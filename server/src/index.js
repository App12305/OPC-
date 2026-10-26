import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import { db, initDb, logActivity } from './db.js';
import { authRouter, requireAuth, requireRole } from './auth.js';
import { resourceRouter } from './crud.js';

function bcryptHash(p) { return bcrypt.hashSync(p, 10); }

initDb();

const app = express();
app.use(cors());
app.use(express.json());

// 静态托管前端产物（生产环境 npm run build 后由后端直接提供）
const distDir = path.join(process.cwd(), '..', 'web', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// 登录
app.use('/api/auth', authRouter());

// 受保护的主 API
const api = express.Router();
api.use(requireAuth);

// ===== 通用资源 =====
api.use('/products', resourceRouter('products', { searchable: ['name', 'sku'] }));
api.use('/customers', resourceRouter('customers', { searchable: ['name', 'phone'] }));
api.use('/suppliers', resourceRouter('suppliers', { searchable: ['name'] }));
api.use('/purchases', resourceRouter('purchases'));
api.use('/campaigns', resourceRouter('campaigns', { searchable: ['name'] }));
api.use('/videos', resourceRouter('videos', { searchable: ['title'] }));
api.use('/chat_sessions', resourceRouter('chat_sessions'));
api.use('/shops', resourceRouter('shops'));
api.use('/orders', resourceRouter('orders', { searchable: ['order_no', 'channel'] }));

// ===== 订单发货（业务动作）=====
api.post('/orders/:id/ship', (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!o) return res.status(404).json({ error: '订单不存在' });
  const logistics = (req.body && req.body.logistics || '').trim();
  if (!logistics) return res.status(400).json({ error: '请填写物流单号' });
  db.prepare("UPDATE orders SET status='已发货', logistics=? WHERE id=?").run(logistics, req.params.id);
  logActivity(req.user.username, '发货', `订单${o.order_no}`);
  res.json({ ok: true });
});

// ===== 采购入库（联动库存）=====
api.post('/purchases/:id/receive', (req, res) => {
  const p = db.prepare('SELECT * FROM purchases WHERE id=?').get(req.params.id);
  if (!p) return res.status(404).json({ error: '采购单不存在' });
  db.prepare("UPDATE purchases SET status='已入库' WHERE id=?").run(req.params.id);
  if (p.product_id) {
    db.prepare("UPDATE products SET stock = stock + ?, updated_at=datetime('now') WHERE id=?").run(p.qty, p.product_id);
  }
  logActivity(req.user.username, '入库', `采购单#${req.params.id} +${p.qty}`);
  res.json({ ok: true });
});

// ===== 售后（业务动作：处理/解决）=====
api.post('/aftersales/:id/resolve', (req, res) => {
  const a = db.prepare('SELECT * FROM aftersales WHERE id=?').get(req.params.id);
  if (!a) return res.status(404).json({ error: '工单不存在' });
  db.prepare("UPDATE aftersales SET status='已解决', handled_by=?, resolved_at=datetime('now') WHERE id=?")
    .run(req.user.name, req.params.id);
  logActivity(req.user.username, '售后解决', `工单#${req.params.id}`);
  res.json({ ok: true });
});
api.use('/aftersales', resourceRouter('aftersales', { searchable: ['type', 'reason'] }));

// ===== 用户与权限（仅 owner）=====
api.get('/users', requireRole('owner'), (req, res) => {
  res.json(db.prepare('SELECT id,username,name,role,active,created_at FROM users ORDER BY id').all());
});
api.post('/users', requireRole('owner'), (req, res) => {
  const { username, name, role, password } = req.body || {};
  if (!username || !name) return res.status(400).json({ error: '账号和姓名必填' });
  const exist = db.prepare('SELECT id FROM users WHERE username=?').get(username);
  if (exist) return res.status(400).json({ error: '账号已存在' });
  const hash = bcryptHash(password || '123456');
  const info = db.prepare('INSERT INTO users(username,password_hash,name,role) VALUES(?,?,?,?)').run(username, hash, name, role || 'ops');
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});
api.put('/users/:id', requireRole('owner'), (req, res) => {
  const { name, role, active, password } = req.body || {};
  const sets = [];
  const params = [];
  if (name !== undefined) { sets.push('name=?'); params.push(name); }
  if (role !== undefined) { sets.push('role=?'); params.push(role); }
  if (active !== undefined) { sets.push('active=?'); params.push(active ? 1 : 0); }
  if (password) { sets.push('password_hash=?'); params.push(bcryptHash(password)); }
  if (!sets.length) return res.json({ ok: true });
  db.prepare(`UPDATE users SET ${sets.join(',')} WHERE id=?`).run(...params, req.params.id);
  res.json({ ok: true });
});
api.delete('/users/:id', requireRole('owner'), (req, res) => {
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ===== 工作台统计数据 =====
api.get('/dashboard/stats', (req, res) => {
  const num = (sql) => db.prepare(sql).get().c;
  const lowStock = db.prepare("SELECT COUNT(*) AS c FROM products WHERE stock < 20").get().c;
  const pendingShip = db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status='待发货'").get().c;
  const abnormal = db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status='异常'").get().c;
  const doneAmt = db.prepare("SELECT COALESCE(SUM(amount),0) AS c FROM orders WHERE status IN ('已发货','已完成')").get().c;
  const orderTotal = db.prepare('SELECT COUNT(*) AS c FROM orders').get().c;
  const customers = db.prepare('SELECT COUNT(*) AS c FROM customers').get().c;
  const tickets = db.prepare("SELECT COUNT(*) AS c FROM aftersales WHERE status!='已解决'").get().c;
  res.json({ orderTotal, pendingShip, abnormal, lowStock, doneAmt, customers, tickets });
});

// ===== 财务与经营分析 =====
api.get('/finance/summary', (req, res) => {
  const sales = db.prepare("SELECT COALESCE(SUM(amount),0) AS v FROM orders WHERE status IN ('已发货','已完成')").get().v;
  // 商品成本估算：已成交订单按当前商品成本 × 数量
  const sold = db.prepare(`SELECT o.qty, p.cost FROM orders o LEFT JOIN products p ON o.product_id=p.id WHERE o.status IN ('已发货','已完成')`).all();
  const cost = sold.reduce((s, r) => s + (r.cost || 0) * (r.qty || 0), 0);
  const adCost = db.prepare('SELECT COALESCE(SUM(budget),0) AS v FROM campaigns').get().v
    + db.prepare('SELECT COALESCE(SUM(cost),0) AS v FROM videos').get().v;
  const refundTickets = db.prepare("SELECT COUNT(*) AS c FROM aftersales WHERE type='退款' AND status!='已解决'").get().c;
  const profit = sales - cost - adCost;
  // 按渠道
  const byChannel = db.prepare(`SELECT o.channel, COALESCE(SUM(o.amount),0) AS sales, COUNT(*) AS orders
    FROM orders o WHERE o.status IN ('已发货','已完成') GROUP BY o.channel`).all();
  // 按商品（利润）
  const byProduct = db.prepare(`SELECT p.name, COALESCE(SUM(o.qty),0) AS qty, COALESCE(SUM(o.amount),0) AS sales
    FROM orders o LEFT JOIN products p ON o.product_id=p.id WHERE o.status IN ('已发货','已完成') GROUP BY o.product_id ORDER BY sales DESC LIMIT 10`).all();
  res.json({ sales, cost, adCost, profit, refundTickets, byChannel, byProduct });
});

// ===== 操作日志 =====
api.get('/activity', (req, res) => {
  res.json(db.prepare('SELECT * FROM activity_log ORDER BY id DESC LIMIT 50').all());
});

app.use('/api', api);

// SPA 兜底
if (fs.existsSync(distDir)) {
  app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ 电商运营工作台后端已启动: http://localhost:${PORT}`);
  console.log(`   数据库: ${process.env.DB_PATH || path.join(process.cwd(), 'data', 'app.db')}`);
});

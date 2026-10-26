import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'app.db');

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = OFF;');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS shops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '启用',
  note TEXT
);
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT,
  platform TEXT,
  note TEXT
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  cost REAL NOT NULL DEFAULT 0,
  price REAL NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  supplier_id INTEGER,
  channel TEXT,
  status TEXT NOT NULL DEFAULT '在售',
  image TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  channel TEXT,
  tags TEXT,
  level TEXT NOT NULL DEFAULT '新客',
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT UNIQUE NOT NULL,
  customer_id INTEGER,
  product_id INTEGER,
  qty INTEGER NOT NULL DEFAULT 1,
  amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT '待付款',
  channel TEXT,
  address TEXT,
  logistics TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS aftersales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL DEFAULT '退款',
  order_id INTEGER,
  customer_id INTEGER,
  product_id INTEGER,
  status TEXT NOT NULL DEFAULT '待处理',
  reason TEXT,
  handled_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);
CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER,
  product_id INTEGER,
  qty INTEGER NOT NULL DEFAULT 0,
  unit_cost REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT '待入库',
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '促销',
  channel TEXT,
  product_id INTEGER,
  budget REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT '筹备中',
  start_date TEXT,
  end_date TEXT,
  note TEXT
);
CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  product_id INTEGER,
  channel TEXT,
  stage TEXT NOT NULL DEFAULT '选题',
  goal TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  inquiries INTEGER NOT NULL DEFAULT 0,
  orders_count INTEGER NOT NULL DEFAULT 0,
  gmv REAL NOT NULL DEFAULT 0,
  cost REAL NOT NULL DEFAULT 0,
  published_at TEXT,
  note TEXT
);
CREATE TABLE IF NOT EXISTS chat_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  channel TEXT,
  status TEXT NOT NULL DEFAULT '接待中',
  agent TEXT,
  unread INTEGER NOT NULL DEFAULT 0,
  last_msg TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user TEXT,
  action TEXT,
  target TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export function initDb() {
  db.exec(SCHEMA);
  seedIfEmpty();
}

function seedIfEmpty() {
  const usersCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (usersCount > 0) return;

  const mkUser = (username, name, role) =>
    db.prepare('INSERT INTO users(username,password_hash,name,role) VALUES(?,?,?,?)')
      .run(username, bcrypt.hashSync('123456', 10), name, role);
  mkUser('admin', '管理员', 'owner');
  mkUser('ops', '运营小李', 'ops');
  mkUser('cs', '客服小王', 'cs');
  mkUser('content', '内容小美', 'content');
  mkUser('wh', '仓储老陈', 'wh');

  const shops = [['淘宝旗舰店', '淘宝'], ['抖音小店', '抖音'], ['拼多多店', '拼多多'], ['京东自营', '京东']];
  const si = db.prepare('INSERT INTO shops(name,platform) VALUES(?,?)');
  shops.forEach(([n, p]) => si.run(n, p));

  const suppliers = [['晨光服饰', '张经理', '淘宝'], ['优品百货', '李总', '拼多多'], ['声学科技', '王工', '京东'], ['丝韵纺织', '赵姐', '小红书']];
  const spi = db.prepare('INSERT INTO suppliers(name,contact,platform) VALUES(?,?,?)');
  suppliers.forEach(([n, c, p]) => spi.run(n, c, p));

  const products = [
    ['纯棉短袖T恤 白色 M', 'TS-W-M', '服饰', 18, 39, 120, 1, '淘宝', '在售'],
    ['纯棉短袖T恤 黑色 L', 'TS-B-L', '服饰', 18, 39, 15, 1, '抖音', '在售'],
    ['便携保温杯 500ml', 'CUP-500', '家居', 22, 59, 8, 2, '拼多多', '在售'],
    ['蓝牙耳机 降噪版', 'EAR-NC', '数码', 65, 129, 200, 3, '京东', '在售'],
    ['真丝围巾 印花', 'SC-PR', '服饰', 30, 88, 60, 4, '小红书', '待上架']
  ];
  const pi = db.prepare('INSERT INTO products(name,sku,category,cost,price,stock,supplier_id,channel,status) VALUES(?,?,?,?,?,?,?,?,?)');
  products.forEach((p) => pi.run(...p));

  const customers = [['李女士', '13800000001', '淘宝', '老客'], ['王先生', '13800000002', '京东', 'VIP'], ['赵小姐', '13800000003', '拼多多', '新客'], ['陈先生', '13800000004', '抖音', '新客']];
  const ci = db.prepare('INSERT INTO customers(name,phone,channel,level) VALUES(?,?,?,?)');
  customers.forEach((c) => ci.run(...c));

  const orders = [
    ['20261026-001', 1, 1, 2, 78, '待发货', '淘宝', '杭州市西湖区', ''],
    ['20261026-002', 2, 4, 1, 129, '已发货', '京东', '北京市朝阳区', 'SF1234567890'],
    ['20261026-003', 3, 3, 3, 177, '待发货', '拼多多', '成都市武侯区', ''],
    ['20261025-014', 4, 2, 1, 39, '异常', '抖音', '广州市天河区', '']
  ];
  const oi = db.prepare('INSERT INTO orders(order_no,customer_id,product_id,qty,amount,status,channel,address,logistics) VALUES(?,?,?,?,?,?,?,?,?)');
  orders.forEach((o) => oi.run(...o));

  const after = [['退款', 3, 3, 3, '待处理', '尺寸不合适'], ['退货', 1, 1, 1, '处理中', '发错颜色']];
  const ai = db.prepare('INSERT INTO aftersales(type,order_id,customer_id,product_id,status,reason) VALUES(?,?,?,?,?,?)');
  after.forEach((a) => ai.run(...a));

  const camp = [['双11预热促销', '促销', '淘宝', 1, 5000, '进行中', '2026-10-20', '2026-11-11'], ['短视频种草投放', '推广', '抖音', 4, 3000, '进行中', '2026-10-15', '2026-11-30']];
  const cpi = db.prepare('INSERT INTO campaigns(name,type,channel,product_id,budget,status,start_date,end_date) VALUES(?,?,?,?,?,?,?,?)');
  camp.forEach((c) => cpi.run(...c));

  const vids = [['夏日T恤穿搭种草', 1, '抖音', '发布', '引流成交', 120000, 3400, 210, 38, 1482, 800, '2026-10-22'], ['保温杯办公室实测', 3, '小红书', '审核', '种草', 0, 0, 0, 0, 0, 300, '']];
  const vi = db.prepare('INSERT INTO videos(title,product_id,channel,stage,goal,views,clicks,inquiries,orders_count,gmv,cost,published_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
  vids.forEach((v) => vi.run(...v));

  const chats = [['李女士', '淘宝', '接待中', 'cs', 0, '这款有黑色吗？'], ['陈先生', '抖音', '待分配', '', 2, '我的订单怎么还没发货'], ['王先生', '京东', '已解决', 'cs', 0, '好的谢谢']];
  const chi = db.prepare('INSERT INTO chat_sessions(customer_id,channel,status,agent,unread,last_msg) VALUES(?,?,?,?,?,?)');
  // map names to customer ids
  const idOf = (name) => db.prepare('SELECT id FROM customers WHERE name=?').get(name)?.id;
  chats.forEach(([nm, ch, st, ag, un, msg]) => chi.run(idOf(nm), ch, st, ag, un, msg));
}

export function logActivity(user, action, target) {
  try { db.prepare('INSERT INTO activity_log(user,action,target) VALUES(?,?,?)').run(user || '系统', action, target || ''); } catch (e) {}
}

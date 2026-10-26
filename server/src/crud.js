import express from 'express';
import { db, logActivity } from './db.js';

const colCache = {};
export function getColumns(table) {
  if (colCache[table]) return colCache[table];
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  colCache[table] = rows.map((r) => r.name);
  return colCache[table];
}

const READ_ONLY = new Set(['id', 'created_at', 'updated_at']);

/**
 * 通用 REST 资源路由：GET /, GET /:id, POST /, PUT /:id, DELETE /:id
 * opts.searchable: 支持 ?q= 模糊搜索的字段
 * opts.allowInsert/allowUpdate: 允许写入的额外字段（覆盖默认列推断）
 */
export function resourceRouter(table, opts = {}) {
  const router = express.Router();
  const cols = getColumns(table);
  const writable = (k) => cols.includes(k) && !READ_ONLY.has(k);

  router.get('/', (req, res) => {
    let sql = `SELECT * FROM ${table}`;
    const conds = [];
    const params = [];
    for (const [k, v] of Object.entries(req.query)) {
      if (k === 'q') continue;
      if (cols.includes(k)) { conds.push(`${k}=?`); params.push(v); }
    }
    if (opts.searchable && opts.searchable.length && req.query.q) {
      const ors = opts.searchable.map((c) => `${c} LIKE ?`);
      conds.push('(' + ors.join(' OR ') + ')');
      opts.searchable.forEach(() => params.push('%' + req.query.q + '%'));
    }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY id DESC';
    res.json(db.prepare(sql).all(...params));
  });

  router.get('/:id', (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: '未找到' });
    res.json(row);
  });

  router.post('/', (req, res) => {
    const keys = Object.keys(req.body || {}).filter(writable);
    if (!keys.length) return res.status(400).json({ error: '无有效字段' });
    const sql = `INSERT INTO ${table}(${keys.join(',')}) VALUES(${keys.map(() => '?').join(',')})`;
    const info = db.prepare(sql).run(...keys.map((k) => req.body[k]));
    logActivity(req.user?.username, '创建', `${table}#${info.lastInsertRowid}`);
    res.status(201).json({ id: Number(info.lastInsertRowid) });
  });

  router.put('/:id', (req, res) => {
    const keys = Object.keys(req.body || {}).filter((k) => writable(k) && k !== 'id');
    if (!keys.length) return res.status(400).json({ error: '无有效字段' });
    let sql = `UPDATE ${table} SET ${keys.map((k) => `${k}=?`).join(',')}`;
    if (cols.includes('updated_at')) sql += ", updated_at=datetime('now')";
    sql += ' WHERE id=?';
    db.prepare(sql).run(...keys.map((k) => req.body[k]), req.params.id);
    logActivity(req.user?.username, '更新', `${table}#${req.params.id}`);
    res.json({ ok: true });
  });

  router.delete('/:id', (req, res) => {
    db.prepare(`DELETE FROM ${table} WHERE id=?`).run(req.params.id);
    logActivity(req.user?.username, '删除', `${table}#${req.params.id}`);
    res.json({ ok: true });
  });

  return router;
}

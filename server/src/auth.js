import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

const SECRET = process.env.JWT_SECRET || 'ecom-workbench-dev-secret';

export function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username, name: user.name, role: user.role }, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try { return jwt.verify(token, SECRET); } catch (e) { return null; }
}

export function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  const payload = token && verifyToken(token);
  if (!payload) return res.status(401).json({ error: '未登录或登录已过期' });
  req.user = payload;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: '未登录' });
    if (roles.length && !roles.includes(req.user.role)) return res.status(403).json({ error: '无权限执行该操作' });
    next();
  };
}

// 登录路由
export function authRouter() {
  const router = express.Router();
  router.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: '请输入账号和密码' });
    const user = db.prepare('SELECT * FROM users WHERE username=?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: '账号或密码错误' });
    }
    if (!user.active) return res.status(403).json({ error: '账号已停用' });
    res.json({ token: signToken(user), user: { id: user.id, username: user.username, name: user.name, role: user.role } });
  });
  router.get('/me', requireAuth, (req, res) => {
    res.json({ id: req.user.id, username: req.user.username, name: req.user.name, role: req.user.role });
  });
  return router;
}

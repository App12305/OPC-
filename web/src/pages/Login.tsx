import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [u, setU] = useState('admin');
  const [p, setP] = useState('123456');
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await login(u, p); nav('/'); }
    catch (e: any) { setErr(e.message || '登录失败'); }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h2>电商运营工作台</h2>
        <div className="sub">登录后进入你的每日经营工作台</div>
        {err && <div className="error-box">{err}</div>}
        <form onSubmit={submit}>
          <div className="field"><label>账号</label><input value={u} onChange={(e) => setU(e.target.value)} /></div>
          <div className="field"><label>密码</label><input type="password" value={p} onChange={(e) => setP(e.target.value)} /></div>
          <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }}>登 录</button>
        </form>
        <div className="muted" style={{ marginTop: 14, fontSize: 12, lineHeight: 1.7 }}>
          演示账号（密码均为 123456）：<br />
          admin 老板 / ops 运营 / cs 客服 / content 内容 / wh 仓储
        </div>
      </div>
    </div>
  );
}

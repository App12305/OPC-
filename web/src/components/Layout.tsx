import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth, Role } from '../auth';

const NAV = [
  { group: '经营分析', items: [{ to: '/', label: '工作台首页', ic: '🏠', end: true }] },
  { group: '① 获客', items: [
    { to: '/videos', label: '视频推广中心', ic: '🎬' },
    { to: '/chat', label: '客服聊天中心', ic: '💬' }
  ] },
  { group: '② 转化', items: [
    { to: '/products', label: '商品与选品中心', ic: '📦' },
    { to: '/campaigns', label: '营销投放中心', ic: '🎯' },
    { to: '/orders', label: '订单与履约中心', ic: '🧾' }
  ] },
  { group: '③ 履约', items: [{ to: '/inventory', label: '采购与库存中心', ic: '🏭' }] },
  { group: '④ 售后', items: [{ to: '/aftersales', label: '售后服务中心', ic: '🛠️' }] },
  { group: '⑤ 复购', items: [{ to: '/customers', label: '客户经营中心', ic: '👥' }] },
  { group: '⑥ 分析', items: [{ to: '/finance', label: '财务与经营分析', ic: '📊' }] },
  { group: '⑦ 管理', items: [{ to: '/team', label: '团队与平台管理', ic: '⚙️' }] }
];

const TITLES: Record<string, string> = {
  '/': '工作台首页', '/products': '商品与选品中心', '/orders': '订单与履约中心',
  '/videos': '视频推广中心', '/chat': '客服聊天中心', '/campaigns': '营销投放中心',
  '/inventory': '采购与库存中心', '/aftersales': '售后服务中心', '/customers': '客户经营中心',
  '/finance': '财务与经营分析中心', '/team': '团队与平台管理'
};

const ROLES: { value: Role; label: string }[] = [
  { value: 'owner', label: '老板 / 负责人' },
  { value: 'ops', label: '运营' },
  { value: 'cs', label: '客服' },
  { value: 'content', label: '内容 / 视频' },
  { value: 'wh', label: '仓储' }
];

export function Layout() {
  const { user, logout, setRole } = useAuth();
  const loc = useLocation();
  const title = TITLES[loc.pathname] || '电商运营工作台';
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><span className="dot" />电商运营工作台</div>
        <nav className="nav">
          {NAV.map((g) => (
            <div key={g.group}>
              <div className="nav-group">{g.group}</div>
              {g.items.map((it) => (
                <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
                  <span className="ic">{it.ic}</span>{it.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="main">
        <div className="topbar">
          <h1>{title}</h1>
          <div className="spacer" />
          <div className="role-switch">
            <span className="muted">角色</span>
            <select value={user?.role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <span className="muted">{user?.name}</span>
          <button className="btn sm" onClick={logout}>退出</button>
        </div>
        <div className="content"><div className="wrap"><Outlet /></div></div>
      </div>
    </div>
  );
}

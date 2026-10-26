import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth, Role } from '../auth';
import { DashboardStats } from '../types';

const ROLE_TIPS: Record<Role, string> = {
  owner: '你是老板 / 负责人：先看经营仪表盘与异常，再处理待审批事项。下方「今日工作」为全局视角。',
  ops: '你是运营：关注商品上架、活动与订单转化，进入商品中心维护资料，到订单中心跟发货。',
  cs: '你是客服：优先处理待发货 / 异常订单相关咨询，必要时转售后工单。',
  content: '你是内容 / 视频：聚焦商品与订单；视频推广中心已可记录选题到发布的效果归因。',
  wh: '你是仓储：关注「待发货」订单与低库存预警，及时拣货发货、触发补货。'
};

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [low, setLow] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [abnormal, setAbnormal] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/dashboard/stats').then(setStats);
    api.get('/api/products').then((p: any[]) => setLow(p.filter((x) => x.stock < 20)));
    api.get('/api/orders').then((o: any[]) => {
      setPending(o.filter((x) => x.status === '待发货'));
      setAbnormal(o.filter((x) => x.status === '异常'));
    });
  }, []);

  if (!stats) return <div className="empty">加载中…</div>;
  const role = (user?.role || 'owner') as Role;

  const todos: { t: string; m: string; r: string }[] = [];
  pending.forEach((o) => todos.push({ t: `订单 ${o.order_no} 待发货`, m: `${o.customer || ''} · ${o.channel || ''}`, r: '/orders' }));
  low.forEach((p) => todos.push({ t: `商品 ${p.name} 库存偏低`, m: `剩余 ${p.stock} 件 · ${p.channel || ''}`, r: '/products' }));
  abnormal.forEach((o) => todos.push({ t: `异常订单 ${o.order_no} 待处理`, m: `${o.customer || ''} · 需人工跟进`, r: '/orders' }));

  return (
    <div>
      <div className="role-tip"><b>{user?.name}：</b>{ROLE_TIPS[role]}</div>
      <div className="note">数据来自后端 SQLite 数据库（真实持久化）。账号 admin / 123456。各模块增删改均写入数据库，刷新、重启服务后仍在。</div>
      <div className="grid g4">
        <div className="stat"><div className="label">订单总数</div><div className="value">{stats.orderTotal}</div><div className="sub muted">{stats.pendingShip} 笔待发货</div></div>
        <div className="stat"><div className="label">待发货</div><div className="value" style={{ color: 'var(--amber)' }}>{stats.pendingShip}</div><div className="sub muted">需尽快处理</div></div>
        <div className="stat"><div className="label">已成交金额</div><div className="value" style={{ color: 'var(--green)' }}>¥{stats.doneAmt}</div><div className="sub muted">已发货 + 已完成</div></div>
        <div className="stat"><div className="label">异常提醒</div><div className="value" style={{ color: 'var(--red)' }}>{stats.lowStock + stats.abnormal}</div><div className="sub muted">低库存 + 异常单</div></div>
      </div>

      <div className="sec-title">📌 今日工作（{user?.name} 视角）</div>
      {todos.length === 0 ? <div className="card"><div className="empty">今日没有待办 🎉</div></div> :
        todos.map((t, i) => (
          <div className="todo" key={i}>
            <div className="t-info"><div className="t-title">{t.t}</div><div className="t-meta">{t.m}</div></div>
            <button className="btn sm primary" onClick={() => nav(t.r)}>处理</button>
          </div>
        ))}

      <div className="sec-title">🔗 常用入口</div>
      <div className="quick">
        <a onClick={() => nav('/products')}><span className="qi">📦</span>商品管理</a>
        <a onClick={() => nav('/orders')}><span className="qi">🧾</span>订单履约</a>
        <a onClick={() => nav('/aftersales')}><span className="qi">🛠️</span>售后工单</a>
        <a onClick={() => nav('/customers')}><span className="qi">👥</span>客户经营</a>
      </div>

      <div className="sec-title">⚠️ 异常与预警</div>
      <div className="card">
        {low.length > 0 && <><div className="muted" style={{ marginBottom: 8 }}>低库存商品（库存 &lt; 20）</div>
          {low.map((p) => (
            <div className="todo" key={p.id}><div className="t-info"><div className="t-title">{p.name} · 库存 {p.stock}</div><div className="t-meta">{p.channel} · 成本 ¥{p.cost} · 建议补货</div></div><button className="btn sm" onClick={() => nav('/products')}>去补货</button></div>
          ))}</>}
        {abnormal.length > 0 && <><div className="muted" style={{ margin: '10px 0 8px' }}>异常订单</div>
          {abnormal.map((o) => (
            <div className="todo" key={o.id}><div className="t-info"><div className="t-title">{o.order_no} · {o.customer}</div><div className="t-meta">{o.channel} · 状态：异常</div></div><button className="btn sm" onClick={() => nav('/orders')}>查看</button></div>
          ))}</>}
        {low.length === 0 && abnormal.length === 0 && <div className="empty">暂无异常 🎉</div>}
      </div>
    </div>
  );
}

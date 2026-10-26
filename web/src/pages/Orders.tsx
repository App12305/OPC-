import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Modal } from '../components/Modal';

const CHANNELS = ['淘宝', '拼多多', '抖音', '京东', '小红书', '微信小店'];
const OSTATUS = ['待付款', '已付款', '待发货', '已发货', '已完成', '异常'];
const stBadge = (s: string) => {
  const m: any = { 待付款: 'b-gray', 已付款: 'b-blue', 待发货: 'b-amber', 已发货: 'b-green', 已完成: 'b-green', 异常: 'b-red' };
  return <span className={`badge ${m[s] || 'b-gray'}`}>{s}</span>;
};

export default function Orders() {
  const [rows, setRows] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [shipOpen, setShipOpen] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [logi, setLogi] = useState('');

  const pMap = Object.fromEntries(products.map((p) => [p.id, p.name]));

  const load = async () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    setRows(await api.get('/api/orders' + (params.toString() ? '?' + params : '')));
  };
  useEffect(() => { load(); api.get('/api/products').then(setProducts); /* eslint-disable-next-line */ }, []);

  const changeStatus = async (id: number, s: string) => { await api.put(`/api/orders/${id}`, { status: s }); load(); };
  const doShip = async () => {
    if (!logi.trim()) { alert('请填写物流单号'); return; }
    await api.post(`/api/orders/${shipOpen.id}/ship`, { logistics: logi });
    setShipOpen(null); setLogi(''); load();
  };
  const openNew = () => { setEditing(null); setForm({ qty: 1, amount: 0, status: '待付款', channel: CHANNELS[0] }); setOpen(true); };
  const openEdit = (o: any) => { setEditing(o); setForm({ ...o }); setOpen(true); };
  const save = async () => {
    if (!form.customer) { alert('请填写客户'); return; }
    if (editing) await api.put(`/api/orders/${editing.id}`, form);
    else await api.post('/api/orders', form);
    setOpen(false); load();
  };
  const remove = async (id: number) => { if (!confirm('确认删除？')) return; await api.del(`/api/orders/${id}`); load(); };

  return (
    <div>
      <div className="hintbar">后端持久化：订单状态可流转，点「发货」填写物流单号后状态联动为「已发货」（调用 /api/orders/:id/ship）。客服 / 运营 / 仓储围绕同一订单协作。</div>
      <div className="toolbar">
        <input className="search" placeholder="搜索订单号 / 客户" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">全部状态</option>{OSTATUS.map((s) => <option key={s}>{s}</option>)}</select>
        <button className="btn" onClick={load}>查询</button>
        <div className="spacer" />
        <button className="btn primary" onClick={openNew}>+ 新增订单</button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>订单号</th><th>客户</th><th>商品</th><th>数量</th><th>金额</th><th>渠道</th><th>状态</th><th>物流单号</th><th>操作</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={9}><div className="empty">没有匹配订单</div></td></tr>}
            {rows.map((o) => (
              <tr key={o.id}>
                <td style={{ fontWeight: 600 }}>{o.order_no}</td><td>{o.customer || '—'}</td>
                <td>{pMap[o.product_id] || '—'}</td><td>×{o.qty}</td><td>¥{o.amount}</td>
                <td>{o.channel || '—'}</td><td>{stBadge(o.status)}</td>
                <td className="muted">{o.logistics || '—'}</td>
                <td>
                  <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)} style={{ padding: '5px 8px', borderRadius: 7, border: '1px solid var(--line)' }}>
                    {OSTATUS.map((s) => <option key={s}>{s}</option>)}
                  </select>{' '}
                  {o.status === '待发货' && <button className="btn sm primary" style={{ marginLeft: 4 }} onClick={() => { setShipOpen(o); setLogi(''); }}>发货</button>}{' '}
                  <button className="btn sm" onClick={() => openEdit(o)}>编辑</button>{' '}
                  <button className="btn sm danger" onClick={() => remove(o.id)}>删</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {shipOpen && (
        <Modal title={`订单发货 · ${shipOpen.order_no}`} onClose={() => setShipOpen(null)}
          footer={<><button className="btn" onClick={() => setShipOpen(null)}>取消</button><button className="btn primary" onClick={doShip}>确认发货</button></>}>
          <div className="field"><label>客户</label><input value={shipOpen.customer || ''} disabled /></div>
          <div className="field"><label>物流单号 *</label><input value={logi} onChange={(e) => setLogi(e.target.value)} placeholder="如 SF1234567890" /></div>
          <div className="field"><label>收货地址</label><input value={shipOpen.address || ''} onChange={(e) => setShipOpen({ ...shipOpen, address: e.target.value })} /></div>
        </Modal>
      )}

      {open && (
        <Modal title={editing ? '编辑订单' : '新增订单'} onClose={() => setOpen(false)}
          footer={<><button className="btn" onClick={() => setOpen(false)}>取消</button><button className="btn primary" onClick={save}>保存</button></>}>
          <div className="row2">
            <div className="field"><label>订单号</label><input value={form.order_no || ''} onChange={(e) => setForm({ ...form, order_no: e.target.value })} placeholder="留空自动生成" /></div>
            <div className="field"><label>客户 *</label><input value={form.customer || ''} onChange={(e) => setForm({ ...form, customer: e.target.value })} /></div>
          </div>
          <div className="row2">
            <div className="field"><label>商品</label><select value={form.product_id || ''} onChange={(e) => setForm({ ...form, product_id: e.target.value ? Number(e.target.value) : '' })}><option value="">—</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div className="field"><label>数量</label><input type="number" value={form.qty ?? 1} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} /></div>
          </div>
          <div className="row2">
            <div className="field"><label>金额(¥)</label><input type="number" value={form.amount ?? 0} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
            <div className="field"><label>状态</label><select value={form.status || '待付款'} onChange={(e) => setForm({ ...form, status: e.target.value })}>{OSTATUS.map((s) => <option key={s}>{s}</option>)}</select></div>
          </div>
          <div className="row2">
            <div className="field"><label>渠道</label><select value={form.channel || CHANNELS[0]} onChange={(e) => setForm({ ...form, channel: e.target.value })}>{CHANNELS.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div className="field"><label>物流单号</label><input value={form.logistics || ''} onChange={(e) => setForm({ ...form, logistics: e.target.value })} /></div>
          </div>
          <div className="field"><label>收货地址</label><input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        </Modal>
      )}
    </div>
  );
}

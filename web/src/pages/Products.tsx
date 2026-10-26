import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Modal } from '../components/Modal';

const CHANNELS = ['淘宝', '拼多多', '抖音', '京东', '小红书', '微信小店'];
const STATUSES = ['在售', '待上架', '下架'];
const profit = (p: any) => (Number(p.price) - Number(p.cost)).toFixed(2);
const stCls = (s: string) => ({ 在售: 'b-green', 待上架: 'b-amber', 下架: 'b-gray' }[s] || 'b-gray');

export default function Products() {
  const [rows, setRows] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [channel, setChannel] = useState('');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const supMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));

  const load = async () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (channel) params.set('channel', channel);
    if (status) params.set('status', status);
    const data = await api.get('/api/products' + (params.toString() ? '?' + params : ''));
    setRows(data);
  };
  useEffect(() => { load(); api.get('/api/suppliers').then(setSuppliers); /* eslint-disable-next-line */ }, []);

  const openNew = () => { setEditing(null); setForm({ cost: 0, price: 0, stock: 0, channel: CHANNELS[0], status: '在售' }); setOpen(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ ...p }); setOpen(true); };
  const save = async () => {
    if (!form.name) { alert('请填写商品名称'); return; }
    if (editing) await api.put(`/api/products/${editing.id}`, form);
    else await api.post('/api/products', form);
    setOpen(false); load();
  };
  const remove = async (id: number) => { if (!confirm('确认删除？')) return; await api.del(`/api/products/${id}`); load(); };

  return (
    <div>
      <div className="hintbar">后端持久化：商品增删改实时写入 SQLite。字段含 SKU、成本、售价、自动利润测算（售价−成本）、库存、供应商、渠道、状态；库存 &lt; 20 标红预警。</div>
      <div className="toolbar">
        <input className="search" placeholder="搜索商品名称 / SKU" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
        <select value={channel} onChange={(e) => setChannel(e.target.value)}><option value="">全部渠道</option>{CHANNELS.map((c) => <option key={c}>{c}</option>)}</select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">全部状态</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <button className="btn" onClick={load}>查询</button>
        <div className="spacer" />
        <button className="btn primary" onClick={openNew}>+ 新增商品</button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>商品 / SKU</th><th>类目</th><th>成本</th><th>售价</th><th>利润</th><th>库存</th><th>供应商</th><th>渠道</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={10}><div className="empty">没有匹配商品</div></td></tr>}
            {rows.map((p) => (
              <tr key={p.id}>
                <td><div style={{ fontWeight: 600 }}>{p.name}</div><div className="muted" style={{ fontSize: 12 }}>{p.sku || '—'}</div></td>
                <td>{p.category || '—'}</td><td>¥{p.cost}</td><td>¥{p.price}</td>
                <td style={{ color: 'var(--green)', fontWeight: 600 }}>¥{profit(p)}</td>
                <td>{p.stock < 20 ? <span className="badge b-red">{p.stock}</span> : p.stock}</td>
                <td>{supMap[p.supplier_id] || '—'}</td><td>{p.channel || '—'}</td>
                <td><span className={`badge ${stCls(p.status)}`}>{p.status}</span></td>
                <td><button className="btn sm" onClick={() => openEdit(p)}>编辑</button> <button className="btn sm danger" onClick={() => remove(p.id)}>删</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={editing ? '编辑商品' : '新增商品'} onClose={() => setOpen(false)}
          footer={<><button className="btn" onClick={() => setOpen(false)}>取消</button><button className="btn primary" onClick={save}>保存</button></>}>
          <div className="field"><label>商品名称 *</label><input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="row2">
            <div className="field"><label>SKU</label><input value={form.sku || ''} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
            <div className="field"><label>类目</label><input value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          </div>
          <div className="row2">
            <div className="field"><label>采购成本(¥)</label><input type="number" value={form.cost ?? 0} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} /></div>
            <div className="field"><label>销售售价(¥)</label><input type="number" value={form.price ?? 0} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
          </div>
          <div className="row2">
            <div className="field"><label>库存</label><input type="number" value={form.stock ?? 0} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></div>
            <div className="field"><label>状态</label><select value={form.status || '在售'} onChange={(e) => setForm({ ...form, status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
          </div>
          <div className="row2">
            <div className="field"><label>供应商</label><select value={form.supplier_id || ''} onChange={(e) => setForm({ ...form, supplier_id: e.target.value ? Number(e.target.value) : '' })}><option value="">—</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div className="field"><label>渠道</label><select value={form.channel || CHANNELS[0]} onChange={(e) => setForm({ ...form, channel: e.target.value })}>{CHANNELS.map((c) => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div className="field"><label>备注</label><input value={form.note || ''} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
          <div className="note">单件利润测算：¥{(Number(form.price) - Number(form.cost) || 0).toFixed(2)}</div>
        </Modal>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Modal } from './Modal';

export interface Col {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select' | 'textarea';
  options?: { label: string; value: any }[];
  optionsApi?: string;          // 从接口拉取选项（如供应商/商品）
  optionsLabel?: string;        // 选项显示字段，默认 name
  optionsValue?: string;        // 选项值字段，默认 id
  editable?: boolean;           // 表单是否可编辑，默认 true
  hideInForm?: boolean;
  width?: string;
}

interface Props {
  title: string;
  endpoint: string;             // 如 /api/customers
  columns: Col[];
  searchable?: boolean;
  rowActions?: (row: any) => React.ReactNode;
  derive?: (form: any) => any;  // 保存前计算派生字段
  note?: string;
}

export function CrudPage({ title, endpoint, columns, searchable, rowActions, derive, note }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [optLists, setOptLists] = useState<Record<string, { label: string; value: any }[]>>({});
  const [optMaps, setOptMaps] = useState<Record<string, Record<any, string>>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get(endpoint + (q ? `?q=${encodeURIComponent(q)}` : ''));
      setRows(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // 预加载外键选项（用于表单下拉与表格显示）
  useEffect(() => {
    const fkCols = columns.filter((c) => c.optionsApi);
    fkCols.forEach(async (c) => {
      try {
        const list = await api.get(c.optionsApi!);
        const lbl = c.optionsLabel || 'name';
        const val = c.optionsValue || 'id';
        const opts = list.map((x: any) => ({ label: x[lbl], value: x[val] }));
        const map: Record<any, string> = {};
        list.forEach((x: any) => { map[x[val]] = x[lbl]; });
        setOptLists((p) => ({ ...p, [c.key]: opts }));
        setOptMaps((p) => ({ ...p, [c.key]: map }));
      } catch { /* ignore */ }
    });
    // eslint-disable-next-line
  }, []);

  const display = (col: Col, row: any) => {
    const v = row[col.key];
    if (v == null || v === '') return '—';
    if (col.optionsApi && optMaps[col.key]) return optMaps[col.key][v] || `(${v})`;
    if (col.options) { const o = col.options.find((o) => o.value === v); return o ? o.label : v; }
    return v;
  };

  const openNew = () => { setEditing(null); const f: any = {}; columns.forEach((c) => { if (c.type === 'number') f[c.key] = 0; }); setForm(f); setOpen(true); };
  const openEdit = (row: any) => { setEditing(row); setForm({ ...row }); setOpen(true); };

  const save = async () => {
    let f = { ...form };
    if (derive) f = derive(f);
    if (editing) await api.put(`${endpoint}/${editing.id}`, f);
    else await api.post(endpoint, f);
    setOpen(false);
    load();
  };
  const remove = async (id: number) => {
    if (!confirm('确认删除？')) return;
    await api.del(`${endpoint}/${id}`);
    load();
  };

  return (
    <div>
      {note && <div className="hintbar">{note}</div>}
      <div className="toolbar">
        {searchable && <input className="search" placeholder="搜索…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load(); }} />}
        <div className="spacer" />
        <button className="btn primary" onClick={openNew}>+ 新增</button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr>{columns.map((c) => <th key={c.key} style={{ width: c.width }}>{c.label}</th>)}<th>操作</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={columns.length + 1}><div className="empty">暂无数据，点右上角新增</div></td></tr>}
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => <td key={c.key}>{display(c, row)}</td>)}
                <td>
                  {rowActions && rowActions(row)}
                  <button className="btn sm" onClick={() => openEdit(row)}>编辑</button>{' '}
                  <button className="btn sm danger" onClick={() => remove(row.id)}>删</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={editing ? `编辑 · ${title}` : `新增 · ${title}`} onClose={() => setOpen(false)}
          footer={<><button className="btn" onClick={() => setOpen(false)}>取消</button><button className="btn primary" onClick={save}>保存</button></>}>
          {columns.filter((c) => !c.hideInForm).map((c) => {
            const opts = c.options || optLists[c.key] || [];
            if (c.type === 'select') {
              return (
                <div className="field" key={c.key}>
                  <label>{c.label}</label>
                  <select value={form[c.key] ?? ''} onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}>
                    <option value="">—</option>
                    {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              );
            }
            if (c.type === 'textarea') {
              return <div className="field" key={c.key}><label>{c.label}</label><textarea rows={3} value={form[c.key] || ''} onChange={(e) => setForm({ ...form, [c.key]: e.target.value })} /></div>;
            }
            return (
              <div className="field" key={c.key}>
                <label>{c.label}</label>
                <input type={c.type === 'number' ? 'number' : 'text'} value={form[c.key] ?? ''} onChange={(e) => setForm({ ...form, [c.key]: c.type === 'number' ? Number(e.target.value) : e.target.value })} />
              </div>
            );
          })}
        </Modal>
      )}
    </div>
  );
}

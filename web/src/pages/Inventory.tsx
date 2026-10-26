import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { CrudPage, Col } from '../components/CrudPage';

type Tab = 'stock' | 'suppliers' | 'purchases';
const ST = ['待入库', '已入库'];

export default function Inventory() {
  const [tab, setTab] = useState<Tab>('stock');
  const [low, setLow] = useState<any[]>([]);

  useEffect(() => { api.get('/api/products').then((p: any[]) => setLow(p.filter((x) => x.stock < 20))); }, []);

  const supCols: Col[] = [
    { key: 'name', label: '供应商名称' },
    { key: 'contact', label: '联系人' },
    { key: 'platform', label: '主营平台' },
    { key: 'note', label: '备注', type: 'textarea' }
  ];
  const purCols: Col[] = [
    { key: 'supplier_id', label: '供应商', optionsApi: '/api/suppliers' },
    { key: 'product_id', label: '商品', optionsApi: '/api/products' },
    { key: 'qty', label: '数量', type: 'number' },
    { key: 'unit_cost', label: '单价(¥)', type: 'number' },
    { key: 'total', label: '合计(¥)', type: 'number' },
    { key: 'status', label: '状态', type: 'select', options: ST.map((s) => ({ label: s, value: s })) },
    { key: 'note', label: '备注' }
  ];
  const rowActions = (row: any) => row.status !== '已入库'
    ? <button className="btn sm primary" style={{ marginRight: 6 }} onClick={async () => { await api.post(`/api/purchases/${row.id}/receive`); location.reload(); }}>入库</button>
    : null;

  return (
    <div>
      <div className="hintbar">采购与库存中心：库存预警触发补货采购，采购「入库」后自动增加对应商品可售库存（调用 /api/purchases/:id/receive）。支持自有库存与供应商代发经营模式。</div>
      <div className="tabs">
        <button className={tab === 'stock' ? 'active' : ''} onClick={() => setTab('stock')}>库存预警</button>
        <button className={tab === 'suppliers' ? 'active' : ''} onClick={() => setTab('suppliers')}>供应商</button>
        <button className={tab === 'purchases' ? 'active' : ''} onClick={() => setTab('purchases')}>采购单</button>
      </div>

      {tab === 'stock' && (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead><tr><th>商品</th><th>SKU</th><th>当前库存</th><th>渠道</th><th>状态</th></tr></thead>
            <tbody>
              {low.length === 0 && <tr><td colSpan={5}><div className="empty">暂无低库存商品（库存 ≥ 20）</div></td></tr>}
              {low.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td><td className="muted">{p.sku || '—'}</td>
                  <td><span className="badge b-red">{p.stock}</span></td><td>{p.channel || '—'}</td>
                  <td><span className="badge b-amber">需补货</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'suppliers' && <CrudPage key="sup" title="供应商" endpoint="/api/suppliers" columns={supCols} searchable note="维护供应商资料，供采购单关联。" />}
      {tab === 'purchases' && <CrudPage key="pur" title="采购单" endpoint="/api/purchases" columns={purCols} rowActions={rowActions}
        derive={(f: any) => ({ ...f, total: (Number(f.qty) || 0) * (Number(f.unit_cost) || 0) })}
        note="新建采购单填写数量与单价，合计自动计算；点「入库」后库存自动增加。" />}
    </div>
  );
}

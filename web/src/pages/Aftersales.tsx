import React from 'react';
import { CrudPage, Col } from '../components/CrudPage';
import { api } from '../api';

const TY = ['退款', '退货', '换货', '投诉', '补发'];
const ST = ['待处理', '处理中', '已解决'];
const sel = (arr: string[]): { label: string; value: string }[] => arr.map((c) => ({ label: c, value: c }));

export default function Aftersales() {
  const cols: Col[] = [
    { key: 'type', label: '类型', type: 'select', options: sel(TY) },
    { key: 'order_id', label: '关联订单' },
    { key: 'customer_id', label: '客户', optionsApi: '/api/customers' },
    { key: 'product_id', label: '商品', optionsApi: '/api/products' },
    { key: 'status', label: '状态', type: 'select', options: sel(ST) },
    { key: 'reason', label: '原因', type: 'textarea' },
    { key: 'handled_by', label: '处理人' }
  ];
  const rowActions = (row: any) => row.status !== '已解决'
    ? <button className="btn sm primary" style={{ marginRight: 6 }} onClick={async () => { await api.post(`/api/aftersales/${row.id}/resolve`); location.reload(); }}>标记解决</button>
    : null;
  return (
    <CrudPage
      title="售后工单"
      endpoint="/api/aftersales"
      columns={cols}
      searchable
      rowActions={rowActions}
      note="售后服务中心：退款 / 退货 / 换货 / 投诉 / 补发工单，支持分派、处理记录与结果追踪，关联客户、订单与商品。点「标记解决」调用 /api/aftersales/:id/resolve 写入处理人与解决时间。"
    />
  );
}

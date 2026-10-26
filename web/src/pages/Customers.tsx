import React from 'react';
import { CrudPage, Col } from '../components/CrudPage';

const CH = ['淘宝', '拼多多', '抖音', '京东', '小红书', '微信小店'];
const LV = ['新客', '老客', 'VIP', '流失'];
const sel = (arr: string[]): { label: string; value: string }[] => arr.map((c) => ({ label: c, value: c }));

export default function Customers() {
  const cols: Col[] = [
    { key: 'name', label: '客户名称' },
    { key: 'phone', label: '电话' },
    { key: 'channel', label: '来源渠道', type: 'select', options: sel(CH) },
    { key: 'tags', label: '标签' },
    { key: 'level', label: '会员层级', type: 'select', options: sel(LV) },
    { key: 'note', label: '备注', type: 'textarea' }
  ];
  return (
    <CrudPage
      title="客户"
      endpoint="/api/customers"
      columns={cols}
      searchable
      note="客户经营中心：档案、来源、标签、会员层级。后续阶段可接入购买偏好、跟进记录与复购任务（购买 → 分层 → 复购 → 再成交）。"
    />
  );
}

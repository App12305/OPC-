import React from 'react';
import { CrudPage, Col } from '../components/CrudPage';

const CH = ['淘宝', '拼多多', '抖音', '京东', '小红书', '微信小店'];
const TY = ['促销', '优惠券', '组合销售', '推广'];
const ST = ['筹备中', '进行中', '已结束'];
const sel = (arr: string[]): { label: string; value: string }[] => arr.map((c) => ({ label: c, value: c }));

export default function Campaigns() {
  const cols: Col[] = [
    { key: 'name', label: '活动名称' },
    { key: 'type', label: '类型', type: 'select', options: sel(TY) },
    { key: 'channel', label: '渠道', type: 'select', options: sel(CH) },
    { key: 'product_id', label: '关联商品', optionsApi: '/api/products' },
    { key: 'budget', label: '预算(¥)', type: 'number' },
    { key: 'status', label: '状态', type: 'select', options: sel(ST) },
    { key: 'start_date', label: '开始日期' },
    { key: 'end_date', label: '结束日期' },
    { key: 'note', label: '说明', type: 'textarea' }
  ];
  return (
    <CrudPage
      title="活动"
      endpoint="/api/campaigns"
      columns={cols}
      searchable
      note="营销活动与投放中心：管理促销活动、优惠券、组合销售与推广计划。活动可关联商品，后续阶段分析获客成本与投入产出（ROI）。"
    />
  );
}

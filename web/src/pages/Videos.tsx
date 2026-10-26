import React from 'react';
import { CrudPage, Col } from '../components/CrudPage';

const CH = ['淘宝', '拼多多', '抖音', '京东', '小红书', '微信小店'];
const STAGE = ['选题', '脚本', '拍摄', '制作中', '审核', '发布'];
const sel = (arr: string[]): { label: string; value: string }[] => arr.map((c) => ({ label: c, value: c }));

export default function Videos() {
  const cols: Col[] = [
    { key: 'title', label: '视频标题' },
    { key: 'product_id', label: '关联商品', optionsApi: '/api/products' },
    { key: 'channel', label: '渠道', type: 'select', options: sel(CH) },
    { key: 'stage', label: '阶段', type: 'select', options: sel(STAGE) },
    { key: 'goal', label: '推广目标' },
    { key: 'views', label: '播放', type: 'number' },
    { key: 'clicks', label: '点击', type: 'number' },
    { key: 'inquiries', label: '咨询', type: 'number' },
    { key: 'orders_count', label: '订单', type: 'number' },
    { key: 'gmv', label: '成交(¥)', type: 'number' },
    { key: 'cost', label: '成本(¥)', type: 'number' },
    { key: 'published_at', label: '发布时间' }
  ];
  return (
    <CrudPage
      title="视频"
      endpoint="/api/videos"
      columns={cols}
      searchable
      note="视频推广中心：从选题到发布的全流程，并记录播放 / 点击 / 咨询 / 订单 / 成交与成本，支撑「商品 → 推广 → 咨询 → 订单」效果归因。AI 辅助（脚本 / 字幕 / 配音）与平台发布 API 为后续接入项。"
    />
  );
}

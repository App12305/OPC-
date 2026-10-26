import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { FinanceSummary } from '../types';

export default function Finance() {
  const [data, setData] = useState<FinanceSummary | null>(null);
  useEffect(() => { api.get('/api/finance/summary').then(setData); }, []);

  if (!data) return <div className="empty">加载中…</div>;
  const maxCh = Math.max(1, ...data.byChannel.map((c: any) => c.sales));

  return (
    <div>
      <div className="hintbar">财务与经营分析中心：指标口径 — 销售额=已发货+已完成订单金额；商品成本=按当前成本×数量估算；推广费=活动预算+视频成本合计；利润=销售额−商品成本−推广费。可按店铺 / 渠道 / 商品追溯至业务记录（后续扩展）。</div>
      <div className="grid g4">
        <div className="stat"><div className="label">销售额</div><div className="value" style={{ color: 'var(--green)' }}>¥{data.sales}</div></div>
        <div className="stat"><div className="label">商品成本</div><div className="value">¥{data.cost}</div></div>
        <div className="stat"><div className="label">推广费用</div><div className="value" style={{ color: 'var(--amber)' }}>¥{data.adCost}</div></div>
        <div className="stat"><div className="label">估算利润</div><div className="value" style={{ color: data.profit >= 0 ? 'var(--green)' : 'var(--red)' }}>¥{data.profit}</div></div>
      </div>

      <div className="sec-title">📊 按渠道</div>
      <div className="card">
        {data.byChannel.length === 0 && <div className="empty">暂无已成交订单</div>}
        {data.byChannel.map((c: any) => (
          <div key={c.channel} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>{c.channel}</span><span className="muted">¥{c.sales} · {c.orders} 单</span>
            </div>
            <div className="bar"><i style={{ width: `${(c.sales / maxCh) * 100}%` }} /></div>
          </div>
        ))}
      </div>

      <div className="sec-title">🏆 商品销售 TOP</div>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>商品</th><th>销量</th><th>销售额</th></tr></thead>
          <tbody>
            {data.byProduct.length === 0 && <tr><td colSpan={3}><div className="empty">暂无数据</div></td></tr>}
            {data.byProduct.map((p: any, i: number) => (
              <tr key={i}><td style={{ fontWeight: 600 }}>{p.name}</td><td>×{p.qty}</td><td>¥{p.sales}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>未解决退款工单数：{data.refundTickets}</div>
    </div>
  );
}

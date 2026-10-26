import React, { useEffect, useState } from 'react';
import { api } from '../api';

const STATUS: Record<string, string> = { 接待中: 'b-green', 待分配: 'b-amber', 已解决: 'b-gray' };

export default function Chat() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [custMap, setCustMap] = useState<Record<number, string>>({});
  const [active, setActive] = useState<any>(null);
  const [reply, setReply] = useState('');

  useEffect(() => {
    api.get('/api/chat_sessions').then(setSessions);
    api.get('/api/customers').then((c: any[]) => setCustMap(Object.fromEntries(c.map((x: any) => [x.id, x.name]))));
  }, []);

  const nameOf = (s: any) => s.customer_id ? custMap[s.customer_id] || '客户' : '访客';
  const thread = active ? [
    { me: false, text: active.last_msg || '（暂无消息）' },
    { me: true, text: '您好，请问有什么可以帮您？' }
  ] : [];

  return (
    <div>
      <div className="hintbar">客服聊天中心（演示）：会话列表来自后端数据库。自建聊天支持分配 / 转接 / 话术 / 知识库 / AI 建议；接入淘宝千牛、抖店、企业微信等需对应开放平台授权，当前为演示会话数据，预留消息接入层。</div>
      <div className="chat-layout">
        <div className="chat-list">
          {sessions.map((s) => (
            <div key={s.id} className={'chat-item' + (active?.id === s.id ? ' active' : '')} onClick={() => setActive(s)}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <b>{nameOf(s)}</b>
                {s.unread > 0 && <span className="badge b-red">{s.unread}</span>}
              </div>
              <div className="muted" style={{ fontSize: 12 }}>{s.channel} · <span className={`badge ${STATUS[s.status] || 'b-gray'}`}>{s.status}</span></div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{s.last_msg}</div>
            </div>
          ))}
        </div>
        <div className="chat-main">
          {!active && <div className="empty">从左侧选择一个会话</div>}
          {active && (
            <>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>{nameOf(active)} · {active.channel}</div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {thread.map((m, i) => <div key={i} className={'msg ' + (m.me ? 'me' : 'them')}>{m.text}</div>)}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input className="search" value={reply} placeholder="输入回复（演示，不持久化）" onChange={(e) => setReply(e.target.value)} />
                <button className="btn primary" onClick={() => setReply('')}>发送</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

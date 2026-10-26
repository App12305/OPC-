import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { CrudPage, Col } from '../components/CrudPage';
import { useAuth } from '../auth';

const ROLES = ['owner', 'ops', 'cs', 'content', 'wh'];
const ROLE_LABEL: Record<string, string> = { owner: '老板', ops: '运营', cs: '客服', content: '内容', wh: '仓储' };

export default function Team() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const [tab, setTab] = useState<'users' | 'shops' | 'log'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [err, setErr] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [nu, setNu] = useState({ username: '', name: '', role: 'ops' });

  const loadUsers = async () => {
    try { setUsers(await api.get('/api/users')); setErr(''); }
    catch (e: any) { setErr(e.message); }
  };
  useEffect(() => {
    if (isOwner) loadUsers();
    api.get('/api/activity').then(setLogs);
    // eslint-disable-next-line
  }, []);

  const changeRole = async (id: number, role: string) => { await api.put(`/api/users/${id}`, { role }); loadUsers(); };
  const toggleActive = async (u: any) => { await api.put(`/api/users/${id_of(u)}`, { active: u.active ? 0 : 1 }); loadUsers(); };
  const id_of = (u: any) => u.id;
  const addUser = async () => {
    if (!nu.username || !nu.name) { alert('账号和姓名必填'); return; }
    await api.post('/api/users', nu); setShowAdd(false); setNu({ username: '', name: '', role: 'ops' }); loadUsers();
  };

  const shopCols: Col[] = [
    { key: 'name', label: '店铺名称' },
    { key: 'platform', label: '平台', type: 'select', options: ['淘宝', '拼多多', '抖音', '京东', '小红书', '微信小店'].map((c) => ({ label: c, value: c })) },
    { key: 'status', label: '状态', type: 'select', options: ['启用', '停用'].map((c) => ({ label: c, value: c })) },
    { key: 'note', label: '备注' }
  ];

  if (!isOwner) return <div className="note">当前账号为「{ROLE_LABEL[user?.role || '']}」，成员管理仅限负责人（owner）操作。你可在「店铺配置」「操作日志」查看配置与审计记录。</div>;

  return (
    <div>
      <div className="hintbar">团队与平台管理：角色权限、成员、店铺渠道配置与操作日志。后端已对成员管理接口做角色鉴权（仅 owner 可调），操作均记入日志。</div>
      <div className="tabs">
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>成员与权限</button>
        <button className={tab === 'shops' ? 'active' : ''} onClick={() => setTab('shops')}>店铺配置</button>
        <button className={tab === 'log' ? 'active' : ''} onClick={() => setTab('log')}>操作日志</button>
      </div>

      {tab === 'users' && (
        <div>
          {err && <div className="error-box">{err}</div>}
          <div className="toolbar"><div className="spacer" /><button className="btn primary" onClick={() => setShowAdd((v) => !v)}>+ 新增成员</button></div>
          {showAdd && (
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="row2">
                <div className="field"><label>账号</label><input value={nu.username} onChange={(e) => setNu({ ...nu, username: e.target.value })} /></div>
                <div className="field"><label>姓名</label><input value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} /></div>
              </div>
              <div className="field"><label>角色</label><select value={nu.role} onChange={(e) => setNu({ ...nu, role: e.target.value })}>{ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></div>
              <div className="muted" style={{ fontSize: 12 }}>默认密码 123456，可在编辑中修改。</div>
              <div style={{ marginTop: 10 }}><button className="btn primary" onClick={addUser}>创建</button></div>
            </div>
          )}
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead><tr><th>账号</th><th>姓名</th><th>角色</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.username}</td><td>{u.name}</td>
                    <td>
                      <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} style={{ padding: '5px 8px', borderRadius: 7, border: '1px solid var(--line)' }}>
                        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </select>
                    </td>
                    <td><span className={`badge ${u.active ? 'b-green' : 'b-gray'}`}>{u.active ? '启用' : '停用'}</span></td>
                    <td><button className="btn sm" onClick={() => toggleActive(u)}>{u.active ? '停用' : '启用'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'shops' && <CrudPage key="shop" title="店铺" endpoint="/api/shops" columns={shopCols} searchable note="维护多平台店铺 / 渠道（淘宝、抖音、拼多多等），供各业务模块按店铺 / 渠道统计。" />}

      {tab === 'log' && (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead><tr><th>时间</th><th>操作人</th><th>动作</th><th>对象</th></tr></thead>
            <tbody>
              {logs.length === 0 && <tr><td colSpan={4}><div className="empty">暂无日志</div></td></tr>}
              {logs.map((l) => (
                <tr key={l.id}><td className="muted">{l.created_at}</td><td>{l.user}</td><td>{l.action}</td><td className="muted">{l.target}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

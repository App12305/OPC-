const TOKEN_KEY = 'eb_token';
const USER_KEY = 'eb_user';

export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function setToken(t: string) { localStorage.setItem(TOKEN_KEY, t); }
export function clearToken() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
}
export function setStoredUser(u: any) { localStorage.setItem(USER_KEY, JSON.stringify(u)); }

async function req(method: string, url: string, body?: any) {
  const headers: any = { 'Content-Type': 'application/json' };
  const t = getToken();
  if (t) headers['Authorization'] = 'Bearer ' + t;
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 401) { clearToken(); if (location.pathname !== '/login') location.href = '/login'; throw new Error('登录已过期，请重新登录'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

export const api = {
  get: (u: string) => req('GET', u),
  post: (u: string, b?: any) => req('POST', u, b),
  put: (u: string, b?: any) => req('PUT', u, b),
  del: (u: string) => req('DELETE', u)
};

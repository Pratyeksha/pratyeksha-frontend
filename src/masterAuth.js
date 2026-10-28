// Platform-admin (/master-admin) session. The backend now requires a signed token on /api/admin/master/* and /api/crm/*
// (POST /api/admin/master/login with the MASTER_ADMIN_PASSWORD set on the server). This module stores that token and attaches
// it to those requests - and only those, and only on our own API - so it is never sent to a guest, operator or third-party URL.
import axios from 'axios';
import API_BASE_URL from './apiBase.js';

const KEY = 'pratyeksha_master_token';
export const MASTER_EXPIRED_EVENT = 'pratyeksha-master-auth-expired';

const read = () => { try { return localStorage.getItem(KEY) || ''; } catch { return ''; } };
export const clearMasterToken = () => { try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ } };

// The token is a JWT; read its expiry locally so an expired one shows the login screen instead of a page full of 401s.
const expiresAtMs = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : 0;
  } catch { return 0; }
};

export const getMasterToken = () => {
  const t = read();
  if (!t) return '';
  if (expiresAtMs(t) <= Date.now() + 5000) { clearMasterToken(); return ''; }
  return t;
};
export const hasValidMasterToken = () => !!getMasterToken();

export async function masterLogin(password) {
  const { data } = await axios.post(`${API_BASE_URL}/admin/master/login`, { password });
  if (!data?.token) throw new Error('Login failed');
  try { localStorage.setItem(KEY, data.token); } catch { /* storage unavailable: session lasts until reload */ }
  return data.token;
}

const isMasterUrl = (url) => typeof url === 'string'
  && (url.startsWith(`${API_BASE_URL}/admin/master`) || url.startsWith(`${API_BASE_URL}/crm`))
  && !url.startsWith(`${API_BASE_URL}/admin/master/login`);

if (typeof window !== 'undefined' && !window.__pratyekshaMasterAuthInstalled) {
  window.__pratyekshaMasterAuthInstalled = true;
  axios.interceptors.request.use((config) => {
    if (isMasterUrl(config.url)) {
      const t = getMasterToken();
      if (t) { config.headers = config.headers || {}; config.headers.Authorization = `Bearer ${t}`; }
    }
    return config;
  });
  axios.interceptors.response.use((r) => r, (err) => {
    if (err?.response?.status === 401 && err.response.data?.code === 'MASTER_AUTH_REQUIRED') {
      clearMasterToken();
      window.dispatchEvent(new Event(MASTER_EXPIRED_EVENT));
    }
    return Promise.reject(err);
  });
}

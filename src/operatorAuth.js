import axios from 'axios';
import API_BASE_URL from './apiBase.js';

/* Attaches the operator's signed, tenant-scoped session token to every call to OUR API, and moves operators whose
   session was created before tokens were verifiable (old "tenant.timestamp" format) back to the login screen once. */
let installed = false;
export function installOperatorAuth() {
  if (installed) return; installed = true;
  axios.interceptors.request.use((config) => {
    try {
      const url = String(config.url || '');
      if (url.startsWith(API_BASE_URL)) {
        const t = localStorage.getItem('pratyeksha_token');
        if (t && !config.headers?.['x-operator-token']) config.headers = { ...(config.headers || {}), 'x-operator-token': t };
      }
    } catch { /* storage unavailable */ }
    return config;
  });
  axios.interceptors.response.use((r) => r, (error) => {
    try {
      const code = error?.response?.data?.code;
      if (error?.response?.status === 401 && code === 'OPERATOR_AUTH_REQUIRED' && localStorage.getItem('pratyeksha_token') && !sessionStorage.getItem('px_relogin_once')) {
        sessionStorage.setItem('px_relogin_once', '1');
        localStorage.removeItem('pratyeksha_token');
        window.location.reload();
      }
    } catch { /* ignore */ }
    return Promise.reject(error);
  });
}

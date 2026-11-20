const configured = String(import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
const host = typeof window !== 'undefined' ? window.location.hostname : '';

// Keep production behaviour unchanged while making local Vite development talk to
// a local backend when VITE_API_URL is intentionally left empty.
export const API_BASE_URL = configured || (
  host === 'localhost' || host === '127.0.0.1' || host === '::1'
    ? 'http://localhost:10000/api'
    : 'https://pratyeksha-backend.onrender.com/api'
);

export const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api$/, '');
export default API_BASE_URL;

import axios from 'axios';

const api = axios.create({
  baseURL: String(import.meta.env.VITE_FEEDBACK_API_URL || '/api/feedback-suite').replace(/\/$/, ''),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export const getPublicSettings = () => api.get('/settings/public');
export const submitFeedback = (payload) => api.post('/feedback', payload);
export const loginAdmin = (payload) => api.post('/auth/login', { ...payload, tenantId: payload?.tenantId || resolveTenantId() });

export const resolveTenantId = () => {
  const queryTenant = new URLSearchParams(window.location.search).get('tenantId');
  return queryTenant || localStorage.getItem('active_tenant') || localStorage.getItem('feedbackTenantId') || '';
};

api.interceptors.request.use((config) => {
  const tenantId = resolveTenantId();
  if (tenantId) config.params = { ...(config.params || {}), tenantId };
  return config;
});

const authConfig = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const getDashboard = (token, params = {}) => api.get('/feedback/dashboard', { ...authConfig(token), params });
export const getFeedback = (token, params = {}) => api.get('/feedback', { ...authConfig(token), params });
export const getCustomers = (token, params = {}) => api.get('/feedback/customers', { ...authConfig(token), params });
export const getCustomerFeedback = (token, id) => api.get(`/feedback/customers/${id}/feedback`, authConfig(token));
export const optOutCustomer = (token, id) => api.post(`/feedback/customers/${id}/marketing-opt-out`, {}, authConfig(token));

export const unlockCampaignStudio = (token, password) => api.post('/campaigns/access', { password }, { ...authConfig(token), timeout: 15000 });
export const getCampaignStatus = (token, campaignAccessToken) => api.get('/campaigns/status', { ...authConfig(token), headers: { Authorization: `Bearer ${token}`, 'X-Campaign-Access-Token': campaignAccessToken } });
const campaignConfig = (token, campaignAccessToken, extra = {}) => ({ ...extra, headers: { Authorization: `Bearer ${token}`, 'X-Campaign-Access-Token': campaignAccessToken } });
export const getCampaignAudience = (token, campaignAccessToken, params = {}) => api.get('/campaigns/audience', campaignConfig(token, campaignAccessToken, { params }));
export const getCampaigns = (token, campaignAccessToken) => api.get('/campaigns', campaignConfig(token, campaignAccessToken));
export const uploadCampaignMedia = (token, campaignAccessToken, payload) => api.post('/campaigns/media', payload, campaignConfig(token, campaignAccessToken, { timeout: 120000 }));
export const createCampaign = (token, campaignAccessToken, payload) => api.post('/campaigns', payload, campaignConfig(token, campaignAccessToken, { timeout: 30000 }));
export const sendCampaign = (token, campaignAccessToken, id) => api.post(`/campaigns/${id}/send`, {}, campaignConfig(token, campaignAccessToken, { timeout: 30000 }));
export const cancelCampaign = (token, campaignAccessToken, id) => api.post(`/campaigns/${id}/cancel`, {}, campaignConfig(token, campaignAccessToken));

export const exportCustomersExcel = async (token, params = {}) => {
  const response = await api.get('/feedback/export/customers', {
    ...authConfig(token),
    params,
    responseType: 'blob',
    timeout: 120000,
  });
  return response.data;
};

export default api;

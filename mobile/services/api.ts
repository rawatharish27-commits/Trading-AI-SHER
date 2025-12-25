
import axios from 'axios';

const API_BASE_URL = 'https://your-sher-ai-instance.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const getDashboardStats = async () => {
  const response = await api.get('/investor/summary');
  return response.data;
};

export const executeOrder = async (signalId: string) => {
  const response = await api.post('/orders/from-signals', {
    signalIds: [signalId],
    portfolioId: 'MOBILE_NODE',
    mode: 'PAPER'
  });
  return response.data;
};

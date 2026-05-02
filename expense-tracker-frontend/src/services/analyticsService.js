import api from './api';

export const getMonthlyAnalytics = async (month, year) => {
  const response = await api.get('/analytics/monthly', { params: { month, year } });
  return response.data;
};

export const getCategoryAnalytics = async (month, year) => {
  const response = await api.get('/analytics/category', { params: { month, year } });
  return response.data;
};

export const getTrends = async (month, year) => {
  const response = await api.get('/analytics/trends', { params: { month, year } });
  return response.data;
};

export const setBudget = async (data) => {
  const response = await api.post('/budgets', data);
  return response.data;
};

export const getBudget = async (month, year) => {
  const response = await api.get(`/budgets/${month}/${year}`);
  return response.data;
};

export const exportExcel = async (month, year) => {
  const response = await api.get('/export/excel', {
    params: { month, year },
    responseType: 'blob',
  });
  return response;
};

export const exportPdf = async (month, year) => {
  const response = await api.get('/export/pdf', {
    params: { month, year },
    responseType: 'blob',
  });
  return response;
};

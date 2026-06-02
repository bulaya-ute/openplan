import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('openplan_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('openplan_token');
      localStorage.removeItem('openplan_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;

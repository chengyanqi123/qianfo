import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const isMock = import.meta.env.VITE_MOCK === 'true';

export const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

request.interceptors.request.use((config) => {
  const auth = useAuthStore();
  if (auth.token) {
    config.headers['Authorization'] = `${auth.token}`;
  }
  config.headers['x-range-valid'] = +new Date();
  return config;
});

request.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code !== 0) return Promise.reject(new Error(res.message || '请求失败'));
    return res.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      const auth = useAuthStore();
      auth.logout();
      window.location.href = '/login';
    }
    return Promise.reject(new Error(error.response?.data?.message || error.message || '网络错误'));
  },
);

export { isMock };

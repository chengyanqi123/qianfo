import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { useLoading } from '@/composables/useLoading';
import { Action, ElMessage, ElMessageBox } from 'element-plus';

const isMock = import.meta.env.VITE_MOCK === 'true';
const { openLoading, closeLoading } = useLoading();

export const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

request.interceptors.request.use((config) => {
  const auth = useAuthStore();
  openLoading();
  if (auth.token) {
    config.headers['Authorization'] = `${auth.token}`;
  }
  config.headers['x-range-valid'] = +new Date();
  return config;
});

request.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code !== 0) {
      ElMessage.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    closeLoading();
    return res.data;
  },
  (error) => {
    closeLoading();
    if (error?.code === 'ERR_CANCELED') {
      // 静默处理取消的请求，不抛出错误
      return Promise.resolve(null);
    }
    const message = error.response?.data?.message || error.message || '网络错误';
    if (error.response?.status === 401) {
      const auth = useAuthStore();
      ElMessageBox.alert('登录已过期，为了您的账户安全，请重新登录！', '提示', {
        confirmButtonText: '确定',
        callback: (action: Action) => {
          auth.logout();
        },
      });
      window.location.href = '/login';
      return Promise.reject(new Error('登录已过期，请重新登录'));
    }
    ElMessage.error(message);
    return Promise.reject(new Error(message));
  },
);

export { isMock };

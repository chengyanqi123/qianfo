import axios from 'axios';
import { useUserStore } from '@/stores/user';
import router from '@/router';
import { showFailToast } from 'vant';

export const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

request.interceptors.request.use((config) => {
  const user = useUserStore();
  const token = user.getToken();
  if (token) {
    config.headers['Authorization'] = `${token}`;
  }
  config.headers['x-range-valid'] = +new Date();
  return config;
});

request.interceptors.response.use(
  (response) => {
    debugger;
    const res = response.data;
    if (res.code !== 0) {
      showFailToast(res.message || `请求失败[${res.code}]`);
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return res.data;
  },
  (error) => {
    debugger;
    const message = error?.response?.data?.message || error?.message;
    const code = error?.response?.data?.code || error?.response?.status;
    if (error.response?.status === 401) {
      showFailToast(`${message || '登录信息已过期'}[${code}]`);
      useUserStore().clear();
      router.replace('/appointment');
    }
    showFailToast(`${message || '网络错误'}[${code}]`);
    return Promise.reject(new Error(`${message || '网络错误'}[${code}]`));
  },
);

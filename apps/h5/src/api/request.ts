import axios from 'axios';
import { useUserStore } from '@/stores/user';
import router from '@/router';
import { showFailToast } from 'vant';
import { useWechat } from '@/composables/useWechat';
import { captureMonitorException } from '@qianfo/shared';
// 登录重定向标志位
// wxLogin 内部调用的是 window.location.replace()，整个页面会跳走到微信授权页。
// 用户授权回来后 SPA 会重新加载，所有模块级变量都会重新初始化，isRedirecting 又会重置到 false。
let isRedirecting = false;

function summarizePayload(payload: unknown) {
  if (!payload) return undefined;
  const value = typeof payload === 'string' ? (() => {
    try {
      return JSON.parse(payload);
    } catch {
      return payload;
    }
  })() : payload;
  if (Array.isArray(value)) {
    return { type: 'array', size: value.length };
  }
  if (value && typeof value === 'object') {
    return { type: 'object', keys: Object.keys(value as Record<string, unknown>).slice(0, 20) };
  }
  return { type: typeof value };
}

function reportApiError(error: unknown, responseCode?: number | string, statusCode?: number, config?: any) {
  captureMonitorException(error, {
    tags: {
      source: 'api',
      method: String(config?.method || 'get').toUpperCase(),
    },
    extra: {
      responseCode,
      statusCode,
      url: config?.url,
      params: summarizePayload(config?.params),
      data: summarizePayload(config?.data),
    },
  });
}

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
    const res = response.data;
    if (res.code !== 0) {
      if (res.code !== 401) {
        reportApiError(new Error(res.message || '请求失败'), res.code, response.status, response.config);
      }
      showFailToast(res.message || `请求失败[${res.code}]`);
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return res.data;
  },
  (error) => {
    const message = error?.response?.data?.message || error?.message;
    const code = error?.response?.data?.code || error?.response?.status;
    if (error.response?.status === 401) {
      if (!isRedirecting) {
        isRedirecting = true;
        showFailToast(`${message || '登录信息已过期'}[${code}]`);
        useUserStore().clear();
        const { login: wxLogin } = useWechat();
        const currentRoute = router.currentRoute.value;
        wxLogin(undefined, { _fullPath: currentRoute.fullPath }).then((data) => {
          data && useUserStore().setUserInfo(data);
        });
      }
      return Promise.reject(new Error(`${message || '登录信息已过期'}[${code}]`));
    }
    reportApiError(error, code, error.response?.status, error.config);
    showFailToast(`${message || '网络错误'}[${code}]`);
    return Promise.reject(new Error(`${message || '网络错误'}[${code}]`));
  },
);

import { AxiosRequestConfig } from 'axios';
import { request } from './request';
import type { LimitResult, SetDefaultLimitParams, GetLimitByDateParams, SetLimitByDateParams } from '@qianfo/shared';

// 获取默认限制
export function getDefaultLimit(_params = {}, options?: AxiosRequestConfig): Promise<number> {
  return request.get('/setting/capacity/default', { params: _params, ...options });
}

// 设置默认限制
export function setDefaultLimit(_params: SetDefaultLimitParams, options?: AxiosRequestConfig): Promise<null> {
  return request.put('/setting/capacity/default', _params, options);
}

// 获取指定时间段的默认限制
export function getLimitByDate(params: GetLimitByDateParams, options?: AxiosRequestConfig): Promise<LimitResult> {
  return request.post('/setting/capacity/config', params, options);
}

// 设置某一天的默认限制
export function setLimitByDate(params: SetLimitByDateParams, options?: AxiosRequestConfig): Promise<null> {
  return request.put('/setting/capacity', params, options);
}

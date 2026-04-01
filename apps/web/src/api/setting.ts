import { AxiosRequestConfig } from 'axios';
import { request } from './request';
import type {
  LimitResult,
  SetDefaultLimitParams,
  GetLimitByDateParams,
  SetLimitByDateParams,
  GetAppointmentInfoByDateParams,
  AppointmentInfoResult,
} from '@qianfo/shared';
import {
  SETTING_CAPACITY_DEFAULT,
  SETTING_CAPACITY_CONFIG,
  SETTING_CAPACITY,
  SETTING_CAPACITY_APPOINTMENT,
} from '@qianfo/shared';

// 获取默认限制
export function getDefaultLimit(_params = {}, options?: AxiosRequestConfig): Promise<number> {
  return request.get(SETTING_CAPACITY_DEFAULT, { params: _params, ...options });
}

// 设置默认限制
export function setDefaultLimit(_params: SetDefaultLimitParams, options?: AxiosRequestConfig): Promise<null> {
  return request.put(SETTING_CAPACITY_DEFAULT, _params, options);
}

// 获取指定时间段的默认限制
export function getLimitByDate(params: GetLimitByDateParams, options?: AxiosRequestConfig): Promise<LimitResult> {
  return request.post(SETTING_CAPACITY_CONFIG, params, options);
}

// 获取指定时间段的预约信息
export function getReserveByDate(
  params: GetAppointmentInfoByDateParams,
  options?: AxiosRequestConfig,
): Promise<AppointmentInfoResult> {
  return request.post(SETTING_CAPACITY_APPOINTMENT, params, options);
}

// 设置某一天的默认限制
export function setLimitByDate(params: SetLimitByDateParams, options?: AxiosRequestConfig): Promise<null> {
  return request.put(SETTING_CAPACITY, params, options);
}

import type {
  GetLimitByDateParams,
  GetAppointmentInfoByDateParams,
  LimitResult,
  AppointmentInfoResult,
} from '@qianfo/shared';
import { SETTING_CAPACITY_CONFIG, SETTING_CAPACITY_DEFAULT, SETTING_CAPACITY_APPOINTMENT } from '@qianfo/shared';
import { request } from './request';
import { AxiosRequestConfig } from 'axios';

// 获取指定时间段的默认限制
export function getLimitByDate(params: GetLimitByDateParams, options?: AxiosRequestConfig): Promise<LimitResult> {
  return request.post(SETTING_CAPACITY_CONFIG, params, options);
}

// 获取默认限制
export function getDefaultLimit(_params = {}, options?: AxiosRequestConfig): Promise<number> {
  return request.get(SETTING_CAPACITY_DEFAULT, { params: _params, ...options });
}

// 获取指定时间段的预约情况
export function getAppointmentInfoByDate(
  params: GetAppointmentInfoByDateParams,
  options?: AxiosRequestConfig,
): Promise<AppointmentInfoResult> {
  return request.post(SETTING_CAPACITY_APPOINTMENT, params, options);
}

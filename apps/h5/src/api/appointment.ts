import type { CreateAppointmentDto, PageResult, LoginResult } from '@qianfo/shared';
import { useRouter } from 'vue-router';
import { request } from './request';

const router = useRouter();

/** 用户登录 */
export async function login(code: string): Promise<LoginResult> {
  return request.post('/auth/h5/login', { code });
}

/** 提交预约 */
export async function submitAppointment(dto: CreateAppointmentDto): Promise<any> {
  return request.post('/appointments', dto);
}

/** 获取历史预约记录 */
export async function getAppointmentHistory(page = 1, pageSize = 10): Promise<PageResult<any>> {
  return request.get('/appointments/history', { params: { page, pageSize } });
}

/** 取消预约 */
export async function cancelAppointment(id: number): Promise<any> {
  return request.patch(`/appointments/${id}/status`, { status: 'cancelled' });
}

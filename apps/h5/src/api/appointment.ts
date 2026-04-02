import type { AppointmentStatus, CreateAppointmentDto, PageResult } from '@qianfo/shared';
import { APPOINTMENTS, APPOINTMENTS_HISTORY, appointments_status, appointmentStatusUrl } from '@qianfo/shared';
import { request } from './request';

/** 提交预约 */
export async function submitAppointment(dto: CreateAppointmentDto): Promise<any> {
  return request.post(APPOINTMENTS, dto);
}

/** 获取历史预约记录 */
export async function getAppointmentHistory(page = 1, pageSize = 10): Promise<PageResult<any>> {
  return request.get(APPOINTMENTS_HISTORY, { params: { page, pageSize } });
}

/** 取消预约 */
export async function cancelAppointment(id: number): Promise<any> {
  return request.patch(appointmentStatusUrl(id), { status: 'cancelled' });
}

export async function getAppointmentStatus(id: number): Promise<AppointmentStatus> {
  return request.get(appointments_status(id));
}

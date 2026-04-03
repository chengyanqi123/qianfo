import { request } from './request';
import type { Appointment, AppointmentStatus, PageResult } from '@qianfo/shared';
import { APPOINTMENTS, appointmentsWriteOff as appo_wo, appointmentStatusUrl } from '@qianfo/shared';

export interface AppointmentFilter {
  page: number;
  pageSize: number;
  phone?: string;
  status?: AppointmentStatus | '';
  dateStart?: string;
  dateEnd?: string;
}

/** 获取分页预约列表 */
export async function getAppointments(filter: AppointmentFilter): Promise<PageResult<Appointment>> {
  return request.get(APPOINTMENTS, { params: filter });
}

/** 更新预约状态 */
export async function updateAppointmentStatus(id: number, status: AppointmentStatus): Promise<void> {
  return request.patch(appointmentStatusUrl(id), { status });
}

/** 核销预约(仅从预约中->已确认) */
export async function appointmentsWriteOff(id: number): Promise<void> {
  return request.post(appo_wo(id));
}

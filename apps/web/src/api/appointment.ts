import { request, isMock } from './request';
import type { Appointment, AppointmentStatus, PageResult } from '@qianfo/shared';
import { APPOINTMENTS, appointments_write_off, appointmentStatusUrl } from '@qianfo/shared';

export interface AppointmentFilter {
  page: number;
  pageSize: number;
  phone?: string;
  status?: AppointmentStatus | '';
  dateStart?: string;
  dateEnd?: string;
}

const MOCK_APPOINTMENTS: Appointment[] = Array.from({ length: 38 }, (_, i) => ({
  id: i + 1,
  userId: Math.floor(Math.random() * 10) + 1,
  date: `2026-03-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
  time: `${String(9 + Math.floor(Math.random() * 9)).padStart(2, '0')}:00`,
  count: Math.floor(Math.random() * 8) + 1,
  phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
  status: (['pending', 'confirmed', 'cancelled'] as AppointmentStatus[])[Math.floor(Math.random() * 3)],
  remark: i % 3 === 0 ? '靠窗位置' : undefined,
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
}));

export async function getAppointments(filter: AppointmentFilter): Promise<PageResult<Appointment>> {
  if (isMock) {
    await new Promise((r) => setTimeout(r, 400));
    let data = [...MOCK_APPOINTMENTS];
    if (filter.phone) data = data.filter((a) => a.phone.includes(filter.phone!));
    if (filter.status) data = data.filter((a) => a.status === filter.status);
    if (filter.dateStart) data = data.filter((a) => a.date >= filter.dateStart!);
    if (filter.dateEnd) data = data.filter((a) => a.date <= filter.dateEnd!);
    const start = (filter.page - 1) * filter.pageSize;
    return {
      list: data.slice(start, start + filter.pageSize),
      total: data.length,
      page: filter.page,
      pageSize: filter.pageSize,
    };
  }
  return request.get(APPOINTMENTS, { params: filter });
}

export async function updateAppointmentStatus(id: number, status: AppointmentStatus): Promise<void> {
  if (isMock) {
    await new Promise((r) => setTimeout(r, 300));
    const item = MOCK_APPOINTMENTS.find((a) => a.id === id);
    if (item) item.status = status;
    return;
  }
  return request.patch(appointmentStatusUrl(id), { status });
}

export async function appointmentsWriteOff(id: number): Promise<void> {
  return request.post(appointments_write_off(id));
}

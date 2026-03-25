import axios from 'axios'
import type { CreateAppointmentDto, Appointment, PageResult } from '@qianfo/shared'

const isMock = import.meta.env.VITE_MOCK === 'true'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
})

// ============ Mock 数据 ============

const MOCK_HISTORY: Appointment[] = [
  {
    id: 1,
    userId: 1,
    date: '2026-03-20',
    time: '10:00',
    count: 2,
    phone: '13800138000',
    status: 'confirmed',
    createdAt: '2026-03-18T08:00:00Z',
  },
  {
    id: 2,
    userId: 1,
    date: '2026-03-22',
    time: '14:00',
    count: 4,
    phone: '13800138000',
    status: 'pending',
    remark: '需要靠窗位置',
    createdAt: '2026-03-19T10:30:00Z',
  },
  {
    id: 3,
    userId: 1,
    date: '2026-03-10',
    time: '18:00',
    count: 6,
    phone: '13800138000',
    status: 'cancelled',
    createdAt: '2026-03-08T14:00:00Z',
  },
]

// ============ 请求拦截（Mock） ============

request.interceptors.response.use(undefined, (error) => Promise.reject(error))

// ============ API 方法 ============

/** 提交预约 */
export async function submitAppointment(dto: CreateAppointmentDto): Promise<void> {
  if (isMock) {
    await new Promise((r) => setTimeout(r, 600))
    return
  }
  await request.post('/appointments', dto)
}

/** 获取历史预约记录 */
export async function getAppointmentHistory(
  page = 1,
  pageSize = 10,
): Promise<PageResult<Appointment>> {
  if (isMock) {
    await new Promise((r) => setTimeout(r, 500))
    return {
      list: MOCK_HISTORY,
      total: MOCK_HISTORY.length,
      page,
      pageSize,
    }
  }
  const res = await request.get('/appointments/history', { params: { page, pageSize } })
  return res.data
}

/** 取消预约 */
export async function cancelAppointment(id: number): Promise<void> {
  if (isMock) {
    await new Promise((r) => setTimeout(r, 400))
    const item = MOCK_HISTORY.find((a) => a.id === id)
    if (item) item.status = 'cancelled'
    return
  }
  await request.patch(`/appointments/${id}/status`, { status: 'cancelled' })
}

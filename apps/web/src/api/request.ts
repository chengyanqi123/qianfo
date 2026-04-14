import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useLoading } from '@/composables/useLoading'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '@/router'
import { captureMonitorException } from '@qianfo/shared'

const { openLoading, closeLoading } = useLoading()

// 登录标志位，防止并发请求同时401时，多次弹窗提示问题:
//  1. auth.logout() 立即执行 — 不等用户点确定，第一时间清除 Token，防止后续请求继续带过期 Token
//  2. 在成功响应中重置标志位 — 用户重新登录后，第一个成功请求会把 isLogoutHandling 重置为 false，下次过期时能正常弹窗
let isLogoutHandling = false

function summarizePayload(payload: unknown) {
  if (!payload) return undefined
  const value = typeof payload === 'string'
    ? (() => {
        try {
          return JSON.parse(payload)
        } catch {
          return payload
        }
      })()
    : payload
  if (Array.isArray(value)) {
    return { type: 'array', size: value.length }
  }
  if (value && typeof value === 'object') {
    return { type: 'object', keys: Object.keys(value as Record<string, unknown>).slice(0, 20) }
  }
  return { type: typeof value }
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
  })
}

export const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

request.interceptors.request.use((config) => {
  const auth = useAuthStore()
  openLoading()
  if (auth.token) {
    config.headers['Authorization'] = `${auth.token}`
  }
  config.headers['x-range-valid'] = +new Date()
  return config
})

request.interceptors.response.use(
  (response) => {
    closeLoading()
    isLogoutHandling = false
    const res = response.data
    if (res.code !== 0) {
      if (res.code !== 401) {
        reportApiError(new Error(res.message || '请求失败'), res.code, response.status, response.config)
      }
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res.data
  },
  (error) => {
    closeLoading()
    if (error?.code === 'ERR_CANCELED') {
      return Promise.resolve(null)
    }
    const message = error.response?.data?.message || error.message || '网络错误'
    if (error?.status === 401 || error.response?.status === 401 || error.response?.data?.code === 401) {
      if (!isLogoutHandling) {
        isLogoutHandling = true
        const auth = useAuthStore()
        auth.logout()
        ElMessageBox.alert('登录已过期，为了您的账户安全，请重新登录！', '提示', {
          confirmButtonText: '确定',
          callback: () => {
            router.replace('/login')
          },
        })
      }
      return Promise.reject(new Error('登录已过期，请重新登录'))
    }
    reportApiError(error, error.response?.data?.code, error.response?.status, error.config)
    ElMessage.error(message)
    return Promise.reject(new Error(message))
  },
)

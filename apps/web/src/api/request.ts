import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useLoading } from '@/composables/useLoading'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '@/router'

const { openLoading, closeLoading } = useLoading()

// 登录标志位，防止并发请求同时401时，多次弹窗提示问题:
//  1. auth.logout() 立即执行 — 不等用户点确定，第一时间清除 Token，防止后续请求继续带过期 Token
//  2. 在成功响应中重置标志位 — 用户重新登录后，第一个成功请求会把 isLogoutHandling 重置为 false，下次过期时能正常弹窗
let isLogoutHandling = false

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
    ElMessage.error(message)
    return Promise.reject(new Error(message))
  },
)

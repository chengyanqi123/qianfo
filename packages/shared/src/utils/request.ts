import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'

export interface RequestConfig extends AxiosRequestConfig {
  /** 不自动携带 token（如登录接口） */
  noAuth?: boolean
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/**
 * 创建一个 axios 实例，统一处理请求/响应拦截。
 * @param baseURL - API 基础地址
 * @param getToken - 获取 token 的函数（由各端自行实现）
 * @param noAuthHandler - 处理未授权请求的函数（如跳转登录页）
 * @returns - axios 实例
 */
type NoAuthHandler = (response: AxiosResponse<ApiResponse>) => Promise<void> | void
export function createRequest(baseURL: string, getToken: () => string | null, noAuthHandler?: NoAuthHandler): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  })

  // 请求拦截：自动挂载 token
  instance.interceptors.request.use((config) => {
    const token = getToken()
    if (token && !(config as RequestConfig).noAuth) {
      config.headers = config.headers ?? {}
      config.headers['Authorization'] = `${token}`
    }
    config.headers['x-range-valid'] = +new Date()
    return config
  })

  // 响应拦截：统一解包 data，业务错误转为 reject
  instance.interceptors.response.use(
    async (response: AxiosResponse<ApiResponse>) => {
      const res = response.data
      if (res.code === 401) {
        const stopper = await noAuthHandler?.(response)
        if (stopper) return stopper
      }
      if (res.code !== 0) {
        return Promise.reject(new Error(res.message ?? '请求失败'))
      }
      return res.data as any
    },
    async (error) => {
      if (error.response?.status === 401) {
        const stopper = await noAuthHandler?.(error?.response)
        if (stopper) return stopper
      }
      const message = error.response?.data?.message ?? error.message ?? '网络错误'
      return Promise.reject(new Error(message))
    },
  )

  return instance
}

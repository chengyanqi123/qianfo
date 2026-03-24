import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { getWxConfig } from '@/api/wechat'

// weixin-js-sdk 通过 UMD 方式挂载在 window.wx，需要声明类型
declare const wx: any

/**
 * 微信 JS-SDK 初始化与手机号获取。
 * 真实环境需要后端提供签名接口 /api/wechat/jsconfig。
 */
export function useWechat() {
  const userStore = useUserStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function initWx() {
    try {
      const url = window.location.href.split('#')[0]
      const config = await getWxConfig(url)
      wx.config({
        debug: false,
        appId: config.appId,
        timestamp: config.timestamp,
        nonceStr: config.nonceStr,
        signature: config.signature,
        jsApiList: [],
        openTagList: ['wx-open-launch-weapp'],
      })
    } catch (e) {
      console.warn('[useWechat] wx.config 初始化失败，可能不在微信环境', e)
    }
  }

  /**
   * 通过微信网页授权获取手机号（一键登录按钮方式）
   * 本方法适用于公众号中调用，需要用户授权。
   */
  function getPhoneNumber(callback: (phone: string) => void) {
    loading.value = true
    wx.ready(() => {
      // wx.invoke 适用于企业微信；公众号通常使用授权回调获取 phone
      // 此处展示调用模式，实际手机号需从授权回调 URL 参数中解析
      wx.invoke(
        'getPhoneNumber',
        {},
        (res: { phoneNumber?: string; errMsg: string }) => {
          loading.value = false
          if (res.phoneNumber) {
            userStore.setPhone(res.phoneNumber)
            callback(res.phoneNumber)
          } else {
            error.value = '获取手机号失败: ' + res.errMsg
          }
        },
      )
    })
    wx.error((err: { errMsg: string }) => {
      loading.value = false
      error.value = err.errMsg
    })
  }

  /** 尝试从 URL query 中解析手机号（授权回调场景） */
  function parsePhoneFromQuery() {
    const params = new URLSearchParams(window.location.search)
    const phone = params.get('phone')
    if (phone) {
      userStore.setPhone(phone)
    }
  }

  onMounted(async () => {
    parsePhoneFromQuery()
    await initWx()
  })

  return { loading, error, getPhoneNumber }
}

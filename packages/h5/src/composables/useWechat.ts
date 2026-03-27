import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { getWxConfig, getOpenIdByCode } from '@/api/wechat'
const SITE_ADDRESS = import.meta.env.VITE_SITE_ADDRESS
const WX_APP_ID = import.meta.env.VITE_WX_APP_ID

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
      wx.invoke('getPhoneNumber', {}, (res: { phoneNumber?: string; errMsg: string }) => {
        loading.value = false
        if (res.phoneNumber) {
          userStore.setPhone(res.phoneNumber)
          callback(res.phoneNumber)
        } else {
          error.value = '获取手机号失败: ' + res.errMsg
        }
      })
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

  /**
   * 获取微信 openId，基于 OAuth2.0 网页授权流程（snsapi_base 静默授权）。
   *
   * 流程：
   * 1. 若当前 URL 已携带 `code` 参数（微信授权回调），直接用 code 换取 openId。
   * 2. 否则，将用户重定向到微信授权页；微信完成授权后会把 code 拼回 redirect_uri，
   *    页面重新加载后再次进入步骤 1。
   *
   * @param appId   微信公众号 AppID（由后端透传或写入环境变量）
   * @param options.scope  'snsapi_base'（静默，仅获取 openId）|
   *                       'snsapi_userinfo'（需用户手动同意，可获取昵称头像）
   *                       默认 'snsapi_base'
   * @param options.state  透传参数，原样出现在回调 URL 中，默认 'STATE'
   */
  async function getOpenId(appId?: string, { scope = 'snsapi_base', state = 'STATE' }: { scope?: 'snsapi_base' | 'snsapi_userinfo'; state?: string } = {}): Promise<string | null> {
    if (!appId) {
      appId = WX_APP_ID
    }
    // ── 步骤 1：回调页，URL 上已有 code ──────────────────────────────────
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (code) {
      try {
        loading.value = true
        const { openId } = await getOpenIdByCode(code)
        userStore.setOpenId(openId)

        // 清理 URL 中的 code / state，避免刷新后重复使用（code 只能用一次）
        params.delete('code')
        params.delete('state')
        const cleanSearch = params.toString()
        const cleanUrl = window.location.pathname + (cleanSearch ? `?${cleanSearch}` : '') + window.location.hash
        window.history.replaceState(null, '', cleanUrl)

        return openId
      } catch (e) {
        error.value = e instanceof Error ? e.message : '获取 openId 失败'
        return null
      } finally {
        loading.value = false
      }
    }

    // ── 步骤 2：尚未授权，跳转微信授权页 ────────────────────────────────
    const redirectUri = encodeURIComponent(SITE_ADDRESS)
    const authUrl =
      `https://open.weixin.qq.com/connect/oauth2/authorize` + `?appid=${appId}` + `&redirect_uri=${redirectUri}` + `&response_type=code` + `&scope=${scope}` + `&state=${state}` + `#wechat_redirect`

    window.location.href = authUrl
    return null // 页面即将跳转，此处不会真正执行
  }

  onMounted(async () => {
    parsePhoneFromQuery()
    await initWx()
  })

  return { loading, error, getPhoneNumber, getOpenId }
}

import { createRouter, createWebHashHistory } from 'vue-router'
import AppointmentView from '@/views/AppointmentView.vue'
import HistoryView from '@/views/HistoryView.vue'
import * as Apis from '@/api/login'
import { useUserStore } from '@/stores/user'

function getWechatCallbackQuery() {
  const searchParams = new URLSearchParams(window.location.search)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code && !state) {
    return null
  }

  return {
    ...(code ? { code } : {}),
    ...(state ? { state } : {}),
  }
}

function clearWechatCallbackQueryFromUrl() {
  const url = new URL(window.location.href)
  const searchParams = new URLSearchParams(url.search)
  const hasCallbackQuery = searchParams.has('code') || searchParams.has('state')

  if (!hasCallbackQuery) {
    return
  }

  searchParams.delete('code')
  searchParams.delete('state')

  const nextSearch = searchParams.toString()
  const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash}`
  window.history.replaceState(window.history.state, '', nextUrl)
}

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/appointment' },
    { path: '/appointment', component: AppointmentView, meta: { title: '在线预约' } },
    { path: '/history', component: HistoryView, meta: { title: '预约历史' } },
  ],
})

router.beforeEach(async (to) => {
  const callbackQuery = getWechatCallbackQuery()
  const code = (to.query.code as string | undefined) || callbackQuery?.code
  const hasRouteCallbackQuery = to.query.code !== undefined || to.query.state !== undefined

  if (code) {
    try {
      const data = await Apis.login(code)
      useUserStore().setUserInfo(data)
    } catch {
      // 登录失败，继续导航
    }

    clearWechatCallbackQueryFromUrl()

    if (hasRouteCallbackQuery) {
      // 删除路由里的 code / state，避免重复触发登录
      const { code: _, state: __, ...query } = to.query
      return { path: to.path, query, hash: to.hash }
    }

    return
  }

  if (callbackQuery) {
    clearWechatCallbackQueryFromUrl()
  }
})

router.afterEach((to) => {
  document.title = `千佛摆渡车 - ${to.meta.title}`
})

export default router

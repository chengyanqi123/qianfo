import { createRouter, createWebHistory } from 'vue-router'
import AppointmentView from '@/views/AppointmentView.vue'
import HistoryView from '@/views/HistoryView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/appointment' },
    { path: '/appointment', component: AppointmentView, meta: { title: '预约' } },
    { path: '/history', component: HistoryView, meta: { title: '历史' } },
  ],
})

router.afterEach((to) => {
  document.title = (to.meta.title as string) || '预约服务'
})

export default router

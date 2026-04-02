import { createRouter, createWebHistory } from 'vue-router';
import AppointmentView from '@/views/AppointmentView.vue';
import HistoryView from '@/views/HistoryView.vue';
import * as Apis from '@/api/login';
import { useUserStore } from '@/stores/user';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/appointment' },
    { path: '/appointment', component: AppointmentView, meta: { title: '在线预约' } },
    { path: '/history', component: HistoryView, meta: { title: '预约历史' } },
  ],
});

router.beforeEach(async (to) => {
  const code = to.query.code as string | undefined;
  if (code) {
    try {
      const data = await Apis.login(code);
      useUserStore().setUserInfo(data);
    } catch {
      // 登录失败，继续导航
    }
    // 删除code和state参数
    const { code: _, state: __, ...query } = to.query;
    return { path: to.path, query };
  }
});

router.afterEach((to) => {
  document.title = `千佛摆渡车 - ${to.meta.title}`;
});

export default router;

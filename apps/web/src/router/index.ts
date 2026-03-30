import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import AppLayout from '@/layout/AppLayout.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { title: '控制台', icon: 'Odometer' },
        },
        {
          path: 'appointments',
          component: () => import('@/views/AppointmentView.vue'),
          meta: { title: '预约管理', icon: 'Calendar' },
        },
        {
          path: 'users',
          component: () => import('@/views/UserView.vue'),
          meta: { title: '用户管理', icon: 'User' },
        },
        {
          path: 'settings',
          component: () => import('@/views/SettingView.vue'),
          meta: { title: '系统设置', icon: 'Setting' },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth !== false && !auth.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  if (to.path === '/login' && auth.isLoggedIn) {
    return { path: '/' };
  }
});

export default router;

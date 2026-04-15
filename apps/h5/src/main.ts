import { createApp } from 'vue';
import { watch } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import router from './router';
import './styles/main.css';
// 函数式调用的 Vant API（showConfirmDialog / showToast 等）需手动引入样式
import 'vant/es/dialog/style';
import 'vant/es/toast/style';
import { Notify } from 'vant';
import { initMonitor, setMonitorContext, setMonitorTag, setMonitorUser } from '@qianfo/shared';
import { useUserStore } from '@/stores/user';
import { setUmengUserId, trackUmengPageView } from '@/analytics/umeng';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);
app.use(Notify);
app.use(pinia);
app.use(router);

initMonitor({
  app,
  router,
  appName: 'h5',
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
  release: import.meta.env.VITE_SENTRY_RELEASE,
  tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.1),
  replaysSessionSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || 0),
  replaysOnErrorSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || 1),
});

const userStore = useUserStore(pinia);

watch(
  () => userStore.user,
  (session) => {
    const currentUser = session.user;
    if (!session.token || !currentUser?.id) {
      setUmengUserId(null);
      setMonitorUser(null);
      setMonitorTag('user_role', null);
      return;
    }

    setUmengUserId(String(currentUser.id));
    setMonitorUser({
      id: String(currentUser.id),
      username: currentUser.nickname || undefined,
      segment: currentUser.role,
    });
    setMonitorTag('user_role', currentUser.role ?? 'user');
  },
  { immediate: true, deep: true },
);

router.afterEach((to) => {
  trackUmengPageView(to);
  setMonitorTag('route', to.path);
  setMonitorContext('route', {
    path: to.path,
    fullPath: to.fullPath,
    name: to.name ? String(to.name) : null,
    params: to.params,
    query: to.query,
  });
});

app.mount('#app');

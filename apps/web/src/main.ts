import { createApp, watch } from 'vue';
import { createPinia } from 'pinia';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import ElementPlus from 'element-plus';
import App from './App.vue';
import router from './router';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import './styles/main.css';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { initMonitor, setMonitorContext, setMonitorTag, setMonitorUser } from '@qianfo/shared';
import { useAuthStore } from '@/stores/auth';

const app = createApp(App);
const pinia = createPinia();

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(pinia);
app.use(router);
app.use(ElementPlus, {
  locale: zhCn,
});

initMonitor({
  app,
  router,
  appName: 'web',
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
  release: import.meta.env.VITE_SENTRY_RELEASE,
  tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.1),
  replaysSessionSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || 0),
  replaysOnErrorSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || 1),
})

const authStore = useAuthStore(pinia)

watch(
  [() => authStore.token, () => authStore.user],
  ([token, user]) => {
    if (!token || !user?.id) {
      setMonitorUser(null)
      setMonitorTag('user_role', null)
      return
    }

    setMonitorUser({
      id: String(user.id),
      username: user.username || undefined,
      segment: user.role,
    })
    setMonitorTag('user_role', user.role)
  },
  { immediate: true },
)

router.afterEach((to) => {
  setMonitorTag('route', to.path)
  setMonitorContext('route', {
    path: to.path,
    fullPath: to.fullPath,
    name: to.name ? String(to.name) : null,
    params: to.params,
    query: to.query,
  })
})

app.mount('#app');

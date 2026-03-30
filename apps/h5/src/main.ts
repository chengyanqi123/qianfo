import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import router from './router';
import './styles/main.css';
// 函数式调用的 Vant API（showConfirmDialog / showToast 等）需手动引入样式
import 'vant/es/dialog/style';
import 'vant/es/toast/style';
import { Notify } from 'vant';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);
app.use(Notify);
app.use(pinia);
app.use(router);
app.mount('#app');

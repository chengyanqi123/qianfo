import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/main.css'
// 函数式调用的 Vant API（showConfirmDialog / showToast 等）需手动引入样式
import 'vant/es/dialog/style'
import 'vant/es/toast/style'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

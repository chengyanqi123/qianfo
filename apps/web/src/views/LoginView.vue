<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <el-icon class="login-logo"><Calendar /></el-icon>
        <h1 class="login-title">千佛摆渡车—预约管理系统</h1>
        <p class="login-subtitle">请登录您的账号</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="onSubmit">
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" placeholder="请输入账号" :prefix-icon="User" size="large" clearable />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="onSubmit"
          />
        </el-form-item>
        <el-checkbox v-model="rememberMe" class="remember-me">记住密码</el-checkbox>
        <el-button type="primary" size="large" :loading="loading" class="login-btn" @click="onSubmit"> 登录 </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { login } from '@/api/auth'
import { trackMonitorEvent } from '@qianfo/shared'

const REMEMBER_KEY = 'qianfo_remember'

const router = useRouter()
const route = useRoute()

const formRef = ref<FormInstance>()
const loading = ref(false)
const rememberMe = ref(false)
const form = reactive({ username: '', password: '' })

const rules: FormRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

onMounted(() => {
  const saved = localStorage.getItem(REMEMBER_KEY)
  if (saved) {
    try {
      const { username, password } = JSON.parse(saved)
      form.username = username
      form.password = password
      rememberMe.value = true
    } catch {
      localStorage.removeItem(REMEMBER_KEY)
    }
  }
})

async function onSubmit() {
  await formRef.value?.validate()
  loading.value = true
  try {
    const auth = useAuthStore()
    const result = await login(form)
    auth.setToken(result.token)
    auth.setUser(result.user)

    if (rememberMe.value) {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({ username: form.username, password: form.password }))
    } else {
      localStorage.removeItem(REMEMBER_KEY)
    }

    const redirect = (route.query.redirect as string) || '/'
    trackMonitorEvent('admin_login', {
      attributes: {
        result: 'success',
        remember_me: rememberMe.value,
      },
      data: {
        redirect,
      },
    })
    router.replace(redirect)
  } catch (error: any) {
    trackMonitorEvent('admin_login', {
      attributes: {
        result: 'failure',
        remember_me: rememberMe.value,
      },
      data: {
        reason: error?.message || 'unknown',
      },
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: min(400px, calc(100vw - 32px));
  background: var(--el-bg-color);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

@media (max-width: 480px) {
  .login-card {
    padding: 28px 20px;
    border-radius: 12px;
  }

  .login-logo {
    font-size: 40px !important;
  }

  .login-title {
    font-size: 18px !important;
  }
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  font-size: 48px;
  color: var(--el-color-primary);
  margin-bottom: 12px;
}

.login-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 8px 0 4px;
}

.login-subtitle {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.login-btn {
  width: 100%;
  margin-top: 8px;
}

.remember-me {
  margin-bottom: 8px;
  --el-checkbox-text-color: var(--el-text-color-secondary);
  --el-checkbox-font-size: 13px;
}
</style>

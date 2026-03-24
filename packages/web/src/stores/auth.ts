import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@qianfo/shared'

const TOKEN_KEY = 'qianfo_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) ?? '')
  const user = ref<User | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  function setToken(val: string) {
    token.value = val
    localStorage.setItem(TOKEN_KEY, val)
  }

  function setUser(val: User) {
    user.value = val
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  return { token, user, isLoggedIn, setToken, setUser, logout }
})

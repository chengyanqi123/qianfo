import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@qianfo/shared'
type UserInfo = { token: string; user: Partial<User> }

export const useUserStore = defineStore(
  'user',
  () => {
    const user = ref<UserInfo>({
      token: '',
      user: {},
    })

    function setUserInfo(userInfo: UserInfo) {
      user.value = userInfo
    }

    function getUserInfo() {
      return user.value
    }

    function setToken(token: string) {
      user.value.token = token
    }

    function getToken() {
      return user.value.token
    }

    function clear() {
      user.value = {
        token: '',
        user: {},
      }
    }

    return { user, setUserInfo, getUserInfo, setToken, getToken, clear }
  },
  { persist: true },
)

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref({
    phone: '',
    openId: '',
    token: '',
  })

  function setPhone(val: string) {
    user.value.phone = val
  }

  function setOpenId(val: string) {
    user.value.openId = val
  }

  function setToken(val: string) {
    user.value.token = val
  }

  function clear() {
    user.value = {
      phone: '',
      openId: '',
      token: '',
    }
  }

  return { user, setPhone, setOpenId, setToken, clear }
})

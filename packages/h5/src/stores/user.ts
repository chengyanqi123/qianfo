import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const phone = ref<string>('')
  const openId = ref<string>('')

  function setPhone(val: string) {
    phone.value = val
  }

  function setOpenId(val: string) {
    openId.value = val
  }

  return { phone, openId, setPhone, setOpenId }
})

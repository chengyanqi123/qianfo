<template>
  <div class="app-wrapper">
    <router-view v-slot="{ Component }">
      <keep-alive include="AppointmentView">
        <component :is="Component" />
      </keep-alive>
    </router-view>
    <van-tabbar v-model="active" route fixed safe-area-inset-bottom>
      <van-tabbar-item to="/appointment" icon="calendar-o">在线预约</van-tabbar-item>
      <van-tabbar-item to="/history" icon="records-o">预约历史</van-tabbar-item>
    </van-tabbar>
    <SafetyNoticeDialog v-model:visible="safetyNoticeVisible" />
  </div>
</template>

<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import SafetyNoticeDialog from '@/components/SafetyNoticeDialog.vue'

const userStore = useUserStore()
const safetyNoticeVisible = shallowRef(false)
const active = shallowRef(0)

watch(
  () => userStore.user.token,
  (token) => {
    safetyNoticeVisible.value = Boolean(token)
  },
  { immediate: true },
)
</script>

<style>
.app-wrapper {
  min-height: 100vh;
  background-color: #f7f8fa;
}
</style>

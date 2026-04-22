<template>
  <div class="app-wrapper">
    <router-view v-slot="{ Component }">
      <keep-alive include="AppointmentView,HistoryView">
        <component :is="Component" />
      </keep-alive>
    </router-view>
    <van-tabbar v-model="active" route fixed safe-area-inset-bottom>
      <van-tabbar-item to="/appointment" icon="calendar-o">在线预约</van-tabbar-item>
      <van-tabbar-item to="/history" icon="records-o">预约历史</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const active = ref(0)
</script>

<style>
.app-wrapper {
  min-height: 100vh;
  background-color: #f7f8fa;
}
</style>

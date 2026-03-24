<template>
  <div class="app-wrapper">
    <router-view />
    <van-tabbar v-model="active" route fixed safe-area-inset-bottom>
      <van-tabbar-item replace to="/appointment" icon="calendar-o">预约</van-tabbar-item>
      <van-tabbar-item replace to="/history" icon="records-o">历史</van-tabbar-item>
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

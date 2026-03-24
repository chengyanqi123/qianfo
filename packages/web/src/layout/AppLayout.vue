<template>
  <el-container class="app-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapsed ? '64px' : '220px'" class="sidebar">
      <Sidebar :collapsed="isCollapsed" />
    </el-aside>

    <el-container>
      <!-- 顶栏 -->
      <el-header class="topbar" height="56px">
        <Topbar :collapsed="isCollapsed" @toggle="isCollapsed = !isCollapsed" />
      </el-header>

      <!-- 内容区 -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="$route.fullPath" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from './Sidebar.vue'
import Topbar from './Topbar.vue'

const isCollapsed = ref(false)
</script>

<style scoped>
.app-layout {
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  transition: width 0.25s ease;
  overflow: hidden;
  background: var(--el-menu-bg-color);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);
}

.topbar {
  padding: 0;
  border-bottom: 1px solid var(--el-border-color);
  display: flex;
  align-items: center;
}

.main-content {
  overflow-y: auto;
  background: var(--el-bg-color-page);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<template>
  <el-container class="app-layout">
    <!-- 桌面端：固定侧边栏 -->
    <el-aside v-if="!isMobile" :width="isCollapsed ? '64px' : '220px'" class="sidebar">
      <Sidebar :collapsed="isCollapsed" />
    </el-aside>

    <!-- 移动端：抽屉侧边栏 -->
    <el-drawer
      v-if="isMobile"
      v-model="drawerOpen"
      direction="ltr"
      :with-header="false"
      :size="220"
      class="mobile-drawer"
    >
      <Sidebar :collapsed="false" @nav="drawerOpen = false" />
    </el-drawer>

    <el-container>
      <!-- 顶栏 -->
      <el-header class="topbar" height="56px">
        <Topbar :collapsed="isMobile ? false : isCollapsed" :is-mobile="isMobile" @toggle="handleToggle" />
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
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from './Sidebar.vue';
import Topbar from './Topbar.vue';
import { useIsMobile } from '@/composables/useIsMobile';

const { isMobile } = useIsMobile();
const isCollapsed = ref(false);
const drawerOpen = ref(false);
const route = useRoute();

function handleToggle() {
  if (isMobile.value) {
    drawerOpen.value = !drawerOpen.value;
  } else {
    isCollapsed.value = !isCollapsed.value;
  }
}

// 路由切换时自动关闭移动端抽屉
watch(
  () => route.path,
  () => {
    if (isMobile.value) {
      drawerOpen.value = false;
    }
  },
);
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

<style>
/* 移动端抽屉全局覆盖（去除默认 padding） */
.mobile-drawer .el-drawer__body {
  padding: 0;
  overflow: hidden;
}
</style>

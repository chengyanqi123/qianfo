<template>
  <div class="topbar-inner" :class="{ 'topbar-inner-mobile': isMobile }">
    <!-- 左侧：折叠/汉堡按钮 + 面包屑 -->
    <div class="topbar-left">
      <el-button
        text
        :icon="collapsed ? Expand : Fold"
        @click="$emit('toggle')"
        :style="isMobile ? mobileButtonStyle : {}"
      />
      <el-breadcrumb v-if="!isMobile" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
      </el-breadcrumb>
      <!-- 移动端显示当前页面标题 -->
      <span v-if="isMobile && currentTitle" class="mobile-title">{{ currentTitle }}</span>
    </div>

    <!-- 右侧：主题切换 + 用户信息 -->
    <div class="topbar-right">
      <el-button text :icon="isDark ? Sunny : Moon" @click="toggleTheme" :style="isMobile ? mobileButtonStyle : {}" />

      <el-dropdown @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" :icon="UserFilled" />
          <span v-if="!isMobile" class="username">{{ auth.user?.username ?? 'Admin' }}</span>
          <el-icon v-if="!isMobile"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="changePassword" :icon="EditPen">修改密码</el-dropdown-item>
            <el-dropdown-item command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, CSSProperties } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Expand, Fold, Sunny, Moon, UserFilled, SwitchButton, ArrowDown, EditPen } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from '@/composables/useTheme';

defineProps<{ collapsed: boolean; isMobile: boolean }>();
defineEmits<{ (e: 'toggle'): void }>();

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const { isDark, toggleTheme } = useTheme();

const currentTitle = computed(() => route.meta.title as string | undefined);
const mobileButtonStyle: CSSProperties = {
  padding: '6px',
};

async function handleCommand(cmd: string) {
  if (cmd === 'logout') {
    await ElMessageBox.confirm('确认退出登录？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    });
    auth.logout();
    router.replace('/login');
    return;
  }
  if (cmd === 'changePassword') {
    // Handle change password logic
  }
}
</script>

<style scoped>
.topbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 16px;
  height: 100%;
}
.topbar-inner-mobile {
  padding: 0 8px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}
.user-info:hover {
  background: var(--el-fill-color-light);
}

.username {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.mobile-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

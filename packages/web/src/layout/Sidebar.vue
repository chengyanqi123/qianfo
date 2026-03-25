<template>
  <el-menu
    :collapse="collapsed"
    :default-active="$route.path"
    router
    class="sidebar-menu"
    @select="$emit('nav')"
  >
    <div class="logo-area">
      <el-icon class="logo-icon"><Calendar /></el-icon>
      <span v-show="!collapsed" class="logo-text">预约管理</span>
    </div>

    <el-menu-item index="/dashboard">
      <el-icon><Odometer /></el-icon>
      <template #title>控制台</template>
    </el-menu-item>

    <el-menu-item index="/appointments">
      <el-icon><Calendar /></el-icon>
      <template #title>预约管理</template>
    </el-menu-item>

    <el-menu-item index="/users">
      <el-icon><User /></el-icon>
      <template #title>系统用户</template>
    </el-menu-item>
  </el-menu>
</template>

<script setup lang="ts">
defineProps<{ collapsed: boolean }>()
defineEmits<{ (e: 'nav'): void }>()
</script>

<style scoped>
.sidebar-menu {
  height: 100%;
  border-right: none;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  height: 56px;
  border-bottom: 1px solid var(--el-border-color);
  overflow: hidden;
  white-space: nowrap;
}

.logo-icon {
  font-size: 22px;
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
</style>

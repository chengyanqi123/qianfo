<template>
  <el-dialog v-model="visible" title="修改密码" destroy-on-close align-center v-bind="$attrs" @close="onClose">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="原密码" prop="oldPassword">
        <el-input v-model="form.oldPassword" type="password" show-password placeholder="请输入原密码" />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="form.newPassword" type="password" show-password placeholder="请输入新密码" />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="form.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-space>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="onSubmit">确认</el-button>
      </el-space>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';
import { changePassword } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';
import { trackMonitorEvent } from '@qianfo/shared';

const visible = defineModel<boolean>({ required: true });
const router = useRouter();
const auth = useAuthStore();
const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const rules: FormRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.newPassword) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
};

function onClose() {
  formRef.value?.resetFields();
}

async function onSubmit() {
  await formRef.value?.validate();
  loading.value = true;
  try {
    await changePassword(form.oldPassword, form.newPassword);
    trackMonitorEvent('password_change', {
      attributes: {
        result: 'success',
      },
    });
    visible.value = false;
    await ElMessageBox.confirm('密码修改成功，请重新登录', '提示', {
      confirmButtonText: '重新登录',
      showCancelButton: false,
      closeOnClickModal: false,
      closeOnPressEscape: false,
      showClose: false,
      type: 'success',
    });
    auth.logout();
    router.replace('/login');
  } catch (error: any) {
    trackMonitorEvent('password_change', {
      attributes: {
        result: 'failure',
      },
      data: {
        reason: error?.message || 'unknown',
      },
    });
    // 错误由 axios 拦截器处理
  } finally {
    loading.value = false;
  }
}
</script>

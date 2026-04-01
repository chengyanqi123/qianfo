import { ref } from 'vue';
import { ElLoading } from 'element-plus';

let loadingInstance: ReturnType<typeof ElLoading.service> | null = null;
export function useLoading() {
  const loading = ref(false);
  watch(
    () => loading.value,
    (loading) => {
      if (loading) {
        loadingInstance = ElLoading.service({
          lock: true,
          text: '',
          background: 'rgba(0, 0, 0, 0.7)',
        });
      } else {
        loadingInstance?.close();
      }
    },
  );
  return { loading, openLoading: () => (loading.value = true), closeLoading: () => (loading.value = false) };
}

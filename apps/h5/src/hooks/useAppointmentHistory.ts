import { computed, ref, watch } from 'vue'

const APPOINTMENT_HISTORY_KEY = 'appointment_history'
export function useAppointmentHistory() {
  const store = JSON.parse(localStorage.getItem(APPOINTMENT_HISTORY_KEY) || '{}')
  const history = ref<Record<string, string>>(store)
  const historyKeys = computed(() => Object.keys(history.value))

  watch(
    () => history.value,
    (val) => {
      localStorage.setItem(APPOINTMENT_HISTORY_KEY, JSON.stringify(val))
    },
    { deep: true },
  )

  function addHistory(key: string, value: string) {
    history.value[key] = value
  }

  function removeHistory(key: string) {
    delete history.value[key]
  }

  function getHistory(key: string) {
    return history.value[key]
  }

  return {
    history,
    historyKeys,
    addHistory,
    removeHistory,
    getHistory,
  }
}

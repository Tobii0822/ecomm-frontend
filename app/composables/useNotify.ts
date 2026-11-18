/** Global snackbar used for success / error / info feedback. */
interface NotifyState { show: boolean, text: string, color: string, icon: string, timeout: number }

export function useNotify() {
  const state = useState<NotifyState>('notify', () => ({ show: false, text: '', color: 'success', icon: 'mdi-check-circle', timeout: 3000 }))

  function show(text: string, color: string, icon: string, timeout = 3000) {
    state.value = { show: false, text, color, icon, timeout }
    // re-open on next tick so consecutive messages restart the timer
    nextTick(() => { state.value.show = true })
  }

  return {
    state,
    success: (text: string) => show(text, 'success', 'mdi-check-circle'),
    error: (text: string) => show(text, 'error', 'mdi-alert-circle', 6000),
    info: (text: string) => show(text, 'info', 'mdi-information'),
    warning: (text: string) => show(text, 'warning', 'mdi-alert', 5000),
  }
}

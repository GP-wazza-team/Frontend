import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { useToastStore } from '../store/toastStore'
import { useUIStore } from '../store/uiStore'

export function clearAllStores() {
  useChatStore.getState().clear()
  useToastStore.getState().clear?.()
  // UI store persists preferences (language, theme) — don't clear those
}

export function resetAuthAndStores() {
  useAuthStore.getState().logout()
  clearAllStores()
}

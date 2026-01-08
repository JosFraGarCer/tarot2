import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ToastMessage {
  id: string
  title: string
  description?: string
  color?: 'primary' | 'success' | 'warning' | 'error' | 'neutral'
  icon?: string
  timestamp: number
  read?: boolean
}

export const useNotificationStore = defineStore('notifications', () => {
  const history = ref<ToastMessage[]>([])
  const maxHistory = 50

  function addNotification(notification: Omit<ToastMessage, 'id' | 'timestamp' | 'read'>) {
    const newNotification: ToastMessage = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      read: false
    }
    
    history.value.unshift(newNotification)
    
    if (history.value.length > maxHistory) {
      history.value.pop()
    }
    
    return newNotification
  }

  function markAsRead(id: string) {
    const notification = history.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  function clearHistory() {
    history.value = []
  }

  return {
    history,
    addNotification,
    markAsRead,
    clearHistory
  }
})

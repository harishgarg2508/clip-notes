export interface NotificationPermission {
  granted: boolean
  denied: boolean
  default: boolean
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return { granted: false, denied: true, default: false }
  }

  let permission = Notification.permission

  if (permission === "default") {
    permission = await Notification.requestPermission()
  }

  return {
    granted: permission === "granted",
    denied: permission === "denied",
    default: permission === "default",
  }
}

export function getNotificationPermissionStatus(): NotificationPermission {
  if (!("Notification" in window)) {
    return { granted: false, denied: true, default: false }
  }

  const permission = Notification.permission
  return {
    granted: permission === "granted",
    denied: permission === "denied",
    default: permission === "default",
  }
}

export function showNotification(title: string, options?: NotificationOptions) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return null
  }

  const notification = new Notification(title, {
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    ...options,
  })

  // Auto-close after 5 seconds
  setTimeout(() => {
    notification.close()
  }, 5000)

  return notification
}

export function scheduleNotification(title: string, body: string, date: Date, noteId?: string) {
  const now = new Date()
  const delay = date.getTime() - now.getTime()

  if (delay <= 0) {
    // Show immediately if the time has passed
    showNotification(title, { body, tag: noteId })
    return null
  }

  return setTimeout(() => {
    showNotification(title, { body, tag: noteId })
  }, delay)
}

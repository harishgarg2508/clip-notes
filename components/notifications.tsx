"use client"

import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { getNotesWithPendingReminders, markReminderNotified } from "@/lib/notes"
import { toast } from "sonner"

export function NotificationSystem() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const checkReminders = async () => {
      try {
        const pendingReminders = await getNotesWithPendingReminders(user.uid)
        
        for (const note of pendingReminders) {
          // Show browser notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`Reminder: ${note.title || "Note"}`, {
              body: note.summary || note.originalContent.substring(0, 100) + "...",
              icon: "/favicon.ico",
              tag: note.id,
            })
          }

          // Show toast notification
          toast.info(`Reminder: ${note.title || "Note"}`, {
            description: note.summary || note.originalContent.substring(0, 100) + "...",
            duration: 10000,
          })

          // Mark as notified
          if (note.id) {
            await markReminderNotified(note.id)
          }
        }
      } catch (error) {
        console.error("Error checking reminders:", error)
      }
    }

    // Check immediately
    checkReminders()

    // Check every minute
    const interval = setInterval(checkReminders, 60000)

    return () => clearInterval(interval)
  }, [user])

  return null // This component doesn't render anything
}
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, Clock, CheckCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getUpcomingReminders, getNotesWithPendingReminders, markReminderNotified, type Note } from "@/lib/notes"
import { showNotification, getNotificationPermissionStatus } from "@/lib/notifications"
import { format } from "date-fns"
import { toast } from "sonner"

export function ReminderManager() {
  const [upcomingReminders, setUpcomingReminders] = useState<Note[]>([])
  const [pendingReminders, setPendingReminders] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const loadReminders = async () => {
    if (!user) return

    try {
      setLoading(true)
      const [upcoming, pending] = await Promise.all([
        getUpcomingReminders(user.uid),
        getNotesWithPendingReminders(user.uid),
      ])

      setUpcomingReminders(upcoming)
      setPendingReminders(pending)

      // Show notifications for pending reminders
      if (pending.length > 0 && getNotificationPermissionStatus().granted) {
        pending.forEach((note) => {
          showNotification(`Reminder: ${note.title || "Note"}`, {
            body: note.summary || note.cleanedContent?.substring(0, 100) || "You have a note reminder",
            tag: note.id,
          })
        })
      }
    } catch (error) {
      console.error("Error loading reminders:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReminders()

    // Check for reminders every minute
    const interval = setInterval(loadReminders, 60000)
    return () => clearInterval(interval)
  }, [user])

  const handleDismissReminder = async (noteId: string) => {
    try {
      await markReminderNotified(noteId)
      setPendingReminders((prev) => prev.filter((note) => note.id !== noteId))
      toast.success("Reminder dismissed")
    } catch (error) {
      console.error("Error dismissing reminder:", error)
      toast.error("Failed to dismiss reminder")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-3 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (pendingReminders.length === 0 && upcomingReminders.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Pending Reminders */}
      {pendingReminders.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <Bell className="h-5 w-5" />
              Active Reminders ({pendingReminders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingReminders.map((note) => (
              <div
                key={note.id}
                className="flex items-start justify-between gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground">{note.title || "Untitled Note"}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {note.summary || note.cleanedContent?.substring(0, 100)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {note.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Due: {note.reminderDate ? format(note.reminderDate.toDate(), "PPp") : "Now"}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => note.id && handleDismissReminder(note.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Reminders ({upcomingReminders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingReminders.slice(0, 5).map((note) => (
              <div key={note.id} className="flex items-start justify-between gap-3 p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground">{note.title || "Untitled Note"}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {note.summary || note.cleanedContent?.substring(0, 100)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {note.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {note.reminderDate ? format(note.reminderDate.toDate(), "PPp") : ""}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {upcomingReminders.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                +{upcomingReminders.length - 5} more reminders
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

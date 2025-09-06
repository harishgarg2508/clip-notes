"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Bell, BellOff } from "lucide-react"
import { format } from "date-fns"
import { Timestamp } from "firebase/firestore"
import { updateNote, type Note } from "@/lib/notes"
import { requestNotificationPermission, getNotificationPermissionStatus } from "@/lib/notifications"
import { toast } from "sonner"
import { DialogDescription } from "@radix-ui/react-dialog"

interface ReminderDialogProps {
  note: Note | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onReminderSet: () => void
}

export function ReminderDialog({ note, open, onOpenChange, onReminderSet }: ReminderDialogProps) {
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderDate, setReminderDate] = useState<Date>()
  const [reminderTime, setReminderTime] = useState("09:00")
  const [saving, setSaving] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermissionStatus())

  useEffect(() => {
    if (note) {
      setReminderEnabled(note.reminderEnabled || false)
      if (note.reminderDate) {
        const date = note.reminderDate.toDate()
        setReminderDate(date)
        setReminderTime(format(date, "HH:mm"))
      } else {
        setReminderDate(undefined)
        setReminderTime("09:00")
      }
    }
  }, [note])

  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission()
    setNotificationPermission(permission)

    if (permission.granted) {
      toast.success("Notification permission granted!")
    } else if (permission.denied) {
      toast.error("Notification permission denied. Please enable in browser settings.")
    }
  }

  const handleSave = async () => {
    if (!note?.id) return

    setSaving(true)
    try {
      let reminderTimestamp: Timestamp | undefined

      if (reminderEnabled && reminderDate) {
        const [hours, minutes] = reminderTime.split(":").map(Number)
        const combinedDate = new Date(reminderDate)
        combinedDate.setHours(hours, minutes, 0, 0)
        reminderTimestamp = Timestamp.fromDate(combinedDate)
      }

      await updateNote(note.id, {
        reminderEnabled: reminderEnabled,
        reminderDate: reminderTimestamp,
        reminderNotified: false, // Reset notification status when updating reminder
      })

      toast.success(reminderEnabled ? "Reminder set successfully!" : "Reminder disabled")
      onReminderSet()
      onOpenChange(false)
    } catch (error) {
      console.error("Error setting reminder:", error)
      toast.error("Failed to set reminder")
    } finally {
      setSaving(false)
    }
  }

  const getQuickDateOptions = () => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const nextWeek = new Date(now)
    nextWeek.setDate(nextWeek.getDate() + 7)

    return [
      { label: "Later today", date: now },
      { label: "Tomorrow", date: tomorrow },
      { label: "Next week", date: nextWeek },
    ]
  }

  return (
   <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Set Reminder
          </DialogTitle>
          <DialogDescription>
            Set a reminder for this note to be notified later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!notificationPermission.granted && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Enable Notifications</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-300">
                    Allow notifications to receive reminders
                  </p>
                </div>
                <Button size="sm" onClick={handleRequestPermission}>
                  Enable
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="reminder-enabled" className="flex items-center gap-2">
              {reminderEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              Enable Reminder
            </Label>
            <Switch id="reminder-enabled" checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
          </div>

          {reminderEnabled && (
            <>
              <div>
                <Label>Quick Options</Label>
                <div className="flex gap-2 mt-1">
                  {getQuickDateOptions().map((option) => (
                    <Button key={option.label} variant="outline" size="sm" onClick={() => setReminderDate(option.date)}>
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {reminderDate ? format(reminderDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={reminderDate}
                      onSelect={setReminderDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="reminder-time">Time</Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                />
              </div>

              {reminderDate && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Reminder will be shown on{" "}
                    <span className="font-medium">
                      {format(reminderDate, "PPP")} at {reminderTime}
                    </span>
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || (reminderEnabled && !reminderDate)}>
            {saving ? "Saving..." : "Save Reminder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

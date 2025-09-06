import { getUserNotes } from "@/lib/notes"
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval } from "date-fns"

export interface AnalyticsData {
  totalNotes: number
  notesToday: number
  notesThisWeek: number
  categoryStats: CategoryStat[]
  priorityStats: PriorityStat[]
  typeStats: TypeStat[]
  dailyActivity: DailyActivity[]
  tagStats: TagStat[]
  reminderStats: ReminderStat
  productivityScore: number
}

export interface CategoryStat {
  category: string
  count: number
  percentage: number
}

export interface PriorityStat {
  priority: string
  count: number
  percentage: number
}

export interface TypeStat {
  type: string
  count: number
  percentage: number
}

export interface DailyActivity {
  date: string
  count: number
}

export interface TagStat {
  tag: string
  count: number
}

export interface ReminderStat {
  totalWithReminders: number
  activeReminders: number
  completedReminders: number
}

export async function generateAnalytics(userId: string): Promise<AnalyticsData> {
  const notes = await getUserNotes(userId)
  const now = new Date()
  const today = startOfDay(now)
  const weekAgo = subDays(today, 7)

  // Basic counts
  const totalNotes = notes.length
  const notesToday = notes.filter((note) => {
    const noteDate = note.createdAt.toDate()
    return noteDate >= today && noteDate <= endOfDay(now)
  }).length

  const notesThisWeek = notes.filter((note) => {
    const noteDate = note.createdAt.toDate()
    return noteDate >= weekAgo
  }).length

  // Category statistics
  const categoryCount: Record<string, number> = {}
  notes.forEach((note) => {
    const category = note.category || "uncategorized"
    categoryCount[category] = (categoryCount[category] || 0) + 1
  })

  const categoryStats: CategoryStat[] = Object.entries(categoryCount)
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / totalNotes) * 100),
    }))
    .sort((a, b) => b.count - a.count)

  // Priority statistics
  const priorityCount: Record<string, number> = {}
  notes.forEach((note) => {
    const priority = note.priority || "medium"
    priorityCount[priority] = (priorityCount[priority] || 0) + 1
  })

  const priorityStats: PriorityStat[] = Object.entries(priorityCount).map(([priority, count]) => ({
    priority,
    count,
    percentage: Math.round((count / totalNotes) * 100),
  }))

  // Type statistics
  const typeCount: Record<string, number> = {}
  notes.forEach((note) => {
    typeCount[note.type] = (typeCount[note.type] || 0) + 1
  })

  const typeStats: TypeStat[] = Object.entries(typeCount).map(([type, count]) => ({
    type,
    count,
    percentage: Math.round((count / totalNotes) * 100),
  }))

  // Daily activity for the last 7 days
  const dailyActivity: DailyActivity[] = eachDayOfInterval({
    start: weekAgo,
    end: now,
  }).map((date) => {
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)
    const count = notes.filter((note) => {
      const noteDate = note.createdAt.toDate()
      return noteDate >= dayStart && noteDate <= dayEnd
    }).length

    return {
      date: format(date, "MMM dd"),
      count,
    }
  })

  // Tag statistics
  const tagCount: Record<string, number> = {}
  notes.forEach((note) => {
    note.tags?.forEach((tag) => {
      tagCount[tag] = (tagCount[tag] || 0) + 1
    })
  })

  const tagStats: TagStat[] = Object.entries(tagCount)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Top 10 tags

  // Reminder statistics
  const totalWithReminders = notes.filter((note) => note.reminderEnabled).length
  const activeReminders = notes.filter(
    (note) => note.reminderEnabled && note.reminderDate && note.reminderDate.toDate() > now && !note.reminderNotified,
  ).length
  const completedReminders = notes.filter((note) => note.reminderEnabled && note.reminderNotified).length

  const reminderStats: ReminderStat = {
    totalWithReminders,
    activeReminders,
    completedReminders,
  }

  // Productivity score (0-100)
  const productivityScore = Math.min(
    100,
    Math.round(notesThisWeek * 10 + totalWithReminders * 5 + categoryStats.length * 3 + tagStats.length * 2),
  )

  return {
    totalNotes,
    notesToday,
    notesThisWeek,
    categoryStats,
    priorityStats,
    typeStats,
    dailyActivity,
    tagStats,
    reminderStats,
    productivityScore,
  }
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Grid, List, BarChart3 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getUserNotes } from "@/lib/notes"
import { getCategoryIcon } from "@/lib/ai-service"

interface CategoryStats {
  category: string
  count: number
  icon: string
}

interface CategoryFilterProps {
  onCategoryChange: (category: string | null) => void
  onViewModeChange: (mode: "list" | "grid" | "stats") => void
  selectedCategory: string | null
  viewMode: "list" | "grid" | "stats"
}

export function CategoryFilter({
  onCategoryChange,
  onViewModeChange,
  selectedCategory,
  viewMode,
}: CategoryFilterProps) {
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const loadCategoryStats = async () => {
    if (!user) return

    try {
      setLoading(true)
      const notes = await getUserNotes(user.uid)

      // Calculate category statistics
      const stats: Record<string, number> = {}
      notes.forEach((note) => {
        const category = note.category || "uncategorized"
        stats[category] = (stats[category] || 0) + 1
      })

      const categoryStatsArray = Object.entries(stats)
        .map(([category, count]) => ({
          category,
          count,
          icon: getCategoryIcon(category),
        }))
        .sort((a, b) => b.count - a.count)

      setCategoryStats(categoryStatsArray)
    } catch (error) {
      console.error("Error loading category stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategoryStats()
  }, [user])

  const totalNotes = categoryStats.reduce((sum, stat) => sum + stat.count, 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Categories & Views
          </CardTitle>

          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "stats" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("stats")}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Category Filter */}
        <div>
          <Select
            value={selectedCategory || "all"}
            onValueChange={(value) => onCategoryChange(value === "all" ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories ({totalNotes})</SelectItem>
              {categoryStats.map((stat) => (
                <SelectItem key={stat.category} value={stat.category}>
                  {stat.icon} {stat.category} ({stat.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === null ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => onCategoryChange(null)}
          >
            All ({totalNotes})
          </Badge>

          {categoryStats.map((stat) => (
            <Badge
              key={stat.category}
              variant={selectedCategory === stat.category ? "default" : "secondary"}
              className="cursor-pointer flex items-center gap-1"
              onClick={() => onCategoryChange(stat.category)}
            >
              <span>{stat.icon}</span>
              {stat.category} ({stat.count})
            </Badge>
          ))}
        </div>

        {/* Category Statistics */}
        {viewMode === "stats" && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Category Breakdown</h4>
            {categoryStats.map((stat) => (
              <div key={stat.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{stat.icon}</span>
                  <span className="text-sm capitalize">{stat.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(stat.count / totalNotes) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{stat.count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

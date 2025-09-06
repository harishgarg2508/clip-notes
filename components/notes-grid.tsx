"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Link, Code, ImageIcon, Edit, Trash2, ExternalLink } from "lucide-react"
import type { Note } from "@/lib/notes"
import { getCategoryIcon, getPriorityColor } from "@/lib/ai-service"

interface NotesGridProps {
  notes: Note[]
  onEdit: (note: Note) => void
  onDelete: (noteId: string) => void
  onOpenUrl: (url: string) => void
}

export function NotesGrid({ notes, onEdit, onDelete, onOpenUrl }: NotesGridProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "url":
        return <Link className="h-4 w-4" />
      case "code":
        return <Code className="h-4 w-4" />
      case "image":
        return <ImageIcon className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "url":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "code":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "image":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "mixed":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const formatContent = (content: string, type: string) => {
    if (type === "url") return content
    return content.length > 120 ? content.substring(0, 120) + "..." : content
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => (
        <Card key={note.id} className="hover:shadow-md transition-shadow h-fit">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header with type and actions */}
              <div className="flex items-start justify-between">
                <Badge className={`${getTypeColor(note.type)} flex items-center gap-1`}>
                  {getTypeIcon(note.type)}
                  {note.type}
                </Badge>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(note)} className="h-6 w-6 p-0">
                    <Edit className="h-3 w-3" />
                  </Button>

                  {note.type === "url" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenUrl(note.originalContent)}
                      className="h-6 w-6 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => note.id && onDelete(note.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Title */}
              {note.title && <h3 className="font-medium text-foreground text-sm line-clamp-2">{note.title}</h3>}

              {/* Content */}
              {note.type === "image" ? (
                <img
                  src={note.originalContent || "/placeholder.svg"}
                  alt="Pasted image"
                  className="w-full h-32 object-cover rounded border"
                />
              ) : (
                <p className="text-xs text-muted-foreground line-clamp-4">
                  {formatContent(note.cleanedContent || note.originalContent, note.type)}
                </p>
              )}

              {/* Category and Priority */}
              <div className="flex items-center gap-2 flex-wrap">
                {note.category && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <span>{getCategoryIcon(note.category)}</span>
                    {note.category}
                  </Badge>
                )}

                {note.priority && (
                  <Badge variant="outline" className={`text-xs ${getPriorityColor(note.priority)}`}>
                    {note.priority}
                  </Badge>
                )}
              </div>

              {/* Tags */}
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {note.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                  {note.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{note.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Date */}
              <p className="text-xs text-muted-foreground">
                {note.createdAt?.toDate?.()?.toLocaleDateString() || "Recently"}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

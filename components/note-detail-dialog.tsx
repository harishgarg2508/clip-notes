"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import type { Note } from "@/lib/notes"

interface NoteDetailDialogProps {
  note: Note | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NoteDetailDialog({ note, open, onOpenChange }: NoteDetailDialogProps) {
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${type} copied to clipboard!`)
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }

  if (!note) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{note.title || "Untitled Note"}</span>
            <div className="flex items-center gap-2">
              {note.category && (
                <Badge variant="secondary" className="capitalize">
                  {note.category}
                </Badge>
              )}
              {note.priority && (
                <Badge 
                  variant={note.priority === "high" ? "destructive" : note.priority === "medium" ? "default" : "secondary"}
                >
                  {note.priority}
                </Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            {note.summary || "View the complete content of this note"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="cleaned" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cleaned">Cleaned Content</TabsTrigger>
            <TabsTrigger value="original">Original Content</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cleaned" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Cleaned Content</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(note.cleanedContent || note.originalContent, "Cleaned content")}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <ScrollArea className="h-[300px] w-full border rounded-md p-4">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {note.cleanedContent || note.originalContent}
              </pre>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="original" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Original Content</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(note.originalContent, "Original content")}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <ScrollArea className="h-[300px] w-full border rounded-md p-4">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {note.originalContent}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {note.tags && note.tags.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Created: {note.createdAt.toDate().toLocaleString()}
          {note.updatedAt && (
            <> • Updated: {note.updatedAt.toDate().toLocaleString()}</>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Clipboard,
  Plus,
  FileText,
  Link,
  Code,
  ImageIcon,
  Loader2,
  Save,
  Edit3,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { processClipboardWithAI } from "@/lib/clipboard"
import { saveNote } from "@/lib/notes"

interface PasteInterfaceProps {
  onNotePasted?: () => void
}

export function PasteInterface({ onNotePasted }: PasteInterfaceProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [textContent, setTextContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { user } = useAuth()

  const handlePasteFromClipboard = async () => {
    if (!user) {
      toast.error("Please sign in to save notes")
      return
    }

    setIsProcessing(true)

    try {
      const clipboardItems = await navigator.clipboard.read()

      for (const item of clipboardItems) {
        if (item.types.includes("text/plain")) {
          const textBlob = await item.getType("text/plain")
          const text = await textBlob.text()

          if (text.trim()) {
            setTextContent(text)
            toast.success("Content pasted! You can now edit it before saving.")
            return
          }
        }
      }

      toast.error("No text content found in clipboard")
    } catch (error: any) {
      console.error("[v0] Paste error:", error)
      if (error.message === "Clipboard is empty") {
        toast.error("Clipboard is empty. Copy some content first, then try pasting again.")
      } else if (error.message === "Clipboard API not available") {
        toast.error("Clipboard access not available. Please paste manually.")
      } else {
        toast.error("Failed to paste from clipboard. Type directly instead.")
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveNote = async () => {
    if (!user) {
      toast.error("Please sign in to save notes")
      return
    }
    if (!textContent.trim()) {
      toast.error("Please enter some content before saving")
      return
    }

    setIsSaving(true)

    try {
      const clipboardContent = await processClipboardWithAI(textContent)
      console.log("[v0] Text content with AI analysis:", clipboardContent)

      const noteId = await saveNote(user.uid, clipboardContent)
      console.log("[v0] Note saved with ID:", noteId)

      const aiInfo = clipboardContent.aiClassification
      const successMessage = aiInfo
        ? `${aiInfo.category.charAt(0).toUpperCase() + aiInfo.category.slice(1)} note saved!`
        : "Note saved successfully!"

      toast.success(successMessage)
      setTextContent("")
      onNotePasted?.()
    } catch (error: any) {
      console.error("[v0] Save error:", error)
      toast.error("Failed to save note. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      handleSaveNote()
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-3 sm:px-0">
      {/* Text Input Area */}
      <Card className="border-2 border-primary/20">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="font-playfair text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Write or Paste Content
              </h2>
              <Button
                onClick={handlePasteFromClipboard}
                disabled={isProcessing}
                variant="outline"
                size="sm"
                className="self-start sm:self-auto"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Pasting...
                  </>
                ) : (
                  <>
                    <Clipboard className="mr-2 h-4 w-4" />
                    Paste
                  </>
                )}
              </Button>
            </div>

            <Textarea
              placeholder="Type or paste your content..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[150px] sm:min-h-[200px] resize-y text-sm sm:text-base"
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {textContent.length > 0 && <span>{textContent.length} chars • </span>}
                Press Ctrl+Enter to save
              </p>

              <Button
                onClick={handleSaveNote}
                disabled={isSaving || !textContent.trim()}
                size="sm"
                className="px-5 py-2 sm:px-6 sm:py-3"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Note
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Paste & Save */}
      <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
        <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-6 sm:px-8">
          <div className="p-3 sm:p-4 bg-primary/10 rounded-full mb-3 sm:mb-4">
            <Clipboard className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
          <h3 className="font-playfair text-base sm:text-lg font-bold text-foreground mb-2 text-center">
            Quick Paste & Save
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground text-center mb-4 sm:mb-6 max-w-md leading-relaxed">
            Paste and save directly without editing
          </p>
          <Button
            onClick={async () => {
              await handlePasteFromClipboard()
              if (textContent) {
                await handleSaveNote()
              }
            }}
            disabled={isProcessing || isSaving}
            variant="outline"
            className="px-5 py-2 sm:px-6 sm:py-3"
          >
            {isProcessing || isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Paste & Save
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Content Type Examples */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: FileText, title: "Text Notes", desc: "Meeting notes, ideas" },
          { icon: Link, title: "Links", desc: "Articles & resources" },
          { icon: Code, title: "Code", desc: "Snippets & configs" },
          { icon: ImageIcon, title: "Screenshots", desc: "Images & visuals" },
        ].map((item, i) => (
          <Card
            key={i}
            className="hover:shadow-md transition-shadow rounded-xl"
          >
            <CardContent className="p-3 sm:p-6 text-center space-y-1 sm:space-y-2">
              <item.icon className="h-5 w-5 sm:h-8 sm:w-8 text-primary mx-auto" />
              <h3 className="text-xs sm:text-base font-medium">{item.title}</h3>
              <p className="text-[10px] sm:text-sm text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

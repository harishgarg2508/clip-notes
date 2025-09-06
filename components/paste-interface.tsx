"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Clipboard, Plus, FileText, Link, Code, ImageIcon, Loader2, Save, Edit3 } from "lucide-react"
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
      // Get clipboard content and put it in the textarea
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
        toast.error("Clipboard access not available. Please paste content manually.")
      } else {
        toast.error("Failed to paste from clipboard. You can type directly in the text area.")
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
      // Process the text content with AI
      const clipboardContent = await processClipboardWithAI(textContent)

      console.log("[v0] Text content with AI analysis:", clipboardContent)

      const noteId = await saveNote(user.uid, clipboardContent)

      console.log("[v0] Note saved with ID:", noteId)

      const aiInfo = clipboardContent.aiClassification
      const successMessage = aiInfo
        ? `${aiInfo.category.charAt(0).toUpperCase() + aiInfo.category.slice(1)} note "${aiInfo.title}" saved!`
        : "Note saved successfully!"

      toast.success(successMessage)

      // Clear the textarea after successful save
      setTextContent("")

      // Notify parent component that a note was pasted
      onNotePasted?.()
    } catch (error: any) {
      console.error("[v0] Save error:", error)
      toast.error("Failed to save note. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSaveNote()
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Text Input Area */}
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-playfair text-xl font-bold text-foreground flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Write or Paste Content
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePasteFromClipboard}
                  disabled={isProcessing}
                  variant="outline"
                  size="sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Pasting...
                    </>
                  ) : (
                    <>
                      <Clipboard className="mr-2 h-4 w-4" />
                      Paste from Clipboard
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Textarea
              placeholder="Type your content here or paste from clipboard using the button above..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[200px] resize-y"
            />

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {textContent.length > 0 && (
                  <span>{textContent.length} characters • </span>
                )}
                Press Ctrl+Enter to save quickly
              </p>

              <Button
                onClick={handleSaveNote}
                disabled={isSaving || !textContent.trim()}
                size="lg"
                className="px-6"
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

      {/* Alternative: Quick Paste Button */}
      <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
        <CardContent className="flex flex-col items-center justify-center py-12 px-8">
          <div className="p-4 bg-primary/10 rounded-full mb-4">
            <Clipboard className="h-8 w-8 text-primary" />
          </div>

          <h3 className="font-playfair text-lg font-bold text-foreground mb-2 text-center">Quick Paste & Save</h3>

          <p className="text-muted-foreground text-center mb-6 max-w-md text-sm leading-relaxed">
            Or paste and save directly without editing
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
            className="px-6"
          >
            {isProcessing || isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Paste & Save Instantly
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Content Type Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-medium text-foreground mb-2">Text Notes</h3>
            <p className="text-sm text-muted-foreground">Meeting notes, ideas, and thoughts</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Link className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-medium text-foreground mb-2">Links & URLs</h3>
            <p className="text-sm text-muted-foreground">Articles, resources, and references</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Code className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-medium text-foreground mb-2">Code Snippets</h3>
            <p className="text-sm text-muted-foreground">Functions, configs, and examples</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <ImageIcon className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-medium text-foreground mb-2">Screenshots</h3>
            <p className="text-sm text-muted-foreground">Images and visual content</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
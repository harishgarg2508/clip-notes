"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clipboard, Plus, FileText, Link, Code, ImageIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { processClipboardWithAI } from "@/lib/clipboard"
import { saveNote } from "@/lib/notes"

interface PasteInterfaceProps {
  onNotePasted?: () => void
}

export function PasteInterface({ onNotePasted }: PasteInterfaceProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const { user } = useAuth()

  const handlePaste = async () => {
    if (!user) {
      toast.error("Please sign in to save notes")
      return
    }

    setIsProcessing(true)

    try {
      const clipboardContent = await processClipboardWithAI()

      console.log("[v0] Clipboard content with AI analysis:", clipboardContent)

      const noteId = await saveNote(user.uid, clipboardContent)

      console.log("[v0] Note saved with ID:", noteId)

      const aiInfo = clipboardContent.aiClassification
      const successMessage = aiInfo
        ? `${aiInfo.category.charAt(0).toUpperCase() + aiInfo.category.slice(1)} note "${aiInfo.title}" saved!`
        : `${clipboardContent.type.charAt(0).toUpperCase() + clipboardContent.type.slice(1)} note saved successfully!`

      toast.success(successMessage)

      // Notify parent component that a note was pasted
      onNotePasted?.()
    } catch (error: any) {
      console.error("[v0] Paste error:", error)

      if (error.message === "Clipboard is empty") {
        toast.error("Clipboard is empty. Copy some content first, then try pasting again.")
      } else if (error.message === "Clipboard API not available") {
        toast.error("Clipboard access not available. Please paste content manually.")
      } else {
        toast.error("Failed to save note. Please try again.")
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Main Paste Button */}
      <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
        <CardContent className="flex flex-col items-center justify-center py-16 px-8">
          <div className="p-6 bg-primary/10 rounded-full mb-6">
            <Clipboard className="h-12 w-12 text-primary" />
          </div>

          <h2 className="font-playfair text-2xl font-bold text-foreground mb-4 text-center">Paste Anything</h2>

          <p className="text-muted-foreground text-center mb-8 max-w-md leading-relaxed">
            Copy any content to your clipboard, then click the button below. Our AI will automatically organize and
            clean it for you.
          </p>

          <Button onClick={handlePaste} disabled={isProcessing} size="lg" className="px-8 py-6 text-lg font-medium">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-5 w-5" />
                Paste from Clipboard
              </>
            )}
          </Button>

          <p className="text-sm text-muted-foreground mt-4">Supports text, links, code, and images</p>
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

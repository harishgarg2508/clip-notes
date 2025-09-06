import { classifyContent, type AIClassification } from "./ai-service"

export interface ClipboardContent {
  type: "text" | "url" | "code" | "image" | "mixed"
  content: string
  metadata?: {
    title?: string
    domain?: string
    language?: string
    imageUrl?: string
    source?: string
    length?: number
    size?: number
    mimeType?: string
  }
  aiClassification?: AIClassification
}

export async function readClipboardContent(): Promise<ClipboardContent> {
  if (!navigator.clipboard) {
    throw new Error("Clipboard API not available")
  }

  try {
    // Try to read clipboard items first (supports images)
    const clipboardItems = await navigator.clipboard.read()

    for (const item of clipboardItems) {
      // Check for images
      for (const type of item.types) {
        if (type.startsWith("image/")) {
          const blob = await item.getType(type)
          const imageUrl = URL.createObjectURL(blob)
          return {
            type: "image",
            content: imageUrl,
            metadata: { imageUrl },
          }
        }
      }
    }
  } catch (error) {
    console.log("Clipboard.read() not supported, falling back to readText()")
  }

  // Fall back to text reading
  const text = await navigator.clipboard.readText()

  if (!text.trim()) {
    throw new Error("Clipboard is empty")
  }

  return analyzeTextContent(text)
}

function analyzeTextContent(text: string): ClipboardContent {
  const trimmedText = text.trim()

  // Check if it's a URL
  const urlRegex = /^https?:\/\/[^\s]+$/i
  if (urlRegex.test(trimmedText)) {
    const url = new URL(trimmedText)
    return {
      type: "url",
      content: trimmedText,
      metadata: {
        domain: url.hostname,
        title: url.pathname,
      },
    }
  }

  // Check if it's code (contains common code patterns)
  const codePatterns = [
    /function\s+\w+\s*\(/,
    /const\s+\w+\s*=/,
    /import\s+.*from/,
    /class\s+\w+/,
    /<\w+.*>/,
    /\{\s*".*":/,
    /def\s+\w+\s*\(/,
    /public\s+class/,
  ]

  const isCode = codePatterns.some((pattern) => pattern.test(trimmedText))
  if (isCode) {
    return {
      type: "code",
      content: trimmedText,
      metadata: {
        language: detectLanguage(trimmedText),
      },
    }
  }

  // Check if it contains URLs mixed with text
  const hasUrls = /https?:\/\/[^\s]+/i.test(trimmedText)
  if (hasUrls) {
    return {
      type: "mixed",
      content: trimmedText,
    }
  }

  // Default to text
  return {
    type: "text",
    content: trimmedText,
  }
}

function detectLanguage(code: string): string {
  if (/import\s+.*from|const\s+.*=|function\s+.*\(/.test(code)) return "javascript"
  if (/def\s+.*\(|import\s+\w+/.test(code)) return "python"
  if (/<\w+.*>|<\/\w+>/.test(code)) return "html"
  if (/\{\s*".*":/.test(code)) return "json"
  if (/public\s+class|private\s+\w+/.test(code)) return "java"
  return "text"
}

// Use the existing analyzeTextContent function instead of the Next.js detectContentType
function detectContentType(text: string): ClipboardContent["type"] {
  const analyzed = analyzeTextContent(text)
  return analyzed.type
}

export async function processClipboardWithAI(directText?: string): Promise<ClipboardContent> {
  try {
    // If direct text is provided, use it instead of clipboard
    if (directText) {
      const text = directText.trim()
      if (text) {
        // Classify with AI
        const aiClassification = await classifyContent(text, "text")
        
        return {
          type: detectContentType(text),
          content: text,
          aiClassification: aiClassification || undefined,
          metadata: {
            source: "manual",
            length: text.length
          }
        }
      }
    }

    // Original clipboard processing code
    const clipboardItems = await navigator.clipboard.read()
    
    for (const item of clipboardItems) {
      // Handle images
      if (item.types.includes("image/png") || item.types.includes("image/jpeg")) {
        const imageType = item.types.find(type => type.startsWith("image/"))
        
        if (imageType) {
          const blob = await item.getType(imageType)
          const url = URL.createObjectURL(blob)
          
          return {
            type: "image",
            content: url,
            metadata: {
              size: blob.size,
              mimeType: imageType,
              source: "clipboard"
            }
          }
        }
      }
      
      // Handle text
      if (item.types.includes("text/plain")) {
        const textBlob = await item.getType("text/plain")
        const text = await textBlob.text()
        
        if (text.trim()) {
          // Classify with AI
          const aiClassification = await classifyContent(text, "text")
          
          return {
            type: detectContentType(text),
            content: text,
            aiClassification: aiClassification || undefined,
            metadata: {
              source: "clipboard",
              length: text.length
            }
          }
        }
      }
    }
    
    throw new Error("Clipboard is empty")
  } catch (error) {
    console.error("[Debug] Clipboard processing error:", error)
    throw error
  }
}
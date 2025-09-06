// lib/types.ts
import { Timestamp } from "firebase/firestore"

export interface Note {
  id?: string
  userId: string
  content: string
  cleanedContent: string
  type: "text" | "url" | "code" | "image" | "mixed"
  categoryId: string
  categoryPath: string
  title: string
  summary: string
  tags: string[]
  priority: "low" | "medium" | "high"
  metadata?: Record<string, any>
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Category {
  id?: string
  userId: string
  name: string
  parentId: string | null
  path: string
  noteCount: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface AIClassification {
  categoryPath: string
  title: string
  summary: string
  tags: string[]
  cleanedContent: string
  priority: "low" | "medium" | "high"
  reasoning: string
}

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { ClipboardContent } from "@/lib/clipboard"

export interface Note {
  id?: string
  userId: string
  originalContent: string
  cleanedContent?: string
  type: "text" | "url" | "code" | "image" | "mixed"
  category?: string | null
  title?: string | null
  summary?: string | null
  tags?: string[] | null
  priority?: "low" | "medium" | "high" | null
  metadata?: Record<string, any> | null
  reminderDate?: Timestamp | null
  reminderEnabled?: boolean | null
  reminderNotified?: boolean | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

export async function saveNote(userId: string, clipboardContent: ClipboardContent): Promise<string> {
  try {
    console.log("[Debug] Starting saveNote with userId:", userId)
    console.log("[Debug] Clipboard content:", clipboardContent)
    
    const aiClassification = clipboardContent.aiClassification

    const note: Omit<Note, "id"> = {
      userId,
      originalContent: clipboardContent.content,
      cleanedContent: aiClassification?.cleanedContent || clipboardContent.content,
      type: clipboardContent.type,
      category: aiClassification?.category || undefined,
      title: aiClassification?.title || undefined,
      summary: aiClassification?.summary || undefined,
      tags: aiClassification?.tags || undefined,
      priority: aiClassification?.priority || undefined,
      metadata: clipboardContent.metadata || undefined,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    // Remove undefined values to prevent Firestore errors
    const cleanedNote = Object.fromEntries(
      Object.entries(note).filter(([_, value]) => value !== undefined)
    ) as Omit<Note, "id">

    console.log("[Debug] Note object to save:", cleanedNote)
    
    const docRef = await addDoc(collection(db, "notes"), cleanedNote)
    console.log("[Debug] Note saved successfully with ID:", docRef.id)
    return docRef.id
  } catch (error: any) {
    console.error("[Debug] SaveNote detailed error:", error)
    
    // Handle specific Firebase errors
    if (error.code === 'permission-denied') {
      throw new Error("Permission denied. Please check your Firestore security rules.")
    } else if (error.code === 'unavailable') {
      throw new Error("Database unavailable. Please check your internet connection.")
    } else if (error.code === 'invalid-argument') {
      throw new Error("Invalid data format. Please try again.")
    } else {
      throw new Error(`Database error: ${error.message || error.code || 'Unknown error'}`)
    }
  }
}
export async function getUserNotes(userId: string): Promise<Note[]> {
  try {
    console.log("[Debug] Getting notes for userId:", userId)
    const q = query(collection(db, "notes"), where("userId", "==", userId), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    console.log("[Debug] Query successful, found", querySnapshot.docs.length, "notes")
    
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Note,
    )
  } catch (error: any) {
    console.error("[Debug] getUserNotes error:", error)
    throw new Error(`Failed to load notes: ${error.message || error.code}`)
  }
}

export async function updateNote(noteId: string, updates: Partial<Note>): Promise<void> {
  // Remove undefined values to prevent Firestore errors
  const cleanedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  )

  const noteRef = doc(db, "notes", noteId)
  await updateDoc(noteRef, {
    ...cleanedUpdates,
    updatedAt: Timestamp.now(),
  })
}

export async function deleteNote(noteId: string): Promise<void> {
  const noteRef = doc(db, "notes", noteId)
  await deleteDoc(noteRef)
}

export async function searchUserNotes(userId: string, searchTerm: string): Promise<Note[]> {
  const allNotes = await getUserNotes(userId)

  if (!searchTerm.trim()) {
    return allNotes
  }

  const searchLower = searchTerm.toLowerCase()

  return allNotes.filter(
    (note) =>
      note.title?.toLowerCase().includes(searchLower) ||
      note.summary?.toLowerCase().includes(searchLower) ||
      note.cleanedContent?.toLowerCase().includes(searchLower) ||
      note.originalContent.toLowerCase().includes(searchLower) ||
      note.category?.toLowerCase().includes(searchLower) ||
      note.tags?.some((tag) => tag.toLowerCase().includes(searchLower)),
  )
}

export async function getUserNotesByCategory(userId: string, category: string): Promise<Note[]> {
  const q = query(
    collection(db, "notes"),
    where("userId", "==", userId),
    where("category", "==", category),
    orderBy("createdAt", "desc"),
  )

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Note,
  )
}

export async function getNotesWithPendingReminders(userId: string): Promise<Note[]> {
  const now = Timestamp.now()
  const q = query(
    collection(db, "notes"),
    where("userId", "==", userId),
    where("reminderEnabled", "==", true),
    where("reminderNotified", "==", false),
    where("reminderDate", "<=", now),
  )

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Note,
  )
}

export async function markReminderNotified(noteId: string): Promise<void> {
  const noteRef = doc(db, "notes", noteId)
  await updateDoc(noteRef, {
    reminderNotified: true,
    updatedAt: Timestamp.now(),
  })
}

export async function getUpcomingReminders(userId: string): Promise<Note[]> {
  const now = Timestamp.now()
  const q = query(
    collection(db, "notes"),
    where("userId", "==", userId),
    where("reminderEnabled", "==", true),
    where("reminderDate", ">", now),
    orderBy("reminderDate", "asc"),
  )

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Note,
  )
}

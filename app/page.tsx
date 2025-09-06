"use client"

import { useState } from "react"
import { PasteInterface } from "@/components/paste-interface"
import { NotesList } from "@/components/notes-list"
import { AuthWrapper } from "@/components/auth-wrapper"
import { ReminderManager } from "@/components/reminder-manager"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { LogOut, User, BarChart3 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { NotificationSystem } from "@/components/notifications"

export default function HomePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { user, signOut } = useAuth()

  const handleNotePasted = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success("Signed out successfully")
    } catch (error) {
      toast.error("Failed to sign out")
    }
  }

  return (
    <AuthWrapper>
        <NotificationSystem />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <header className="flex items-center justify-between mb-12">
            <div className="text-center flex-1">
              <h1 className="font-playfair text-4xl md:text-5xl font-bold text-foreground mb-4">ClipNote</h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                Your intelligent clipboard companion. Paste anything, organize everything, and let AI help you stay
                productive.
              </p>
            </div>

            {user && (
              <div className="flex items-center gap-3">
                <Link href="/analytics">
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                </Link>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  {user.email}
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </header>

          <div className="space-y-12">
            <PasteInterface onNotePasted={handleNotePasted} />

            <ReminderManager />

            <NotesList refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </main>
    </AuthWrapper>
  )
}

"use client"

import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { AuthWrapper } from "@/components/auth-wrapper"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, LogOut, User } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function AnalyticsPage() {
  const { user, signOut } = useAuth()

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
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Notes
                </Button>
              </Link>
              <div>
                <h1 className="font-playfair text-3xl font-bold text-foreground">Analytics Dashboard</h1>
                <p className="text-muted-foreground">Insights into your note-taking patterns and productivity</p>
              </div>
            </div>

            {user && (
              <div className="flex items-center gap-3">
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

          <AnalyticsDashboard />
        </div>
      </main>
    </AuthWrapper>
  )
}

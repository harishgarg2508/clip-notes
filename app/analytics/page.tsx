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
          <header className="relative rounded-2xl overflow-hidden mb-10 shadow-lg">
            {/* Gradient background (same as ClipNote) */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-400 via-emerald-500 to-lime-500 opacity-95" />

            {/* Content */}
            <div className="relative px-6 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-white">
              {/* Title + Subtitle */}
              <div className="text-center md:text-left flex-1">
                <h1 className="font-playfair text-4xl sm:text-5xl font-extrabold mb-3 drop-shadow-md">
                  Analytics Dashboard
                </h1>
                <p className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto md:mx-0 leading-relaxed opacity-90">
                  Insights into your note-taking patterns and productivity.
                </p>
              </div>

              {/* User Actions */}
              {user && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
                  <Link href="/" className="w-full sm:w-auto">
                    <Button
                      size="sm"
                      className="w-full sm:w-auto bg-white text-emerald-600 hover:bg-emerald-100 font-medium shadow"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Notes
                    </Button>
                  </Link>

                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-white w-full sm:w-auto">
                    <User className="h-4 w-4" />
                    <span className="truncate max-w-[150px] sm:max-w-none">
                      {user.email}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    onClick={handleSignOut}
                    className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white shadow"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </header>

          <AnalyticsDashboard />
        </div>
      </main>
    </AuthWrapper>
  )
}

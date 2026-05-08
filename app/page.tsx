"use client"

import { useState } from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { Navigation } from "@/components/navigation"
import { PlayerLogin } from "@/components/player-login"
import { WhatsAppParser } from "@/components/whatsapp-parser"
import { Matchmaker } from "@/components/matchmaker"
import { PostMatch } from "@/components/post-match"
import { StatsDashboard } from "@/components/stats-dashboard"
import { AdminPanel } from "@/components/admin-panel"
import { Sparkles } from "lucide-react"

function AppContent() {
  const [activeTab, setActiveTab] = useState("parser")
  const { player, isLoading } = useAuth()

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-lg font-bold text-primary-foreground">
                F8
              </div>
              <Sparkles className="absolute -right-1 -top-1 h-3 w-3 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold tracking-tight">Futbol 8</h1>
              <p className="text-[10px] text-muted-foreground">Jueves 20:00hs</p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="text-xs font-medium text-primary">
              {player ? player.name : "Sin sesion"}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
        {/* Always show login at top */}
        <PlayerLogin />
        
        {/* Only show app content if logged in */}
        {player && !isLoading && (
          <>
            {activeTab === "parser" && <WhatsAppParser />}
            {activeTab === "matchmaker" && <Matchmaker />}
            {activeTab === "postmatch" && <PostMatch />}
            {activeTab === "stats" && <StatsDashboard />}
            {activeTab === "admin" && <AdminPanel />}
          </>
        )}
      </div>

      {/* Navigation - only show if logged in */}
      {player && <Navigation activeTab={activeTab} onTabChange={setActiveTab} />}
    </main>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

"use client"

import { useState } from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { Navigation } from "@/components/navigation"
import { PlayerLogin } from "@/components/player-login"
import { HomeDashboard } from "@/components/home-dashboard"
import { WhatsAppParser } from "@/components/whatsapp-parser"
import { PlayersRoster } from "@/components/players-roster"
import { Matchmaker } from "@/components/matchmaker"
import { PostMatch } from "@/components/post-match"
import { StatsDashboard } from "@/components/stats-dashboard"
import { AdminPanel } from "@/components/admin-panel"

/* ─── Animated background ───────────────────────────────── */
function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base */}
      <div className="absolute inset-0 bg-[oklch(0.09_0.016_260)]" />
      {/* Blobs */}
      <div className="blob-green" />
      <div className="blob-cyan" />
      <div className="blob-small" />
      {/* Pitch grid */}
      <div className="pitch-grid absolute inset-0 opacity-[0.55]" />
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, oklch(0.06 0.01 260 / 0.7) 100%)",
        }}
      />
    </div>
  )
}

/* ─── Tab content with mount animation ─────────────────── */
function TabContent({ tab, onNavigate }: { tab: string; onNavigate: (t: string) => void }) {
  return (
    <div key={tab} className="anim-fade-up">
      {tab === "home"       && <HomeDashboard onNavigate={onNavigate} />}
      {tab === "parser"     && <WhatsAppParser />}
      {tab === "players"    && <PlayersRoster />}
      {tab === "matchmaker" && <Matchmaker />}
      {tab === "postmatch"  && <PostMatch />}
      {tab === "stats"      && <StatsDashboard />}
      {tab === "admin"      && <AdminPanel />}
    </div>
  )
}

/* ─── App content ──────────────────────────────────────── */
function AppContent() {
  const [activeTab, setActiveTab] = useState("home")
  const { player, isLoading } = useAuth()

  return (
    <main className="min-h-screen pb-28">
      <Background />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 anim-fade-down">
        <div className="glass-strong border-b border-primary/10">
          <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
            {/* Logo + title */}
            <div className="flex items-center gap-3">
              <div className="relative">
                {/* Spinning ring */}
                <div
                  className="absolute inset-0 rounded-2xl anim-spin"
                  style={{
                    background:
                      "conic-gradient(from 0deg, oklch(0.75 0.18 160 / 0.8), transparent 60%, oklch(0.75 0.18 160 / 0.2), transparent)",
                    padding: "1.5px",
                    borderRadius: "14px",
                    margin: "-2px",
                  }}
                />
                <div
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    fontFamily: "var(--font-mono), ui-monospace, monospace",
                    background:
                      "linear-gradient(135deg, oklch(0.22 0.02 260), oklch(0.14 0.02 260))",
                    color: "oklch(0.78 0.22 145)",
                    letterSpacing: "-0.06em",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  FJ
                </div>
              </div>
              <h1
                className="text-[15px] font-semibold leading-none tracking-tight"
                style={{ letterSpacing: "-0.02em" }}
              >
                FUTJUEVES
              </h1>
            </div>

            {/* Right side — only player chip */}
            <div className="flex items-center gap-2">
              {player ? (
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-primary"
                    style={{ animation: "glowPulse 2s ease-in-out infinite" }}
                  />
                  <span className="max-w-[132px] truncate text-[12px] font-medium tracking-tight text-primary">
                    {player.name}
                  </span>
                </div>
              ) : (
                <div
                  className="text-[10px] text-muted-foreground/55 uppercase"
                  style={{
                    fontFamily: "var(--font-mono), ui-monospace, monospace",
                    letterSpacing: "0.14em",
                  }}
                >
                  Jueves 20hs
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="mx-auto max-w-lg px-4 pt-5 space-y-5">
        {/* PlayerLogin: only when logged out */}
        {!player && !isLoading && (
          <div className="anim-fade-up delay-1">
            <PlayerLogin />
          </div>
        )}

        {/* Dashboard / tabs: only when logged in */}
        {player && !isLoading && (
          <div className="anim-fade-up delay-1">
            <TabContent tab={activeTab} onNavigate={setActiveTab} />
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      {player && (
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      )}
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

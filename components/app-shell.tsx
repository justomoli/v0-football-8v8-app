"use client"

import { useEffect, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { Navigation } from "@/components/navigation"
import { PlayerLogin } from "@/components/player-login"

/* ─── Animated background (shared across all routes) ───── */
function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[oklch(0.09_0.016_260)]" />
      <div className="blob-green" />
      <div className="blob-cyan" />
      <div className="blob-small" />
      <div className="pitch-grid absolute inset-0 opacity-[0.55]" />
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

/* ─── Header (logo + player chip) ─── */
function Header() {
  const { player } = useAuth()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40 anim-fade-down">
      <div className="glass-strong border-b border-primary/10">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          {/* Logo + title — clickable home shortcut */}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-xl"
            aria-label="Ir al home"
          >
            <div className="relative">
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
          </button>

          {/* Right: player chip */}
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
  )
}

/* ─── Scroll-to-top on route change ─── */
function ScrollResetOnRoute() {
  const pathname = usePathname()
  useEffect(() => {
    // Reset to top whenever the path changes
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })
  }, [pathname])
  return null
}

/* ─── Gate: shows login if no player; else renders children ─── */
function AuthGate({ children }: { children: ReactNode }) {
  const { player, isLoading } = useAuth()

  if (isLoading) {
    // The LoadingState is mounted globally in client routes if needed;
    // here we just render nothing while auth is resolving to avoid flash.
    return null
  }

  if (!player) {
    return (
      <div className="anim-fade-up delay-1">
        <PlayerLogin />
      </div>
    )
  }

  return <>{children}</>
}

/* ─── Inner shell (uses Auth context) ─── */
function ShellInner({ children }: { children: ReactNode }) {
  const { player } = useAuth()

  return (
    <main className="min-h-screen pb-28">
      <Background />
      <Header />
      <ScrollResetOnRoute />

      <div className="mx-auto max-w-lg px-4 pt-5 space-y-5">
        <AuthGate>
          <div className="anim-fade-up delay-1">{children}</div>
        </AuthGate>
      </div>

      {/* Bottom nav: only after auth is resolved */}
      {player && <Navigation />}
    </main>
  )
}

/* ─── Top-level export: wraps with AuthProvider ─── */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ShellInner>{children}</ShellInner>
    </AuthProvider>
  )
}

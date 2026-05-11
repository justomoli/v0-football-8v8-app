"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Flame, LogIn, LogOut, Shield } from "lucide-react"
import { LoadingState, Spinner } from "@/components/ui/spinner"

const ROAST_NAMES = [
  "pecho frío",
  "fantasma táctico",
  "suplente emocional",
  "cono con botines",
  "9 de área chica",
  "líder del banco",
]

export function PlayerLogin() {
  const { loginGeneral, player, logout, isLoading: authLoading } = useAuth()
  const [displayName, setDisplayName] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleLogin = async () => {
    setIsLoggingIn(true)
    try {
      const fallback = ROAST_NAMES[Math.floor(Math.random() * ROAST_NAMES.length)]
      await loginGeneral(displayName || fallback)
    }
    catch { /* handled in context */ }
    finally { setIsLoggingIn(false) }
  }

  /* ── Loading ── */
  if (authLoading) {
    return <LoadingState message="Cargando sesión" />
  }

  /* ── Logged in ── */
  if (player) {
    return (
      <div className="glass rounded-2xl p-4 anim-scale-in neon-border">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center text-primary-foreground font-semibold text-[22px]"
              style={{
                fontFamily: "var(--font-sans), system-ui, sans-serif",
                background: "linear-gradient(135deg, oklch(0.75 0.18 160), oklch(0.6 0.18 160))",
                boxShadow: "0 0 24px oklch(0.75 0.18 160 / 0.4)",
                letterSpacing: "-0.02em",
              }}
            >
              {player.name.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <Shield className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-semibold text-[17px] leading-tight truncate tracking-tight">
                {player.name}
              </h2>
              <span className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/30">
                Admin
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Acceso general habilitado. Hoy se edita sin llorar.
            </p>
          </div>

          <button
            onClick={logout}
            className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium
              text-muted-foreground hover:text-destructive border border-border/40 hover:border-destructive/40
              bg-white/3 hover:bg-destructive/10 transition-all duration-200"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  /* ── Login form ── */
  return (
    <div className="glass-strong relative overflow-hidden rounded-[1.75rem] p-6 anim-fade-up">
      <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary/15 blur-3xl" />
      {/* Header */}
      <div className="relative mb-5 text-center">
        <div
          className="mx-auto mb-3 h-14 w-14 rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, oklch(0.2 0.02 260), oklch(0.14 0.02 260))",
            border: "1px solid oklch(0.75 0.18 160 / 0.3)",
            boxShadow: "0 0 20px oklch(0.75 0.18 160 / 0.2)",
          }}
        >
          <Flame className="h-6 w-6 text-primary" />
        </div>
        <h2 className="font-display text-[26px] font-extrabold leading-none tracking-[-0.06em]">
          Entrar a FUTJUEVES
        </h2>
        <p className="eyebrow-sub mx-auto mt-2 max-w-[18rem]">
          Un solo acceso general. Sin ratings visibles, sin excusas, sin VAR.
        </p>
      </div>

      <div className="relative space-y-3">
        <Input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && handleLogin()}
          placeholder="Poné tu apodo (opcional)"
          className="h-12 rounded-2xl border-white/[0.1] bg-black/25 text-center text-[15px] placeholder:text-muted-foreground/55 focus-visible:border-primary/40 focus-visible:ring-primary/30"
        />

        <Button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="h-12 w-full gap-2 rounded-2xl font-bold tracking-wide transition-all duration-200
            shadow-[0_0_20px_oklch(0.75_0.18_160/0.0)] hover:shadow-[0_0_20px_oklch(0.75_0.18_160/0.4)]
            disabled:opacity-50"
        >
          {isLoggingIn ? (
            <><Spinner className="h-4 w-4" /> Ingresando…</>
          ) : (
            <><LogIn className="h-4 w-4" /> Entrar como usuario general</>
          )}
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          Si no ponés apodo, el vestuario elige por vos.
        </p>
      </div>
    </div>
  )
}

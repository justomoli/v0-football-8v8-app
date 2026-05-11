"use client"

import { useState } from "react"
import { useAuth, usePlayersList } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, LogIn, User, Shield, Star, Trophy, Target, LogOut } from "lucide-react"

/* ── Rating bar ───────────────────────────────────────── */
function RatingBar({ value }: { value: number }) {
  const pct = Math.min(100, (value / 10) * 100)
  const color =
    value >= 8 ? "oklch(0.75 0.18 160)" :
    value >= 6 ? "oklch(0.8 0.15 195)" :
    value >= 4 ? "oklch(0.8 0.15 80)" :
                 "oklch(0.6 0.2 25)"
  return (
    <div className="h-1 w-24 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full rating-bar-fill"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          boxShadow: `0 0 8px ${color}80`,
          "--rating-w": `${pct}%`,
        } as React.CSSProperties}
      />
    </div>
  )
}

/* ── Stat chip ────────────────────────────────────────── */
function StatChip({ icon: Icon, value, label }: { icon: React.ElementType; value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl bg-white/5 border border-white/8 px-3 py-2 min-w-[60px]">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mb-0.5" />
      <span className="text-sm font-bold text-foreground">{value}</span>
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  )
}

export function PlayerLogin() {
  const { login, player, logout, isLoading: authLoading } = useAuth()
  const { players, loading: playersLoading } = usePlayersList()
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleLogin = async () => {
    if (!selectedPlayerId) return
    setIsLoggingIn(true)
    try { await login(selectedPlayerId) }
    catch { /* handled in context */ }
    finally { setIsLoggingIn(false) }
  }

  /* ── Loading ── */
  if (authLoading) {
    return (
      <div className="glass rounded-2xl p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    )
  }

  /* ── Logged in ── */
  if (player) {
    return (
      <div className="glass rounded-2xl p-4 anim-scale-in neon-border">
        <div className="flex items-center gap-4">
          {/* Avatar */}
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
            {player.is_admin && (
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <Shield className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-semibold text-[17px] leading-tight truncate tracking-tight">
                {player.name}
              </h2>
              {player.is_admin && (
                <span className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/30">
                  Admin
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span
                className="text-[13px] font-semibold text-primary tabular-nums"
                style={{
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  letterSpacing: "-0.03em",
                }}
              >
                {player.dynamic_rating.toFixed(1)}
              </span>
              <RatingBar value={player.dynamic_rating} />
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium
              text-muted-foreground hover:text-destructive border border-border/40 hover:border-destructive/40
              bg-white/3 hover:bg-destructive/10 transition-all duration-200"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Stats row */}
        <div className="mt-3 flex gap-2 justify-center">
          <StatChip icon={Trophy}  value={player.total_matches} label="Partidos" />
          <StatChip icon={Target}  value={player.total_goals}   label="Goles" />
          <StatChip icon={Star}    value={player.motm_count}     label="MOTM" />
          <StatChip icon={User}    value={player.dynamic_rating.toFixed(1)} label="Rating" />
        </div>
      </div>
    )
  }

  /* ── Login form ── */
  return (
    <div className="glass rounded-2xl p-6 anim-fade-up">
      {/* Header */}
      <div className="mb-5 text-center">
        <div
          className="mx-auto mb-3 h-14 w-14 rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, oklch(0.2 0.02 260), oklch(0.14 0.02 260))",
            border: "1px solid oklch(0.75 0.18 160 / 0.3)",
            boxShadow: "0 0 20px oklch(0.75 0.18 160 / 0.2)",
          }}
        >
          <LogIn className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-[17px] font-semibold tracking-tight">
          Iniciar sesión
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Seleccioná tu nombre para entrar
        </p>
      </div>

      {/* Select */}
      <div className="space-y-3">
        <Select
          value={selectedPlayerId}
          onValueChange={setSelectedPlayerId}
          disabled={playersLoading}
        >
          <SelectTrigger
            className="w-full border-border/50 bg-secondary/40 backdrop-blur-sm
              focus:border-primary/50 focus:ring-primary/30 transition-all duration-200
              hover:border-border"
          >
            <SelectValue
              placeholder={playersLoading ? "Cargando jugadores…" : "Seleccioná tu nombre"}
            />
          </SelectTrigger>
          <SelectContent className="glass-strong border-border/30">
            {players.map((p) => (
              <SelectItem key={p.id} value={p.id} className="focus:bg-primary/10">
                <div className="flex items-center gap-2">
                  {p.is_admin && <Shield className="h-3 w-3 text-primary" />}
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-auto text-muted-foreground text-xs">
                    ★ {p.dynamic_rating.toFixed(1)}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleLogin}
          disabled={!selectedPlayerId || isLoggingIn}
          className="w-full gap-2 font-bold tracking-wide transition-all duration-200
            shadow-[0_0_20px_oklch(0.75_0.18_160/0.0)] hover:shadow-[0_0_20px_oklch(0.75_0.18_160/0.4)]
            disabled:opacity-50"
          style={{ fontFamily: "var(--font-outfit, Outfit, sans-serif)" }}
        >
          {isLoggingIn ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Ingresando…</>
          ) : (
            <><LogIn className="h-4 w-4" /> Ingresar</>
          )}
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          Sin contraseña — solo elegí tu nombre
        </p>
      </div>
    </div>
  )
}

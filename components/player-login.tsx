"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getCurrentMatchSetup, getPlayerById } from "@/lib/db"
import type { Player } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Flame, LogIn, LogOut, Shield, UserCircle2 } from "lucide-react"
import { LoadingState, Spinner } from "@/components/ui/spinner"

export function PlayerLogin() {
  const { loginGeneral, login, player, logout, isLoading: authLoading } = useAuth()
  const [confirmedPlayers, setConfirmedPlayers] = useState<Player[]>([])
  const [confirmedLoading, setConfirmedLoading] = useState(true)
  const [pickConfirmedId, setPickConfirmedId] = useState<string>("")
  const [busyKey, setBusyKey] = useState<null | "guest" | "confirmed">(null)

  useEffect(() => {
    let alive = true
    setConfirmedLoading(true)
    getCurrentMatchSetup()
      .then(async (setup) => {
        if (!alive || !setup?.confirmed_players?.length) {
          setConfirmedPlayers([])
          return
        }
        const resolved = (
          await Promise.all(setup.confirmed_players.map((id) => getPlayerById(id)))
        ).filter((p): p is Player => p !== null)
        const order = [...setup.confirmed_players]
        resolved.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
        setConfirmedPlayers(resolved)
      })
      .catch(() => setConfirmedPlayers([]))
      .finally(() => alive && setConfirmedLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const handleGuest = async () => {
    setBusyKey("guest")
    try {
      await loginGeneral("Invitado")
    } catch {
      /* context */
    } finally {
      setBusyKey(null)
    }
  }

  const handleConfirmed = async (playerId: string) => {
    if (!playerId) return
    setBusyKey("confirmed")
    try {
      await login(playerId)
    } catch {
      /* context */
    } finally {
      setBusyKey(null)
    }
  }

  /* ── Loading ── */
  if (authLoading) {
    return <LoadingState message="Cargando sesión" />
  }

  /* ── Already signed in (debería estar oculto desde page.tsx) ── */
  if (player) {
    return (
      <div className="glass rounded-2xl p-4 anim-scale-in neon-border">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center text-primary-foreground font-semibold text-[22px]"
              style={{
                fontFamily: "var(--font-sans), system-ui, sans-serif",
                background:
                  "linear-gradient(135deg, oklch(0.75 0.18 160), oklch(0.6 0.18 160))",
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
              <span className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/30 shrink-0">
                {player.id === "general-user" ? "Invitadx" : "Sesión"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => logout()}
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

  /* ── Login screen — 2 opciones: invitado o desde la lista del jueves ── */
  const noConfirmed = !confirmedLoading && confirmedPlayers.length === 0

  return (
    <div className="glass-strong relative overflow-hidden rounded-[1.75rem] p-6 anim-fade-up">
      <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary/15 blur-3xl" />

      {/* Brand header */}
      <div className="relative mb-6 text-center">
        <div
          className="mx-auto mb-3 h-14 w-14 rounded-2xl flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.2 0.02 260), oklch(0.14 0.02 260))",
            border: "1px solid oklch(0.75 0.18 160 / 0.3)",
            boxShadow: "0 0 20px oklch(0.75 0.18 160 / 0.2)",
          }}
        >
          <Flame className="h-6 w-6 text-primary" />
        </div>
        <h2 className="font-display text-[26px] font-extrabold leading-none tracking-[-0.06em]">
          Entrar a FUTJUEVES
        </h2>
        <p className="eyebrow-sub mx-auto mt-2 max-w-[20rem] text-balance text-muted-foreground/75 leading-snug">
          Elegí cómo entrás
        </p>
      </div>

      <div className="relative space-y-4">
        {/* ── Option 1: Guest (one-click) ── */}
        <Button
          onClick={handleGuest}
          disabled={busyKey !== null}
          className="h-14 w-full gap-2 rounded-2xl font-bold text-[15px] tracking-tight transition-all duration-200
            shadow-[0_0_20px_oklch(0.75_0.18_160/0.0)] hover:shadow-[0_0_22px_oklch(0.75_0.18_160/0.4)]
            disabled:opacity-50"
        >
          {busyKey === "guest" ? (
            <>
              <Spinner className="h-4 w-4" /> Entrando…
            </>
          ) : (
            <>
              <UserCircle2 className="h-5 w-5" /> Entrar como invitado
            </>
          )}
        </Button>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-white/[0.08]" />
          <span
            className="text-[9px] uppercase text-muted-foreground/55"
            style={{
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              letterSpacing: "0.22em",
            }}
          >
            o desde la lista
          </span>
          <div className="h-px flex-1 bg-white/[0.08]" />
        </div>

        {/* ── Option 2: Lista jueves ── */}
        <div className="space-y-2.5">
          {confirmedLoading ? (
            <div className="flex justify-center py-6">
              <Spinner className="h-5 w-5 text-primary" />
            </div>
          ) : noConfirmed ? (
            <p className="text-[12px] text-muted-foreground/70 text-center py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] px-3 leading-snug">
              No hay confirmados esta semana. Cargá la lista desde{" "}
              <strong className="text-foreground/85">Carga</strong>.
            </p>
          ) : (
            <>
              <Select value={pickConfirmedId} onValueChange={setPickConfirmedId}>
                <SelectTrigger
                  className="h-12 rounded-2xl border-white/[0.1] bg-black/25 text-[14px]"
                  disabled={busyKey !== null}
                >
                  <SelectValue placeholder="Confirmados del jueves…" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-border/30">
                  {confirmedPlayers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => handleConfirmed(pickConfirmedId)}
                disabled={!pickConfirmedId || busyKey !== null}
                variant="outline"
                className="h-12 w-full gap-2 rounded-2xl font-semibold border-white/[0.1] bg-black/25 hover:bg-white/[0.05] disabled:opacity-50"
              >
                {busyKey === "confirmed" ? (
                  <>
                    <Spinner className="h-4 w-4" /> Entrando…
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" /> Entrar con mi nombre
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

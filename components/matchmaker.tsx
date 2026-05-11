"use client"

import { useState, useEffect, useCallback } from "react"
import {
  getCurrentMatchSetup,
  setTeams,
  getPlayerById,
} from "@/lib/db"
import type { Player, CurrentMatchSetup } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Shuffle, Copy, Check, Star, RefreshCw,
  Users, ImageIcon, Zap, TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LoadingState, Spinner } from "@/components/ui/spinner"
import { TeamShareCard } from "./team-share-card"

/* ── Rating bar ─────────────────────────────────────── */
function RatingBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: "linear-gradient(90deg, oklch(0.75 0.18 160), oklch(0.75 0.18 160 / 0.5))",
          boxShadow: "0 0 6px oklch(0.75 0.18 160 / 0.5)",
          transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
    </div>
  )
}

/* ── Player row ─────────────────────────────────────── */
function PlayerRow({
  player,
  index,
  variant,
}: {
  player: Player
  index: number
  variant: "white" | "black"
}) {
  const isWhite = variant === "white"
  const r = player.dynamic_rating
  const tier =
    r >= 8 ? "oklch(0.78 0.18 145)" :
    r >= 6 ? "oklch(0.78 0.15 195)" :
    r >= 4 ? "oklch(0.85 0.16 85)"  :
             "oklch(0.7 0.2 25)"

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl anim-slide-right",
        "transition-all duration-200 hover:translate-x-[2px]",
        isWhite
          ? "bg-white/8 hover:bg-white/[0.13] border border-white/10"
          : "bg-black/25 hover:bg-black/35 border border-white/[0.07]"
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Tier accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{
          background: tier,
          boxShadow: `0 0 8px ${tier}A0`,
        }}
      />

      <div className="flex items-center gap-2.5 pl-3 pr-3 py-2">
        {/* Jersey number tag */}
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold tabular-nums"
          style={{
            background: isWhite ? "oklch(0.96 0 0 / 0.18)" : "oklch(0.08 0 0 / 0.55)",
            color: isWhite ? "white" : "oklch(0.68 0 0)",
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            letterSpacing: "-0.04em",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.25)",
          }}
        >
          {index + 1}
        </div>

        {/* Name + rating bar */}
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold truncate leading-none mb-1.5 tracking-tight">
            {player.name}
          </div>
          <div className="h-[3px] rounded-full bg-white/8 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (r / 10) * 100)}%`,
                background: `linear-gradient(90deg, ${tier}, ${tier}80)`,
                boxShadow: `0 0 6px ${tier}90`,
                transition: "width 0.9s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </div>
        </div>

        {/* Rating value */}
        <div className="shrink-0 flex flex-col items-end leading-none gap-1">
          <span
            className="text-[17px] font-semibold tabular-nums"
            style={{
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              color: tier,
              textShadow: `0 0 8px ${tier}50`,
              letterSpacing: "-0.05em",
            }}
          >
            {r.toFixed(1)}
          </span>
          <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
            rating
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── Team card ──────────────────────────────────────── */
function TeamCard({
  players,
  variant,
  delay = 0,
}: {
  players: Player[]
  variant: "white" | "black"
  delay?: number
}) {
  const isWhite = variant === "white"
  const avg = players.length ? players.reduce((s, p) => s + p.dynamic_rating, 0) / players.length : 0
  const total = players.reduce((s, p) => s + p.dynamic_rating, 0)

  return (
    <div
      className={cn("rounded-2xl p-4 space-y-3 anim-scale-in", isWhite ? "glass-white" : "glass-dark")}
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Team header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="h-5 w-5 rounded-full shadow-lg"
            style={
              isWhite
                ? { background: "white", boxShadow: "0 0 12px rgba(255,255,255,0.6)" }
                : { background: "#111", boxShadow: "0 2px 8px rgba(0,0,0,0.8)", outline: "2px solid #444" }
            }
          />
          <h3 className="eyebrow">
            Equipo {isWhite ? "Blanco" : "Negro"}
          </h3>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-foreground">
            {avg.toFixed(1)} <span className="text-muted-foreground font-normal text-[10px]">prom</span>
          </div>
          <div className="text-[10px] text-muted-foreground">{total.toFixed(1)} total</div>
        </div>
      </div>

      {/* Players */}
      <div className="space-y-1.5">
        {players.map((p, i) => (
          <PlayerRow key={p.id} player={p} index={i} variant={variant} />
        ))}
      </div>
    </div>
  )
}

/* ── Main component ──────────────────────────────────── */
export function Matchmaker() {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [setup, setSetup] = useState<CurrentMatchSetup | null>(null)
  const [confirmedPlayers, setConfirmedPlayers] = useState<Player[]>([])
  const [whiteTeamPlayers, setWhiteTeamPlayers] = useState<Player[]>([])
  const [blackTeamPlayers, setBlackTeamPlayers] = useState<Player[]>([])

  const loadSetup = useCallback(async () => {
    setLoading(true)
    try {
      const matchSetup = await getCurrentMatchSetup()
      setSetup(matchSetup)
      if (matchSetup) {
        const confirmed = await Promise.all(matchSetup.confirmed_players.map(id => getPlayerById(id)))
        setConfirmedPlayers(confirmed.filter((p): p is Player => p !== null))
        const white = await Promise.all(matchSetup.white_team.map(id => getPlayerById(id)))
        setWhiteTeamPlayers(white.filter((p): p is Player => p !== null))
        const black = await Promise.all(matchSetup.black_team.map(id => getPlayerById(id)))
        setBlackTeamPlayers(black.filter((p): p is Player => p !== null))
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadSetup() }, [loadSetup])

  const generateTeams = async () => {
    if (confirmedPlayers.length < 2) return
    setGenerating(true)
    try {
      const sorted = [...confirmedPlayers].sort((a, b) => b.dynamic_rating - a.dynamic_rating)
      const white: Player[] = []
      const black: Player[] = []
      sorted.forEach((player, i) => {
        const round = Math.floor(i / 2)
        const isEvenRound = round % 2 === 0
        const isFirstPick = i % 2 === 0
        if ((isEvenRound && isFirstPick) || (!isEvenRound && !isFirstPick)) white.push(player)
        else black.push(player)
      })
      await setTeams(white.map(p => p.id), black.map(p => p.id))
      setWhiteTeamPlayers(white)
      setBlackTeamPlayers(black)
    } catch (e) { console.error(e) }
    finally { setGenerating(false) }
  }

  const formatTeamsForWhatsApp = () => {
    const wAvg = whiteTeamPlayers.length
      ? (whiteTeamPlayers.reduce((s, p) => s + p.dynamic_rating, 0) / whiteTeamPlayers.length).toFixed(1)
      : "0"
    const bAvg = blackTeamPlayers.length
      ? (blackTeamPlayers.reduce((s, p) => s + p.dynamic_rating, 0) / blackTeamPlayers.length).toFixed(1)
      : "0"
    return `⚽ *EQUIPOS JUEVES 20hs* ⚽\n\n⚪️ *EQUIPO BLANCO* (Prom: ${wAvg})\n${whiteTeamPlayers.map((p, i) => `${i + 1}. ${p.name}`).join("\n")}\n\n⚫️ *EQUIPO NEGRO* (Prom: ${bAvg})\n${blackTeamPlayers.map((p, i) => `${i + 1}. ${p.name}`).join("\n")}\n\n¡Nos vemos en la cancha! 🏟️`
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(formatTeamsForWhatsApp())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const teamsGenerated = whiteTeamPlayers.length > 0 && blackTeamPlayers.length > 0
  const hasEnough = confirmedPlayers.length >= 2
  const diff = teamsGenerated
    ? Math.abs(
        whiteTeamPlayers.reduce((s, p) => s + p.dynamic_rating, 0) / whiteTeamPlayers.length -
        blackTeamPlayers.reduce((s, p) => s + p.dynamic_rating, 0) / blackTeamPlayers.length
      )
    : 0
  const balanced = diff < 0.5

  /* ── Loading ── */
  if (loading) {
    return <LoadingState message="Cargando equipos" />
  }

  return (
    <div className="space-y-5">
      {/* ── Control card ── */}
      <div className="glass rounded-2xl p-5 anim-fade-up">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, oklch(0.3 0.18 160 / 0.3), oklch(0.2 0.18 160 / 0.2))",
              border: "1px solid oklch(0.75 0.18 160 / 0.3)",
            }}
          >
            <Shuffle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="eyebrow">Matchmaker</h2>
            <p className="eyebrow-sub mt-1">
              Snake-draft por rating dinámico
            </p>
          </div>
        </div>

        {/* Confirmed count */}
        <div className="flex items-center justify-between rounded-xl bg-secondary/40 border border-border/30 px-4 py-3 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>Jugadores confirmados</span>
          </div>
          <span
            className={cn(
              "font-semibold text-[17px] tabular-nums",
              hasEnough ? "text-primary" : "text-destructive",
            )}
            style={{
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              letterSpacing: "-0.04em",
            }}
          >
            {confirmedPlayers.length}
            <span className="text-[13px] font-normal text-muted-foreground/55">/16</span>
          </span>
        </div>

        <Button
          onClick={generateTeams}
          disabled={!hasEnough || generating}
          className={cn(
            "w-full gap-2 font-bold transition-all duration-200 active:scale-[0.97]",
            teamsGenerated
              ? "shadow-[0_0_0px_oklch(0.75_0.18_160/0)] hover:shadow-[0_0_20px_oklch(0.75_0.18_160/0.35)]"
              : "shadow-[0_0_20px_oklch(0.75_0.18_160/0.2)] hover:shadow-[0_0_30px_oklch(0.75_0.18_160/0.45)]"
          )}
        >
          {generating ? (
            <><Spinner className="h-4 w-4" /> Generando equipos…</>
          ) : teamsGenerated ? (
            <><RefreshCw className="h-4 w-4" /> Rebalancear Equipos</>
          ) : (
            <><Zap className="h-4 w-4" /> Generar Equipos Parejos</>
          )}
        </Button>
      </div>

      {/* ── Teams ── */}
      {teamsGenerated && (
        <>
          {/* Balance indicator */}
          <div
            className={cn(
              "glass rounded-2xl p-4 anim-fade-up",
              balanced ? "border-primary/25" : "border-yellow-500/25"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Balance de equipos</span>
              </div>
              <div className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                balanced
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
              )}>
                {balanced ? "✓ Parejos" : "⚠ Desbalance"}
                <span className="ml-1 opacity-70">{diff.toFixed(2)} pts</span>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary/50">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min(100, Math.max(10, (1 - diff / 3) * 100))}%`,
                  background: balanced
                    ? "linear-gradient(90deg, oklch(0.75 0.18 160), oklch(0.75 0.18 160 / 0.5))"
                    : "linear-gradient(90deg, oklch(0.8 0.18 80), oklch(0.8 0.18 80 / 0.5))",
                  boxShadow: balanced
                    ? "0 0 10px oklch(0.75 0.18 160 / 0.4)"
                    : "0 0 10px oklch(0.8 0.18 80 / 0.4)",
                }}
              />
            </div>
          </div>

          {/* Team cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <TeamCard players={whiteTeamPlayers} variant="white" delay={0.05} />
            <TeamCard players={blackTeamPlayers} variant="black" delay={0.12} />
          </div>

          {/* Share image */}
          <div className="glass rounded-2xl p-5 anim-fade-up delay-3">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, oklch(0.3 0.15 195 / 0.3), oklch(0.2 0.15 195 / 0.2))",
                  border: "1px solid oklch(0.8 0.15 195 / 0.3)",
                }}
              >
                <ImageIcon className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <h2 className="eyebrow">Compartir</h2>
                <p className="eyebrow-sub mt-1">
                  Imagen para WhatsApp / Descarga PNG
                </p>
              </div>
            </div>
            <TeamShareCard whiteTeam={whiteTeamPlayers} blackTeam={blackTeamPlayers} />
          </div>

          {/* Copy text */}
          <Button
            onClick={copyToClipboard}
            variant="outline"
            className={cn(
              "w-full gap-2 font-semibold transition-all duration-200 active:scale-[0.97]",
              "border-border/40 bg-transparent hover:bg-white/5",
              copied && "border-primary/40 text-primary bg-primary/5"
            )}
          >
            {copied ? (
              <><Check className="h-4 w-4" /> ¡Copiado al portapapeles!</>
            ) : (
              <><Copy className="h-4 w-4" /> Copiar texto para WhatsApp</>
            )}
          </Button>
        </>
      )}

      {/* ── No players warning ── */}
      {!hasEnough && (
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/8 p-4 anim-fade-up">
          <p className="text-center text-sm text-yellow-300/80">
            Primero cargá los jugadores en la pestaña{" "}
            <span className="font-bold text-yellow-300">Jugadores</span>
          </p>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  getCurrentMatchSetup,
  setTeams,
  getPlayerById,
} from "@/lib/db"
import type { Player, CurrentMatchSetup } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Shuffle, Copy, Check, Star, RefreshCw,
  Users, ImageIcon, Zap, TrendingUp,
  ArrowLeft, ArrowRight
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

/* ── Player row (swipeable) ─────────────────────────── */
function PlayerRow({
  player,
  index,
  variant,
  onSwap,
}: {
  player: Player
  index: number
  variant: "white" | "black"
  onSwap?: (playerId: string) => void
}) {
  const isWhite = variant === "white"
  const r = player.dynamic_rating
  const tier =
    r >= 8 ? "oklch(0.78 0.18 145)" :
    r >= 6 ? "oklch(0.78 0.15 195)" :
    r >= 4 ? "oklch(0.85 0.16 85)"  :
             "oklch(0.7 0.2 25)"

  // Swipe state — white swipes right to send to black, black swipes left
  const [dx, setDx] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const startX = useRef<number | null>(null)
  const SWIPE_THRESHOLD = 60

  const allowedDir = isWhite ? 1 : -1 // sign of dx that triggers swap

  const handleStart = (clientX: number) => {
    startX.current = clientX
    setSwiping(true)
  }
  const handleMove = (clientX: number) => {
    if (startX.current == null) return
    const delta = clientX - startX.current
    // Only allow drag in the meaningful direction
    if (Math.sign(delta) === allowedDir || delta === 0) setDx(delta)
    else setDx(delta * 0.25) // rubber band the wrong way
  }
  const handleEnd = () => {
    if (startX.current == null) return
    const triggered = Math.sign(dx) === allowedDir && Math.abs(dx) > SWIPE_THRESHOLD
    startX.current = null
    setSwiping(false)
    if (triggered && onSwap) {
      // Slide out, then swap
      setDx(allowedDir * 320)
      setTimeout(() => {
        onSwap(player.id)
        setDx(0)
      }, 160)
    } else {
      setDx(0)
    }
  }

  const progress = Math.min(1, Math.abs(dx) / SWIPE_THRESHOLD)
  const swapHint = Math.sign(dx) === allowedDir && progress > 0.15

  return (
    <div
      className="relative overflow-hidden rounded-xl anim-slide-right select-none"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Swipe hint background — only on the side we're swiping toward */}
      <div
        className="absolute inset-y-0 flex items-center justify-center px-3 pointer-events-none transition-opacity"
        style={{
          [isWhite ? "right" : "left"]: 0,
          opacity: swapHint ? progress : 0,
          width: 60,
          background: `linear-gradient(${isWhite ? "270deg" : "90deg"}, ${tier}40, transparent)`,
        }}
      >
        {isWhite ? <ArrowRight className="h-4 w-4" style={{ color: tier }} /> : <ArrowLeft className="h-4 w-4" style={{ color: tier }} />}
      </div>

      <div
        className={cn(
          "group relative overflow-hidden rounded-xl border",
          isWhite ? "bg-white/8 border-white/10" : "bg-black/25 border-white/[0.07]",
          !swiping && "transition-transform duration-200"
        )}
        style={{ transform: `translateX(${dx}px)` }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          handleStart(e.clientX)
        }}
        onPointerMove={(e) => handleMove(e.clientX)}
        onPointerUp={handleEnd}
        onPointerCancel={handleEnd}
      >
        {/* Tier stripe */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{ background: tier, boxShadow: `0 0 8px ${tier}A0` }}
        />

        <div className="flex items-center gap-3 pl-3 pr-2.5 py-2.5">
          {/* Jersey number circle */}
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums"
            style={{
              background: isWhite ? "oklch(0.20 0 0 / 0.45)" : "oklch(0.08 0 0 / 0.65)",
              color: "oklch(0.72 0 0)",
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              letterSpacing: "-0.04em",
            }}
          >
            {index + 1}
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold truncate leading-tight tracking-tight">
              {player.name}
            </div>
          </div>

          {/* Rating + RATING label */}
          <div className="shrink-0 flex flex-col items-end leading-none">
            <span
              className="text-[18px] font-semibold tabular-nums"
              style={{
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                color: tier,
                textShadow: `0 0 10px ${tier}55`,
                letterSpacing: "-0.05em",
              }}
            >
              {r.toFixed(1)}
            </span>
            <span className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.18em] text-muted-foreground/45">
              rating
            </span>
          </div>

          {/* Swap button — always visible on mobile, hover on desktop */}
          {onSwap && (
            <button
              type="button"
              aria-label="Mover al otro equipo"
              onClick={(e) => {
                e.stopPropagation()
                onSwap(player.id)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="ml-1 shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-white/10 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
            >
              {isWhite ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}
            </button>
          )}
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
  onSwap,
}: {
  players: Player[]
  variant: "white" | "black"
  delay?: number
  onSwap?: (playerId: string) => void
}) {
  const isWhite = variant === "white"
  const avg = players.length ? players.reduce((s, p) => s + p.dynamic_rating, 0) / players.length : 0
  const total = players.reduce((s, p) => s + p.dynamic_rating, 0)

  return (
    <div
      className={cn("rounded-2xl p-3 space-y-3 anim-scale-in", isWhite ? "glass-white" : "glass-dark")}
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Team header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="h-4 w-4 shrink-0 rounded-full shadow-lg"
            style={
              isWhite
                ? { background: "white", boxShadow: "0 0 10px rgba(255,255,255,0.55)" }
                : { background: "#111", boxShadow: "0 2px 6px rgba(0,0,0,0.7)", outline: "1.5px solid #444" }
            }
          />
          <h3 className="eyebrow truncate text-[10px]">
            Equipo {isWhite ? "Blanco" : "Negro"}
          </h3>
        </div>
        <div className="text-right shrink-0 leading-tight">
          <div className="text-[11px] font-bold text-foreground tabular-nums" style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}>
            {avg.toFixed(1)} <span className="text-muted-foreground font-normal text-[9px]">prom</span>
          </div>
          <div className="text-[9px] text-muted-foreground tabular-nums" style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}>
            {total.toFixed(1)} total
          </div>
        </div>
      </div>

      {/* Players */}
      <div className="space-y-1.5">
        {players.map((p, i) => (
          <PlayerRow key={p.id} player={p} index={i} variant={variant} onSwap={onSwap} />
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
  const [activeTeam, setActiveTeam] = useState<"white" | "black">("white")

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
      // Sort by rating desc, but shuffle within equal-rating ties for variance
      const sorted = [...confirmedPlayers].sort((a, b) => {
        if (b.dynamic_rating !== a.dynamic_rating) return b.dynamic_rating - a.dynamic_rating
        return Math.random() - 0.5
      })
      // Pair adjacent ratings; for each pair randomly assign one to white, the other to black.
      // Preserves balance (pairs sum to ~0 diff) and randomizes per click.
      const white: Player[] = []
      const black: Player[] = []
      for (let i = 0; i < sorted.length; i += 2) {
        const a = sorted[i]
        const b = sorted[i + 1]
        if (!b) {
          const wSum = white.reduce((s, p) => s + p.dynamic_rating, 0)
          const bSum = black.reduce((s, p) => s + p.dynamic_rating, 0)
          if (wSum <= bSum) white.push(a); else black.push(a)
          break
        }
        if (Math.random() < 0.5) { white.push(a); black.push(b) }
        else                     { white.push(b); black.push(a) }
      }
      await setTeams(white.map(p => p.id), black.map(p => p.id))
      setWhiteTeamPlayers(white)
      setBlackTeamPlayers(black)
    } catch (e) { console.error(e) }
    finally { setGenerating(false) }
  }

  const swapPlayer = async (playerId: string) => {
    const inWhite = whiteTeamPlayers.some((p) => p.id === playerId)
    const player = (inWhite ? whiteTeamPlayers : blackTeamPlayers).find((p) => p.id === playerId)
    if (!player) return
    const nextWhite = inWhite
      ? whiteTeamPlayers.filter((p) => p.id !== playerId)
      : [...whiteTeamPlayers, player]
    const nextBlack = inWhite
      ? [...blackTeamPlayers, player]
      : blackTeamPlayers.filter((p) => p.id !== playerId)
    setWhiteTeamPlayers(nextWhite)
    setBlackTeamPlayers(nextBlack)
    try {
      await setTeams(nextWhite.map((p) => p.id), nextBlack.map((p) => p.id))
    } catch (e) {
      console.error(e)
    }
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

          {/* Teams — tab layout para legibilidad mobile */}
          <div className="glass rounded-2xl overflow-hidden anim-fade-up">
            {/* Comparison header — ambos equipos de un vistazo */}
            <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
              {[
                { label: "Blanco", players: whiteTeamPlayers, team: "white" as const },
                { label: "Negro",  players: blackTeamPlayers, team: "black" as const },
              ].map(({ label, players, team }) => {
                const avg = players.length
                  ? players.reduce((s, p) => s + p.dynamic_rating, 0) / players.length
                  : 0
                const isActive = activeTeam === team
                const isWhite = team === "white"
                return (
                  <button
                    key={team}
                    type="button"
                    onClick={() => setActiveTeam(team)}
                    className={cn(
                      "flex items-center gap-2.5 px-4 py-3 transition-all duration-200",
                      isActive
                        ? isWhite ? "bg-white/[0.07]" : "bg-black/30"
                        : "opacity-55 hover:opacity-80"
                    )}
                  >
                    <div
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={
                        isWhite
                          ? { background: "white", boxShadow: isActive ? "0 0 10px rgba(255,255,255,0.5)" : "none" }
                          : { background: "#111", outline: "1.5px solid #555", boxShadow: isActive ? "0 0 8px rgba(0,0,0,0.7)" : "none" }
                      }
                    />
                    <div className="text-left flex-1 min-w-0">
                      <div className={cn("eyebrow text-[10px]", isActive ? "" : "text-muted-foreground")}>
                        {label}
                      </div>
                      <div
                        className="tabular-nums leading-none mt-0.5"
                        style={{
                          fontFamily: "var(--font-mono), ui-monospace, monospace",
                          fontSize: 16,
                          fontWeight: 600,
                          letterSpacing: "-0.04em",
                          color: isActive
                            ? isWhite ? "rgba(255,255,255,0.95)" : "oklch(0.65 0 0)"
                            : "oklch(0.45 0 0)",
                        }}
                      >
                        {avg.toFixed(1)}
                        <span
                          className="ml-1 text-[9px] font-normal tracking-wider"
                          style={{ color: isActive ? "oklch(0.6 0 0)" : "oklch(0.38 0 0)" }}
                        >
                          prom
                        </span>
                      </div>
                    </div>
                    {/* Active indicator dot */}
                    {isActive && (
                      <div
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{
                          background: isWhite ? "white" : "oklch(0.65 0 0)",
                          boxShadow: isWhite ? "0 0 6px rgba(255,255,255,0.6)" : "none",
                        }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.06]" />

            {/* Full-width player list for active team */}
            <div className="p-3 space-y-1.5">
              {(activeTeam === "white" ? whiteTeamPlayers : blackTeamPlayers).map((p, i) => (
                <PlayerRow
                  key={p.id}
                  player={p}
                  index={i}
                  variant={activeTeam}
                  onSwap={swapPlayer}
                />
              ))}
            </div>

            {/* Swipe hint */}
            <p
              className="pb-3 text-center text-[10px] text-muted-foreground/40"
              style={{ fontFamily: "var(--font-mono), ui-monospace, monospace", letterSpacing: "0.08em" }}
            >
              deslizá un jugador para moverlo al otro equipo
            </p>
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

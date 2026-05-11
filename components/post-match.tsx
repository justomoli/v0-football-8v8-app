"use client"

import { useState, useEffect, useCallback } from "react"
import {
  getCurrentMatchSetup,
  getPlayerById,
  getActiveSeason,
  saveMatchWithStats,
  createSeason,
  clearMatchSetup,
} from "@/lib/db"
import type { Player, Season, Match, CurrentMatchSetup } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Target, Star, Save, Sparkles, AlertCircle, Award, CheckCircle2, Copy, MessageCircle, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { LoadingState, Spinner } from "@/components/ui/spinner"
import { buildMatchMessage } from "@/lib/match-message"

interface PlayerMatchInput {
  playerId: string
  goals: number
  rating: number
}

/* ── 7-Segment LCD display ──────────────────────────── */
// Segments: [A-top, B-top-right, C-bot-right, D-bottom, E-bot-left, F-top-left, G-middle]
const SEG_MAP = {
  0: [true,  true,  true,  true,  true,  true,  false],
  1: [false, true,  true,  false, false, false, false],
  2: [true,  true,  false, true,  true,  false, true ],
  3: [true,  true,  true,  true,  false, false, true ],
  4: [false, true,  true,  false, false, true,  true ],
  5: [true,  false, true,  true,  false, true,  true ],
  6: [true,  false, true,  true,  true,  true,  true ],
  7: [true,  true,  true,  false, false, false, false],
  8: [true,  true,  true,  true,  true,  true,  true ],
  9: [true,  true,  true,  true,  false, true,  true ],
} as const

function SevenSegDigit({ digit, color }: { digit: number; color: string }) {
  const d = Math.max(0, Math.min(9, digit)) as keyof typeof SEG_MAP
  const segs = SEG_MAP[d]
  // Dimensions: W×H with segment thickness t and gap g
  const W = 40, H = 64, t = 7, g = 2
  const sw = W - 2 * t - 2 * g   // horiz segment span = 22
  const sv = H / 2 - t - 2 * g   // vert segment span  = 23

  // Diamond-tipped segment paths (classic 7-seg shape)
  const hp = `M ${t / 2},0 L ${sw - t / 2},0 L ${sw},${t / 2} L ${sw - t / 2},${t} L ${t / 2},${t} L 0,${t / 2} Z`
  const vp = `M ${t / 2},0 L ${t},${t / 2} L ${t},${sv - t / 2} L ${t / 2},${sv} L 0,${sv - t / 2} L 0,${t / 2} Z`

  const glow = `drop-shadow(0 0 3px ${color}) drop-shadow(0 0 7px ${color})`

  const seg = (path: string, x: number, y: number, on: boolean) => (
    <path
      d={path}
      transform={`translate(${x},${y})`}
      fill={on ? color : "rgba(255,255,255,0.045)"}
      style={{ filter: on ? glow : "none", transition: "fill 0.1s ease, filter 0.1s ease" }}
    />
  )

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} overflow="visible" aria-hidden>
      {seg(hp, t + g,  0,              segs[0])}  {/* A – top        */}
      {seg(vp, W - t,  t + g,          segs[1])}  {/* B – top-right  */}
      {seg(vp, W - t,  H / 2 + g,      segs[2])}  {/* C – bot-right  */}
      {seg(hp, t + g,  H - t,          segs[3])}  {/* D – bottom     */}
      {seg(vp, 0,      H / 2 + g,      segs[4])}  {/* E – bot-left   */}
      {seg(vp, 0,      t + g,          segs[5])}  {/* F – top-left   */}
      {seg(hp, t + g,  H / 2 - t / 2, segs[6])}  {/* G – middle     */}
    </svg>
  )
}

function ScoreDisplay({ value, color }: { value: number; color: string }) {
  const tens = Math.floor(value / 10)
  const ones = value % 10
  return (
    <div className="flex items-center gap-2">
      {value >= 10 && <SevenSegDigit digit={tens} color={color} />}
      <SevenSegDigit digit={ones} color={color} />
    </div>
  )
}

/* ── Score control ───────────────────────────────────── */
function ScoreControl({
  value,
  onDecrement,
  onIncrement,
  label,
  dot,
  accent = "oklch(0.75 0.18 160)",
}: {
  value: number
  onDecrement: () => void
  onIncrement: () => void
  label: string
  dot: "white" | "black"
  accent?: string
}) {
  const isWhite = dot === "white"
  const segColor = accent

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Team label with dot */}
      <div className="flex items-center gap-1.5">
        <div
          className="h-3 w-3 rounded-full shrink-0"
          style={
            isWhite
              ? { background: "white", boxShadow: "0 0 8px rgba(255,255,255,0.6)" }
              : { background: "#1a1a1a", outline: "1.5px solid #555", outlineOffset: "1px" }
          }
        />
        <span className="text-[11px] font-semibold tracking-wide text-foreground/70">{label}</span>
      </div>

      {/* LCD panel — dark inset housing for the 7-seg */}
      <div
        className="relative flex items-center justify-center rounded-xl px-4 py-3"
        style={{
          background: "linear-gradient(170deg, rgba(4,12,8,0.92) 0%, rgba(2,8,5,0.80) 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow:
            "inset 0 2px 12px rgba(0,0,0,0.7), " +
            "inset 0 0 0 1px rgba(255,255,255,0.03), " +
            "0 1px 0 rgba(255,255,255,0.05)",
          minWidth: value >= 10 ? 100 : 60,
        }}
      >
        {/* Subtle scanline texture */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)",
            opacity: 0.5,
          }}
        />
        {/* Green ambient glow behind segments */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${segColor.replace(")", " / 0.05)")} 0%, transparent 70%)`,
          }}
        />
        <ScoreDisplay value={value} color={segColor} />
      </div>

      {/* +/− buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onDecrement}
          className="h-8 w-8 rounded-xl border border-border/50 bg-secondary/50 text-base font-bold
            hover:bg-secondary/80 hover:border-border active:scale-90
            transition-all duration-150 flex items-center justify-center"
        >
          −
        </button>
        <button
          onClick={onIncrement}
          className="h-8 w-8 rounded-xl border border-primary/40 bg-primary/10 text-base font-bold text-primary
            hover:bg-primary/20 hover:border-primary/60 active:scale-90
            transition-all duration-150 flex items-center justify-center"
        >
          +
        </button>
      </div>
    </div>
  )
}

/* ── Player stats row ───────────────────────────────── */
function PlayerStatsRow({
  player,
  team,
  input,
  onUpdate,
  index,
}: {
  player: Player
  team: "white" | "black"
  input: PlayerMatchInput
  onUpdate: (field: "goals" | "rating", value: number) => void
  index: number
}) {
  const isWhite = team === "white"
  return (
    <div
      className={cn(
        "rounded-xl p-3 space-y-3 anim-slide-right",
        isWhite ? "bg-white/6 border border-white/8" : "bg-black/25 border border-white/5"
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">{player.name}</span>
        <div className="flex items-center gap-1.5">
          <Star className="h-3 w-3 fill-muted-foreground text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Actual: {player.dynamic_rating.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {/* Goals */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Target className="h-3 w-3" /> Goles
          </label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdate("goals", Math.max(0, input.goals - 1))}
              className="h-8 w-8 rounded-lg border border-border/40 bg-secondary/40 font-bold
                hover:bg-secondary/70 active:scale-95 transition-all duration-150 text-sm"
            >
              −
            </button>
            <Input
              type="number"
              min="0"
              max="20"
              value={input.goals}
              onChange={(e) => onUpdate("goals", parseInt(e.target.value) || 0)}
              className="h-8 w-12 text-center px-1 bg-secondary/30 border-border/30 font-bold"
            />
            <button
              onClick={() => onUpdate("goals", input.goals + 1)}
              className="h-8 w-8 rounded-lg border border-border/40 bg-secondary/40 font-bold
                hover:bg-secondary/70 active:scale-95 transition-all duration-150 text-sm"
            >
              +
            </button>
          </div>
        </div>
        {/* Rating */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Star className="h-3 w-3" /> Nota:
            <span
              className="text-primary font-semibold ml-1 tabular-nums"
              style={{
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                letterSpacing: "-0.03em",
              }}
            >
              {input.rating}
            </span>
          </label>
          <Slider
            value={[input.rating]}
            onValueChange={([v]) => onUpdate("rating", v)}
            min={1} max={10} step={0.5}
            className="py-2"
          />
        </div>
      </div>
    </div>
  )
}

/* ── Section header ─────────────────────────────────── */
function SectionHeader({ icon: Icon, title, subtitle, color = "primary" }: {
  icon: React.ElementType
  title: string
  subtitle?: string
  color?: string
}) {
  const colorMap: Record<string, string> = {
    primary: "oklch(0.3 0.18 160 / 0.3)",
    amber: "oklch(0.3 0.18 80 / 0.3)",
    white: "oklch(0.96 0 0 / 0.1)",
    dark: "oklch(0.1 0 0 / 0.4)",
  }
  const borderMap: Record<string, string> = {
    primary: "oklch(0.75 0.18 160 / 0.3)",
    amber: "oklch(0.8 0.18 80 / 0.3)",
    white: "oklch(0.96 0 0 / 0.2)",
    dark: "oklch(0.4 0 0 / 0.4)",
  }
  const iconColorMap: Record<string, string> = {
    primary: "text-primary",
    amber: "text-amber-400",
    white: "text-white",
    dark: "text-zinc-400",
  }

  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: colorMap[color], border: `1px solid ${borderMap[color]}` }}
      >
        <Icon className={cn("h-4 w-4", iconColorMap[color])} />
      </div>
      <div className="min-w-0">
        <h2 className="eyebrow truncate">{title}</h2>
        {subtitle && <p className="eyebrow-sub mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}

/* ── Fireworks (Superclásico) ────────────────────────── */
type Burst = { x: number; y: number; delay: number; color: string }
const FIREWORK_BURSTS: Burst[] = [
  { x: 22, y: 38, delay: 0.00, color: "oklch(0.78 0.22 145)" }, // emerald-neon
  { x: 78, y: 32, delay: 0.30, color: "oklch(0.72 0.28 5)"   }, // hot-pink
  { x: 50, y: 65, delay: 0.60, color: "oklch(0.82 0.16 200)" }, // electric-cyan
]

function FireworkBurst({ burst }: { burst: Burst }) {
  return (
    <div
      className="absolute"
      style={{
        left: `${burst.x}%`,
        top: `${burst.y}%`,
        width: 0,
        height: 0,
      }}
    >
      {/* Central flash */}
      <div
        className="absolute rounded-full firework-flash"
        style={{
          width: 26,
          height: 26,
          left: -13,
          top: -13,
          background: `radial-gradient(circle, ${burst.color} 0%, ${burst.color.replace(")", " / 0.5)")} 30%, transparent 70%)`,
          animationDelay: `${burst.delay}s`,
          opacity: 0,
        }}
      />
      {/* 8 directional particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className={`absolute rounded-full fw-p${i}`}
          style={{
            width: 5,
            height: 5,
            left: -2.5,
            top: -2.5,
            background: burst.color,
            boxShadow: `0 0 6px ${burst.color}, 0 0 14px ${burst.color.replace(")", " / 0.7)")}`,
            animationDelay: `${burst.delay}s`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  )
}

function Fireworks() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-20">
      {FIREWORK_BURSTS.map((b, i) => (
        <FireworkBurst key={i} burst={b} />
      ))}
    </div>
  )
}

/* ── Superclásico stamp ──────────────────────────────── */
function SuperclasicoStamp() {
  return (
    <div
      className="absolute -top-2 right-3 z-20 superclasico-stamp pointer-events-none origin-top-right"
    >
      <div
        className="px-2.5 py-1 rounded-md backdrop-blur-sm"
        style={{
          background: "linear-gradient(135deg, oklch(0.32 0.10 70 / 0.85), oklch(0.18 0.08 60 / 0.7))",
          border: "1px solid oklch(0.85 0.18 80 / 0.55)",
          boxShadow:
            "0 0 18px oklch(0.85 0.18 80 / 0.45), inset 0 0 10px oklch(0.95 0.13 95 / 0.10)",
        }}
      >
        <span
          className="text-[10px] uppercase gold-shimmer leading-none whitespace-nowrap"
          style={{
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            letterSpacing: "0.16em",
            fontWeight: 500,
          }}
        >
          ★ Superclásico
        </span>
      </div>
    </div>
  )
}

/* ── Main component ──────────────────────────────────── */
export function PostMatch() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [setup, setSetup] = useState<CurrentMatchSetup | null>(null)
  const [whiteTeamPlayers, setWhiteTeamPlayers] = useState<Player[]>([])
  const [blackTeamPlayers, setBlackTeamPlayers] = useState<Player[]>([])
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null)
  const [whiteScore, setWhiteScore] = useState(0)
  const [blackScore, setBlackScore] = useState(0)
  const [isSpecialEvent, setIsSpecialEvent] = useState(false)
  const [fireworksActive, setFireworksActive] = useState(false)
  const [playerInputs, setPlayerInputs] = useState<Record<string, PlayerMatchInput>>({})
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [savedMatch, setSavedMatch] = useState<Match | null>(null)
  const [savedMotm, setSavedMotm] = useState<Player | null>(null)
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle")

  const handleSpecialChange = (checked: boolean) => {
    setIsSpecialEvent(checked)
    if (checked) {
      setFireworksActive(false)
      // Re-trigger fireworks: brief unmount → remount so CSS animations replay
      requestAnimationFrame(() => {
        setFireworksActive(true)
        setTimeout(() => setFireworksActive(false), 2000)
      })
    } else {
      setFireworksActive(false)
    }
  }
  const [saved, setSaved] = useState(false)
  const [motmPlayerId, setMotmPlayerId] = useState<string>("")

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [matchSetup, season] = await Promise.all([getCurrentMatchSetup(), getActiveSeason()])
      setSetup(matchSetup)
      if (!season) {
        const s = await createSeason("Temporada 1")
        setCurrentSeason(s)
      } else setCurrentSeason(season)
      if (matchSetup) {
        const white = await Promise.all(matchSetup.white_team.map(id => getPlayerById(id)))
        setWhiteTeamPlayers(white.filter((p): p is Player => p !== null))
        const black = await Promise.all(matchSetup.black_team.map(id => getPlayerById(id)))
        setBlackTeamPlayers(black.filter((p): p is Player => p !== null))
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const allPlayers = [...whiteTeamPlayers, ...blackTeamPlayers]
  const hasTeams = allPlayers.length > 0
  const getPlayerInput = (id: string): PlayerMatchInput =>
    playerInputs[id] || { playerId: id, goals: 0, rating: 7 }

  const updatePlayerInput = (id: string, field: "goals" | "rating", value: number) => {
    setPlayerInputs(prev => ({ ...prev, [id]: { ...getPlayerInput(id), [field]: value } }))
  }

  const totalInputGoals = allPlayers.reduce((s, p) => s + getPlayerInput(p.id).goals, 0)
  const totalMatchGoals = whiteScore + blackScore
  const goalsMatch = totalInputGoals === totalMatchGoals

  const handleSaveMatch = async () => {
    if (!currentSeason) return
    setSaving(true)
    try {
      const match = await saveMatchWithStats(
        currentSeason.id,
        whiteScore, blackScore,
        whiteTeamPlayers.map(p => p.id),
        blackTeamPlayers.map(p => p.id),
        allPlayers.map(player => ({
          playerId: player.id,
          goals: getPlayerInput(player.id).goals,
          rating: getPlayerInput(player.id).rating,
        })),
        isSpecialEvent,
        motmPlayerId || undefined
      )

      // Build WhatsApp message before clearing state
      const motm = motmPlayerId
        ? allPlayers.find((p) => p.id === motmPlayerId) ?? null
        : null
      const message = buildMatchMessage({
        match,
        whiteTeam: whiteTeamPlayers.map((p) => ({
          player: p,
          goals: getPlayerInput(p.id).goals,
          rating: getPlayerInput(p.id).rating,
        })),
        blackTeam: blackTeamPlayers.map((p) => ({
          player: p,
          goals: getPlayerInput(p.id).goals,
          rating: getPlayerInput(p.id).rating,
        })),
        motmPlayer: motm,
      })
      setSavedMessage(message)
      setSavedMatch(match)
      setSavedMotm(motm)

      // Clear current setup in DB so next session is fresh
      await clearMatchSetup()

      setSaved(true)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleCopyMessage = async () => {
    if (!savedMessage) return
    try {
      await navigator.clipboard.writeText(savedMessage)
      setCopyState("copied")
      setTimeout(() => setCopyState("idle"), 2200)
    } catch (e) {
      console.error("Clipboard failed:", e)
    }
  }

  const handleNewMatch = () => {
    setWhiteScore(0)
    setBlackScore(0)
    setPlayerInputs({})
    setIsSpecialEvent(false)
    setMotmPlayerId("")
    setSaved(false)
    setSavedMessage(null)
    setSavedMatch(null)
    setSavedMotm(null)
    setWhiteTeamPlayers([])
    setBlackTeamPlayers([])
    setSetup(null)
  }

  /* ── States ── */
  if (loading) return (
    <LoadingState message="Cargando partido" />
  )

  if (saved && savedMatch) return (
    <div className="space-y-5">
      {/* Confirmation card */}
      <div className="glass rounded-2xl p-6 anim-scale-in neon-border">
        <div className="flex items-center gap-3 mb-5">
          <div className="anim-glow-pulse shrink-0 rounded-2xl p-2.5 bg-primary/15 border border-primary/30">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-[18px] font-semibold leading-tight tracking-tight">
              Partido guardado
            </h3>
            <p className="text-muted-foreground/65 text-[12px] mt-0.5">
              Ratings actualizados · setup reiniciado
            </p>
          </div>
        </div>

        {/* Recap: score */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4">
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  background: "white",
                  boxShadow: "0 0 8px rgba(255,255,255,0.5)",
                }}
              />
              <span
                className="text-[10px] text-muted-foreground/65 uppercase"
                style={{
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  letterSpacing: "0.1em",
                }}
              >
                Blanco
              </span>
              <span
                className={cn(
                  "text-[36px] font-semibold leading-none tabular-nums",
                  savedMatch.white_score > savedMatch.black_score && "text-primary"
                )}
                style={{
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  letterSpacing: "-0.05em",
                }}
              >
                {savedMatch.white_score}
              </span>
            </div>
            <span className="text-muted-foreground/25 font-light text-xl pb-2 select-none">—</span>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  background: "#1a1a1a",
                  outline: "1.5px solid #555",
                  outlineOffset: "1px",
                }}
              />
              <span
                className="text-[10px] text-muted-foreground/65 uppercase"
                style={{
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  letterSpacing: "0.1em",
                }}
              >
                Negro
              </span>
              <span
                className={cn(
                  "text-[36px] font-semibold leading-none tabular-nums",
                  savedMatch.black_score > savedMatch.white_score && "text-primary"
                )}
                style={{
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  letterSpacing: "-0.05em",
                }}
              >
                {savedMatch.black_score}
              </span>
            </div>
          </div>

          {savedMotm && (
            <div
              className="mt-4 flex items-center gap-2.5 rounded-lg px-3 py-2"
              style={{
                background: "oklch(0.85 0.16 85 / 0.08)",
                border: "1px solid oklch(0.85 0.16 85 / 0.20)",
              }}
            >
              <Award className="h-3.5 w-3.5 shrink-0" style={{ color: "oklch(0.85 0.16 85)" }} />
              <div className="flex-1 min-w-0">
                <div
                  className="text-[9px] uppercase text-amber-400/75"
                  style={{
                    fontFamily: "var(--font-mono), ui-monospace, monospace",
                    letterSpacing: "0.1em",
                  }}
                >
                  Jugador del partido
                </div>
                <div className="text-[13px] font-medium truncate leading-tight mt-0.5">
                  {savedMotm.name}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid gap-2">
        <Button
          onClick={handleCopyMessage}
          className={cn(
            "w-full gap-2 font-semibold transition-all duration-200 active:scale-[0.98]",
            copyState === "copied"
              ? "bg-primary/85 hover:bg-primary/85"
              : "shadow-[0_0_20px_oklch(0.75_0.18_160/0.25)] hover:shadow-[0_0_28px_oklch(0.75_0.18_160/0.4)]"
          )}
        >
          {copyState === "copied" ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              ¡Copiado! Pegalo en el grupo
            </>
          ) : (
            <>
              <MessageCircle className="h-4 w-4" />
              Copiar mensaje para WhatsApp
            </>
          )}
        </Button>

        <Button
          onClick={handleNewMatch}
          variant="outline"
          className="w-full gap-2 border-border/40 hover:bg-white/5"
        >
          <RotateCcw className="h-4 w-4" />
          Nuevo partido
        </Button>
      </div>

      {/* Message preview (collapsed) */}
      {savedMessage && (
        <details className="glass rounded-2xl px-4 py-3 group">
          <summary className="cursor-pointer flex items-center justify-between text-[12px] font-medium text-muted-foreground/75 hover:text-foreground transition-colors">
            <span className="flex items-center gap-2">
              <Copy className="h-3 w-3" />
              Ver preview del mensaje
            </span>
            <span className="text-[10px] opacity-50 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <pre
            className="mt-3 text-[11px] leading-relaxed whitespace-pre-wrap text-foreground/80 max-h-[280px] overflow-auto"
            style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}
          >
            {savedMessage}
          </pre>
        </details>
      )}
    </div>
  )

  if (!hasTeams) return (
    <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/8 p-8 text-center anim-fade-up">
      <AlertCircle className="h-10 w-10 mx-auto text-yellow-500 mb-3" />
      <p className="text-yellow-300 font-medium">
        Primero generá los equipos en{" "}
        <span className="font-bold">Equipos</span>
      </p>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* ── Score ── */}
      <div
        className={cn(
          "relative glass rounded-2xl p-5 anim-fade-up overflow-hidden transition-all duration-700",
          isSpecialEvent && "superclasico-pulse"
        )}
        style={
          isSpecialEvent
            ? {
                background:
                  "linear-gradient(135deg, oklch(0.18 0.05 70 / 0.85) 0%, oklch(0.10 0.04 60 / 0.92) 100%)",
                border: "1px solid oklch(0.85 0.18 80 / 0.35)",
              }
            : undefined
        }
      >
        {/* Gold radial wash when special */}
        {isSpecialEvent && (
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, oklch(0.85 0.18 80 / 0.10) 0%, transparent 60%), " +
                "radial-gradient(ellipse at 50% 100%, oklch(0.78 0.20 30 / 0.06) 0%, transparent 55%)",
            }}
          />
        )}

        {/* Fireworks layer */}
        {fireworksActive && <Fireworks />}

        {/* Stamp */}
        {isSpecialEvent && <SuperclasicoStamp />}

        <SectionHeader
          icon={isSpecialEvent ? Sparkles : Trophy}
          title={isSpecialEvent ? "Superclásico" : "Resultado Final"}
          subtitle={currentSeason?.name || "Sin temporada activa"}
          color={isSpecialEvent ? "amber" : "primary"}
        />
        {/* Scoreboard — grid keeps everything inside the card */}
        <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-2 mt-1 z-[5]">
          <ScoreControl
            value={whiteScore}
            onDecrement={() => setWhiteScore(Math.max(0, whiteScore - 1))}
            onIncrement={() => setWhiteScore(whiteScore + 1)}
            label="Blanco"
            dot="white"
            accent={isSpecialEvent ? "oklch(0.88 0.18 80)" : "oklch(0.75 0.18 160)"}
          />
          {/* Separator */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="w-px h-5 rounded-full"
              style={{
                background: isSpecialEvent
                  ? "oklch(0.85 0.18 80 / 0.18)"
                  : "rgba(255,255,255,0.08)",
              }}
            />
            <span
              className="text-[13px] font-bold leading-none"
              style={{
                fontFamily: "'Outfit', var(--font-outfit), sans-serif",
                color: isSpecialEvent ? "oklch(0.85 0.18 80 / 0.45)" : "rgba(255,255,255,0.18)",
                letterSpacing: "0.04em",
              }}
            >
              –
            </span>
            <div
              className="w-px h-5 rounded-full"
              style={{
                background: isSpecialEvent
                  ? "oklch(0.85 0.18 80 / 0.18)"
                  : "rgba(255,255,255,0.08)",
              }}
            />
          </div>
          <ScoreControl
            value={blackScore}
            onDecrement={() => setBlackScore(Math.max(0, blackScore - 1))}
            onIncrement={() => setBlackScore(blackScore + 1)}
            label="Negro"
            dot="black"
            accent={isSpecialEvent ? "oklch(0.88 0.18 80)" : "oklch(0.75 0.18 160)"}
          />
        </div>

        <div
          className={cn(
            "relative mt-4 pt-4 border-t flex items-center justify-center gap-3 z-[5]",
            isSpecialEvent ? "border-amber-400/20" : "border-border/30"
          )}
        >
          <Switch id="special" checked={isSpecialEvent} onCheckedChange={handleSpecialChange} />
          <Label
            htmlFor="special"
            className={cn(
              "text-sm cursor-pointer flex items-center gap-1.5 transition-colors",
              isSpecialEvent && "text-amber-300 font-semibold"
            )}
          >
            <Sparkles className={cn("h-3.5 w-3.5", isSpecialEvent ? "text-amber-300" : "text-amber-400")} />
            Superclásico / Evento Especial
          </Label>
        </div>
      </div>

      {/* ── MOTM ── */}
      <div className="glass rounded-2xl p-5 anim-fade-up delay-1"
        style={{ border: "1px solid oklch(0.8 0.18 80 / 0.2)" }}>
        <SectionHeader icon={Award} title="MOTM" subtitle="Jugador del Partido" color="amber" />
        <Select value={motmPlayerId} onValueChange={setMotmPlayerId}>
          <SelectTrigger className="w-full border-amber-500/25 bg-secondary/40 focus:border-amber-500/50">
            <SelectValue placeholder="Seleccioná al MOTM…" />
          </SelectTrigger>
          <SelectContent className="glass-strong border-border/30">
            {allPlayers.map((player) => {
              const isW = whiteTeamPlayers.some(p => p.id === player.id)
              return (
                <SelectItem key={player.id} value={player.id} className="focus:bg-amber-500/10">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={isW
                        ? { background: "white", boxShadow: "0 0 6px rgba(255,255,255,0.6)" }
                        : { background: "#111", outline: "1.5px solid #555" }}
                    />
                    <span>{player.name}</span>
                    <span className="text-muted-foreground text-xs ml-auto">
                      ★ {player.dynamic_rating.toFixed(1)}
                    </span>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        {motmPlayerId && (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-amber-300">
            <Award className="h-4 w-4 text-amber-400" />
            <span className="font-semibold">
              {allPlayers.find(p => p.id === motmPlayerId)?.name}
            </span>
            <span className="text-amber-300/70">será el MOTM</span>
          </div>
        )}
      </div>

      {/* ── White team stats ── */}
      <div className="glass rounded-2xl p-5 anim-fade-up delay-2"
        style={{ border: "1px solid oklch(0.96 0 0 / 0.1)" }}>
        <SectionHeader icon={Trophy} title="Equipo Blanco" color="white" />
        <div className="space-y-2">
          {whiteTeamPlayers.map((p, i) => (
            <PlayerStatsRow
              key={p.id}
              player={p}
              team="white"
              input={getPlayerInput(p.id)}
              onUpdate={(f, v) => updatePlayerInput(p.id, f, v)}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* ── Black team stats ── */}
      <div className="glass rounded-2xl p-5 anim-fade-up delay-3"
        style={{ border: "1px solid oklch(0.2 0 0 / 0.6)" }}>
        <SectionHeader icon={Trophy} title="Equipo Negro" color="dark" />
        <div className="space-y-2">
          {blackTeamPlayers.map((p, i) => (
            <PlayerStatsRow
              key={p.id}
              player={p}
              team="black"
              input={getPlayerInput(p.id)}
              onUpdate={(f, v) => updatePlayerInput(p.id, f, v)}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* ── Validation + save ── */}
      <div
        className={cn(
          "glass rounded-2xl p-5 anim-fade-up delay-4 transition-all duration-300",
          goalsMatch
            ? "border border-primary/25"
            : totalMatchGoals > 0 ? "border border-destructive/25" : "border border-border/20"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Validación de goles</span>
          <div className={cn(
            "rounded-full px-3 py-1 text-xs font-bold border",
            goalsMatch
              ? "bg-primary/15 text-primary border-primary/30"
              : totalMatchGoals > 0 ? "bg-destructive/15 text-destructive border-destructive/30"
              : "bg-secondary/50 text-muted-foreground border-border/30"
          )}>
            {totalInputGoals} / {totalMatchGoals} goles
          </div>
        </div>
        {!goalsMatch && totalMatchGoals > 0 && (
          <p className="text-xs text-destructive mb-3">
            La suma de goles individuales debe coincidir con el resultado final
          </p>
        )}
        <Button
          onClick={handleSaveMatch}
          disabled={!goalsMatch || totalMatchGoals === 0 || saving}
          className={cn(
            "w-full gap-2 font-bold transition-all duration-200 active:scale-[0.97]",
            goalsMatch && totalMatchGoals > 0
              ? "shadow-[0_0_20px_oklch(0.75_0.18_160/0.3)] hover:shadow-[0_0_30px_oklch(0.75_0.18_160/0.5)]"
              : ""
          )}
        >
          {saving ? (
            <><Spinner className="h-4 w-4" /> Guardando…</>
          ) : (
            <><Save className="h-4 w-4" /> Guardar Partido</>
          )}
        </Button>
      </div>
    </div>
  )
}

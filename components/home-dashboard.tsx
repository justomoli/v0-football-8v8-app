"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  getActiveSeason,
  getMatches,
  getCurrentMatchSetup,
  getSeasonTopScorers,
  getSeasonTopMotms,
  getPlayerById,
  getPlayers,
} from "@/lib/db"
import type { Player, Season, Match, CurrentMatchSetup } from "@/lib/types"
import { tierColor } from "@/lib/rating-tier"
import { useRotatingDemotivation } from "@/lib/demotivational-quotes"
import {
  Calendar,
  ChevronRight,
  Sparkles,
  Trophy,
  Target,
  Award,
  Star,
  Hand,
  Zap,
  Users,
  Shuffle,
  Medal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LoadingState } from "@/components/ui/spinner"

interface HomeDashboardProps {
  onNavigate: (tab: string) => void
}

/* ─── Countdown helper ─── */
function useNextThursday() {
  const [state, setState] = useState<{
    label: string
    days: number
    hours: number
    minutes: number
    isToday: boolean
    isLive: boolean
    targetDate: Date
  }>(() => ({
    label: "—",
    days: 0,
    hours: 0,
    minutes: 0,
    isToday: false,
    isLive: false,
    targetDate: new Date(),
  }))

  useEffect(() => {
    const calc = () => {
      const now = new Date()
      const day = now.getDay()
      let daysUntil = (4 - day + 7) % 7

      // After Thu 22:00, jump to next Thursday
      if (daysUntil === 0 && now.getHours() >= 22) daysUntil = 7

      const target = new Date(now)
      target.setDate(now.getDate() + daysUntil)
      target.setHours(20, 0, 0, 0)

      const diff = target.getTime() - now.getTime()
      const isToday = daysUntil === 0
      const isLive = isToday && now.getHours() >= 20 && now.getHours() < 22

      if (diff <= 0 && isLive) {
        setState({
          label: "EN VIVO",
          days: 0,
          hours: 0,
          minutes: 0,
          isToday: true,
          isLive: true,
          targetDate: target,
        })
        return
      }

      const totalMinutes = Math.floor(diff / 60000)
      const days = Math.floor(totalMinutes / (60 * 24))
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
      const minutes = totalMinutes % 60

      let label: string
      if (isToday && diff > 0) label = "HOY 20:00"
      else if (days >= 2) label = `${days}d ${hours}h`
      else if (days === 1) label = `1d ${hours}h`
      else label = `${hours}h ${minutes}m`

      setState({
        label,
        days,
        hours,
        minutes,
        isToday,
        isLive: false,
        targetDate: target,
      })
    }
    calc()
    const id = setInterval(calc, 30000)
    return () => clearInterval(id)
  }, [])

  return state
}

/* ─── Eyebrow ─── */
function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("eyebrow", className)}>{children}</div>
}

/* ─── Hero Countdown ─── */
function HeroCountdown({
  cd,
  confirmed,
  roast,
}: {
  cd: ReturnType<typeof useNextThursday>
  confirmed: number
  roast: string
}) {
  const dateLabel = cd.targetDate.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "short",
  })
  const formatted = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)

  const progress = Math.min(100, (confirmed / 16) * 100)
  const tier =
    confirmed >= 13
      ? "oklch(0.78 0.22 145)"
      : confirmed >= 8
      ? "oklch(0.85 0.16 85)"
      : "oklch(0.7 0.2 25)"

  return (
    <div
      className={cn(
        "relative overflow-hidden glass rounded-2xl p-6 anim-fade-up",
        cd.isToday && "neon-border"
      )}
      style={
        cd.isLive
          ? {
              background:
                "linear-gradient(135deg, oklch(0.18 0.10 25 / 0.85) 0%, oklch(0.10 0.05 20 / 0.95) 100%)",
              border: "1px solid oklch(0.7 0.22 25 / 0.4)",
            }
          : cd.isToday
          ? {
              background:
                "linear-gradient(135deg, oklch(0.18 0.10 145 / 0.7) 0%, oklch(0.10 0.05 145 / 0.95) 100%)",
            }
          : undefined
      }
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl opacity-50"
        style={{
          background: cd.isLive
            ? "radial-gradient(ellipse at 50% 0%, oklch(0.7 0.22 25 / 0.15) 0%, transparent 60%)"
            : cd.isToday
            ? "radial-gradient(ellipse at 50% 0%, oklch(0.78 0.22 145 / 0.18) 0%, transparent 60%)"
            : "radial-gradient(ellipse at 50% 0%, oklch(0.78 0.22 145 / 0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative">
        {/* Top row: eyebrow + status badge */}
        <div className="flex items-center justify-between mb-4">
          <Eyebrow>
            {cd.isLive ? "Partido en curso" : cd.isToday ? "Hoy juega" : "Próximo partido"}
          </Eyebrow>
          {cd.isLive && (
            <span
              className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] uppercase px-2 py-1 rounded-full"
              style={{
                background: "oklch(0.7 0.22 25 / 0.2)",
                color: "oklch(0.85 0.18 25)",
                border: "1px solid oklch(0.7 0.22 25 / 0.4)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full anim-blink"
                style={{ background: "oklch(0.75 0.22 25)" }}
              />
              EN VIVO
            </span>
          )}
        </div>

        {/* Big countdown number */}
        <div className="flex items-baseline gap-2 mb-3">
          <h1
            className={cn(
              "leading-[0.95] tabular-nums",
              cd.isToday ? "anim-glow-pulse" : ""
            )}
            style={{
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              fontWeight: 600,
              fontSize: cd.isLive ? "40px" : cd.isToday ? "44px" : "52px",
              letterSpacing: "-0.05em",
              background: cd.isLive
                ? "linear-gradient(135deg, oklch(0.95 0.15 25), oklch(0.78 0.20 25))"
                : "linear-gradient(135deg, oklch(0.95 0.10 145), oklch(0.78 0.22 145))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {cd.label}
          </h1>
        </div>

        {/* Date subtitle */}
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
          <p className="text-[13px] font-normal text-muted-foreground/75 tracking-tight">
            {formatted} · 20:00 hs
          </p>
        </div>

        {/* Confirmed progress bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="meta-label">Confirmados</span>
            <span
              className="text-[13px] font-semibold tabular-nums tracking-tight"
              style={{
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                color: tier,
                letterSpacing: "-0.03em",
              }}
            >
              {confirmed}
              <span className="text-muted-foreground/40 font-normal">/16</span>
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${tier}, ${tier}80)`,
                boxShadow: `0 0 10px ${tier}80`,
                transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </div>
        </div>

        <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground/70 text-center italic px-0.5">
          {roast}
        </p>
      </div>
    </div>
  )
}

/* ─── Smart Action ─── */
function SmartAction({
  setup,
  hasMatchToday,
  onNavigate,
}: {
  setup: CurrentMatchSetup | null
  hasMatchToday: boolean
  onNavigate: (tab: string) => void
}) {
  const confirmed = setup?.confirmed_players.length ?? 0
  const teamsReady =
    (setup?.white_team.length ?? 0) > 0 && (setup?.black_team.length ?? 0) > 0

  let title: string
  let subtitle: string
  let cta: string
  let target: string
  let Icon: React.ElementType
  let accent: string

  if (hasMatchToday) {
    title = "Partido guardado"
    subtitle = "Las stats están actualizadas"
    cta = "Ver historial"
    target = "stats"
    Icon = Trophy
    accent = "oklch(0.78 0.22 145)"
  } else if (teamsReady) {
    title = "Equipos armados"
    subtitle = "Cargá el resultado cuando termine el partido"
    cta = "Cargar resultado"
    target = "postmatch"
    Icon = Trophy
    accent = "oklch(0.85 0.16 85)"
  } else if (confirmed >= 16) {
    title = "Listos para armar equipos"
    subtitle = "16 jugadores confirmados"
    cta = "Generar equipos"
    target = "matchmaker"
    Icon = Shuffle
    accent = "oklch(0.78 0.22 145)"
  } else if (confirmed > 0) {
    const missing = 16 - confirmed
    title = `Faltan ${missing} jugador${missing === 1 ? "" : "es"}`
    subtitle = "Agregá la lista del WhatsApp para completar"
    cta = "Agregar jugadores"
    target = "parser"
    Icon = Users
    accent = "oklch(0.85 0.16 85)"
  } else {
    title = "Empezá pegando la lista"
    subtitle = "Importá los confirmados desde WhatsApp"
    cta = "Abrir parser"
    target = "parser"
    Icon = Zap
    accent = "oklch(0.78 0.22 145)"
  }

  return (
    <button
      onClick={() => onNavigate(target)}
      className="group relative w-full overflow-hidden rounded-2xl glass p-5 anim-fade-up delay-1 text-left
        transition-all duration-200 hover:translate-y-[-2px] active:translate-y-0"
      style={{
        border: `1px solid ${accent.replace(")", " / 0.2)")}`,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl opacity-60"
        style={{
          background: `radial-gradient(ellipse at 100% 0%, ${accent.replace(
            ")",
            " / 0.10)"
          )} 0%, transparent 60%)`,
        }}
      />
      <div className="relative flex items-center gap-4">
        <div
          className="shrink-0 h-11 w-11 rounded-xl flex items-center justify-center"
          style={{
            background: accent.replace(")", " / 0.15)"),
            border: `1px solid ${accent.replace(")", " / 0.35)")}`,
            boxShadow: `0 0 18px ${accent.replace(")", " / 0.25)")}`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold leading-snug tracking-tight">
            {title}
          </h3>
          <p className="text-[13px] text-muted-foreground/70 mt-1 leading-snug">
            {subtitle}
          </p>
        </div>
        <div
          className="shrink-0 flex items-center gap-1 text-[10px] font-medium uppercase opacity-70 group-hover:opacity-100 transition-opacity"
          style={{
            color: accent,
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            letterSpacing: "0.08em",
          }}
        >
          {cta}
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </button>
  )
}

/* ─── My Stats ─── */
function MyStats({
  player,
  rank,
  total,
  seasonAvg,
}: {
  player: Player
  rank: number | null
  total: number
  seasonAvg: number
}) {
  const tier = tierColor(player.dynamic_rating)
  const delta = player.dynamic_rating - seasonAvg
  const deltaSign = delta >= 0 ? "+" : ""

  return (
    <div className="glass rounded-2xl p-5 anim-fade-up delay-2">
      <div className="flex items-center gap-3 mb-4">
        {/* Avatar */}
        <div
          className="relative h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-lg font-semibold"
          style={{
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            background: `linear-gradient(135deg, ${tier}40, ${tier}15)`,
            border: `1px solid ${tier}50`,
            color: tier,
            textShadow: `0 0 10px ${tier}90`,
            letterSpacing: "-0.02em",
          }}
        >
          {player.name.charAt(0).toUpperCase()}
          {player.is_goalkeeper && (
            <span
              className="absolute -bottom-1 -right-1 h-4 w-4 rounded-md flex items-center justify-center"
              style={{
                background: "oklch(0.85 0.16 85)",
                border: "1.5px solid #08100c",
              }}
              title="Arquero"
            >
              <Hand className="h-2.5 w-2.5" style={{ color: "#08100c" }} />
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Eyebrow className="mb-2">Tu temporada</Eyebrow>
          <h3 className="text-[16px] font-semibold leading-tight tracking-tight truncate">
            {player.name}
          </h3>
        </div>
        {rank !== null && (
          <div className="shrink-0 text-right">
            <div
              className="text-[22px] font-semibold leading-none tabular-nums"
              style={{
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                letterSpacing: "-0.05em",
              }}
            >
              #{rank}
            </div>
            <div
              className="text-[9px] text-muted-foreground/55 mt-1 uppercase"
              style={{
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                letterSpacing: "0.1em",
              }}
            >
              de {total}
            </div>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        <StatTile
          icon={Star}
          value={player.dynamic_rating.toFixed(1)}
          label="Rating"
          color={tier}
          delta={
            seasonAvg > 0 && delta !== 0
              ? `${deltaSign}${delta.toFixed(1)}`
              : undefined
          }
          deltaPositive={delta >= 0}
        />
        <StatTile
          icon={Trophy}
          value={player.total_matches}
          label="PJ"
        />
        <StatTile
          icon={Target}
          value={player.total_goals}
          label="Goles"
        />
        <StatTile
          icon={Award}
          value={player.motm_count}
          label="MOTM"
          color="oklch(0.85 0.16 85)"
        />
      </div>
    </div>
  )
}

function StatTile({
  icon: Icon,
  value,
  label,
  color = "currentColor",
  delta,
  deltaPositive,
}: {
  icon: React.ElementType
  value: string | number
  label: string
  color?: string
  delta?: string
  deltaPositive?: boolean
}) {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] px-2 py-3 text-center">
      <Icon className="h-3 w-3 mx-auto text-muted-foreground/50 mb-1.5" />
      <div
        className="text-[16px] font-semibold tabular-nums leading-none"
        style={{
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          letterSpacing: "-0.04em",
          color,
        }}
      >
        {value}
      </div>
      <div
        className="text-[9px] text-muted-foreground/50 mt-1.5 uppercase font-medium"
        style={{
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </div>
      {delta && (
        <div
          className="text-[10px] mt-1 font-medium tabular-nums"
          style={{
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            letterSpacing: "-0.02em",
            color: deltaPositive ? "oklch(0.78 0.22 145)" : "oklch(0.7 0.2 25)",
          }}
        >
          {delta}
        </div>
      )}
    </div>
  )
}

/* ─── Last Match ─── */
function LastMatch({
  match,
  motmPlayer,
  onNavigate,
}: {
  match: Match
  motmPlayer: Player | null
  onNavigate: (tab: string) => void
}) {
  const wWin = match.white_score > match.black_score
  const bWin = match.black_score > match.white_score
  const date = new Date(match.date)
  const days = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
  )
  const relative =
    days === 0 ? "Hoy" : days === 1 ? "Ayer" : `Hace ${days} días`

  return (
    <div
      className={cn(
        "relative overflow-hidden glass rounded-2xl p-5 anim-fade-up delay-3",
        match.is_special_event && "border border-amber-400/25"
      )}
    >
      {match.is_special_event && (
        <div
          className="absolute top-0 right-0 px-2.5 py-1 text-[9px] uppercase"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.85 0.18 80 / 0.20), transparent)",
            color: "oklch(0.92 0.13 95)",
            borderBottomLeftRadius: 8,
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            letterSpacing: "0.12em",
            fontWeight: 500,
          }}
        >
          ★ Superclásico
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <Eyebrow>Último partido</Eyebrow>
        <span
          className="text-[11px] text-muted-foreground/55"
          style={{
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            letterSpacing: "-0.01em",
          }}
        >
          {relative}
        </span>
      </div>

      {/* Score */}
      <div className="flex items-center justify-center gap-7 my-5">
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: "white", boxShadow: "0 0 8px rgba(255,255,255,0.5)" }}
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
              "text-[44px] font-semibold leading-none tabular-nums",
              wWin && "text-primary"
            )}
            style={{
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              letterSpacing: "-0.05em",
            }}
          >
            {match.white_score}
          </span>
        </div>
        <span className="text-muted-foreground/25 font-light text-2xl pb-2 select-none">—</span>
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: "#1a1a1a", outline: "1.5px solid #555", outlineOffset: "1px" }}
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
              "text-[44px] font-semibold leading-none tabular-nums",
              bWin && "text-primary"
            )}
            style={{
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              letterSpacing: "-0.05em",
            }}
          >
            {match.black_score}
          </span>
        </div>
      </div>

      {/* MOTM */}
      {motmPlayer && (
        <div
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 mt-4"
          style={{
            background: "oklch(0.85 0.16 85 / 0.08)",
            border: "1px solid oklch(0.85 0.16 85 / 0.20)",
          }}
        >
          <div
            className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center"
            style={{
              background: "oklch(0.85 0.16 85 / 0.20)",
              border: "1px solid oklch(0.85 0.16 85 / 0.4)",
            }}
          >
            <Award className="h-3.5 w-3.5" style={{ color: "oklch(0.85 0.16 85)" }} />
          </div>
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
            <div className="text-[14px] font-medium truncate leading-tight mt-1 tracking-tight">
              {motmPlayer.name}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => onNavigate("stats")}
        className="mt-4 w-full flex items-center justify-center gap-1 text-[10px] uppercase
          text-muted-foreground/55 hover:text-foreground transition-colors group"
        style={{
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          letterSpacing: "0.12em",
        }}
      >
        Ver historial
        <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  )
}

/* ─── Leaders ─── */
function Leaders({
  topScorer,
  topMotm,
}: {
  topScorer: { player: Player; goals: number } | null
  topMotm: { player: Player; count: number } | null
}) {
  if (!topScorer && !topMotm) return null

  return (
    <div className="grid grid-cols-2 gap-3 anim-fade-up delay-4">
      {topScorer ? (
        <LeaderCard
          icon={Target}
          eyebrow="Goleador"
          name={topScorer.player.name}
          value={topScorer.goals}
          unit="goles"
          accent="oklch(0.78 0.22 145)"
        />
      ) : (
        <EmptyLeader icon={Target} label="Sin goleador" />
      )}
      {topMotm ? (
        <LeaderCard
          icon={Award}
          eyebrow="Top MOTM"
          name={topMotm.player.name}
          value={topMotm.count}
          unit={topMotm.count === 1 ? "vez" : "veces"}
          accent="oklch(0.85 0.16 85)"
        />
      ) : (
        <EmptyLeader icon={Award} label="Sin MOTM aún" />
      )}
    </div>
  )
}

function LeaderCard({
  icon: Icon,
  eyebrow,
  name,
  value,
  unit,
  accent,
}: {
  icon: React.ElementType
  eyebrow: string
  name: string
  value: number
  unit: string
  accent: string
}) {
  return (
    <div
      className="relative overflow-hidden glass rounded-2xl p-4"
      style={{
        border: `1px solid ${accent.replace(")", " / 0.20)")}`,
      }}
    >
      <div
        className="absolute -top-6 -right-6 h-20 w-20 rounded-full pointer-events-none"
        style={{
          background: accent.replace(")", " / 0.10)"),
          filter: "blur(20px)",
        }}
      />
      <div className="relative">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Medal className="h-3 w-3" style={{ color: accent }} />
          <span
            className="text-[9px] uppercase"
            style={{
              color: accent,
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              letterSpacing: "0.12em",
              fontWeight: 500,
            }}
          >
            {eyebrow}
          </span>
        </div>
        <div className="text-[14px] font-medium leading-tight tracking-tight truncate mb-2">
          {name}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-[30px] font-semibold leading-none tabular-nums"
            style={{
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              color: accent,
              textShadow: `0 0 10px ${accent.replace(")", " / 0.4)")}`,
              letterSpacing: "-0.05em",
            }}
          >
            {value}
          </span>
          <span
            className="text-[10px] text-muted-foreground/55 uppercase"
            style={{
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              letterSpacing: "0.1em",
            }}
          >
            {unit}
          </span>
        </div>
      </div>
    </div>
  )
}

function EmptyLeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="rounded-2xl p-4 border border-border/20 bg-secondary/15 flex flex-col items-center justify-center text-center min-h-[100px]">
      <Icon className="h-5 w-5 text-muted-foreground/40 mb-1.5" />
      <span className="text-[11px] text-muted-foreground/60">{label}</span>
    </div>
  )
}

/* ═══════════ Main Component ═══════════ */
export function HomeDashboard({ onNavigate }: HomeDashboardProps) {
  const { player } = useAuth()
  const cd = useNextThursday()
  const heroRoast = useRotatingDemotivation(53_000)

  const [loading, setLoading] = useState(true)
  const [season, setSeason] = useState<Season | null>(null)
  const [setup, setSetup] = useState<CurrentMatchSetup | null>(null)
  const [lastMatch, setLastMatch] = useState<Match | null>(null)
  const [motmPlayer, setMotmPlayer] = useState<Player | null>(null)
  const [topScorer, setTopScorer] = useState<{ player: Player; goals: number } | null>(null)
  const [topMotm, setTopMotm] = useState<{ player: Player; count: number } | null>(null)
  const [allPlayers, setAllPlayers] = useState<Player[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [activeSeason, currentSetup, players] = await Promise.all([
        getActiveSeason(),
        getCurrentMatchSetup(),
        getPlayers(),
      ])
      setSeason(activeSeason)
      setSetup(currentSetup)
      setAllPlayers(players)

      if (activeSeason) {
        const [matches, scorers, motms] = await Promise.all([
          getMatches(activeSeason.id),
          getSeasonTopScorers(activeSeason.id),
          getSeasonTopMotms(activeSeason.id),
        ])
        setLastMatch(matches[0] ?? null)
        setTopScorer(scorers[0] ?? null)
        setTopMotm(motms[0] ?? null)

        if (matches[0]?.motm_player_id) {
          const motm = await getPlayerById(matches[0].motm_player_id)
          setMotmPlayer(motm)
        } else {
          setMotmPlayer(null)
        }
      }
    } catch (e) {
      console.error("Failed to load dashboard:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const confirmed = setup?.confirmed_players.length ?? 0
  const sortedByRating = [...allPlayers].sort(
    (a, b) => b.dynamic_rating - a.dynamic_rating
  )
  const myRank = player
    ? sortedByRating.findIndex((p) => p.id === player.id) + 1 || null
    : null
  const seasonAvg =
    allPlayers.length > 0
      ? allPlayers.reduce((s, p) => s + p.dynamic_rating, 0) / allPlayers.length
      : 0

  // Was today's match already saved?
  const hasMatchToday = !!(
    lastMatch &&
    new Date(lastMatch.date).toDateString() === new Date().toDateString()
  )

  if (loading) {
    return <LoadingState message="Cargando dashboard" />
  }

  return (
    <div className="space-y-5">
      <HeroCountdown cd={cd} confirmed={confirmed} roast={heroRoast} />

      <SmartAction
        setup={setup}
        hasMatchToday={hasMatchToday}
        onNavigate={onNavigate}
      />

      {player && (
        <MyStats
          player={player}
          rank={myRank}
          total={allPlayers.length}
          seasonAvg={seasonAvg}
        />
      )}

      {lastMatch && (
        <LastMatch
          match={lastMatch}
          motmPlayer={motmPlayer}
          onNavigate={onNavigate}
        />
      )}

      <Leaders topScorer={topScorer} topMotm={topMotm} />

      {!season && (
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/8 p-4 anim-fade-up text-center">
          <Sparkles className="h-5 w-5 text-yellow-400 mx-auto mb-2" />
          <p className="text-sm text-yellow-300/80">
            No hay temporada activa.{" "}
            <button
              onClick={() => onNavigate("stats")}
              className="font-bold underline-offset-2 hover:underline"
            >
              Crear una
            </button>
          </p>
        </div>
      )}
    </div>
  )
}

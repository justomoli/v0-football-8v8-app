"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { Match, MatchStats, Player } from "@/lib/types"
import { getMatchStats } from "@/lib/db"
import { tierColor } from "@/lib/rating-tier"
import { Award, Target, Calendar, Sparkles, Hand } from "lucide-react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

interface MatchDetailDrawerProps {
  match: Match | null
  open: boolean
  onClose: () => void
  playersById: Map<string, Player>
  motmPlayer?: Player | null
}

interface Row {
  player: Player
  goals: number
  rating: number
}

export function MatchDetailDrawer({
  match,
  open,
  onClose,
  playersById,
  motmPlayer,
}: MatchDetailDrawerProps) {
  const [stats, setStats] = useState<MatchStats[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!match || !open) return
    setLoading(true)
    getMatchStats(match.id)
      .then(setStats)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [match, open])

  if (!match) return null

  const date = new Date(match.date)
  const dateLabel = date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const statsByPlayer = new Map(stats.map((s) => [s.player_id, s]))

  const whiteRows: Row[] = match.white_team
    .map((id) => {
      const player = playersById.get(id)
      const stat = statsByPlayer.get(id)
      if (!player) return null
      return {
        player,
        goals: stat?.goals_scored ?? 0,
        rating: stat?.match_rating ?? 0,
      }
    })
    .filter((r): r is Row => r !== null)
    .sort((a, b) => b.rating - a.rating || b.goals - a.goals)

  const blackRows: Row[] = match.black_team
    .map((id) => {
      const player = playersById.get(id)
      const stat = statsByPlayer.get(id)
      if (!player) return null
      return {
        player,
        goals: stat?.goals_scored ?? 0,
        rating: stat?.match_rating ?? 0,
      }
    })
    .filter((r): r is Row => r !== null)
    .sort((a, b) => b.rating - a.rating || b.goals - a.goals)

  const wWin = match.white_score > match.black_score
  const bWin = match.black_score > match.white_score

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass-strong border-border/30 max-w-md p-0 overflow-hidden">
        <DialogTitle className="sr-only">
          Detalle del partido del {dateLabel}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Ratings y goles por jugador del partido seleccionado
        </DialogDescription>

        <div className="relative max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b border-border/15">
            {match.is_special_event && (
              <div
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md mb-2"
                style={{
                  background: "oklch(0.85 0.18 80 / 0.15)",
                  border: "1px solid oklch(0.85 0.18 80 / 0.35)",
                }}
              >
                <Sparkles className="h-3 w-3" style={{ color: "oklch(0.92 0.13 95)" }} />
                <span
                  className="text-[9px] uppercase"
                  style={{
                    fontFamily: "var(--font-mono), ui-monospace, monospace",
                    color: "oklch(0.92 0.13 95)",
                    letterSpacing: "0.16em",
                    fontWeight: 500,
                  }}
                >
                  Superclásico
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-3 w-3 text-muted-foreground/60" />
              <span className="text-[12px] text-muted-foreground/70">
                {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
              </span>
            </div>

            {/* Score */}
            <div className="flex items-center justify-center gap-7 my-2">
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
                    "text-[42px] font-semibold leading-none tabular-nums",
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
              <span className="text-muted-foreground/25 font-light text-xl pb-2 select-none">
                —
              </span>
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
                    "text-[42px] font-semibold leading-none tabular-nums",
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

            {motmPlayer && (
              <div
                className="mt-3 flex items-center gap-2.5 rounded-lg px-3 py-2"
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
                    {motmPlayer.name}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Teams */}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground/60">
              <Spinner className="h-4 w-4" />
              <span className="text-[12px]">Cargando stats…</span>
            </div>
          ) : (
            <div className="px-5 pb-5 pt-3 space-y-4">
              <TeamSection title="Blanco" variant="white" rows={whiteRows} />
              <TeamSection title="Negro" variant="black" rows={blackRows} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TeamSection({
  title,
  variant,
  rows,
}: {
  title: string
  variant: "white" | "black"
  rows: Row[]
}) {
  const isWhite = variant === "white"
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={
            isWhite
              ? { background: "white" }
              : { background: "#1a1a1a", outline: "1px solid #555", outlineOffset: "1px" }
          }
        />
        <span className="eyebrow">{title}</span>
      </div>

      <div className="space-y-1">
        {rows.map((r) => {
          const tier = tierColor(r.rating)
          return (
            <div
              key={r.player.id}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5",
                isWhite ? "bg-white/[0.04]" : "bg-black/30"
              )}
            >
              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                <span className="text-[13px] font-medium truncate tracking-tight">
                  {r.player.name}
                </span>
                {r.player.is_goalkeeper && (
                  <Hand className="h-3 w-3 text-amber-400/80 shrink-0" />
                )}
              </div>

              {/* Goals */}
              {r.goals > 0 && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <Target className="h-3 w-3 text-primary/70" />
                  <span
                    className="text-[12px] font-semibold tabular-nums text-primary/90"
                    style={{
                      fontFamily: "var(--font-mono), ui-monospace, monospace",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {r.goals}
                  </span>
                </div>
              )}

              {/* Rating */}
              <span
                className="shrink-0 text-[13px] font-semibold tabular-nums w-8 text-right"
                style={{
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  color: tier,
                  letterSpacing: "-0.04em",
                  textShadow: `0 0 6px ${tier}55`,
                }}
              >
                {r.rating.toFixed(1)}
              </span>
            </div>
          )
        })}
        {rows.length === 0 && (
          <div className="text-[11px] text-muted-foreground/55 px-2.5 py-2">
            Sin stats registradas
          </div>
        )}
      </div>
    </div>
  )
}

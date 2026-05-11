"use client"

import { useState } from "react"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { Player } from "@/lib/types"
import { getPhotoUrl } from "@/lib/player-photo"
import { Hand, Shield, Trophy, Target, Award, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlayerFifaCardProps {
  player: Player | null
  open: boolean
  onClose: () => void
}

/* ── Card visual theme ── */
function getCardTheme(rating: number) {
  if (rating >= 9) {
    return {
      bg: "linear-gradient(160deg, #2a1d0a 0%, #1a1206 45%, #0c0904 100%)",
      border: "oklch(0.85 0.18 80)",
      accent: "oklch(0.92 0.14 95)",
      glow: "oklch(0.85 0.18 80 / 0.45)",
      ratingGlow: "oklch(0.95 0.18 90 / 0.6)",
    }
  }
  if (rating >= 8) {
    return {
      bg: "linear-gradient(160deg, #0a1f15 0%, #06150e 50%, #030a07 100%)",
      border: "oklch(0.78 0.22 145)",
      accent: "oklch(0.78 0.22 145)",
      glow: "oklch(0.78 0.22 145 / 0.40)",
      ratingGlow: "oklch(0.78 0.22 145 / 0.6)",
    }
  }
  if (rating >= 7) {
    return {
      bg: "linear-gradient(160deg, #0a1822 0%, #06121a 50%, #030810 100%)",
      border: "oklch(0.78 0.15 195)",
      accent: "oklch(0.85 0.15 200)",
      glow: "oklch(0.78 0.15 195 / 0.35)",
      ratingGlow: "oklch(0.85 0.15 200 / 0.5)",
    }
  }
  if (rating >= 5) {
    return {
      bg: "linear-gradient(160deg, #1c1808 0%, #110e05 50%, #080603 100%)",
      border: "oklch(0.78 0.14 85)",
      accent: "oklch(0.88 0.16 90)",
      glow: "oklch(0.78 0.14 85 / 0.30)",
      ratingGlow: "oklch(0.88 0.16 90 / 0.5)",
    }
  }
  return {
    bg: "linear-gradient(160deg, #1a1218 0%, #100a10 50%, #080508 100%)",
    border: "oklch(0.55 0.04 270)",
    accent: "oklch(0.7 0.04 270)",
    glow: "oklch(0.55 0.04 270 / 0.25)",
    ratingGlow: "oklch(0.7 0.04 270 / 0.4)",
  }
}

const POSITION_LABEL: Record<string, string> = {
  GK: "ARQ",
  DEF: "DEF",
  MID: "MED",
  FWD: "DEL",
}

function deriveStat(value: number | null | undefined, fallback: number): number {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback
  return Math.max(1, Math.min(99, Math.round(value)))
}

export function PlayerFifaCard({ player, open, onClose }: PlayerFifaCardProps) {
  const [photoError, setPhotoError] = useState(false)

  if (!player) return null

  const theme = getCardTheme(player.dynamic_rating)
  const overallRating = Math.round(player.dynamic_rating * 10) // 1-100 scale
  const position = player.position ?? (player.is_goalkeeper ? "GK" : "MID")
  const positionLabel = POSITION_LABEL[position] ?? position

  // Stats with fallback heuristic when not set yet
  const base = Math.round(player.dynamic_rating * 9.5) // ~rating*10 scaled
  const stats = {
    shot: deriveStat(player.shot, base),
    pace: deriveStat(player.pace, base),
    passing: deriveStat(player.passing, base),
    dribbling: deriveStat(player.dribbling, base),
    defense: deriveStat(player.defense, base),
    physique: deriveStat(player.physique, base),
  }

  const photoUrl = getPhotoUrl(player)
  const showPhoto = !photoError

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="border-0 p-4 overflow-visible max-w-[390px] bg-transparent shadow-none"
        style={{ background: "transparent" }}
      >
        <DialogTitle className="sr-only">Carta de jugador: {player.name}</DialogTitle>
        <DialogClose
          type="button"
          className="absolute right-0 top-0 z-30 flex h-10 w-10 -translate-y-2 translate-x-2 items-center justify-center rounded-2xl border border-white/15 bg-black/65 text-white/80 shadow-[0_0_24px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all hover:scale-105 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/60"
        >
          ×
        </DialogClose>

        {/* Card body */}
        <div
          className="relative rounded-3xl overflow-hidden anim-scale-in"
          style={{
            background: theme.bg,
            border: `1px solid ${theme.border}55`,
            boxShadow: `0 0 50px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
        >
          {/* Top corner: rating + position */}
          <div className="absolute top-5 left-5 flex flex-col items-start gap-0.5 z-10">
            <span
              className="text-[44px] font-semibold leading-none tabular-nums"
              style={{
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                color: theme.accent,
                letterSpacing: "-0.06em",
                textShadow: `0 0 14px ${theme.ratingGlow}`,
              }}
            >
              {overallRating}
            </span>
            <span
              className="text-[11px] uppercase mt-0.5"
              style={{
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                color: theme.accent,
                letterSpacing: "0.18em",
                fontWeight: 500,
              }}
            >
              {positionLabel}
            </span>
          </div>

          {/* Admin / GK badges top-right */}
          <div className="absolute top-5 right-5 flex flex-col items-end gap-1.5 z-10">
            {player.is_admin && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <Shield className="h-3 w-3" style={{ color: theme.accent }} />
              </span>
            )}
            {player.is_goalkeeper && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md"
                style={{
                  background: "oklch(0.85 0.16 85 / 0.18)",
                  border: "1px solid oklch(0.85 0.16 85 / 0.4)",
                }}
              >
                <Hand className="h-3 w-3" style={{ color: "oklch(0.92 0.14 90)" }} />
              </span>
            )}
          </div>

          {/* Photo / initial */}
          <div className="pt-20 pb-2 flex items-center justify-center">
            <div
              className="relative h-32 w-32 rounded-full overflow-hidden"
              style={{
                background: `radial-gradient(circle at 50% 30%, ${theme.accent}22 0%, transparent 70%), ${theme.bg}`,
                border: `2px solid ${theme.border}40`,
                boxShadow: `0 0 30px ${theme.glow}, inset 0 0 30px rgba(0,0,0,0.5)`,
              }}
            >
              {showPhoto ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={photoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => setPhotoError(true)}
                />
              ) : (
                <div
                  className="h-full w-full flex items-center justify-center text-[58px] font-semibold"
                  style={{
                    color: theme.accent,
                    textShadow: `0 0 20px ${theme.ratingGlow}`,
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                    letterSpacing: "-0.04em",
                  }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Name + nickname */}
          <div className="px-6 text-center mt-2">
            <h2
              id="fifa-card-name"
              className="text-[22px] font-semibold leading-tight tracking-tight uppercase"
              style={{
                letterSpacing: "-0.02em",
                textShadow: `0 1px 0 rgba(0,0,0,0.5)`,
              }}
            >
              {player.name}
            </h2>
            {player.nickname && (
              <p
                className="text-[11px] mt-1 italic opacity-65"
                style={{ color: theme.accent }}
              >
                «{player.nickname}»
              </p>
            )}
          </div>

          {/* Divider */}
          <div
            className="mx-6 my-4 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${theme.border}55, transparent)`,
            }}
          />

          {/* Stats grid 3×2 */}
          <div className="px-6 grid grid-cols-3 gap-y-3 gap-x-4 place-items-center">
            <StatItem value={stats.shot} color={theme.accent} />
            <StatItem value={stats.passing} color={theme.accent} />
            <StatItem value={stats.dribbling} color={theme.accent} />
            <StatItem value={stats.pace} color={theme.accent} />
            <StatItem value={stats.defense} color={theme.accent} />
            <StatItem value={stats.physique} color={theme.accent} />
          </div>

          {/* Footer: physical + season */}
          <div
            className="mt-5 mx-6 mb-6 pt-3 border-t"
            style={{ borderColor: `${theme.border}25` }}
          >
            {(player.height_cm || player.weight_kg) && (
              <div
                className="flex items-center justify-center gap-3 text-[11px] mb-2 opacity-75"
                style={{
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  letterSpacing: "0.04em",
                }}
              >
                {player.height_cm && <span>{(player.height_cm / 100).toFixed(2)}m</span>}
                {player.height_cm && player.weight_kg && (
                  <span className="opacity-40">·</span>
                )}
                {player.weight_kg && <span>{player.weight_kg}kg</span>}
              </div>
            )}

            <div className="flex items-center justify-around mt-1">
              <SeasonStat icon={Trophy} value={player.total_matches} color={theme.accent} />
              <SeasonStat icon={Target} value={player.total_goals} color={theme.accent} />
              <SeasonStat icon={Award} value={player.motm_count} color={theme.accent} />
              <SeasonStat icon={Star} value={player.dynamic_rating.toFixed(1)} color={theme.accent} />
            </div>
          </div>

          {/* Decorative corner shimmer */}
          <div
            className="absolute -top-20 -right-20 h-60 w-60 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${theme.glow}, transparent 65%)`,
              filter: "blur(20px)",
            }}
          />
          <div
            className="absolute -bottom-24 -left-24 h-60 w-60 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${theme.glow}, transparent 65%)`,
              filter: "blur(25px)",
              opacity: 0.6,
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StatItem({ value, color }: { value: number; color: string }) {
  return (
    <span
      className="text-[18px] font-semibold leading-none tabular-nums"
      style={{
        fontFamily: "var(--font-mono), ui-monospace, monospace",
        color,
        letterSpacing: "-0.04em",
      }}
    >
      {value}
    </span>
  )
}

function SeasonStat({
  icon: Icon,
  value,
  color,
}: {
  icon: React.ElementType
  value: number | string
  color: string
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon className="h-3 w-3 mb-0.5" style={{ color, opacity: 0.6 }} />
      <span
        className="text-[13px] font-semibold tabular-nums leading-none"
        style={{
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          color,
          letterSpacing: "-0.03em",
        }}
      >
        {value}
      </span>
    </div>
  )
}

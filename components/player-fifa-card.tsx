"use client"

import { useLayoutEffect, useState } from "react"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { Player, PlayerPosition } from "@/lib/types"
import { getPhotoUrl } from "@/lib/player-photo"
import { Hand, Trophy, Target, Award, Star } from "lucide-react"
import { attributeToTen } from "@/lib/player-stats-ten-scale"
import { updatePlayer } from "@/lib/db"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const POSITION_FIELDS: Record<string, string> = {
  GK: "ARQ",
  DEF: "DEF",
  MID: "MED",
  FWD: "DEL",
}

const ATTRIBUTE_FIELDS = [
  ["pace", "Ritmo"],
  ["shot", "Tiro"],
  ["passing", "Pase"],
  ["dribbling", "Regate"],
  ["defense", "Defensa"],
  ["physique", "Físico"],
] as const

interface PlayerFifaCardProps {
  player: Player | null
  open: boolean
  onClose: () => void
  onPlayerUpdated?: (player: Player) => void
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

export function PlayerFifaCard({ player, open, onClose, onPlayerUpdated }: PlayerFifaCardProps) {
  const [photoError, setPhotoError] = useState(false)
  const [draft, setDraft] = useState<Player | null>(null)
  const [saving, setSaving] = useState(false)

  useLayoutEffect(() => {
    if (open && player) {
      setDraft({ ...player })
      setPhotoError(false)
    }
    if (!open) setDraft(null)
  }, [open, player])

  if (!player) return null

  const edit = draft ?? player
  const theme = getCardTheme(edit.dynamic_rating)
  const overallTen = edit.dynamic_rating
  const overallFifaUi = Math.round(edit.dynamic_rating * 10)

  const positionKey = edit.position ?? (edit.is_goalkeeper ? "GK" : "MID")
  const positionLabel = POSITION_FIELDS[positionKey] ?? positionKey

  const stats = {
    pace: attributeToTen(edit.pace, edit.dynamic_rating),
    shot: attributeToTen(edit.shot, edit.dynamic_rating),
    passing: attributeToTen(edit.passing, edit.dynamic_rating),
    dribbling: attributeToTen(edit.dribbling, edit.dynamic_rating),
    defense: attributeToTen(edit.defense, edit.dynamic_rating),
    physique: attributeToTen(edit.physique, edit.dynamic_rating),
  }

  const photoUrl = getPhotoUrl(edit)
  const showPhoto = !photoError

  const mergeSource = (): Player | null => draft ?? player ?? null

  const patchDraft = (updater: (p: Player) => Player) => {
    setDraft((prev) => updater(prev ?? player))
  }

  const handleSave = async () => {
    const src = mergeSource()
    if (!src) return
    setSaving(true)
    try {
      const updated = await updatePlayer(src.id, {
        dynamic_rating: src.dynamic_rating,
        pace: src.pace ?? null,
        shot: src.shot ?? null,
        passing: src.passing ?? null,
        dribbling: src.dribbling ?? null,
        defense: src.defense ?? null,
        physique: src.physique ?? null,
        position: src.position ?? null,
        is_goalkeeper: !!src.is_goalkeeper,
      })
      setDraft(updated)
      onPlayerUpdated?.(updated)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="border-0 p-4 overflow-y-auto overflow-x-visible max-w-[390px] max-h-[min(94vh,900px)] bg-transparent shadow-none"
        style={{ background: "transparent" }}
      >
        <DialogTitle className="sr-only">Carta de jugador: {edit.name}</DialogTitle>
        <DialogClose
          type="button"
          className="absolute right-0 top-0 z-30 flex h-10 w-10 -translate-y-2 translate-x-2 items-center justify-center rounded-2xl border border-white/15 bg-black/65 text-white/80 shadow-[0_0_24px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all hover:scale-105 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/60"
        >
          ×
        </DialogClose>

        <div
          className="relative rounded-3xl overflow-hidden anim-scale-in"
          style={{
            background: theme.bg,
            border: `1px solid ${theme.border}55`,
            boxShadow: `0 0 50px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
        >
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
              {overallFifaUi}
            </span>
            <span
              className="text-[10px] mt-px opacity-85 tabular-nums"
              style={{
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                color: theme.accent,
                letterSpacing: "0.06em",
                fontWeight: 500,
              }}
            >
              {overallTen.toFixed(1)} / 10
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

          <div className="absolute top-5 right-5 flex flex-col items-end gap-1.5 z-10">
            {edit.is_goalkeeper && (
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
                  {edit.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 text-center mt-2">
            <h2
              id="fifa-card-name"
              className="text-[22px] font-semibold leading-tight tracking-tight uppercase"
              style={{
                letterSpacing: "-0.02em",
                textShadow: `0 1px 0 rgba(0,0,0,0.5)`,
              }}
            >
              {edit.name}
            </h2>
            {edit.nickname && (
              <p className="text-[11px] mt-1 italic opacity-65" style={{ color: theme.accent }}>
                «{edit.nickname}»
              </p>
            )}
          </div>

          <div
            className="mx-6 my-4 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${theme.border}55, transparent)`,
            }}
          />

          <div className="px-6 grid grid-cols-3 gap-y-3 gap-x-4 place-items-center">
            <StatItem value={stats.shot} color={theme.accent} />
            <StatItem value={stats.passing} color={theme.accent} />
            <StatItem value={stats.dribbling} color={theme.accent} />
            <StatItem value={stats.pace} color={theme.accent} />
            <StatItem value={stats.defense} color={theme.accent} />
            <StatItem value={stats.physique} color={theme.accent} />
          </div>

          {open && (
            <div
              className="mx-6 mt-4 mb-5 rounded-2xl border px-4 py-3 space-y-3"
              style={{
                borderColor: `${theme.border}40`,
                background: "rgba(0,0,0,0.35)",
              }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: theme.accent, opacity: 0.85 }}
              >
                Editar tarjeta
              </p>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-white/65">Posición</Label>
                <Select
                  value={(edit.position ?? (edit.is_goalkeeper ? "GK" : "MID")) as PlayerPosition}
                  onValueChange={(v) => {
                    const pos = v as PlayerPosition
                    patchDraft((p) => ({
                      ...p,
                      position: pos,
                      is_goalkeeper: pos === "GK",
                    }))
                  }}
                >
                  <SelectTrigger className="h-9 rounded-xl border-white/15 bg-black/35 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GK">GK</SelectItem>
                    <SelectItem value="DEF">DEF</SelectItem>
                    <SelectItem value="MID">MID</SelectItem>
                    <SelectItem value="FWD">DEL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="flex justify-between text-[11px] text-white/70">
                  <span>Valoración general</span>
                  <span className="font-mono text-primary">{edit.dynamic_rating.toFixed(1)}</span>
                </Label>
                <Slider
                  value={[edit.dynamic_rating]}
                  onValueChange={([v]) => patchDraft((p) => ({ ...p, dynamic_rating: v }))}
                  min={1}
                  max={10}
                  step={0.5}
                />
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                {ATTRIBUTE_FIELDS.map(([field, label]) => {
                  const val = attributeToTen(edit[field], edit.dynamic_rating)
                  return (
                    <div key={field} className="space-y-1">
                      <Label className="flex justify-between text-[10px] text-white/60">
                        <span>{label}</span>
                        <span className="font-mono" style={{ color: theme.accent }}>
                          {val.toFixed(1)}
                        </span>
                      </Label>
                      <Slider
                        value={[val]}
                        onValueChange={([nv]) =>
                          patchDraft((p) => ({
                            ...p,
                            [field]: nv,
                          }))
                        }
                        min={1}
                        max={10}
                        step={0.5}
                      />
                    </div>
                  )
                })}
              </div>

              <Button size="sm" className="w-full rounded-xl mt-2" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Guardando…
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </div>
          )}

          <div
            className="mt-1 mx-6 mb-6 pt-3 border-t"
            style={{ borderColor: `${theme.border}25` }}
          >
            {(edit.height_cm || edit.weight_kg) && (
              <div
                className="flex items-center justify-center gap-3 text-[11px] mb-2 opacity-75"
                style={{
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  letterSpacing: "0.04em",
                }}
              >
                {edit.height_cm && <span>{(edit.height_cm / 100).toFixed(2)}m</span>}
                {edit.height_cm && edit.weight_kg && <span className="opacity-40">·</span>}
                {edit.weight_kg && <span>{edit.weight_kg}kg</span>}
              </div>
            )}

            <div className="flex items-center justify-around mt-1">
              <SeasonStat icon={Trophy} value={edit.total_matches} color={theme.accent} />
              <SeasonStat icon={Target} value={edit.total_goals} color={theme.accent} />
              <SeasonStat icon={Award} value={edit.motm_count} color={theme.accent} />
              <SeasonStat icon={Star} value={edit.dynamic_rating.toFixed(1)} color={theme.accent} />
            </div>
          </div>

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
      {value.toFixed(1)}
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

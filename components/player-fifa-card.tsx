"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { Player } from "@/lib/types"
import { getPhotoUrl } from "@/lib/player-photo"
import { Hand, Pencil, Check, X, Camera } from "lucide-react"
import { updatePlayer } from "@/lib/db"
import { uploadPlayerPhoto } from "@/lib/image-upload"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

const POSITION_SHORT: Record<string, string> = {
  GK: "ARQ",
  DEF: "DEF",
  MID: "MED",
  FWD: "DEL",
}
const POSITION_FULL: Record<string, string> = {
  GK: "Arquero",
  DEF: "Defensor",
  MID: "Mediocampista",
  FWD: "Delantero",
}

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
      label: "ICON",
      bg: "linear-gradient(165deg, #2a1d0a 0%, #1a1206 50%, #0c0904 100%)",
      border: "oklch(0.85 0.18 80)",
      accent: "oklch(0.92 0.14 95)",
      accentSoft: "oklch(0.85 0.18 80)",
      glow: "oklch(0.85 0.18 80 / 0.45)",
      ratingGlow: "oklch(0.95 0.18 90 / 0.55)",
    }
  }
  if (rating >= 8) {
    return {
      label: "CRACK",
      bg: "linear-gradient(165deg, #0a1f15 0%, #06150e 50%, #030a07 100%)",
      border: "oklch(0.78 0.22 145)",
      accent: "oklch(0.78 0.22 145)",
      accentSoft: "oklch(0.78 0.22 145)",
      glow: "oklch(0.78 0.22 145 / 0.40)",
      ratingGlow: "oklch(0.78 0.22 145 / 0.55)",
    }
  }
  if (rating >= 7) {
    return {
      label: "TITULAR",
      bg: "linear-gradient(165deg, #0a1822 0%, #06121a 50%, #030810 100%)",
      border: "oklch(0.78 0.15 195)",
      accent: "oklch(0.85 0.15 200)",
      accentSoft: "oklch(0.85 0.15 200)",
      glow: "oklch(0.78 0.15 195 / 0.35)",
      ratingGlow: "oklch(0.85 0.15 200 / 0.45)",
    }
  }
  if (rating >= 5) {
    return {
      label: "ESTÁNDAR",
      bg: "linear-gradient(165deg, #1c1808 0%, #110e05 50%, #080603 100%)",
      border: "oklch(0.78 0.14 85)",
      accent: "oklch(0.88 0.16 90)",
      accentSoft: "oklch(0.88 0.16 90)",
      glow: "oklch(0.78 0.14 85 / 0.28)",
      ratingGlow: "oklch(0.88 0.16 90 / 0.45)",
    }
  }
  return {
    label: "RESERVA",
    bg: "linear-gradient(165deg, #1a1218 0%, #100a10 50%, #080508 100%)",
    border: "oklch(0.55 0.04 270)",
    accent: "oklch(0.78 0.04 270)",
    accentSoft: "oklch(0.78 0.04 270)",
    glow: "oklch(0.55 0.04 270 / 0.22)",
    ratingGlow: "oklch(0.78 0.04 270 / 0.35)",
  }
}

const BIO_MAX = 200

export function PlayerFifaCard({
  player,
  open,
  onClose,
  onPlayerUpdated,
}: PlayerFifaCardProps) {
  const [photoError, setPhotoError] = useState(false)
  const [editingBio, setEditingBio] = useState(false)
  const [bioDraft, setBioDraft] = useState("")
  const [saving, setSaving] = useState(false)
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoErrorMsg, setPhotoErrorMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    if (open && player) {
      setLocalPlayer(player)
      setBioDraft(player.bio ?? "")
      setPhotoError(false)
      setEditingBio(false)
    }
    if (!open) {
      setLocalPlayer(null)
      setEditingBio(false)
    }
  }, [open, player])

  if (!player) return null

  const view = localPlayer ?? player
  const theme = getCardTheme(view.dynamic_rating)
  const overallFifaUi = Math.round(view.dynamic_rating * 10)
  const overallTen = view.dynamic_rating

  const positionKey = view.position ?? (view.is_goalkeeper ? "GK" : "MID")
  const positionShort = POSITION_SHORT[positionKey] ?? positionKey
  const positionFull = POSITION_FULL[positionKey] ?? positionKey

  const photoUrl = getPhotoUrl(view)
  const showPhoto = !photoError

  // Pseudo-ID for the watermark — short hash of player id
  const shortId = view.id.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase()

  const handleSaveBio = async () => {
    const trimmed = bioDraft.trim().slice(0, BIO_MAX)
    setSaving(true)
    try {
      const updated = await updatePlayer(view.id, {
        bio: trimmed.length > 0 ? trimmed : null,
      })
      setLocalPlayer(updated)
      setEditingBio(false)
      onPlayerUpdated?.(updated)
    } catch (e) {
      console.error("Bio save failed:", e)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelBio = () => {
    setBioDraft(view.bio ?? "")
    setEditingBio(false)
  }

  const handlePickPhoto = () => {
    setPhotoErrorMsg(null)
    fileInputRef.current?.click()
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setUploadingPhoto(true)
    setPhotoErrorMsg(null)
    try {
      const publicUrl = await uploadPlayerPhoto(file, view.id)
      const updated = await updatePlayer(view.id, { photo_url: publicUrl })
      setLocalPlayer(updated)
      setPhotoError(false)
      onPlayerUpdated?.(updated)
    } catch (err) {
      console.error("Photo upload failed:", err)
      const message =
        err instanceof Error ? err.message : "No pudimos subir la foto."
      setPhotoErrorMsg(message)
    } finally {
      setUploadingPhoto(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="border-0 p-4 overflow-y-auto overflow-x-visible max-w-[380px] max-h-[min(94vh,860px)] bg-transparent shadow-none"
        style={{ background: "transparent" }}
      >
        <DialogTitle className="sr-only">Carta de jugador: {view.name}</DialogTitle>

        <DialogClose
          type="button"
          className="absolute right-0 top-0 z-30 flex h-9 w-9 -translate-y-1 translate-x-1 items-center justify-center rounded-2xl border border-white/15 bg-black/65 text-white/80 shadow-[0_0_24px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all hover:scale-105 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/60"
        >
          <X className="h-4 w-4" />
        </DialogClose>

        <div
          className="relative rounded-[28px] overflow-hidden anim-scale-in"
          style={{
            background: theme.bg,
            border: `1px solid ${theme.border}40`,
            boxShadow: `0 0 60px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
        >
          {/* Top decorative stripes pattern */}
          <div
            className="absolute inset-x-0 top-0 h-24 pointer-events-none opacity-[0.07]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                ${theme.accent} 0,
                ${theme.accent} 1px,
                transparent 1px,
                transparent 14px
              )`,
              maskImage:
                "linear-gradient(180deg, black 0%, black 60%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(180deg, black 0%, black 60%, transparent 100%)",
            }}
          />

          {/* Decorative blurry orbs */}
          <div
            className="absolute -top-24 -right-24 h-64 w-64 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${theme.glow}, transparent 65%)`,
              filter: "blur(20px)",
            }}
          />
          <div
            className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${theme.glow}, transparent 65%)`,
              filter: "blur(28px)",
              opacity: 0.55,
            }}
          />

          {/* ── Header strip: rating tile + tier label ── */}
          <div className="relative pt-5 px-5 flex items-start justify-between">
            <div className="flex items-stretch gap-3">
              {/* Big rating */}
              <div className="flex flex-col items-start leading-none">
                <span
                  className="tabular-nums"
                  style={{
                    fontFamily: "var(--font-mono), ui-monospace, monospace",
                    fontWeight: 600,
                    fontSize: 56,
                    color: theme.accent,
                    letterSpacing: "-0.06em",
                    textShadow: `0 0 18px ${theme.ratingGlow}`,
                  }}
                >
                  {overallFifaUi}
                </span>
                <span
                  className="mt-1 tabular-nums opacity-75"
                  style={{
                    fontFamily: "var(--font-mono), ui-monospace, monospace",
                    fontSize: 10,
                    color: theme.accent,
                    letterSpacing: "0.06em",
                    fontWeight: 500,
                  }}
                >
                  {overallTen.toFixed(1)} / 10
                </span>
              </div>

              {/* Vertical divider */}
              <div
                className="self-stretch w-px"
                style={{
                  background: `linear-gradient(180deg, transparent, ${theme.border}50, transparent)`,
                }}
              />

              {/* Position + tier */}
              <div className="flex flex-col items-start gap-1 mt-1.5">
                <span
                  className="uppercase"
                  style={{
                    fontFamily: "var(--font-mono), ui-monospace, monospace",
                    fontSize: 11,
                    color: theme.accent,
                    letterSpacing: "0.2em",
                    fontWeight: 600,
                  }}
                >
                  {positionShort}
                </span>
                <span
                  className="uppercase opacity-60"
                  style={{
                    fontFamily: "var(--font-mono), ui-monospace, monospace",
                    fontSize: 9,
                    color: theme.accent,
                    letterSpacing: "0.22em",
                  }}
                >
                  {theme.label}
                </span>
                {view.is_goalkeeper && (
                  <span
                    className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                    style={{
                      background: "oklch(0.85 0.16 85 / 0.18)",
                      border: "1px solid oklch(0.85 0.16 85 / 0.40)",
                    }}
                    title="Arquero"
                  >
                    <Hand
                      className="h-2.5 w-2.5"
                      style={{ color: "oklch(0.92 0.14 90)" }}
                    />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Photo frame with corner brackets ── */}
          <div className="relative mt-5 mb-3 px-6 flex justify-center">
            <div className="relative" style={{ width: 192, height: 192 }}>
              {/* Corner brackets */}
              {(["tl", "tr", "bl", "br"] as const).map((corner) => (
                <CornerBracket key={corner} corner={corner} color={theme.border} />
              ))}

              {/* Photo */}
              <div
                className="relative h-full w-full rounded-[18px] overflow-hidden"
                style={{
                  background: `radial-gradient(circle at 50% 30%, ${theme.accent}1a 0%, transparent 70%), linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.45))`,
                  border: `1px solid ${theme.border}30`,
                  boxShadow: `inset 0 0 40px rgba(0,0,0,0.45), 0 18px 40px -20px ${theme.glow}`,
                }}
              >
                {showPhoto ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={photoUrl}
                    alt={view.name}
                    className="h-full w-full object-cover"
                    onError={() => setPhotoError(true)}
                  />
                ) : (
                  <div
                    className="h-full w-full flex items-center justify-center font-semibold"
                    style={{
                      color: theme.accent,
                      textShadow: `0 0 22px ${theme.ratingGlow}`,
                      fontFamily: "var(--font-sans), system-ui, sans-serif",
                      fontSize: 88,
                      letterSpacing: "-0.06em",
                    }}
                  >
                    {view.name.charAt(0).toUpperCase()}
                  </div>
                )}

                {uploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <Spinner />
                  </div>
                )}
              </div>

              {/* Camera button */}
              <button
                type="button"
                onClick={handlePickPhoto}
                disabled={uploadingPhoto}
                aria-label="Cambiar foto"
                className="absolute -bottom-2 -right-2 inline-flex h-9 w-9 items-center justify-center rounded-xl shadow-[0_0_18px_rgba(0,0,0,0.55)] transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                style={{
                  background: theme.bg,
                  border: `1.5px solid ${theme.border}90`,
                  color: theme.accent,
                }}
              >
                <Camera className="h-4 w-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>

          {photoErrorMsg && (
            <p className="text-center text-[11px] text-destructive/85 leading-snug px-6">
              {photoErrorMsg}
            </p>
          )}

          {/* ── Name + position full ── */}
          <div className="px-6 mt-3 text-center">
            <h2
              className="font-semibold leading-[0.95] uppercase"
              style={{
                fontFamily: "var(--font-sans), system-ui, sans-serif",
                fontSize: view.name.length > 12 ? 28 : 34,
                letterSpacing: "-0.04em",
                color: "rgba(255,255,255,0.97)",
                textShadow: "0 1px 0 rgba(0,0,0,0.6)",
              }}
            >
              {view.name}
            </h2>

            {/* Decorative bar */}
            <div className="mt-3 mb-2 flex items-center justify-center gap-2">
              <div
                className="h-px w-8"
                style={{ background: `${theme.border}80` }}
              />
              <span
                className="uppercase tabular-nums"
                style={{
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  fontSize: 10,
                  color: theme.accent,
                  letterSpacing: "0.22em",
                  fontWeight: 500,
                }}
              >
                {positionFull}
              </span>
              <div
                className="h-px w-8"
                style={{ background: `${theme.border}80` }}
              />
            </div>

            {view.nickname && (
              <p
                className="text-[12px] italic opacity-65 mt-0.5"
                style={{ color: theme.accent }}
              >
                «{view.nickname}»
              </p>
            )}
          </div>

          {/* ── BIO block with vertical accent ── */}
          <div className="mt-5 px-6">
            <div
              className="relative pl-3"
              style={{
                borderLeft: `2px solid ${theme.border}80`,
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="uppercase"
                  style={{
                    fontFamily: "var(--font-mono), ui-monospace, monospace",
                    fontSize: 9,
                    color: theme.accent,
                    letterSpacing: "0.18em",
                    fontWeight: 600,
                    opacity: 0.8,
                  }}
                >
                  Biografía
                </span>
                {!editingBio && (
                  <button
                    type="button"
                    onClick={() => setEditingBio(true)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] uppercase opacity-55 hover:opacity-100 transition-opacity"
                    style={{
                      fontFamily: "var(--font-mono), ui-monospace, monospace",
                      color: theme.accent,
                      letterSpacing: "0.14em",
                      fontWeight: 500,
                    }}
                  >
                    <Pencil className="h-2.5 w-2.5" />
                    Editar
                  </button>
                )}
              </div>

              {editingBio ? (
                <div className="space-y-2">
                  <textarea
                    value={bioDraft}
                    onChange={(e) =>
                      setBioDraft(e.target.value.slice(0, BIO_MAX))
                    }
                    rows={3}
                    placeholder="Una línea sobre el jugador…"
                    autoFocus
                    className="w-full rounded-lg border bg-black/40 px-2.5 py-2 text-[13px] leading-snug text-foreground/95 placeholder:text-foreground/35 focus:outline-none focus:ring-1 resize-none"
                    style={{
                      borderColor: `${theme.border}40`,
                      fontFamily: "var(--font-sans), system-ui, sans-serif",
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] tabular-nums opacity-55"
                      style={{
                        fontFamily: "var(--font-mono), ui-monospace, monospace",
                        color: theme.accent,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {bioDraft.length}/{BIO_MAX}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelBio}
                        disabled={saving}
                        className="h-7 px-2.5 gap-1 text-[11px]"
                      >
                        <X className="h-3 w-3" />
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveBio}
                        disabled={saving}
                        className="h-7 px-2.5 gap-1 text-[11px]"
                      >
                        {saving ? <Spinner /> : <Check className="h-3 w-3" />}
                        Guardar
                      </Button>
                    </div>
                  </div>
                </div>
              ) : view.bio && view.bio.trim().length > 0 ? (
                <p
                  className="text-[13px] leading-relaxed text-foreground/85 italic"
                  style={{
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                  }}
                >
                  “{view.bio}”
                </p>
              ) : (
                <p
                  className="text-[12px] leading-relaxed text-foreground/40 italic"
                  style={{
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                  }}
                >
                  Sin biografía. Tocá «Editar» para sumar una.
                </p>
              )}
            </div>
          </div>

          {/* ── Stats footer panel ── */}
          <div className="mt-5 mx-5 mb-4">
            <div
              className="grid grid-cols-4 rounded-2xl overflow-hidden"
              style={{
                background: "rgba(0,0,0,0.32)",
                border: `1px solid ${theme.border}25`,
              }}
            >
              <StatCell
                value={view.total_matches}
                label="PJ"
                accent={theme.accent}
                divider
              />
              <StatCell
                value={view.total_goals}
                label="G"
                accent={theme.accent}
                divider
              />
              <StatCell
                value={view.motm_count}
                label="MOTM"
                accent={theme.accent}
                divider
              />
              <StatCell
                value={view.dynamic_rating.toFixed(1)}
                label="AVG"
                accent={theme.accent}
              />
            </div>
          </div>

          {/* ── Watermark footer ── */}
          <div className="px-5 pb-4 flex items-center justify-between">
            <span
              className="tabular-nums opacity-30"
              style={{
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                fontSize: 9,
                color: theme.accent,
                letterSpacing: "0.16em",
              }}
            >
              F8 · #{shortId}
            </span>
            <span
              className="uppercase opacity-25"
              style={{
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                fontSize: 9,
                color: theme.accent,
                letterSpacing: "0.22em",
              }}
            >
              FutJueves
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Corner bracket (decorative ID frame) ── */
function CornerBracket({
  corner,
  color,
}: {
  corner: "tl" | "tr" | "bl" | "br"
  color: string
}) {
  const styles: Record<typeof corner, React.CSSProperties> = {
    tl: { top: -6, left: -6, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` },
    tr: { top: -6, right: -6, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` },
    bl: { bottom: -6, left: -6, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` },
    br: { bottom: -6, right: -6, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` },
  }
  return (
    <span
      aria-hidden
      className="absolute h-4 w-4 pointer-events-none"
      style={{
        ...styles[corner],
        borderRadius: 3,
        opacity: 0.75,
      }}
    />
  )
}

/* ── Stat cell ── */
function StatCell({
  value,
  label,
  accent,
  divider,
}: {
  value: number | string
  label: string
  accent: string
  divider?: boolean
}) {
  return (
    <div
      className="relative flex flex-col items-center justify-center px-2 py-3"
      style={{
        borderRight: divider ? `1px solid ${accent}15` : undefined,
      }}
    >
      <span
        className="tabular-nums leading-none"
        style={{
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          fontSize: 18,
          fontWeight: 600,
          color: accent,
          letterSpacing: "-0.04em",
        }}
      >
        {value}
      </span>
      <span
        className="mt-1.5 uppercase opacity-55"
        style={{
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          fontSize: 9,
          color: accent,
          letterSpacing: "0.16em",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </div>
  )
}

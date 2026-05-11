"use client"

import { useRef, useState } from "react"
import type { Player } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Download, Share2, Check, Hand } from "lucide-react"
import { toPng } from "html-to-image"
import { cn } from "@/lib/utils"

interface TeamShareCardProps {
  whiteTeam: Player[]
  blackTeam: Player[]
}

/* ─── Player line — minimal, no rating, with optional GK badge ─── */
function PlayerLine({
  player,
  index,
  variant,
}: {
  player: Player
  index: number
  variant: "white" | "black"
}) {
  const isWhite = variant === "white"
  const isGK = !!player.is_goalkeeper

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md",
        isWhite ? "bg-white/[0.06]" : "bg-black/40"
      )}
    >
      {/* Jersey number */}
      <span
        className="shrink-0 w-6 text-center text-[12px] font-semibold tabular-nums leading-none"
        style={{
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          color: isWhite ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.4)",
          letterSpacing: "-0.04em",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Name */}
      <span
        className={cn(
          "flex-1 truncate text-[14px] font-semibold leading-tight",
          isWhite ? "text-white" : "text-white/85"
        )}
        style={{
          fontFamily: "'Outfit', var(--font-outfit), sans-serif",
          letterSpacing: "-0.005em",
        }}
      >
        {player.name}
      </span>

      {/* GK badge */}
      {isGK && (
        <span
          className="shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-md"
          style={{
            background: "oklch(0.85 0.16 85 / 0.20)",
            border: "1px solid oklch(0.85 0.16 85 / 0.55)",
            boxShadow: "0 0 8px oklch(0.85 0.16 85 / 0.35)",
          }}
          title="Arquero"
        >
          <Hand className="h-3 w-3" style={{ color: "oklch(0.92 0.14 90)" }} />
        </span>
      )}
    </div>
  )
}

export function TeamShareCard({ whiteTeam, blackTeam }: TeamShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  const today = new Date()
  const formattedDate = today
    .toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    .toUpperCase()

  const handleDownload = async () => {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#08100c",
      })
      const link = document.createElement("a")
      link.download = `equipos-${today.toISOString().split("T")[0]}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Error generating image:", error)
    } finally {
      setDownloading(false)
    }
  }

  const handleCopyImage = async () => {
    if (!cardRef.current) return
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#08100c",
      })
      const blob = await (await fetch(dataUrl)).blob()
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Error copying image:", error)
    }
  }

  if (whiteTeam.length === 0 || blackTeam.length === 0) return null

  return (
    <div className="space-y-3">
      {/* ── Shareable card ── */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-2xl p-5"
        style={{
          background:
            "linear-gradient(160deg, #0b1410 0%, #08100c 50%, #060d0a 100%)",
          border: "1px solid oklch(0.78 0.22 145 / 0.25)",
          fontFamily: "'Outfit', var(--font-outfit), sans-serif",
        }}
      >
        {/* Decorative blobs — neon green palette */}
        <div
          className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full"
          style={{
            background: "oklch(0.78 0.22 145 / 0.18)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -right-16 h-44 w-44 rounded-full"
          style={{
            background: "oklch(0.85 0.16 85 / 0.10)",
            filter: "blur(60px)",
          }}
        />

        {/* Header */}
        <div className="relative mb-5 text-center">
          <div
            className="text-[10px] font-bold tracking-[0.22em] uppercase mb-1.5"
            style={{
              color: "oklch(0.78 0.22 145)",
              fontFamily: "'Outfit', var(--font-outfit), sans-serif",
            }}
          >
            {formattedDate} · 20:00
          </div>
          <h2
            className="text-[28px] font-semibold leading-none"
            style={{
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              letterSpacing: "-0.04em",
              background:
                "linear-gradient(180deg, #ffffff 0%, oklch(0.92 0.04 145) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Equipos
          </h2>
          <div className="mt-3 mx-auto flex items-center justify-center gap-2 max-w-[180px]">
            <div
              className="h-px flex-1"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.78 0.22 145 / 0.55), transparent)",
              }}
            />
            <span
              className="h-1 w-1 rounded-full"
              style={{
                background: "oklch(0.78 0.22 145)",
                boxShadow: "0 0 6px oklch(0.78 0.22 145)",
              }}
            />
            <div
              className="h-px flex-1"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.78 0.22 145 / 0.55), transparent)",
              }}
            />
          </div>
        </div>

        {/* Teams grid */}
        <div className="relative grid grid-cols-2 gap-3">
          {/* White team */}
          <div
            className="rounded-xl p-3"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div className="mb-2.5 flex items-center justify-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  background: "white",
                  boxShadow: "0 0 8px rgba(255,255,255,0.6)",
                }}
              />
              <span
                className="text-[11px] font-bold tracking-[0.18em] uppercase"
                style={{
                  fontFamily: "'Outfit', var(--font-outfit), sans-serif",
                  color: "rgba(255,255,255,0.95)",
                }}
              >
                Blanco
              </span>
            </div>
            <div className="space-y-1">
              {whiteTeam.map((p, i) => (
                <PlayerLine key={p.id} player={p} index={i} variant="white" />
              ))}
            </div>
          </div>

          {/* Black team */}
          <div
            className="rounded-xl p-3"
            style={{
              background: "rgba(0,0,0,0.45)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="mb-2.5 flex items-center justify-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  background: "#1a1a1a",
                  outline: "1.5px solid #555",
                  outlineOffset: "1px",
                }}
              />
              <span
                className="text-[11px] font-bold tracking-[0.18em] uppercase"
                style={{
                  fontFamily: "'Outfit', var(--font-outfit), sans-serif",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                Negro
              </span>
            </div>
            <div className="space-y-1">
              {blackTeam.map((p, i) => (
                <PlayerLine key={p.id} player={p} index={i} variant="black" />
              ))}
            </div>
          </div>
        </div>

        {/* Footer watermark */}
        <div className="relative mt-4 flex items-center justify-center gap-1.5">
          <span
            className="h-1 w-1 rounded-full"
            style={{
              background: "oklch(0.78 0.22 145 / 0.55)",
            }}
          />
          <span
            className="text-[9px] font-bold tracking-[0.25em] uppercase"
            style={{
              color: "rgba(255,255,255,0.32)",
              fontFamily: "'Outfit', var(--font-outfit), sans-serif",
            }}
          >
            futjueves · F8
          </span>
          <span
            className="h-1 w-1 rounded-full"
            style={{
              background: "oklch(0.78 0.22 145 / 0.55)",
            }}
          />
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex gap-2">
        <Button
          onClick={handleDownload}
          variant="outline"
          className="flex-1 gap-2 border-primary/30 hover:bg-primary/10"
          disabled={downloading}
        >
          <Download className="h-4 w-4" />
          {downloading ? "Generando..." : "Descargar"}
        </Button>
        <Button
          onClick={handleCopyImage}
          variant="outline"
          className="flex-1 gap-2 border-primary/30 hover:bg-primary/10"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-primary" />
              Copiado
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" />
              Copiar Imagen
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

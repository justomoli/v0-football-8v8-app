"use client"

import { useRef, useState } from "react"
import type { Player } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Download, Share2, Check } from "lucide-react"
import { toPng } from "html-to-image"
import { cn } from "@/lib/utils"

interface TeamShareCardProps {
  whiteTeam: Player[]
  blackTeam: Player[]
}

export function TeamShareCard({ whiteTeam, blackTeam }: TeamShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  const getTeamTotal = (team: Player[]) => {
    return team.reduce((sum, p) => sum + p.dynamic_rating, 0)
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 9) return "from-yellow-400 to-amber-500"
    if (rating >= 8) return "from-emerald-400 to-teal-500"
    if (rating >= 7) return "from-cyan-400 to-blue-500"
    if (rating >= 6) return "from-blue-400 to-indigo-500"
    return "from-slate-400 to-slate-500"
  }

  const today = new Date()
  const formattedDate = today.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })

  const handleDownload = async () => {
    if (!cardRef.current) return
    setDownloading(true)
    
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#0a0a12',
      })
      
      const link = document.createElement('a')
      link.download = `equipos-${today.toISOString().split('T')[0]}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Error generating image:', error)
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
        backgroundColor: '#0a0a12',
      })
      
      const blob = await (await fetch(dataUrl)).blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying image:', error)
    }
  }

  if (whiteTeam.length === 0 || blackTeam.length === 0) return null

  return (
    <div className="space-y-3">
      {/* Shareable Card */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-br from-[#0a0a12] via-[#0f1020] to-[#0a0a12] p-4"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Neon glow effects */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
        
        {/* Header */}
        <div className="relative mb-4 text-center">
          <div className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-400/80">
            {formattedDate}
          </div>
          <h2 className="bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-xl font-bold tracking-tight text-transparent">
            EQUIPOS JUEVES - 20:00hs
          </h2>
          <div className="mt-1 flex items-center justify-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <span className="text-xs font-bold text-cyan-400">SB5</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          </div>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* White Team */}
          <div className="rounded-lg border border-white/20 bg-white/5 p-3">
            <div className="mb-2 flex items-center justify-center gap-2">
              <div className="h-3 w-3 rounded-full bg-white shadow-lg shadow-white/30" />
              <span className="text-sm font-bold text-white">BLANCO</span>
            </div>
            <div className="space-y-1.5">
              {whiteTeam.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-md bg-white/10 px-2 py-1.5"
                >
                  <span className="truncate text-xs font-medium text-white/90">
                    {player.name}
                  </span>
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white shadow-lg",
                      getRatingColor(player.dynamic_rating)
                    )}
                  >
                    {player.dynamic_rating.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 border-t border-white/10 pt-2 text-center">
              <span className="text-xs text-white/60">Total: </span>
              <span className="text-sm font-bold text-white">
                {getTeamTotal(whiteTeam).toFixed(1)}
              </span>
            </div>
          </div>

          {/* Black Team */}
          <div className="rounded-lg border border-zinc-600/30 bg-zinc-900/50 p-3">
            <div className="mb-2 flex items-center justify-center gap-2">
              <div className="h-3 w-3 rounded-full bg-zinc-800 ring-2 ring-zinc-500 shadow-lg" />
              <span className="text-sm font-bold text-zinc-300">NEGRO</span>
            </div>
            <div className="space-y-1.5">
              {blackTeam.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-md bg-zinc-800/50 px-2 py-1.5"
                >
                  <span className="truncate text-xs font-medium text-zinc-300">
                    {player.name}
                  </span>
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white shadow-lg",
                      getRatingColor(player.dynamic_rating)
                    )}
                  >
                    {player.dynamic_rating.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 border-t border-zinc-700/50 pt-2 text-center">
              <span className="text-xs text-zinc-500">Total: </span>
              <span className="text-sm font-bold text-zinc-300">
                {getTeamTotal(blackTeam).toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Balance indicator */}
        <div className="mt-3 flex items-center justify-center gap-2 text-xs">
          <span className="text-cyan-400/80">Diferencia:</span>
          <span className={cn(
            "font-bold",
            Math.abs(getTeamTotal(whiteTeam) - getTeamTotal(blackTeam)) < 2
              ? "text-emerald-400"
              : "text-amber-400"
          )}>
            {Math.abs(getTeamTotal(whiteTeam) - getTeamTotal(blackTeam)).toFixed(1)} pts
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleDownload}
          variant="outline"
          className="flex-1 gap-2 border-cyan-500/30 hover:bg-cyan-500/10"
          disabled={downloading}
        >
          <Download className="h-4 w-4" />
          {downloading ? "Generando..." : "Descargar"}
        </Button>
        <Button
          onClick={handleCopyImage}
          variant="outline"
          className="flex-1 gap-2 border-emerald-500/30 hover:bg-emerald-500/10"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" />
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

"use client"

import { useState, useEffect, useCallback } from "react"
import {
  getPlayers,
  parsePlayersFromText,
  createPlayer,
  addAlias,
  getCurrentMatchSetup,
  setConfirmedPlayers as dbSetConfirmedPlayers,
  getPlayerById,
} from "@/lib/db"
import type { Player, ParsedPlayer } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  ClipboardPaste,
  Users,
  UserPlus,
  Check,
  Star,
  Trash2,
  Tag,
  Loader2,
  RefreshCw,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface WhatsAppParserProps {
  onPlayersConfirmed?: (playerIds: string[]) => void
}

/* ── Rating dot ─────────────────────────────────────── */
function RatingDot({ rating }: { rating: number }) {
  const color =
    rating >= 8 ? "#22c55e" :
    rating >= 6 ? "#06b6d4" :
    rating >= 4 ? "#eab308" :
                  "#ef4444"
  return (
    <span
      className="inline-block h-2 w-2 rounded-full shrink-0"
      style={{ background: color, boxShadow: `0 0 6px ${color}80` }}
    />
  )
}

export function WhatsAppParser({ onPlayersConfirmed }: WhatsAppParserProps) {
  const [rawText, setRawText] = useState("")
  const [parsedPlayers, setParsedPlayers] = useState<ParsedPlayer[]>([])
  const [confirmedPlayerIds, setConfirmedPlayerIds] = useState<string[]>([])
  const [confirmedPlayers, setConfirmedPlayers] = useState<Player[]>([])
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(true)

  const [newPlayerDialog, setNewPlayerDialog] = useState(false)
  const [pendingNewPlayers, setPendingNewPlayers] = useState<ParsedPlayer[]>([])
  const [currentNewPlayer, setCurrentNewPlayer] = useState<{
    name: string; rating: number; createAlias: boolean; originalName: string
  }>({ name: "", rating: 5, createAlias: false, originalName: "" })

  const loadMatchSetup = useCallback(async () => {
    setLoading(true)
    try {
      const setup = await getCurrentMatchSetup()
      if (setup && setup.confirmed_players.length > 0) {
        setConfirmedPlayerIds(setup.confirmed_players)
        const details = await Promise.all(setup.confirmed_players.map(id => getPlayerById(id)))
        setConfirmedPlayers(details.filter((p): p is Player => p !== null))
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadMatchSetup() }, [loadMatchSetup])

  const parseWhatsAppList = async () => {
    if (!rawText.trim()) return
    setProcessing(true)
    try {
      const parsed = await parsePlayersFromText(rawText)
      setParsedPlayers(parsed)
      const existing = parsed.filter(p => !p.isNew)
      const newPlayers = parsed.filter(p => p.isNew)
      const existingIds = existing
        .map(p => p.existingPlayer?.id)
        .filter((id): id is string => id !== undefined)

      if (newPlayers.length > 0) {
        setPendingNewPlayers(newPlayers)
        setCurrentNewPlayer({ name: newPlayers[0].name, rating: 5, createAlias: false, originalName: newPlayers[0].name })
        setNewPlayerDialog(true)
      } else {
        await dbSetConfirmedPlayers(existingIds)
        setConfirmedPlayerIds(existingIds)
        const details = await Promise.all(existingIds.map(id => getPlayerById(id)))
        setConfirmedPlayers(details.filter((p): p is Player => p !== null))
        onPlayersConfirmed?.(existingIds)
      }
    } catch (e) { console.error(e) }
    finally { setProcessing(false) }
  }

  const handleNewPlayerRating = async () => {
    try {
      const newPlayer = await createPlayer(currentNewPlayer.name, currentNewPlayer.rating)
      if (currentNewPlayer.createAlias && currentNewPlayer.originalName !== currentNewPlayer.name)
        await addAlias(newPlayer.id, currentNewPlayer.originalName)

      const remaining = pendingNewPlayers.slice(1)
      setPendingNewPlayers(remaining)

      if (remaining.length > 0) {
        setCurrentNewPlayer({ name: remaining[0].name, rating: 5, createAlias: false, originalName: remaining[0].name })
      } else {
        setNewPlayerDialog(false)
        const allPlayers = await getPlayers()
        const confirmedIds = parsedPlayers
          .map(p => p.existingPlayer
            ? p.existingPlayer.id
            : allPlayers.find(ap => ap.name.toLowerCase() === p.name.toLowerCase())?.id)
          .filter((id): id is string => id !== undefined)

        await dbSetConfirmedPlayers(confirmedIds)
        setConfirmedPlayerIds(confirmedIds)
        const details = await Promise.all(confirmedIds.map(id => getPlayerById(id)))
        setConfirmedPlayers(details.filter((p): p is Player => p !== null))
        onPlayersConfirmed?.(confirmedIds)
      }
    } catch (e) { console.error(e) }
  }

  const removePlayer = async (playerId: string) => {
    const newIds = confirmedPlayerIds.filter(id => id !== playerId)
    setConfirmedPlayerIds(newIds)
    setConfirmedPlayers(prev => prev.filter(p => p.id !== playerId))
    await dbSetConfirmedPlayers(newIds)
    onPlayersConfirmed?.(newIds)
  }

  const clearAll = async () => {
    setConfirmedPlayerIds([])
    setConfirmedPlayers([])
    setRawText("")
    setParsedPlayers([])
    await dbSetConfirmedPlayers([])
    onPlayersConfirmed?.([])
  }

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 flex items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Cargando confirmados…</span>
      </div>
    )
  }

  const lineCount = rawText.split(/[\n,]/).filter(x => x.trim()).length

  return (
    <div className="space-y-5">
      {/* ── Parser card ── */}
      <div className="glass rounded-2xl p-5 anim-fade-up">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, oklch(0.3 0.18 160 / 0.3), oklch(0.2 0.18 160 / 0.2))",
              border: "1px solid oklch(0.75 0.18 160 / 0.3)",
            }}
          >
            <ClipboardPaste className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="eyebrow">Parser WhatsApp</h2>
            <p className="eyebrow-sub mt-1">
              Pegá la lista — reconoce alias automáticamente
            </p>
          </div>
        </div>

        {/* Textarea */}
        <Textarea
          placeholder={"1 Messi\n2 Ronaldo\n3 Neymar\n…"}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className={cn(
            "min-h-[110px] resize-none font-mono text-sm bg-black/20 border-border/30",
            "focus-visible:border-primary/50 focus-visible:ring-primary/20 transition-all duration-200",
            "placeholder:text-muted-foreground/40"
          )}
        />

        {/* Button */}
        <Button
          onClick={parseWhatsAppList}
          className={cn(
            "mt-3 w-full gap-2 font-bold transition-all duration-200",
            "shadow-[0_0_0px_oklch(0.75_0.18_160/0)] hover:shadow-[0_0_20px_oklch(0.75_0.18_160/0.35)]",
            "active:scale-[0.97]"
          )}
          disabled={!rawText.trim() || processing}
        >
          {processing ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Procesando…</>
          ) : (
            <><Zap className="h-4 w-4" /> Procesar {lineCount > 0 ? `(${lineCount} nombres)` : "Lista"}</>
          )}
        </Button>
      </div>

      {/* ── Confirmed players ── */}
      {confirmedPlayers.length > 0 && (
        <div className="glass rounded-2xl p-5 anim-fade-up delay-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              <h2 className="eyebrow">Confirmados</h2>
            </div>
            <div className="flex items-center gap-2">
              {/* Progress pill */}
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                  confirmedPlayers.length >= 16
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-secondary/60 text-muted-foreground border border-border/30"
                )}
              >
                <Users className="h-3 w-3" />
                {confirmedPlayers.length}/16
              </div>
              <button
                onClick={clearAll}
                className="h-7 w-7 rounded-lg flex items-center justify-center
                  text-muted-foreground hover:text-destructive hover:bg-destructive/10
                  border border-border/30 transition-all duration-200"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, (confirmedPlayers.length / 16) * 100)}%`,
                background: "linear-gradient(90deg, oklch(0.75 0.18 160), oklch(0.75 0.18 160 / 0.6))",
                boxShadow: "0 0 10px oklch(0.75 0.18 160 / 0.4)",
              }}
            />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 gap-2">
            {confirmedPlayers.map((player, index) => {
              const r = player.dynamic_rating
              const tier =
                r >= 8 ? "oklch(0.78 0.18 145)" :
                r >= 6 ? "oklch(0.78 0.15 195)" :
                r >= 4 ? "oklch(0.85 0.16 85)"  :
                         "oklch(0.7 0.2 25)"
              return (
                <div
                  key={player.id}
                  className={cn(
                    "group relative overflow-hidden rounded-xl",
                    "bg-gradient-to-br from-white/[0.05] to-white/[0.02]",
                    "border border-white/[0.08] hover:border-primary/25",
                    "transition-all duration-200 anim-slide-right",
                    "hover:translate-x-[1px]"
                  )}
                  style={{ animationDelay: `${index * 0.04}s` }}
                >
                  {/* Vertical tier stripe */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[3px]"
                    style={{
                      background: tier,
                      boxShadow: `0 0 10px ${tier}A0, inset 0 0 4px ${tier}`,
                    }}
                  />

                  <div className="flex items-center gap-2.5 pl-3.5 pr-2.5 py-2">
                    {/* Initial avatar */}
                    <div
                      className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center text-[13px] font-semibold"
                      style={{
                        fontFamily: "var(--font-sans), system-ui, sans-serif",
                        background: `linear-gradient(135deg, ${tier}26 0%, ${tier}08 100%)`,
                        border: `1px solid ${tier}40`,
                        color: tier,
                        textShadow: `0 0 8px ${tier}80`,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Jersey + name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1 leading-none mb-0.5">
                        <span
                          className="text-[9px] font-medium text-muted-foreground/40 tabular-nums"
                          style={{
                            fontFamily: "var(--font-mono), ui-monospace, monospace",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="text-[14px] font-medium truncate leading-tight tracking-tight">
                        {player.name}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className="text-[15px] font-semibold tabular-nums"
                        style={{
                          fontFamily: "var(--font-mono), ui-monospace, monospace",
                          color: tier,
                          textShadow: `0 0 8px ${tier}60`,
                          letterSpacing: "-0.04em",
                        }}
                      >
                        {r.toFixed(1)}
                      </span>
                      <button
                        onClick={() => removePlayer(player.id)}
                        className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Faltan */}
          {confirmedPlayers.length < 16 && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Faltan{" "}
              <span className="font-bold text-foreground">
                {16 - confirmedPlayers.length}
              </span>{" "}
              jugadores para completar los equipos
            </p>
          )}
        </div>
      )}

      {/* ── New player dialog ── */}
      <Dialog open={newPlayerDialog} onOpenChange={setNewPlayerDialog}>
        <DialogContent className="glass-strong border-primary/20 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Jugador Nuevo Detectado
            </DialogTitle>
            <DialogDescription>
              &quot;{currentNewPlayer.originalName}&quot; no está en la base de datos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 p-4">
              <span className="font-black text-lg" style={{ fontFamily: "var(--font-syne, Syne, sans-serif)" }}>
                {currentNewPlayer.originalName}
              </span>
              <span className="text-xs font-semibold bg-secondary/60 rounded-full px-3 py-1 text-muted-foreground">
                {pendingNewPlayers.length} pendiente{pendingNewPlayers.length !== 1 && "s"}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Nombre a guardar</label>
              <Input
                value={currentNewPlayer.name}
                onChange={(e) => {
                  const n = e.target.value
                  setCurrentNewPlayer(prev => ({ ...prev, name: n, createAlias: n !== prev.originalName }))
                }}
                className="bg-secondary/40 border-border/40 focus-visible:border-primary/50"
                placeholder="Nombre completo…"
              />
              {currentNewPlayer.name !== currentNewPlayer.originalName && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Tag className="h-3 w-3 text-primary" />
                  Alias: &quot;{currentNewPlayer.originalName}&quot; → &quot;{currentNewPlayer.name}&quot;
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">Puntaje inicial</label>
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  <span
                    className="font-black text-primary text-lg w-8 text-center"
                    style={{ fontFamily: "var(--font-syne, Syne, sans-serif)" }}
                  >
                    {currentNewPlayer.rating}
                  </span>
                </div>
              </div>
              <Slider
                value={[currentNewPlayer.rating]}
                onValueChange={([v]) => setCurrentNewPlayer(prev => ({ ...prev, rating: v }))}
                min={1} max={10} step={0.5}
                className="[&_[role=slider]]:shadow-[0_0_12px_oklch(0.75_0.18_160/0.6)]"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Principiante</span>
                <span>Intermedio</span>
                <span>Crack ⚡</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleNewPlayerRating}
              className="w-full font-bold gap-2 shadow-[0_0_20px_oklch(0.75_0.18_160/0.3)]"
            >
              <UserPlus className="h-4 w-4" />
              {pendingNewPlayers.length > 1 ? "Siguiente Jugador →" : "Confirmar y Continuar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

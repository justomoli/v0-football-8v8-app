"use client"

import { useState, useEffect, useCallback } from "react"
import {
  parsePlayersFromText,
  createPlayer,
  findPlayerByNameOrAlias,
  getCurrentMatchSetup,
  setConfirmedPlayers as dbSetConfirmedPlayers,
  getPlayerById,
} from "@/lib/db"
import type { Player, ParsedPlayer } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertCircle,
  ClipboardPaste,
  Users,
  Check,
  Trash2,
  RefreshCw,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LoadingState, Spinner } from "@/components/ui/spinner"

interface WhatsAppParserProps {
  onPlayersConfirmed?: (playerIds: string[]) => void
}

const PROCESSING_STEPS = ["Leyendo mensaje", "Reconociendo nombres", "Guardando jugadores"]

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural
}

function estimateInputNames(text: string) {
  return text
    .split(/[\n,;]/)
    .map((line) =>
      line
        .trim()
        .replace(/^(confirmados?|lista|jugadores|anotados|convocados)\s*:\s*/i, "")
        .replace(/^[\s>*_~`-]+/g, "")
        .replace(/^\d+\s*[\.\-\)\:]?\s*/g, "")
        .replace(/^[•·◦▪▫✅☑✔➕➖-]\s*/gu, "")
        .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, " ")
        .replace(/\s*\([^)]*\)\s*$/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((line) => {
      const key = line
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
      return key && !/\b(fut|futbol|jueves|hora|hs|20)\b/.test(key)
    }).length
}

export function WhatsAppParser({ onPlayersConfirmed }: WhatsAppParserProps) {
  const [rawText, setRawText] = useState("")
  const [parsedPlayers, setParsedPlayers] = useState<ParsedPlayer[]>([])
  const [confirmedPlayerIds, setConfirmedPlayerIds] = useState<string[]>([])
  const [confirmedPlayers, setConfirmedPlayers] = useState<Player[]>([])
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [parserError, setParserError] = useState<string | null>(null)

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

  const resolveParsedPlayer = async (parsed: ParsedPlayer): Promise<Player> => {
    if (parsed.existingPlayer) return parsed.existingPlayer

    try {
      return await createPlayer(parsed.name, parsed.suggestedRating ?? 5)
    } catch (error) {
      // Another client may have created it between parse and insert.
      const recovered = await findPlayerByNameOrAlias(parsed.name)
      if (recovered.player) return recovered.player
      throw error
    }
  }

  const parseWhatsAppList = async () => {
    if (!rawText.trim()) return
    setProcessing(true)
    setParserError(null)
    try {
      const parsed = await parsePlayersFromText(rawText)
      setParsedPlayers(parsed)

      if (parsed.length === 0) {
        await dbSetConfirmedPlayers([])
        setConfirmedPlayerIds([])
        setConfirmedPlayers([])
        onPlayersConfirmed?.([])
        setParserError("No encontré nombres válidos en esa lista.")
        return
      }

      const resolvedPlayers = await Promise.all(parsed.map(resolveParsedPlayer))
      const uniquePlayers = resolvedPlayers.filter((player, index, list) =>
        list.findIndex((p) => p.id === player.id) === index,
      )
      const confirmedIds = uniquePlayers.map((player) => player.id)

      await dbSetConfirmedPlayers(confirmedIds)
      setConfirmedPlayerIds(confirmedIds)
      setConfirmedPlayers(uniquePlayers)
      onPlayersConfirmed?.(confirmedIds)
    } catch (e) {
      console.error(e)
      setParserError("No pude procesar la lista. Revisá los nombres y probá de nuevo.")
    } finally {
      setProcessing(false)
    }
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
    return <LoadingState message="Cargando confirmados" />
  }

  const lineCount = estimateInputNames(rawText)
  const createdCount = parsedPlayers.filter((p) => p.isNew).length
  const recognizedCount = parsedPlayers.length - createdCount

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
          placeholder={"1) kriko ✅\n2) justo\n3) nuevo pibe\n…"}
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value)
            setParsedPlayers([])
            setParserError(null)
          }}
          className={cn(
            "min-h-[110px] resize-none font-mono text-sm bg-black/20 border-border/30",
            "focus-visible:border-primary/50 focus-visible:ring-primary/20 transition-all duration-200",
            "placeholder:text-muted-foreground/40"
          )}
        />

        {processing && (
          <div
            className="parser-processing mt-3 overflow-hidden rounded-2xl border border-primary/20 bg-black/25 p-3"
            aria-live="polite"
          >
            <div className="parser-processing-scan" />
            <div className="relative flex items-center justify-between gap-3">
              {PROCESSING_STEPS.map((step, index) => (
                <div key={step} className="parser-processing-step flex min-w-0 flex-1 items-center gap-2">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-primary/25 bg-primary/10 text-[10px] font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="truncate text-[11px] font-semibold text-white/75">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {parserError && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{parserError}</p>
          </div>
        )}

        {!processing && parsedPlayers.length > 0 && !parserError && (
          <div className="mt-3 rounded-2xl border border-primary/15 bg-primary/10 px-3 py-2 text-xs text-primary/90">
            Lista procesada: {parsedPlayers.length} {pluralize(parsedPlayers.length, "jugador", "jugadores")}
            {recognizedCount > 0 && `, ${recognizedCount} ${pluralize(recognizedCount, "reconocido")}`}
            {createdCount > 0 && `, ${createdCount} ${pluralize(createdCount, "nuevo")} ${pluralize(createdCount, "guardado")} con media 5`}
            .
          </div>
        )}

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
            <><Spinner className="h-4 w-4" /> Procesando lista…</>
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
    </div>
  )
}

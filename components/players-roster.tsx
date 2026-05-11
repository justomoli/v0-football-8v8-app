"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Award,
  Edit,
  Hand,
  Search,
  Sparkles,
  Star,
  Tag,
  Target,
  Trophy,
  UserRound,
  X,
  Zap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { PlayerFifaCard } from "@/components/player-fifa-card"
import { LoadingState, Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/lib/auth-context"
import { attributeToTen } from "@/lib/player-stats-ten-scale"
import { addAlias, deleteAlias, getAliasesByPlayerId, getPlayers, updatePlayer } from "@/lib/db"
import type { Player, PlayerAlias, PlayerPosition } from "@/lib/types"
import { cn } from "@/lib/utils"

const POSITIONS: PlayerPosition[] = ["GK", "DEF", "MID", "FWD"]
const ATTRIBUTE_FIELDS = [
  ["pace", "Ritmo"],
  ["shot", "Tiro"],
  ["passing", "Pase"],
  ["dribbling", "Regate"],
  ["defense", "Defensa"],
  ["physique", "Físico"],
] as const

function ratingTone(rating: number) {
  if (rating >= 9) return "oklch(0.85 0.18 80)"
  if (rating >= 8) return "oklch(0.78 0.22 145)"
  if (rating >= 7) return "oklch(0.78 0.15 195)"
  if (rating >= 5) return "oklch(0.85 0.16 85)"
  return "oklch(0.7 0.04 270)"
}

function withAlpha(color: string, alpha: number) {
  return color.replace(")", ` / ${alpha})`)
}

function toOptionalNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && value.trim() ? parsed : null
}

function RosterStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string | number
}) {
  return (
    <div className="glass rounded-2xl p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30">
      <Icon className="mb-2.5 h-4 w-4 text-primary drop-shadow-[0_0_10px_oklch(0.75_0.18_160/0.45)]" />
      <p className="display-num text-[22px] leading-none text-white">{value}</p>
      <p className="meta-label mt-1.5">
        {label}
      </p>
    </div>
  )
}

export function PlayersRoster() {
  const { player: currentPlayer } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [aliases, setAliases] = useState<PlayerAlias[]>([])
  const [newAlias, setNewAlias] = useState("")
  const [saving, setSaving] = useState(false)

  const loadPlayers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPlayers()
      setPlayers(data)
    } catch (error) {
      console.error("Failed to load players:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlayers()
  }, [loadPlayers])

  const filteredPlayers = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return players
      .filter((p) => {
        if (!needle) return true
        return [p.name, p.nickname, p.position].filter(Boolean).some((value) =>
          String(value).toLowerCase().includes(needle),
        )
      })
      .sort((a, b) => b.dynamic_rating - a.dynamic_rating || a.name.localeCompare(b.name))
  }, [players, query])

  const totals = useMemo(() => {
    const totalGoals = players.reduce((sum, p) => sum + p.total_goals, 0)
    const totalMatches = players.reduce((sum, p) => sum + p.total_matches, 0)
    const avgRating = players.length
      ? players.reduce((sum, p) => sum + p.dynamic_rating, 0) / players.length
      : 0
    return {
      totalGoals,
      totalMatches,
      avgRating: avgRating.toFixed(1),
    }
  }, [players])

  const startEdit = async (p: Player) => {
    setEditingPlayer({ ...p })
    setNewAlias("")
    try {
      setAliases(await getAliasesByPlayerId(p.id))
    } catch (error) {
      console.error("Failed to load aliases:", error)
      setAliases([])
    }
  }

  const savePlayer = async () => {
    if (!editingPlayer) return
    setSaving(true)
    try {
      const updated = await updatePlayer(editingPlayer.id, {
        name: editingPlayer.name,
        nickname: editingPlayer.nickname || null,
        photo_url: editingPlayer.photo_url || null,
        position: editingPlayer.position || null,
        height_cm: editingPlayer.height_cm ?? null,
        weight_kg: editingPlayer.weight_kg ?? null,
        dynamic_rating: editingPlayer.dynamic_rating,
        is_goalkeeper: editingPlayer.is_goalkeeper ?? false,
        pace: editingPlayer.pace ?? null,
        shot: editingPlayer.shot ?? null,
        passing: editingPlayer.passing ?? null,
        dribbling: editingPlayer.dribbling ?? null,
        defense: editingPlayer.defense ?? null,
        physique: editingPlayer.physique ?? null,
      })
      setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setSelectedPlayer((prev) => (prev?.id === updated.id ? updated : prev))
      setEditingPlayer(null)
    } catch (error) {
      console.error("Failed to save player:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddAlias = async () => {
    if (!editingPlayer || !newAlias.trim()) return
    try {
      await addAlias(editingPlayer.id, newAlias)
      setAliases(await getAliasesByPlayerId(editingPlayer.id))
      setNewAlias("")
    } catch (error) {
      console.error("Failed to add alias:", error)
    }
  }

  const handleDeleteAlias = async (aliasId: string) => {
    if (!editingPlayer) return
    try {
      await deleteAlias(aliasId)
      setAliases(await getAliasesByPlayerId(editingPlayer.id))
    } catch (error) {
      console.error("Failed to delete alias:", error)
    }
  }

  if (loading) return <LoadingState message="Cargando plantel" />

  return (
    <div className="space-y-5">
      <section className="glass-strong relative overflow-hidden rounded-[1.75rem] p-5 anim-fade-up neon-border">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-primary/45 to-transparent" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow">Plantel</p>
            <h2 className="mt-2 font-display text-[28px] font-extrabold leading-none tracking-[-0.06em]">
              Jugadores cargados
            </h2>
            <p className="eyebrow-sub mt-2 max-w-[16rem]">
              Estadísticas, edición de atributos y cartas del plantel.
            </p>
          </div>
          <div className="glass grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-primary/25">
            <UserRound className="h-5 w-5 text-primary" />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2.5">
        <RosterStat icon={UserRound} label="Jugadores" value={players.length} />
        <RosterStat icon={Target} label="Goles" value={totals.totalGoals} />
        <RosterStat icon={Star} label="Media" value={totals.avgRating} />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar jugador, apodo o posición..."
          className="glass h-12 rounded-2xl border-white/[0.1] bg-white/[0.045] pl-11 text-[15px] shadow-none placeholder:text-muted-foreground/65 focus-visible:border-primary/40 focus-visible:ring-primary/30"
        />
      </div>

      <div className="space-y-3">
        {filteredPlayers.map((p, index) => {
          const tone = ratingTone(p.dynamic_rating)
          const position = p.position ?? (p.is_goalkeeper ? "GK" : "MID")
          return (
            <article
              key={p.id}
              className="glass group relative overflow-hidden rounded-[1.35rem] p-4 anim-slide-right transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_54px_oklch(0_0_0/0.58)]"
              style={{ animationDelay: `${index * 0.035}s` }}
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" style={{ background: withAlpha(tone, 0.22) }} />
              <div
                className="absolute left-0 top-0 h-full w-1"
                style={{ background: tone, boxShadow: `0 0 16px ${tone}` }}
              />
              <div className="flex items-center gap-3 pl-1">
                <button
                  type="button"
                  onClick={() => setSelectedPlayer(p)}
                  className="relative h-16 w-16 shrink-0 rounded-2xl border border-white/[0.12] bg-black/35 text-left transition-transform duration-300 group-hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  style={{ boxShadow: `0 0 24px ${withAlpha(tone, 0.15)}` }}
                >
                  <span
                    className="display-num absolute left-2 top-2 text-[20px] leading-none"
                    style={{ color: tone, fontFamily: "var(--font-mono), ui-monospace, monospace" }}
                  >
                    {Math.round(p.dynamic_rating * 10)}
                  </span>
                  <span className="meta-label absolute bottom-2 right-2 text-white/55">
                    {position}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlayer(p)}
                  className="min-w-0 flex-1 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[16px] font-bold leading-tight tracking-[-0.03em]">{p.name}</h3>
                    {p.id === currentPlayer?.id && (
                      <Badge variant="outline" className="border-primary/35 text-primary">
                        Vos
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {p.nickname && (
                      <Badge variant="secondary" className="border border-white/[0.08] bg-white/[0.07] text-white/70">
                        {p.nickname}
                      </Badge>
                    )}
                    {p.is_goalkeeper && (
                      <Badge variant="outline" className="border-amber-400/45 text-amber-300">
                        <Hand className="mr-1 h-3 w-3" />
                        Arquero
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2.5 flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {p.total_matches} PJ
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {p.total_goals} G
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="h-3 w-3 text-amber-400/70" />
                      {p.motm_count} MOTM
                    </span>
                  </div>
                </button>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className="display-num rounded-xl px-2.5 py-1 text-[13px]"
                    style={{
                      color: tone,
                      background: withAlpha(tone, 0.12),
                      border: `1px solid ${withAlpha(tone, 0.25)}`,
                    }}
                  >
                    {p.dynamic_rating.toFixed(1)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-white/10 hover:text-white"
                    onClick={() => startEdit(p)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="glass rounded-[1.35rem] p-8 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-primary/55" />
          <p className="text-sm text-muted-foreground">No hay jugadores para ese filtro.</p>
        </div>
      )}

      <PlayerFifaCard
        player={selectedPlayer}
        open={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        onPlayerUpdated={(upd) => {
          setPlayers((prev) => prev.map((row) => (row.id === upd.id ? upd : row)))
          setSelectedPlayer((prev) => (prev?.id === upd.id ? upd : prev))
        }}
      />

      <Dialog open={!!editingPlayer} onOpenChange={(open) => !open && setEditingPlayer(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto glass-strong border-border/25">
          <DialogHeader>
            <DialogTitle>Editar jugador</DialogTitle>
            <DialogDescription>
              Datos visibles en el plantel y estadísticas.
            </DialogDescription>
          </DialogHeader>

          {editingPlayer && (
            <div className="space-y-5 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={editingPlayer.name}
                    onChange={(event) =>
                      setEditingPlayer({ ...editingPlayer, name: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Apodo</Label>
                  <Input
                    value={editingPlayer.nickname ?? ""}
                    onChange={(event) =>
                      setEditingPlayer({ ...editingPlayer, nickname: event.target.value })
                    }
                    placeholder="Ej: El Mago"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Posicion</Label>
                  <Select
                    value={editingPlayer.position ?? ""}
                    onValueChange={(value) =>
                      setEditingPlayer({ ...editingPlayer, position: value as PlayerPosition })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Elegir" />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map((position) => (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Altura (cm)</Label>
                  <Input
                    inputMode="numeric"
                    value={editingPlayer.height_cm ?? ""}
                    onChange={(event) =>
                      setEditingPlayer({
                        ...editingPlayer,
                        height_cm: toOptionalNumber(event.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Peso (kg)</Label>
                  <Input
                    inputMode="numeric"
                    value={editingPlayer.weight_kg ?? ""}
                    onChange={(event) =>
                      setEditingPlayer({
                        ...editingPlayer,
                        weight_kg: toOptionalNumber(event.target.value),
                      })
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Foto URL</Label>
                  <Input
                    value={editingPlayer.photo_url ?? ""}
                    onChange={(event) =>
                      setEditingPlayer({ ...editingPlayer, photo_url: event.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
                <Label>Rating general: {editingPlayer.dynamic_rating.toFixed(1)}</Label>
                <Slider
                  value={[editingPlayer.dynamic_rating]}
                  onValueChange={([value]) =>
                    setEditingPlayer({ ...editingPlayer, dynamic_rating: value })
                  }
                  min={1}
                  max={10}
                  step={0.5}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {ATTRIBUTE_FIELDS.map(([field, label]) => {
                  const value = attributeToTen(
                    editingPlayer[field],
                    editingPlayer.dynamic_rating,
                  )
                  return (
                    <div key={field} className="space-y-2 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3">
                      <Label className="flex items-center justify-between">
                        <span>{label}</span>
                        <span className="font-mono text-primary">{value.toFixed(1)}</span>
                      </Label>
                      <Slider
                        value={[value]}
                        onValueChange={([next]) =>
                          setEditingPlayer({ ...editingPlayer, [field]: next })
                        }
                        min={1}
                        max={10}
                        step={0.5}
                      />
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="roster-gk"
                    checked={!!editingPlayer.is_goalkeeper}
                    onCheckedChange={(checked) =>
                      setEditingPlayer({ ...editingPlayer, is_goalkeeper: checked })
                    }
                  />
                  <Label htmlFor="roster-gk">Arquero</Label>
                </div>
              </div>

              <div className="space-y-3 border-t border-border/30 pt-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <Label>Alias para WhatsApp</Label>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newAlias}
                    onChange={(event) => setNewAlias(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && handleAddAlias()}
                    placeholder="Nuevo alias..."
                  />
                  <Button size="icon" onClick={handleAddAlias} disabled={!newAlias.trim()}>
                    <Zap className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aliases.map((alias) => (
                    <Badge key={alias.id} variant="secondary" className="gap-1">
                      {alias.alias}
                      <button
                        type="button"
                        onClick={() => handleDeleteAlias(alias.id)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {aliases.length === 0 && (
                    <span className="text-xs text-muted-foreground">Sin alias configurados</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlayer(null)}>
              Cancelar
            </Button>
            <Button onClick={savePlayer} disabled={saving || !editingPlayer?.name.trim()}>
              {saving ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

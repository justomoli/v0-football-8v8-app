"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  getPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
  getAliasesByPlayerId,
  addAlias,
  deleteAlias,
} from "@/lib/db"
import type { Player, PlayerAlias } from "@/lib/types"
import { tierColor } from "@/lib/rating-tier"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Settings,
  UserPlus,
  Trash2,
  Pencil,
  Tag,
  Plus,
  X,
  RefreshCw,
  Users,
  Hand,
  LogOut,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

export function AdminPanel() {
  const { player, logout } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [aliases, setAliases] = useState<PlayerAlias[]>([])
  const [newAlias, setNewAlias] = useState("")
  const [isAddingPlayer, setIsAddingPlayer] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState("")
  const [newPlayerRating, setNewPlayerRating] = useState(5)
  const [searchQuery, setSearchQuery] = useState("")

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

  const loadAliases = async (playerId: string) => {
    try {
      const data = await getAliasesByPlayerId(playerId)
      setAliases(data)
    } catch (error) {
      console.error("Failed to load aliases:", error)
    }
  }

  const handleEditPlayer = async (p: Player) => {
    setEditingPlayer(p)
    await loadAliases(p.id)
  }

  const handleSavePlayer = async () => {
    if (!editingPlayer) return
    try {
      await updatePlayer(editingPlayer.id, {
        name: editingPlayer.name,
        dynamic_rating: editingPlayer.dynamic_rating,
        is_goalkeeper: editingPlayer.is_goalkeeper ?? false,
      })
      await loadPlayers()
      setEditingPlayer(null)
    } catch (error) {
      console.error("Failed to save player:", error)
    }
  }

  const handleDeletePlayer = async (id: string) => {
    try {
      await deletePlayer(id)
      await loadPlayers()
    } catch (error) {
      console.error("Failed to delete player:", error)
    }
  }

  const handleAddAlias = async () => {
    if (!editingPlayer || !newAlias.trim()) return
    try {
      await addAlias(editingPlayer.id, newAlias)
      await loadAliases(editingPlayer.id)
      setNewAlias("")
    } catch (error) {
      console.error("Failed to add alias:", error)
    }
  }

  const handleDeleteAlias = async (aliasId: string) => {
    try {
      await deleteAlias(aliasId)
      if (editingPlayer) {
        await loadAliases(editingPlayer.id)
      }
    } catch (error) {
      console.error("Failed to delete alias:", error)
    }
  }

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return
    try {
      await createPlayer(newPlayerName, newPlayerRating)
      await loadPlayers()
      setIsAddingPlayer(false)
      setNewPlayerName("")
      setNewPlayerRating(5)
    } catch (error) {
      console.error("Failed to add player:", error)
    }
  }

  /* ── Derived stats ── */
  const totalPlayers = players.length
  const totalGks = players.filter((p) => p.is_goalkeeper).length
  const avgRating =
    totalPlayers > 0
      ? players.reduce((sum, p) => sum + p.dynamic_rating, 0) / totalPlayers
      : 0
  const totalMatches = players.reduce((sum, p) => sum + p.total_matches, 0)

  const filteredPlayers = players
    .filter((p) =>
      searchQuery
        ? p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
        : true
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-5">
      {/* ── Section header ── */}
      <div className="glass rounded-2xl p-5 anim-fade-up">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, oklch(0.30 0.10 70 / 0.35), oklch(0.18 0.05 60 / 0.25))",
              border: "1px solid oklch(0.85 0.18 80 / 0.35)",
              boxShadow: "0 0 18px oklch(0.85 0.18 80 / 0.18)",
            }}
          >
            <Settings className="h-4 w-4 text-amber-300" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h2 className="eyebrow mb-1.5">Ajustes</h2>
            <p className="eyebrow-sub">
              Gestión de jugadores, alias y sesión.
            </p>
          </div>
        </div>

        {/* Quick stats — 3 cells */}
        <div className="grid grid-cols-3 gap-2">
          <StatCell label="Jugadores" value={totalPlayers} accent="oklch(0.78 0.22 145)" />
          <StatCell label="Arqueros" value={totalGks} accent="oklch(0.85 0.16 85)" />
          <StatCell label="Avg rating" value={avgRating.toFixed(1)} accent="oklch(0.78 0.15 195)" />
        </div>
      </div>

      {/* ── Players section ── */}
      <div className="glass rounded-2xl p-5 anim-fade-up delay-1">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <Users className="h-3.5 w-3.5 text-primary" />
            <h3 className="eyebrow">Jugadores</h3>
            <span
              className="text-[11px] tabular-nums opacity-55"
              style={{
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                letterSpacing: "0.04em",
              }}
            >
              {filteredPlayers.length}/{totalPlayers}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={loadPlayers}
              disabled={loading}
              aria-label="Refrescar"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-white/[0.03] hover:bg-white/[0.08] text-muted-foreground/70 hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </button>
            <Dialog open={isAddingPlayer} onOpenChange={setIsAddingPlayer}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1 text-[12px] font-semibold">
                  <UserPlus className="h-3.5 w-3.5" />
                  Nuevo
                </Button>
              </DialogTrigger>
              <DialogContent
                className="glass-strong border-border/30 sm:max-w-md p-5"
                aria-describedby={undefined}
              >
                <DialogHeader className="text-left">
                  <DialogTitle className="font-display text-[20px] font-extrabold tracking-tight">
                    Nuevo jugador
                  </DialogTitle>
                  <DialogDescription className="eyebrow-sub mt-1">
                    Nombre y puntaje inicial. Después podés editar todo.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-name" className="eyebrow text-[10px]">
                      Nombre
                    </Label>
                    <Input
                      id="new-name"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Ej: Juan Perez"
                      className="h-11 rounded-xl border-white/[0.1] bg-black/30"
                      onKeyDown={(e) =>
                        e.key === "Enter" && newPlayerName.trim() && handleAddPlayer()
                      }
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="eyebrow text-[10px]">
                        Puntaje inicial
                      </Label>
                      <span
                        className="tabular-nums text-[16px] font-semibold"
                        style={{
                          fontFamily: "var(--font-mono), ui-monospace, monospace",
                          color: tierColor(newPlayerRating),
                          letterSpacing: "-0.04em",
                          textShadow: `0 0 8px ${tierColor(newPlayerRating)}55`,
                        }}
                      >
                        {newPlayerRating.toFixed(1)}
                      </span>
                    </div>
                    <Slider
                      value={[newPlayerRating]}
                      onValueChange={([v]) => setNewPlayerRating(v)}
                      min={1}
                      max={10}
                      step={0.5}
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingPlayer(false)}
                    className="rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddPlayer}
                    disabled={!newPlayerName.trim()}
                    className="rounded-xl gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Crear
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        {totalPlayers > 6 && (
          <div className="mb-3">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar jugador…"
              className="h-9 rounded-xl border-white/[0.08] bg-black/25 text-[13px] placeholder:text-muted-foreground/45"
            />
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-6 w-6 text-primary" />
          </div>
        ) : filteredPlayers.length === 0 ? (
          <p className="text-center text-[13px] text-muted-foreground/65 py-6">
            {searchQuery ? "Sin coincidencias." : "No hay jugadores cargados."}
          </p>
        ) : (
          <div className="space-y-1.5">
            {filteredPlayers.map((p, i) => {
              const tier = tierColor(p.dynamic_rating)
              const isYou = p.id === player?.id
              return (
                <div
                  key={p.id}
                  className={cn(
                    "group relative overflow-hidden rounded-xl",
                    "transition-all duration-200 hover:translate-x-[1px]",
                    "border",
                    isYou
                      ? "bg-primary/[0.08] border-primary/30"
                      : "bg-white/[0.025] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.10]"
                  )}
                  style={{ animationDelay: `${i * 0.02}s` }}
                >
                  {/* Tier stripe */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[3px]"
                    style={{
                      background: tier,
                      boxShadow: `0 0 8px ${tier}90`,
                    }}
                  />

                  <div className="flex items-center gap-2.5 pl-3 pr-2 py-2">
                    {/* Rating */}
                    <div
                      className="shrink-0 h-9 w-9 rounded-lg flex items-center justify-center tabular-nums"
                      style={{
                        background: `linear-gradient(135deg, ${tier}25, ${tier}08)`,
                        border: `1px solid ${tier}35`,
                        color: tier,
                        fontFamily: "var(--font-mono), ui-monospace, monospace",
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: "-0.04em",
                        textShadow: `0 0 6px ${tier}50`,
                      }}
                    >
                      {p.dynamic_rating.toFixed(1)}
                    </div>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 leading-tight">
                        <span className="text-[14px] font-semibold truncate tracking-tight">
                          {p.name}
                        </span>
                        {p.is_goalkeeper && (
                          <Hand
                            className="h-3 w-3 shrink-0"
                            style={{ color: "oklch(0.92 0.14 90)" }}
                          />
                        )}
                        {isYou && (
                          <span
                            className="ml-0.5 px-1.5 py-px rounded-md text-[8px] uppercase"
                            style={{
                              background: "oklch(0.78 0.22 145 / 0.18)",
                              border: "1px solid oklch(0.78 0.22 145 / 0.35)",
                              color: "oklch(0.85 0.22 145)",
                              fontFamily: "var(--font-mono), ui-monospace, monospace",
                              letterSpacing: "0.14em",
                              fontWeight: 500,
                            }}
                          >
                            Vos
                          </span>
                        )}
                      </div>
                      <p
                        className="mt-0.5 text-[10px] text-muted-foreground/65 truncate"
                        style={{
                          fontFamily: "var(--font-mono), ui-monospace, monospace",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {p.total_matches} PJ · {p.total_goals} G · {p.motm_count} MOTM
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditPlayer(p)}
                        aria-label="Editar"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/55 hover:text-foreground hover:bg-white/[0.06] transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            type="button"
                            aria-label="Eliminar"
                            disabled={isYou}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/55 hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-muted-foreground/55"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass-strong border-border/30">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-display text-[18px] font-extrabold tracking-tight">
                              Eliminar jugador
                            </AlertDialogTitle>
                            <AlertDialogDescription className="eyebrow-sub">
                              ¿Eliminar a <strong className="text-foreground/95">{p.name}</strong>? Esta acción borra también sus stats. No se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeletePlayer(p.id)}
                              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/85"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer summary */}
        {!loading && filteredPlayers.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-muted-foreground/55">
            <span
              style={{
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                letterSpacing: "0.1em",
              }}
              className="uppercase"
            >
              {totalMatches} partidos totales registrados
            </span>
            <Sparkles className="h-3 w-3 opacity-40" />
          </div>
        )}
      </div>

      {/* ── Edit player dialog ── */}
      <Dialog
        open={!!editingPlayer}
        onOpenChange={(open) => !open && setEditingPlayer(null)}
      >
        <DialogContent
          className="glass-strong border-border/30 sm:max-w-md p-5"
          aria-describedby={undefined}
        >
          <DialogHeader className="text-left">
            <DialogTitle className="font-display text-[20px] font-extrabold tracking-tight">
              Editar jugador
            </DialogTitle>
            <DialogDescription className="eyebrow-sub mt-1">
              Modificá nombre, rating, GK y alias.
            </DialogDescription>
          </DialogHeader>
          {editingPlayer && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="eyebrow text-[10px]">
                  Nombre
                </Label>
                <Input
                  id="edit-name"
                  value={editingPlayer.name}
                  onChange={(e) =>
                    setEditingPlayer({ ...editingPlayer, name: e.target.value })
                  }
                  className="h-11 rounded-xl border-white/[0.1] bg-black/30"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="eyebrow text-[10px]">Rating</Label>
                  <span
                    className="tabular-nums text-[16px] font-semibold"
                    style={{
                      fontFamily: "var(--font-mono), ui-monospace, monospace",
                      color: tierColor(editingPlayer.dynamic_rating),
                      letterSpacing: "-0.04em",
                      textShadow: `0 0 8px ${tierColor(editingPlayer.dynamic_rating)}55`,
                    }}
                  >
                    {editingPlayer.dynamic_rating.toFixed(1)}
                  </span>
                </div>
                <Slider
                  value={[editingPlayer.dynamic_rating]}
                  onValueChange={([v]) =>
                    setEditingPlayer({ ...editingPlayer, dynamic_rating: v })
                  }
                  min={1}
                  max={10}
                  step={0.5}
                />
              </div>

              {/* GK toggle */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-black/25 px-3 py-2.5">
                <Label
                  htmlFor="edit-goalkeeper"
                  className="flex items-center gap-2 text-[13px] font-medium cursor-pointer"
                >
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md"
                    style={{
                      background: "oklch(0.85 0.16 85 / 0.18)",
                      border: "1px solid oklch(0.85 0.16 85 / 0.4)",
                    }}
                  >
                    <Hand
                      className="h-3 w-3"
                      style={{ color: "oklch(0.92 0.14 90)" }}
                    />
                  </span>
                  Arquero / Atajador
                </Label>
                <Switch
                  id="edit-goalkeeper"
                  checked={!!editingPlayer.is_goalkeeper}
                  onCheckedChange={(checked) =>
                    setEditingPlayer({ ...editingPlayer, is_goalkeeper: checked })
                  }
                />
              </div>

              {/* Aliases */}
              <div className="space-y-2 pt-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 mb-1.5">
                  <Tag className="h-3 w-3 text-primary" />
                  <Label className="eyebrow text-[10px]">Alias / Apodos</Label>
                </div>
                <p className="eyebrow-sub leading-snug mb-1">
                  Variaciones para reconocerlo en WhatsApp (ej: Nico, Nicolás).
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    placeholder="Nuevo alias…"
                    onKeyDown={(e) => e.key === "Enter" && handleAddAlias()}
                    className="h-10 rounded-xl border-white/[0.1] bg-black/30 text-[13px]"
                  />
                  <Button
                    size="icon"
                    onClick={handleAddAlias}
                    disabled={!newAlias.trim()}
                    className="h-10 w-10 rounded-xl"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {aliases.map((a) => (
                    <span
                      key={a.id}
                      className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 text-[11px]"
                    >
                      {a.alias}
                      <button
                        type="button"
                        onClick={() => handleDeleteAlias(a.id)}
                        className="ml-0.5 text-muted-foreground/55 hover:text-destructive transition-colors"
                        aria-label={`Eliminar alias ${a.alias}`}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                  {aliases.length === 0 && (
                    <span className="text-[11px] text-muted-foreground/45 italic">
                      Sin alias configurados
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingPlayer(null)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button onClick={handleSavePlayer} className="rounded-xl">
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Session / logout — danger zone ── */}
      <div className="glass rounded-2xl p-5 anim-fade-up delay-2">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center"
            style={{
              background: "oklch(0.65 0.20 25 / 0.10)",
              border: "1px solid oklch(0.65 0.20 25 / 0.30)",
            }}
          >
            <LogOut className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex-1 pt-0.5">
            <h3 className="eyebrow mb-1.5">Sesión</h3>
            <p className="eyebrow-sub">
              Cerrá sesión y volvé a la pantalla de login.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => logout()}
          className="w-full gap-2 rounded-xl border-destructive/25 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/45"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}

/* ── Stat cell — used in section header ── */
function StatCell({
  label,
  value,
  accent,
}: {
  label: string
  value: number | string
  accent: string
}) {
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="tabular-nums leading-none mb-1.5"
        style={{
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          fontSize: 18,
          fontWeight: 600,
          color: accent,
          letterSpacing: "-0.04em",
          textShadow: `0 0 10px ${accent}40`,
        }}
      >
        {value}
      </div>
      <div
        className="uppercase opacity-55"
        style={{
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          fontSize: 9,
          color: accent,
          letterSpacing: "0.14em",
          fontWeight: 500,
        }}
      >
        {label}
      </div>
    </div>
  )
}

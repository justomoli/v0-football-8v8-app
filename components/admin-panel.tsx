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
  deleteAlias
} from "@/lib/db"
import type { Player, PlayerAlias } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  Edit,
  Tag,
  Plus,
  X,
  RefreshCw,
  Users,
  Hand,
  LogOut
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

  const loadPlayers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPlayers()
      setPlayers(data)
    } catch (error) {
      console.error('Failed to load players:', error)
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
      console.error('Failed to load aliases:', error)
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
        is_goalkeeper: editingPlayer.is_goalkeeper ?? false
      })
      await loadPlayers()
      setEditingPlayer(null)
    } catch (error) {
      console.error('Failed to save player:', error)
    }
  }

  const handleDeletePlayer = async (id: string) => {
    try {
      await deletePlayer(id)
      await loadPlayers()
    } catch (error) {
      console.error('Failed to delete player:', error)
    }
  }

  const handleAddAlias = async () => {
    if (!editingPlayer || !newAlias.trim()) return
    try {
      await addAlias(editingPlayer.id, newAlias)
      await loadAliases(editingPlayer.id)
      setNewAlias("")
    } catch (error) {
      console.error('Failed to add alias:', error)
    }
  }

  const handleDeleteAlias = async (aliasId: string) => {
    try {
      await deleteAlias(aliasId)
      if (editingPlayer) {
        await loadAliases(editingPlayer.id)
      }
    } catch (error) {
      console.error('Failed to delete alias:', error)
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
      console.error('Failed to add player:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-500/20 p-2">
                <Settings className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Panel de Administracion</CardTitle>
                <CardDescription className="text-xs">
                  Gestiona jugadores, alias y configuracion
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadPlayers} disabled={loading}>
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
              <Dialog open={isAddingPlayer} onOpenChange={setIsAddingPlayer}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <UserPlus className="h-4 w-4" />
                    Nuevo Jugador
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar Nuevo Jugador</DialogTitle>
                    <DialogDescription>
                      Crea un nuevo jugador con nombre y puntaje inicial
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre</Label>
                      <Input
                        id="name"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        placeholder="Ej: Juan Perez"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Puntaje Inicial: {newPlayerRating}</Label>
                      <Slider
                        value={[newPlayerRating]}
                        onValueChange={([v]) => setNewPlayerRating(v)}
                        min={1}
                        max={10}
                        step={0.5}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddingPlayer(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddPlayer} disabled={!newPlayerName.trim()}>
                      Crear Jugador
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Players List */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Jugadores ({players.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6 text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2",
                    p.id === player?.id ? "bg-primary/20 border border-primary/30" : "bg-secondary/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                      p.dynamic_rating >= 9 ? "bg-yellow-500/30 text-yellow-400" :
                      p.dynamic_rating >= 8 ? "bg-green-500/30 text-green-400" :
                      p.dynamic_rating >= 7 ? "bg-cyan-500/30 text-cyan-400" :
                      "bg-secondary text-muted-foreground"
                    )}>
                      {p.dynamic_rating.toFixed(1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{p.name}</span>

                        {p.is_goalkeeper && (
                          <Badge variant="outline" className="text-xs border-amber-400/50 text-amber-300">
                            <Hand className="mr-1 h-3 w-3" />
                            GK
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.total_matches} partidos | {p.total_goals} goles | {p.motm_count} MOTM
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditPlayer(p)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          disabled={p.id === player?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar Jugador</AlertDialogTitle>
                          <AlertDialogDescription>
                            Estas seguro de eliminar a {p.name}? Esta accion no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeletePlayer(p.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Player Dialog */}
      <Dialog open={!!editingPlayer} onOpenChange={(open) => !open && setEditingPlayer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Jugador</DialogTitle>
            <DialogDescription>
              Modifica los datos del jugador y gestiona sus alias
            </DialogDescription>
          </DialogHeader>
          {editingPlayer && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  value={editingPlayer.name}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Puntaje: {editingPlayer.dynamic_rating.toFixed(1)}</Label>
                <Slider
                  value={[editingPlayer.dynamic_rating]}
                  onValueChange={([v]) => setEditingPlayer({ ...editingPlayer, dynamic_rating: v })}
                  min={1}
                  max={10}
                  step={0.5}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-goalkeeper"
                  checked={!!editingPlayer.is_goalkeeper}
                  onCheckedChange={(checked) => setEditingPlayer({ ...editingPlayer, is_goalkeeper: checked })}
                />
                <Label htmlFor="edit-goalkeeper" className="flex items-center gap-1.5">
                  <Hand className="h-3.5 w-3.5 text-amber-400" />
                  Atajador / Arquero
                </Label>
              </div>
              
              {/* Aliases Section */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <Label>Alias (Apodos)</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Agrega variaciones del nombre para reconocerlo en WhatsApp (ej: Nico, Nicolas)
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    placeholder="Nuevo alias..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAlias()}
                  />
                  <Button size="icon" onClick={handleAddAlias} disabled={!newAlias.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {aliases.map((a) => (
                    <Badge key={a.id} variant="secondary" className="gap-1">
                      {a.alias}
                      <button onClick={() => handleDeleteAlias(a.id)} className="hover:text-destructive">
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
            <Button onClick={handleSavePlayer}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session — logout */}
      <Card className="border-destructive/25 bg-gradient-to-br from-destructive/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-destructive/15 p-2">
              <LogOut className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-base">Sesión</CardTitle>
              <CardDescription className="text-xs">
                Cerrá sesión y volvé al login.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Button
            variant="outline"
            onClick={() => logout()}
            className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

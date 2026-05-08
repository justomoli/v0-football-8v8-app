"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  getPlayers, 
  parsePlayersFromText, 
  createPlayer, 
  addAlias,
  getCurrentMatchSetup,
  setConfirmedPlayers as dbSetConfirmedPlayers,
  getPlayerById
} from "@/lib/db"
import type { Player, ParsedPlayer } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog"
import { ClipboardPaste, Users, UserPlus, Check, Star, Trash2, Tag, Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface WhatsAppParserProps {
  onPlayersConfirmed?: (playerIds: string[]) => void
}

export function WhatsAppParser({ onPlayersConfirmed }: WhatsAppParserProps) {
  const [rawText, setRawText] = useState("")
  const [parsedPlayers, setParsedPlayers] = useState<ParsedPlayer[]>([])
  const [confirmedPlayerIds, setConfirmedPlayerIds] = useState<string[]>([])
  const [confirmedPlayers, setConfirmedPlayers] = useState<Player[]>([])
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // New player dialog state
  const [newPlayerDialog, setNewPlayerDialog] = useState(false)
  const [pendingNewPlayers, setPendingNewPlayers] = useState<ParsedPlayer[]>([])
  const [currentNewPlayer, setCurrentNewPlayer] = useState<{ name: string; rating: number; createAlias: boolean; originalName: string }>({ 
    name: "", 
    rating: 5, 
    createAlias: false,
    originalName: ""
  })

  // Load existing match setup
  const loadMatchSetup = useCallback(async () => {
    setLoading(true)
    try {
      const setup = await getCurrentMatchSetup()
      if (setup && setup.confirmed_players.length > 0) {
        setConfirmedPlayerIds(setup.confirmed_players)
        // Load player details
        const playerDetails = await Promise.all(
          setup.confirmed_players.map(id => getPlayerById(id))
        )
        setConfirmedPlayers(playerDetails.filter((p): p is Player => p !== null))
      }
    } catch (error) {
      console.error('Failed to load match setup:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMatchSetup()
  }, [loadMatchSetup])

  const parseWhatsAppList = async () => {
    if (!rawText.trim()) return
    
    setProcessing(true)
    try {
      const parsed = await parsePlayersFromText(rawText)
      setParsedPlayers(parsed)
      
      // Separate existing and new players
      const existing = parsed.filter(p => !p.isNew)
      const newPlayers = parsed.filter(p => p.isNew)
      
      // Automatically confirm existing players
      const existingIds = existing
        .map(p => p.existingPlayer?.id)
        .filter((id): id is string => id !== undefined)
      
      if (newPlayers.length > 0) {
        setPendingNewPlayers(newPlayers)
        setCurrentNewPlayer({
          name: newPlayers[0].name,
          rating: 5,
          createAlias: false,
          originalName: newPlayers[0].name
        })
        setNewPlayerDialog(true)
      } else {
        // All players exist, just confirm them
        await dbSetConfirmedPlayers(existingIds)
        setConfirmedPlayerIds(existingIds)
        const playerDetails = await Promise.all(existingIds.map(id => getPlayerById(id)))
        setConfirmedPlayers(playerDetails.filter((p): p is Player => p !== null))
        onPlayersConfirmed?.(existingIds)
      }
    } catch (error) {
      console.error('Failed to parse players:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleNewPlayerRating = async () => {
    try {
      // Create the new player
      const newPlayer = await createPlayer(currentNewPlayer.name, currentNewPlayer.rating)
      
      // Optionally create alias if name was changed
      if (currentNewPlayer.createAlias && currentNewPlayer.originalName !== currentNewPlayer.name) {
        await addAlias(newPlayer.id, currentNewPlayer.originalName)
      }
      
      // Move to next pending player or finish
      const remaining = pendingNewPlayers.slice(1)
      setPendingNewPlayers(remaining)
      
      if (remaining.length > 0) {
        setCurrentNewPlayer({
          name: remaining[0].name,
          rating: 5,
          createAlias: false,
          originalName: remaining[0].name
        })
      } else {
        setNewPlayerDialog(false)
        
        // Now get all player IDs and confirm
        const allPlayers = await getPlayers()
        const confirmedIds = parsedPlayers
          .map(p => {
            if (p.existingPlayer) return p.existingPlayer.id
            return allPlayers.find(ap => ap.name.toLowerCase() === p.name.toLowerCase())?.id
          })
          .filter((id): id is string => id !== undefined)
        
        await dbSetConfirmedPlayers(confirmedIds)
        setConfirmedPlayerIds(confirmedIds)
        const playerDetails = await Promise.all(confirmedIds.map(id => getPlayerById(id)))
        setConfirmedPlayers(playerDetails.filter((p): p is Player => p !== null))
        onPlayersConfirmed?.(confirmedIds)
      }
    } catch (error) {
      console.error('Failed to create player:', error)
    }
  }

  const removeConfirmedPlayer = async (playerId: string) => {
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

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/20 p-2">
              <ClipboardPaste className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Parser de WhatsApp</CardTitle>
              <CardDescription className="text-xs">
                Pega la lista de confirmados del grupo. Reconoce alias automaticamente.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="1 Messi&#10;2 Ronaldo&#10;3 Neymar&#10;..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="min-h-[120px] resize-none bg-secondary/50 font-mono text-sm"
          />
          <Button 
            onClick={parseWhatsAppList}
            className="w-full gap-2"
            disabled={!rawText.trim() || processing}
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Users className="h-4 w-4" />
                Procesar Lista ({rawText.split(/[\n,]/).filter(x => x.trim()).length} nombres)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Confirmed Players Grid */}
      {confirmedPlayers.length > 0 && (
        <Card className="border-primary/30 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Check className="h-5 w-5 text-primary" />
                Confirmados
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  {confirmedPlayers.length}/16
                </Badge>
                <Button variant="ghost" size="icon" onClick={clearAll}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {confirmedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className="group flex items-center justify-between rounded-lg bg-secondary/50 p-3 transition-all hover:bg-secondary"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      {player.dynamic_rating.toFixed(1)}
                    </div>
                    <button
                      onClick={() => removeConfirmedPlayer(player.id)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {confirmedPlayers.length < 16 && (
              <p className="mt-3 text-center text-sm text-muted-foreground">
                Faltan {16 - confirmedPlayers.length} jugadores para completar
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* New Player Dialog */}
      <Dialog open={newPlayerDialog} onOpenChange={setNewPlayerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Nuevo Jugador Detectado
            </DialogTitle>
            <DialogDescription>
              No se encontro &quot;{currentNewPlayer.originalName}&quot; en la base de datos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
              <span className="font-semibold text-lg">{currentNewPlayer.originalName}</span>
              <Badge variant="outline">
                {pendingNewPlayers.length} pendiente{pendingNewPlayers.length !== 1 && "s"}
              </Badge>
            </div>
            
            {/* Name input (allows correction) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre a Guardar</label>
              <Input
                value={currentNewPlayer.name}
                onChange={(e) => {
                  const newName = e.target.value
                  setCurrentNewPlayer(prev => ({ 
                    ...prev, 
                    name: newName,
                    createAlias: newName !== prev.originalName
                  }))
                }}
                placeholder="Nombre completo..."
              />
              {currentNewPlayer.name !== currentNewPlayer.originalName && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Tag className="h-3 w-3" />
                  Se creara alias: &quot;{currentNewPlayer.originalName}&quot; → &quot;{currentNewPlayer.name}&quot;
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Puntaje Inicial: {currentNewPlayer.rating}</label>
              <Slider
                value={[currentNewPlayer.rating]}
                onValueChange={([v]) => setCurrentNewPlayer(prev => ({ ...prev, rating: v }))}
                min={1}
                max={10}
                step={0.5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Principiante</span>
                <span>Intermedio</span>
                <span>Crack</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleNewPlayerRating} className="w-full">
              {pendingNewPlayers.length > 1 ? "Siguiente Jugador" : "Confirmar y Continuar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

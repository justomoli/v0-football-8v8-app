"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog"
import { ClipboardPaste, Users, UserPlus, Check, Star, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function WhatsAppParser() {
  const [rawText, setRawText] = useState("")
  const [parsedNames, setParsedNames] = useState<string[]>([])
  const [newPlayerDialog, setNewPlayerDialog] = useState(false)
  const [pendingNewPlayers, setPendingNewPlayers] = useState<{ name: string; rating: number }[]>([])
  const [currentNewPlayer, setCurrentNewPlayer] = useState({ name: "", rating: 5 })
  
  const { players, addPlayer, confirmedPlayers, setConfirmedPlayers, getPlayerByName } = useStore()

  const parseWhatsAppList = () => {
    // Parse formats like: "1 Messi, 2 Ronaldo..." or "1. Messi 2. Ronaldo" or just "Messi, Ronaldo"
    const text = rawText.trim()
    
    // Remove common prefixes and split
    const cleaned = text
      .replace(/[📌🔵⚪️⚫️✅❌]/g, "") // Remove emojis
      .replace(/\n/g, ", ") // Replace newlines with commas
    
    // Try to extract names
    const names: string[] = []
    const patterns = [
      /\d+[\.\)\s]+([A-Za-zÀ-ÿ\s]+)/g, // "1. Name" or "1) Name" or "1 Name"
      /([A-Za-zÀ-ÿ]+(?:\s[A-Za-zÀ-ÿ]+)?)/g, // Just names
    ]
    
    // First try numbered format
    let matches = [...cleaned.matchAll(patterns[0])]
    if (matches.length > 0) {
      matches.forEach(match => {
        const name = match[1].trim()
        if (name && name.length > 1) {
          names.push(name)
        }
      })
    } else {
      // Fall back to comma/space separated
      cleaned.split(/[,;]+/).forEach(part => {
        const name = part.replace(/^\d+[\.\)\s]*/g, "").trim()
        if (name && name.length > 1 && !/^\d+$/.test(name)) {
          names.push(name)
        }
      })
    }

    // Limit to 16 players
    const uniqueNames = [...new Set(names)].slice(0, 16)
    setParsedNames(uniqueNames)

    // Check for new players
    const newPlayers: { name: string; rating: number }[] = []
    const existingPlayerIds: string[] = []

    uniqueNames.forEach(name => {
      const existingPlayer = getPlayerByName(name)
      if (existingPlayer) {
        existingPlayerIds.push(existingPlayer.id)
      } else {
        newPlayers.push({ name, rating: 5 })
      }
    })

    if (newPlayers.length > 0) {
      setPendingNewPlayers(newPlayers)
      setCurrentNewPlayer(newPlayers[0])
      setNewPlayerDialog(true)
    } else {
      setConfirmedPlayers(existingPlayerIds)
    }
  }

  const handleNewPlayerRating = () => {
    // Add the current new player
    const addedPlayer = addPlayer(currentNewPlayer.name, currentNewPlayer.rating)
    
    // Update pending list
    const remaining = pendingNewPlayers.filter(p => p.name !== currentNewPlayer.name)
    setPendingNewPlayers(remaining)

    if (remaining.length > 0) {
      setCurrentNewPlayer(remaining[0])
    } else {
      setNewPlayerDialog(false)
      // Now set all confirmed players
      const allPlayerIds = parsedNames
        .map(name => {
          const player = getPlayerByName(name)
          return player?.id
        })
        .filter((id): id is string => id !== undefined)
      
      // Add the just-added player
      if (!allPlayerIds.includes(addedPlayer.id)) {
        allPlayerIds.push(addedPlayer.id)
      }
      
      setConfirmedPlayers(allPlayerIds)
    }
  }

  const removeConfirmedPlayer = (playerId: string) => {
    setConfirmedPlayers(confirmedPlayers.filter(id => id !== playerId))
  }

  const getConfirmedPlayerObjects = () => {
    return confirmedPlayers
      .map(id => players.find(p => p.id === id))
      .filter((p): p is typeof players[0] => p !== undefined)
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
                Pegá la lista de confirmados del grupo
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
            disabled={!rawText.trim()}
          >
            <Users className="h-4 w-4" />
            Procesar Lista ({rawText.split(/[\n,]/).filter(x => x.trim()).length} nombres)
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
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                {confirmedPlayers.length}/16
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {getConfirmedPlayerObjects().map((player, index) => (
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
                      {player.dynamicRating.toFixed(1)}
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
              Asigná un puntaje inicial del 1 al 10 para {currentNewPlayer.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
              <span className="font-semibold text-lg">{currentNewPlayer.name}</span>
              <Badge variant="outline">
                {pendingNewPlayers.length} pendiente{pendingNewPlayers.length !== 1 && "s"}
              </Badge>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Puntaje Inicial</label>
              <div className="flex items-center gap-3">
                <Input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={currentNewPlayer.rating}
                  onChange={(e) => setCurrentNewPlayer(prev => ({ ...prev, rating: parseFloat(e.target.value) }))}
                  className="flex-1"
                />
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-lg font-bold text-xl",
                  currentNewPlayer.rating >= 8 ? "bg-primary/20 text-primary" :
                  currentNewPlayer.rating >= 5 ? "bg-yellow-500/20 text-yellow-500" :
                  "bg-destructive/20 text-destructive"
                )}>
                  {currentNewPlayer.rating}
                </div>
              </div>
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

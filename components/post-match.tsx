"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  getCurrentMatchSetup, 
  getPlayerById,
  getActiveSeason,
  saveMatchWithStats,
  createSeason
} from "@/lib/db"
import type { Player, Season, CurrentMatchSetup } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Target, Star, Save, Sparkles, AlertCircle, Award, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlayerMatchInput {
  playerId: string
  goals: number
  rating: number
}

export function PostMatch() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [setup, setSetup] = useState<CurrentMatchSetup | null>(null)
  const [whiteTeamPlayers, setWhiteTeamPlayers] = useState<Player[]>([])
  const [blackTeamPlayers, setBlackTeamPlayers] = useState<Player[]>([])
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null)
  
  const [whiteScore, setWhiteScore] = useState(0)
  const [blackScore, setBlackScore] = useState(0)
  const [isSpecialEvent, setIsSpecialEvent] = useState(false)
  const [playerInputs, setPlayerInputs] = useState<Record<string, PlayerMatchInput>>({})
  const [saved, setSaved] = useState(false)
  const [motmPlayerId, setMotmPlayerId] = useState<string>("")

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [matchSetup, season] = await Promise.all([
        getCurrentMatchSetup(),
        getActiveSeason()
      ])
      
      setSetup(matchSetup)
      
      // Create season if none exists
      if (!season) {
        const newSeason = await createSeason('Temporada 1')
        setCurrentSeason(newSeason)
      } else {
        setCurrentSeason(season)
      }
      
      if (matchSetup) {
        const whiteDetails = await Promise.all(
          matchSetup.white_team.map(id => getPlayerById(id))
        )
        setWhiteTeamPlayers(whiteDetails.filter((p): p is Player => p !== null))
        
        const blackDetails = await Promise.all(
          matchSetup.black_team.map(id => getPlayerById(id))
        )
        setBlackTeamPlayers(blackDetails.filter((p): p is Player => p !== null))
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const allPlayers = [...whiteTeamPlayers, ...blackTeamPlayers]
  const hasTeams = allPlayers.length > 0

  const getPlayerInput = (playerId: string): PlayerMatchInput => {
    return playerInputs[playerId] || { playerId, goals: 0, rating: 7 }
  }

  const updatePlayerInput = (playerId: string, field: 'goals' | 'rating', value: number) => {
    setPlayerInputs(prev => ({
      ...prev,
      [playerId]: {
        ...getPlayerInput(playerId),
        [field]: value,
      }
    }))
  }

  const handleSaveMatch = async () => {
    if (!currentSeason) return
    
    setSaving(true)
    try {
      const stats = allPlayers.map(player => ({
        playerId: player.id,
        goals: getPlayerInput(player.id).goals,
        rating: getPlayerInput(player.id).rating,
      }))

      await saveMatchWithStats(
        currentSeason.id,
        whiteScore,
        blackScore,
        whiteTeamPlayers.map(p => p.id),
        blackTeamPlayers.map(p => p.id),
        stats,
        isSpecialEvent,
        motmPlayerId || undefined
      )
      
      setSaved(true)
      
      // Reset form
      setTimeout(() => {
        setWhiteScore(0)
        setBlackScore(0)
        setPlayerInputs({})
        setIsSpecialEvent(false)
        setMotmPlayerId("")
        setSaved(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to save match:', error)
    } finally {
      setSaving(false)
    }
  }

  // Calculate total goals to validate
  const totalInputGoals = allPlayers.reduce((sum, p) => sum + getPlayerInput(p.id).goals, 0)
  const totalMatchGoals = whiteScore + blackScore
  const goalsMatch = totalInputGoals === totalMatchGoals

  const renderPlayerRow = (player: Player, team: 'white' | 'black') => {
    const input = getPlayerInput(player.id)

    return (
      <div
        key={player.id}
        className={cn(
          "rounded-lg p-3 transition-all",
          team === 'white' ? "bg-white/10" : "bg-zinc-800/50"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">{player.name}</span>
          <Badge variant="outline" className="text-xs">
            Actual: {player.dynamic_rating.toFixed(1)}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Goals Input */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" /> Goles
            </Label>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => updatePlayerInput(player.id, 'goals', Math.max(0, input.goals - 1))}
              >
                -
              </Button>
              <Input
                type="number"
                min="0"
                max="20"
                value={input.goals}
                onChange={(e) => updatePlayerInput(player.id, 'goals', parseInt(e.target.value) || 0)}
                className="h-8 w-12 text-center px-1"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => updatePlayerInput(player.id, 'goals', input.goals + 1)}
              >
                +
              </Button>
            </div>
          </div>
          
          {/* Rating Input */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Star className="h-3 w-3" /> Nota: {input.rating}
            </Label>
            <Slider
              value={[input.rating]}
              onValueChange={([v]) => updatePlayerInput(player.id, 'rating', v)}
              min={1}
              max={10}
              step={0.5}
              className="py-2"
            />
          </div>
        </div>
      </div>
    )
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

  if (saved) {
    return (
      <Card className="border-primary/50 bg-primary/10">
        <CardContent className="py-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto text-primary mb-4 animate-pulse" />
          <h3 className="text-xl font-bold mb-2">Partido Guardado!</h3>
          <p className="text-muted-foreground">
            Los puntajes dinamicos fueron actualizados
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!hasTeams) {
    return (
      <Card className="border-yellow-500/30 bg-yellow-500/10">
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-yellow-500 mb-3" />
          <p className="text-yellow-200">
            Primero genera los equipos en la pestana &quot;Equipos&quot;
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Score Input */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/20 p-2">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Resultado Final</CardTitle>
              <CardDescription className="text-xs">
                {currentSeason?.name || 'Sin temporada activa'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-4 w-4 rounded-full bg-white shadow-lg" />
                <span className="text-sm font-medium">Blanco</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 w-10"
                  onClick={() => setWhiteScore(Math.max(0, whiteScore - 1))}
                >
                  -
                </Button>
                <div className="w-16 h-14 flex items-center justify-center rounded-lg bg-white/10 text-3xl font-bold">
                  {whiteScore}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 w-10"
                  onClick={() => setWhiteScore(whiteScore + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="text-2xl font-bold text-muted-foreground">vs</div>

            <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-4 w-4 rounded-full bg-zinc-800 ring-2 ring-zinc-600" />
                <span className="text-sm font-medium">Negro</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 w-10"
                  onClick={() => setBlackScore(Math.max(0, blackScore - 1))}
                >
                  -
                </Button>
                <div className="w-16 h-14 flex items-center justify-center rounded-lg bg-zinc-800/50 text-3xl font-bold">
                  {blackScore}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 w-10"
                  onClick={() => setBlackScore(blackScore + 1)}
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border/50">
            <Switch
              id="special"
              checked={isSpecialEvent}
              onCheckedChange={setIsSpecialEvent}
            />
            <Label htmlFor="special" className="text-sm cursor-pointer">
              Superclasico / Evento Especial
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* MOTM Selector */}
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-amber-500/20 p-2">
              <Award className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Jugador del Partido</CardTitle>
              <CardDescription className="text-xs">
                Selecciona al MOTM (Man of the Match)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Select value={motmPlayerId} onValueChange={setMotmPlayerId}>
            <SelectTrigger className="w-full border-amber-500/30 bg-secondary/50">
              <SelectValue placeholder="Seleccionar jugador destacado..." />
            </SelectTrigger>
            <SelectContent>
              {allPlayers.map((player) => {
                const isWhiteTeam = whiteTeamPlayers.some(p => p.id === player.id)
                return (
                  <SelectItem key={player.id} value={player.id}>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        isWhiteTeam ? "bg-white shadow" : "bg-zinc-800 ring-1 ring-zinc-500"
                      )} />
                      <span>{player.name}</span>
                      <span className="text-muted-foreground">
                        ({player.dynamic_rating.toFixed(1)})
                      </span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          {motmPlayerId && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm">
              <Award className="h-4 w-4 text-amber-400" />
              <span className="text-amber-200">
                {allPlayers.find(p => p.id === motmPlayerId)?.name} sera el MOTM de este partido
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* White Team Stats */}
      <Card className="border-white/20 bg-gradient-to-br from-white/10 to-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="h-4 w-4 rounded-full bg-white shadow-lg" />
            Equipo Blanco
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {whiteTeamPlayers.map(player => renderPlayerRow(player, 'white'))}
        </CardContent>
      </Card>

      {/* Black Team Stats */}
      <Card className="border-zinc-700/50 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="h-4 w-4 rounded-full bg-zinc-800 ring-2 ring-zinc-600" />
            Equipo Negro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {blackTeamPlayers.map(player => renderPlayerRow(player, 'black'))}
        </CardContent>
      </Card>

      {/* Validation & Save */}
      <Card className={cn(
        "transition-colors",
        goalsMatch ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"
      )}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm">Validacion de goles</span>
            <Badge variant={goalsMatch ? "default" : "destructive"}>
              {totalInputGoals} / {totalMatchGoals} goles
            </Badge>
          </div>
          {!goalsMatch && (
            <p className="text-xs text-destructive mb-3">
              La suma de goles individuales debe coincidir con el resultado
            </p>
          )}
          <Button 
            onClick={handleSaveMatch}
            disabled={!goalsMatch || totalMatchGoals === 0 || saving}
            className="w-full gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Partido
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

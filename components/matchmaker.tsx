"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  getCurrentMatchSetup, 
  setTeams, 
  getPlayerById,
  getPlayers
} from "@/lib/db"
import type { Player, CurrentMatchSetup } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shuffle, Copy, Check, Star, RefreshCw, Users, Image, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { TeamShareCard } from "./team-share-card"

export function Matchmaker() {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [setup, setSetup] = useState<CurrentMatchSetup | null>(null)
  const [confirmedPlayers, setConfirmedPlayers] = useState<Player[]>([])
  const [whiteTeamPlayers, setWhiteTeamPlayers] = useState<Player[]>([])
  const [blackTeamPlayers, setBlackTeamPlayers] = useState<Player[]>([])

  const loadSetup = useCallback(async () => {
    setLoading(true)
    try {
      const matchSetup = await getCurrentMatchSetup()
      setSetup(matchSetup)
      
      if (matchSetup) {
        // Load confirmed player details
        const confirmedDetails = await Promise.all(
          matchSetup.confirmed_players.map(id => getPlayerById(id))
        )
        setConfirmedPlayers(confirmedDetails.filter((p): p is Player => p !== null))
        
        // Load team player details
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
      console.error('Failed to load match setup:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSetup()
  }, [loadSetup])

  const getTeamTotal = (team: Player[]) => {
    return team.reduce((sum, p) => sum + p.dynamic_rating, 0)
  }

  const getTeamAverage = (team: Player[]) => {
    if (team.length === 0) return 0
    return getTeamTotal(team) / team.length
  }

  const generateTeams = async () => {
    if (confirmedPlayers.length < 2) return
    
    setGenerating(true)
    try {
      // Sort players by rating (highest first)
      const sorted = [...confirmedPlayers].sort((a, b) => b.dynamic_rating - a.dynamic_rating)
      
      // Snake draft algorithm
      const white: Player[] = []
      const black: Player[] = []
      
      sorted.forEach((player, index) => {
        const round = Math.floor(index / 2)
        const isEvenRound = round % 2 === 0
        const isFirstPick = index % 2 === 0
        
        if ((isEvenRound && isFirstPick) || (!isEvenRound && !isFirstPick)) {
          white.push(player)
        } else {
          black.push(player)
        }
      })
      
      // Save to database
      await setTeams(white.map(p => p.id), black.map(p => p.id))
      
      setWhiteTeamPlayers(white)
      setBlackTeamPlayers(black)
    } catch (error) {
      console.error('Failed to generate teams:', error)
    } finally {
      setGenerating(false)
    }
  }

  const formatTeamsForWhatsApp = () => {
    const whiteNames = whiteTeamPlayers.map(p => p.name)
    const blackNames = blackTeamPlayers.map(p => p.name)
    
    const whiteAvg = getTeamAverage(whiteTeamPlayers).toFixed(1)
    const blackAvg = getTeamAverage(blackTeamPlayers).toFixed(1)

    return `⚽ *EQUIPOS JUEVES 20hs* ⚽

⚪️ *EQUIPO BLANCO* (Prom: ${whiteAvg})
${whiteNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}

⚫️ *EQUIPO NEGRO* (Prom: ${blackAvg})
${blackNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}

¡Nos vemos en la cancha! 🏟️`
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(formatTeamsForWhatsApp())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

  const hasEnoughPlayers = confirmedPlayers.length >= 2
  const teamsGenerated = whiteTeamPlayers.length > 0 && blackTeamPlayers.length > 0

  return (
    <div className="space-y-4">
      {/* Generate Teams Card */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/20 p-2">
              <Shuffle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Matchmaker</CardTitle>
              <CardDescription className="text-xs">
                Algoritmo de balanceo por puntaje dinamico
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Jugadores confirmados</span>
            </div>
            <Badge variant={hasEnoughPlayers ? "default" : "destructive"}>
              {confirmedPlayers.length}/16
            </Badge>
          </div>
          
          <Button 
            onClick={generateTeams}
            className="w-full gap-2"
            disabled={!hasEnoughPlayers || generating}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : teamsGenerated ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Rebalancear Equipos
              </>
            ) : (
              <>
                <Shuffle className="h-4 w-4" />
                Generar Equipos Parejos
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Teams Display */}
      {teamsGenerated && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {/* White Team */}
            <Card className="border-white/20 bg-gradient-to-br from-white/10 to-white/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="h-4 w-4 rounded-full bg-white shadow-lg shadow-white/20" />
                    Equipo Blanco
                  </CardTitle>
                  <Badge variant="outline" className="border-white/30 text-white">
                    {getTeamAverage(whiteTeamPlayers).toFixed(1)} prom
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {whiteTeamPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-md bg-white/10 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white/60">
                        {index + 1}
                      </span>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-white/80">{player.dynamic_rating.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
                <div className="mt-2 border-t border-white/10 pt-2 text-center text-sm text-white/60">
                  Total: {getTeamTotal(whiteTeamPlayers).toFixed(1)} pts
                </div>
              </CardContent>
            </Card>

            {/* Black Team */}
            <Card className="border-zinc-700/50 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="h-4 w-4 rounded-full bg-zinc-800 shadow-lg ring-2 ring-zinc-600" />
                    Equipo Negro
                  </CardTitle>
                  <Badge variant="outline" className="border-zinc-600">
                    {getTeamAverage(blackTeamPlayers).toFixed(1)} prom
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {blackTeamPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-md bg-zinc-700/30 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-500">
                        {index + 1}
                      </span>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-zinc-300">{player.dynamic_rating.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
                <div className="mt-2 border-t border-zinc-700/50 pt-2 text-center text-sm text-zinc-500">
                  Total: {getTeamTotal(blackTeamPlayers).toFixed(1)} pts
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Balance Indicator */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Diferencia de equipos</span>
                <Badge
                  className={cn(
                    Math.abs(getTeamAverage(whiteTeamPlayers) - getTeamAverage(blackTeamPlayers)) < 0.5
                      ? "bg-green-500/20 text-green-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  )}
                >
                  {Math.abs(getTeamAverage(whiteTeamPlayers) - getTeamAverage(blackTeamPlayers)).toFixed(2)} pts
                </Badge>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                  style={{
                    width: `${Math.min(100, (1 - Math.abs(getTeamAverage(whiteTeamPlayers) - getTeamAverage(blackTeamPlayers)) / 5) * 100)}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Visual Share Card for WhatsApp */}
          <Card className="border-cyan-500/30 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-cyan-500/20 p-2">
                  <Image className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Imagen para Compartir</CardTitle>
                  <CardDescription className="text-xs">
                    Descarga o copia la imagen para WhatsApp
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TeamShareCard 
                whiteTeam={whiteTeamPlayers} 
                blackTeam={blackTeamPlayers} 
              />
            </CardContent>
          </Card>

          {/* Copy Text Button */}
          <Button 
            onClick={copyToClipboard} 
            variant="outline" 
            className="w-full gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                Copiado al portapapeles!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar Texto para WhatsApp
              </>
            )}
          </Button>
        </>
      )}

      {!hasEnoughPlayers && (
        <Card className="border-yellow-500/30 bg-yellow-500/10">
          <CardContent className="py-4">
            <p className="text-center text-sm text-yellow-200">
              Primero carga los jugadores confirmados en la pestana &quot;Jugadores&quot;
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

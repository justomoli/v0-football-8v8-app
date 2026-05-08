"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  getPlayers,
  getSeasons,
  getMatches,
  getActiveSeason,
  getSeasonTopScorers,
  getSeasonTopMotms,
  closeSeason,
  createSeason,
  getPlayerById
} from "@/lib/db"
import type { Player, Season, Match } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog"
import { 
  BarChart3, 
  Trophy, 
  Target, 
  Star, 
  Calendar,
  Medal,
  Lock,
  Plus,
  History,
  TrendingUp,
  Award,
  Loader2,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

export function StatsDashboard() {
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState<Player[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null)
  const [topScorers, setTopScorers] = useState<{ player: Player; goals: number }[]>([])
  const [topMotms, setTopMotms] = useState<{ player: Player; count: number }[]>([])
  
  const [newSeasonName, setNewSeasonName] = useState("")
  const [closeSeasonDialog, setCloseSeasonDialog] = useState(false)
  const [newSeasonDialog, setNewSeasonDialog] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [playersData, seasonsData, activeSeasonData] = await Promise.all([
        getPlayers(),
        getSeasons(),
        getActiveSeason()
      ])
      
      setPlayers(playersData)
      setSeasons(seasonsData)
      setCurrentSeason(activeSeasonData)
      
      if (activeSeasonData) {
        const [matchesData, scorers, motms] = await Promise.all([
          getMatches(activeSeasonData.id),
          getSeasonTopScorers(activeSeasonData.id),
          getSeasonTopMotms(activeSeasonData.id)
        ])
        setMatches(matchesData)
        setTopScorers(scorers)
        setTopMotms(motms)
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

  const handleCloseSeason = async () => {
    if (!currentSeason) return
    
    try {
      await closeSeason(currentSeason.id, {
        topScorerId: topScorers[0]?.player.id,
        topScorerGoals: topScorers[0]?.goals,
        bestRatingId: players.sort((a, b) => b.dynamic_rating - a.dynamic_rating)[0]?.id,
        bestRatingValue: players.sort((a, b) => b.dynamic_rating - a.dynamic_rating)[0]?.dynamic_rating,
        topMotmId: topMotms[0]?.player.id,
        topMotmCount: topMotms[0]?.count
      })
      setCloseSeasonDialog(false)
      setNewSeasonDialog(true)
      await loadData()
    } catch (error) {
      console.error('Failed to close season:', error)
    }
  }

  const handleStartNewSeason = async () => {
    if (!newSeasonName.trim()) return
    
    try {
      await createSeason(newSeasonName)
      setNewSeasonName("")
      setNewSeasonDialog(false)
      await loadData()
    } catch (error) {
      console.error('Failed to start new season:', error)
    }
  }

  // Sort players by dynamic rating
  const sortedByRating = [...players].sort((a, b) => b.dynamic_rating - a.dynamic_rating)

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
      {/* Season Header */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/20 p-2">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">{currentSeason?.name || 'Sin Temporada'}</h3>
                <p className="text-xs text-muted-foreground">
                  {matches.length} partido{matches.length !== 1 && 's'} jugado{matches.length !== 1 && 's'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={loadData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              {currentSeason && isAdmin && (
                <Dialog open={closeSeasonDialog} onOpenChange={setCloseSeasonDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Cerrar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cerrar Temporada</DialogTitle>
                      <DialogDescription>
                        Estas seguro de cerrar {currentSeason.name}? Se guardara un registro historico.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                      {topScorers.length > 0 && (
                        <div className="rounded-lg bg-secondary/50 p-3">
                          <p className="text-sm text-muted-foreground mb-1">Goleador de la temporada</p>
                          <p className="font-bold flex items-center gap-2">
                            <Medal className="h-4 w-4 text-yellow-500" />
                            {topScorers[0]?.player.name} ({topScorers[0]?.goals} goles)
                          </p>
                        </div>
                      )}
                      {topMotms.length > 0 && (
                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                          <p className="text-sm text-muted-foreground mb-1">Mejor Jugador (MOTM)</p>
                          <p className="font-bold flex items-center gap-2">
                            <Award className="h-4 w-4 text-amber-400" />
                            {topMotms[0]?.player.name} ({topMotms[0]?.count} MOTM)
                          </p>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCloseSeasonDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCloseSeason}>
                        Confirmar y Cerrar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              {!currentSeason && isAdmin && (
                <Dialog open={newSeasonDialog} onOpenChange={setNewSeasonDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Plus className="h-3 w-3" />
                      Nueva
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nueva Temporada</DialogTitle>
                      <DialogDescription>
                        Inicia una nueva temporada de futbol 8
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Input
                        placeholder="Ej: Clausura 2026"
                        value={newSeasonName}
                        onChange={(e) => setNewSeasonName(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button onClick={handleStartNewSeason} disabled={!newSeasonName.trim()}>
                        Iniciar Temporada
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Scorers */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Tabla de Goleadores</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {topScorers.length > 0 ? (
            <div className="space-y-2">
              {topScorers.slice(0, 10).map((entry, index) => (
                <div
                  key={entry.player.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2",
                    index === 0 ? "bg-yellow-500/20" :
                    index === 1 ? "bg-zinc-400/20" :
                    index === 2 ? "bg-orange-700/20" :
                    "bg-secondary/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                      index === 0 ? "bg-yellow-500 text-yellow-950" :
                      index === 1 ? "bg-zinc-400 text-zinc-950" :
                      index === 2 ? "bg-orange-700 text-white" :
                      "bg-secondary text-muted-foreground"
                    )}>
                      {index + 1}
                    </span>
                    <span className="font-medium">{entry.player.name}</span>
                  </div>
                  <Badge variant="outline" className="font-bold">
                    {entry.goals} goles
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              No hay goles registrados en esta temporada
            </p>
          )}
        </CardContent>
      </Card>

      {/* MOTM Ranking */}
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-400" />
            <CardTitle className="text-base">Top 5 - Jugadores del Partido</CardTitle>
          </div>
          <CardDescription className="text-xs">
            MOTM de la temporada actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topMotms.length > 0 ? (
            <div className="space-y-2">
              {topMotms.slice(0, 5).map((entry, index) => (
                <div
                  key={entry.player.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2",
                    index === 0 ? "bg-amber-500/20 border border-amber-500/30" :
                    "bg-secondary/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                      index === 0 ? "bg-amber-500 text-amber-950" :
                      "bg-secondary text-muted-foreground"
                    )}>
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-medium">{entry.player.name}</span>
                      {index === 0 && (
                        <p className="text-xs text-amber-400">Mejor Jugador</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className={cn(
                      "h-4 w-4",
                      index === 0 ? "text-amber-400" : "text-muted-foreground"
                    )} />
                    <Badge variant="outline" className={cn(
                      "font-bold",
                      index === 0 && "border-amber-500/50 text-amber-400"
                    )}>
                      {entry.count} MOTM
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              No hay MOTM registrados en esta temporada
            </p>
          )}
        </CardContent>
      </Card>

      {/* Rating Leaderboard */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Ranking de Puntaje</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Puntaje dinamico promediado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedByRating.slice(0, 10).map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <span className="font-medium">{player.name}</span>
                    <p className="text-xs text-muted-foreground">
                      {player.total_matches} partidos - {player.total_goals} goles
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-bold">{player.dynamic_rating.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Match History */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Historial de Partidos</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {matches.length > 0 ? (
            <div className="space-y-2">
              {matches.slice(0, 10).map((match) => (
                <div
                  key={match.id}
                  className={cn(
                    "rounded-lg px-3 py-3",
                    match.is_special_event ? "bg-primary/10 border border-primary/30" : "bg-secondary/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(match.date).toLocaleDateString('es-AR', { 
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </div>
                    {match.is_special_event && (
                      <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                        Superclasico
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-white shadow" />
                      <span className="text-sm">Blanco</span>
                      <span className={cn(
                        "text-xl font-bold",
                        match.white_score > match.black_score && "text-primary"
                      )}>
                        {match.white_score}
                      </span>
                    </div>
                    <span className="text-muted-foreground">-</span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xl font-bold",
                        match.black_score > match.white_score && "text-primary"
                      )}>
                        {match.black_score}
                      </span>
                      <span className="text-sm">Negro</span>
                      <div className="h-3 w-3 rounded-full bg-zinc-800 ring-1 ring-zinc-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              No hay partidos registrados
            </p>
          )}
        </CardContent>
      </Card>

      {/* Past Seasons */}
      {seasons.filter(s => s.status === 'closed').length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Temporadas Anteriores</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {seasons
                .filter(s => s.status === 'closed')
                .map((season) => (
                  <div
                    key={season.id}
                    className="rounded-lg bg-secondary/30 px-3 py-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{season.name}</span>
                      <Badge variant="outline" className="text-xs">
                        Cerrada
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {season.top_scorer_id && (
                        <div className="flex items-center gap-2">
                          <Medal className="h-4 w-4 text-yellow-500" />
                          Goleador: {season.top_scorer_goals} goles
                        </div>
                      )}
                      {season.top_motm_id && (
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-amber-400" />
                          MOTM: {season.top_motm_count} veces
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
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
  TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"

export function StatsDashboard() {
  const { 
    players, 
    seasons, 
    matches,
    getCurrentSeason, 
    getSeasonStats,
    closeSeason,
    startNewSeason,
    currentSeasonId,
    getPlayerById
  } = useStore()

  const [newSeasonName, setNewSeasonName] = useState("")
  const [closeSeasonDialog, setCloseSeasonDialog] = useState(false)
  const [newSeasonDialog, setNewSeasonDialog] = useState(false)

  const currentSeason = getCurrentSeason()
  const { topScorers, matchHistory } = getSeasonStats()

  const handleCloseSeason = () => {
    closeSeason()
    setCloseSeasonDialog(false)
    setNewSeasonDialog(true)
  }

  const handleStartNewSeason = () => {
    if (newSeasonName.trim()) {
      startNewSeason(newSeasonName)
      setNewSeasonName("")
      setNewSeasonDialog(false)
    }
  }

  // Sort players by dynamic rating
  const sortedByRating = [...players].sort((a, b) => b.dynamicRating - a.dynamicRating)

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
                  {matchHistory.length} partido{matchHistory.length !== 1 && 's'} jugado{matchHistory.length !== 1 && 's'}
                </p>
              </div>
            </div>
            {currentSeason && (
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
                      ¿Estás seguro de cerrar {currentSeason.name}? Se guardará un registro histórico y se reiniciarán los goles de la temporada.
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
            {!currentSeason && (
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
                      Iniciá una nueva temporada de fútbol 8
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
                    {entry.goals} ⚽
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

      {/* Rating Leaderboard */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Ranking de Puntaje</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Puntaje dinámico promediado
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
                      {player.totalMatches} partidos • {player.totalGoals} goles
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-bold">{player.dynamicRating.toFixed(1)}</span>
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
          {matchHistory.length > 0 ? (
            <div className="space-y-2">
              {matchHistory.slice(0, 10).map((match) => (
                <div
                  key={match.id}
                  className={cn(
                    "rounded-lg px-3 py-3",
                    match.isSpecialEvent ? "bg-primary/10 border border-primary/30" : "bg-secondary/30"
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
                    {match.isSpecialEvent && (
                      <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                        Superclásico
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-white shadow" />
                      <span className="text-sm">Blanco</span>
                      <span className={cn(
                        "text-xl font-bold",
                        match.whiteScore > match.blackScore && "text-primary"
                      )}>
                        {match.whiteScore}
                      </span>
                    </div>
                    <span className="text-muted-foreground">-</span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xl font-bold",
                        match.blackScore > match.whiteScore && "text-primary"
                      )}>
                        {match.blackScore}
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
                    {season.topScorer && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Medal className="h-4 w-4 text-yellow-500" />
                        Goleador: {getPlayerById(season.topScorer.playerId)?.name} ({season.topScorer.goals})
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

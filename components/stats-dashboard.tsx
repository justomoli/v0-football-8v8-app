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
} from "@/lib/db"
import type { Player, Season, Match } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  BarChart3, Trophy, Target, Star, Calendar,
  Medal, Lock, Plus, History, TrendingUp, Award, RefreshCw, ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LoadingState } from "@/components/ui/spinner"
import { MatchDetailDrawer } from "@/components/match-detail-drawer"

/* ── Medal badge ────────────────────────────────────── */
function MedalBadge({ rank }: { rank: number }) {
  if (rank === 0) return (
    <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
      style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#1a0a00", fontFamily: "var(--font-mono), ui-monospace, monospace" }}>
      1
    </div>
  )
  if (rank === 1) return (
    <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
      style={{ background: "linear-gradient(135deg, #9ca3af, #6b7280)", color: "#0a0a0a", fontFamily: "var(--font-mono), ui-monospace, monospace" }}>
      2
    </div>
  )
  if (rank === 2) return (
    <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
      style={{ background: "linear-gradient(135deg, #cd7f32, #a0522d)", color: "#fff", fontFamily: "var(--font-mono), ui-monospace, monospace" }}>
      3
    </div>
  )
  return (
    <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
      bg-secondary/60 text-muted-foreground"
      style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}>
      {rank + 1}
    </div>
  )
}

/* ── Section card ───────────────────────────────────── */
function Section({ icon: Icon, title, subtitle, color = "primary", children }: {
  icon: React.ElementType
  title: string
  subtitle?: string
  color?: string
  children: React.ReactNode
}) {
  const bgMap: Record<string, string> = {
    primary: "oklch(0.3 0.18 160 / 0.25)",
    amber:   "oklch(0.3 0.18 80 / 0.25)",
    cyan:    "oklch(0.3 0.15 195 / 0.25)",
  }
  const borderMap: Record<string, string> = {
    primary: "oklch(0.75 0.18 160 / 0.3)",
    amber:   "oklch(0.8 0.18 80 / 0.3)",
    cyan:    "oklch(0.8 0.15 195 / 0.3)",
  }
  const iconCls: Record<string, string> = {
    primary: "text-primary",
    amber:   "text-amber-400",
    cyan:    "text-cyan-400",
  }
  return (
    <div className="glass rounded-2xl p-5 anim-fade-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: bgMap[color], border: `1px solid ${borderMap[color]}` }}>
          <Icon className={cn("h-4 w-4", iconCls[color])} />
        </div>
        <div>
          <h2 className="eyebrow">{title}</h2>
          {subtitle && <p className="eyebrow-sub mt-1">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

export function StatsDashboard() {
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
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [playersData, seasonsData, activeSeasonData] = await Promise.all([
        getPlayers(), getSeasons(), getActiveSeason()
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
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleCloseSeason = async () => {
    if (!currentSeason) return
    try {
      const sorted = [...players].sort((a, b) => b.dynamic_rating - a.dynamic_rating)
      await closeSeason(currentSeason.id, {
        topScorerId: topScorers[0]?.player.id,
        topScorerGoals: topScorers[0]?.goals,
        bestRatingId: sorted[0]?.id,
        bestRatingValue: sorted[0]?.dynamic_rating,
        topMotmId: topMotms[0]?.player.id,
        topMotmCount: topMotms[0]?.count,
      })
      setCloseSeasonDialog(false)
      setNewSeasonDialog(true)
      await loadData()
    } catch (e) { console.error(e) }
  }

  const handleStartNewSeason = async () => {
    if (!newSeasonName.trim()) return
    try {
      await createSeason(newSeasonName)
      setNewSeasonName("")
      setNewSeasonDialog(false)
      await loadData()
    } catch (e) { console.error(e) }
  }

  const sortedByRating = [...players].sort((a, b) => b.dynamic_rating - a.dynamic_rating)
  const playersById = new Map(players.map((p) => [p.id, p]))
  const selectedMatchMotm =
    selectedMatch?.motm_player_id ? playersById.get(selectedMatch.motm_player_id) ?? null : null

  /* ── Loading ── */
  if (loading) return (
    <LoadingState message="Cargando estadísticas" />
  )

  return (
    <div className="space-y-5">

      {/* ── Season header ── */}
      <div className="glass rounded-2xl p-5 anim-fade-up neon-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, oklch(0.3 0.18 160 / 0.3), oklch(0.2 0.18 160 / 0.2))",
                border: "1px solid oklch(0.75 0.18 160 / 0.3)",
              }}>
              <Trophy className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold leading-tight tracking-tight" style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
                {currentSeason?.name || "Sin Temporada"}
              </h2>
              <p className="eyebrow-sub mt-1">
                {matches.length} partido{matches.length !== 1 && "s"} jugado{matches.length !== 1 && "s"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="h-9 w-9 rounded-xl flex items-center justify-center
                border border-border/30 text-muted-foreground hover:text-foreground
                bg-secondary/30 hover:bg-secondary/60 transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            {currentSeason && (
              <Dialog open={closeSeasonDialog} onOpenChange={setCloseSeasonDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 border-border/40">
                    <Lock className="h-3.5 w-3.5" /> Cerrar
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-strong border-border/20">
                  <DialogHeader>
                    <DialogTitle className="font-black" style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}>
                      Cerrar Temporada
                    </DialogTitle>
                    <DialogDescription>
                      ¿Cerrar {currentSeason.name}? Se guardará el registro histórico.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-3">
                    {topScorers[0] && (
                      <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3">
                        <p className="text-xs text-muted-foreground mb-1">Goleador de la temporada</p>
                        <p className="font-bold flex items-center gap-2">
                          <Medal className="h-4 w-4 text-yellow-500" />
                          {topScorers[0].player.name} — {topScorers[0].goals} goles
                        </p>
                      </div>
                    )}
                    {topMotms[0] && (
                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
                        <p className="text-xs text-muted-foreground mb-1">Mejor Jugador (MOTM)</p>
                        <p className="font-bold flex items-center gap-2">
                          <Award className="h-4 w-4 text-amber-400" />
                          {topMotms[0].player.name} — {topMotms[0].count} MOTM
                        </p>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCloseSeasonDialog(false)}>Cancelar</Button>
                    <Button onClick={handleCloseSeason}>Confirmar y Cerrar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {!currentSeason && (
              <Dialog open={newSeasonDialog} onOpenChange={setNewSeasonDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Nueva
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-strong border-border/20">
                  <DialogHeader>
                    <DialogTitle className="font-black" style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}>
                      Nueva Temporada
                    </DialogTitle>
                    <DialogDescription>Iniciá una nueva temporada de Fútbol 8</DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Input
                      placeholder="Ej: Clausura 2026"
                      value={newSeasonName}
                      onChange={(e) => setNewSeasonName(e.target.value)}
                      className="bg-secondary/40 border-border/40"
                      onKeyDown={(e) => e.key === "Enter" && handleStartNewSeason()}
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleStartNewSeason} disabled={!newSeasonName.trim()}
                      className="gap-2">
                      <Plus className="h-4 w-4" /> Iniciar Temporada
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      {/* ── Top scorers ── */}
      <Section icon={Target} title="Goleadores" subtitle="Temporada actual">
        {topScorers.length > 0 ? (
          <div className="space-y-2">
            {topScorers.slice(0, 10).map((entry, i) => (
              <div
                key={entry.player.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 anim-slide-right",
                  i === 0 ? "bg-yellow-500/15 border border-yellow-500/25"
                  : i === 1 ? "bg-zinc-400/10 border border-zinc-400/15"
                  : i === 2 ? "bg-orange-700/10 border border-orange-700/15"
                  : "bg-secondary/25 border border-border/20"
                )}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <MedalBadge rank={i} />
                <span className="flex-1 font-semibold">{entry.player.name}</span>
                <div className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-primary" />
                  <span className="font-black text-sm" style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}>
                    {entry.goals}
                  </span>
                  <span className="text-xs text-muted-foreground">goles</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4">
            No hay goles registrados en esta temporada
          </p>
        )}
      </Section>

      {/* ── MOTM ── */}
      <div className="glass rounded-2xl p-5 anim-fade-up delay-1"
        style={{ border: "1px solid oklch(0.8 0.18 80 / 0.2)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "oklch(0.3 0.18 80 / 0.25)", border: "1px solid oklch(0.8 0.18 80 / 0.3)" }}>
            <Award className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h2 className="eyebrow">Top MOTM</h2>
            <p className="eyebrow-sub mt-1">Man of the Match — temporada actual</p>
          </div>
        </div>
        {topMotms.length > 0 ? (
          <div className="space-y-2">
            {topMotms.slice(0, 5).map((entry, i) => {
              const isLeader = i === 0
              const accent = "oklch(0.85 0.18 80)" // amber for all
              return (
                <div
                  key={entry.player.id}
                  className={cn(
                    "group relative overflow-hidden rounded-xl px-3 py-2.5 anim-slide-right",
                    "transition-all duration-200 hover:translate-x-[2px]",
                    "border",
                    isLeader
                      ? "bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-amber-400/35"
                      : "bg-secondary/25 border-border/20"
                  )}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  {/* Amber accent stripe */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[3px]"
                    style={{
                      background: accent,
                      boxShadow: `0 0 10px ${accent}A0`,
                      opacity: isLeader ? 1 : 0.45,
                    }}
                  />

                  <div className="flex items-center gap-3 pl-2">
                    <MedalBadge rank={i} />

                    {/* Name + tagline */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-sm truncate leading-tight">
                          {entry.player.name}
                        </span>
                        {isLeader && (
                          <span
                            className="text-[8px] font-black tracking-[0.18em] uppercase text-amber-300/90 shrink-0"
                            style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}
                          >
                            ★ Top
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-tight">
                        {isLeader
                          ? "Jugador del partido más veces"
                          : `${entry.count} ${entry.count === 1 ? "elección" : "elecciones"} esta temporada`}
                      </p>
                    </div>

                    {/* MOTM count — big numeral right side */}
                    <div className="shrink-0 flex flex-col items-end leading-none gap-0.5">
                      <div className="flex items-baseline gap-1">
                        <Award
                          className={cn("h-3.5 w-3.5", isLeader ? "text-amber-300" : "text-amber-400/60")}
                          style={{ fill: isLeader ? "oklch(0.85 0.18 80 / 0.25)" : "transparent" }}
                        />
                        <span
                          className="font-black tabular-nums"
                          style={{
                            fontFamily: "var(--font-mono), ui-monospace, monospace",
                            fontSize: isLeader ? 22 : 18,
                            color: accent,
                            textShadow: isLeader ? `0 0 12px ${accent}80` : `0 0 6px ${accent}50`,
                            lineHeight: 1,
                          }}
                        >
                          {entry.count}
                        </span>
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50">
                        MOTM
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4">No hay MOTM registrados</p>
        )}
      </div>

      {/* ── Rating leaderboard ── */}
      <Section icon={TrendingUp} title="Rating" subtitle="Puntaje dinámico promediado">
        <div className="space-y-2">
          {sortedByRating.slice(0, 10).map((player, i) => {
            const r = player.dynamic_rating
            const barPct = Math.min(100, (r / 10) * 100)
            const tier =
              r >= 8 ? "oklch(0.78 0.18 145)" :
              r >= 6 ? "oklch(0.78 0.15 195)" :
              r >= 4 ? "oklch(0.85 0.16 85)"  :
                       "oklch(0.7 0.2 25)"
            const isPodium = i < 3
            return (
              <div
                key={player.id}
                className={cn(
                  "group relative overflow-hidden rounded-xl px-3 py-2.5 anim-slide-right",
                  "transition-all duration-200 hover:translate-x-[2px]",
                  "border border-border/20",
                  isPodium
                    ? "bg-gradient-to-r from-secondary/45 via-secondary/30 to-secondary/15"
                    : "bg-secondary/25"
                )}
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                {/* Tier accent stripe */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px]"
                  style={{
                    background: tier,
                    boxShadow: `0 0 10px ${tier}A0`,
                  }}
                />

                <div className="flex items-center gap-3 pl-2">
                  <MedalBadge rank={i} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-sm truncate leading-none">
                        {player.name}
                      </span>
                      <div className="flex items-center gap-1 shrink-0 ml-2 leading-none">
                        <Star className="h-3 w-3" style={{ fill: tier, color: tier }} />
                        <span
                          className="font-black text-sm tabular-nums"
                          style={{
                            fontFamily: "var(--font-mono), ui-monospace, monospace",
                            color: tier,
                            textShadow: `0 0 8px ${tier}50`,
                          }}
                        >
                          {r.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${barPct}%`,
                          background: `linear-gradient(90deg, ${tier}, ${tier}80)`,
                          boxShadow: `0 0 6px ${tier}90`,
                          transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
                          animationDelay: `${i * 0.07}s`,
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2.5 mt-1.5 text-[10px] text-muted-foreground/70">
                      <span className="flex items-center gap-1">
                        <Trophy className="h-2.5 w-2.5" />
                        <span className="tabular-nums font-medium">{player.total_matches}</span>
                        <span className="text-muted-foreground/50">PJ</span>
                      </span>
                      <span className="text-muted-foreground/30">·</span>
                      <span className="flex items-center gap-1">
                        <Target className="h-2.5 w-2.5" />
                        <span className="tabular-nums font-medium">{player.total_goals}</span>
                        <span className="text-muted-foreground/50">G</span>
                      </span>
                      {player.motm_count > 0 && (
                        <>
                          <span className="text-muted-foreground/30">·</span>
                          <span className="flex items-center gap-1">
                            <Award className="h-2.5 w-2.5 text-amber-400/70" />
                            <span className="tabular-nums font-medium">{player.motm_count}</span>
                            <span className="text-muted-foreground/50">MOTM</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* ── Match history ── */}
      <Section icon={History} title="Historial" subtitle="Últimos partidos · tocá para ver detalle">
        {matches.length > 0 ? (
          <div className="space-y-2">
            {matches.slice(0, 10).map((match, i) => {
              const wWin = match.white_score > match.black_score
              const bWin = match.black_score > match.white_score
              return (
                <button
                  key={match.id}
                  onClick={() => setSelectedMatch(match)}
                  className={cn(
                    "group relative w-full text-left rounded-xl px-4 py-3 anim-fade-in border",
                    "transition-all duration-200 hover:translate-x-[2px] hover:border-primary/30",
                    match.is_special_event
                      ? "bg-primary/8 border-primary/25"
                      : "bg-secondary/25 border-border/20"
                  )}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase"
                      style={{
                        fontFamily: "var(--font-mono), ui-monospace, monospace",
                        letterSpacing: "0.08em",
                      }}
                    >
                      <Calendar className="h-3 w-3" />
                      {new Date(match.date).toLocaleDateString("es-AR", {
                        weekday: "short", day: "numeric", month: "short"
                      })}
                    </div>
                    {match.is_special_event && (
                      <span
                        className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25"
                        style={{
                          fontFamily: "var(--font-mono), ui-monospace, monospace",
                          letterSpacing: "0.14em",
                          fontWeight: 500,
                        }}
                      >
                        Superclásico
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-white" style={{ boxShadow: "0 0 6px rgba(255,255,255,0.5)" }} />
                      <span className="text-xs font-medium text-muted-foreground/70">Blanco</span>
                      <span
                        className={cn(
                          "text-[24px] font-semibold tabular-nums",
                          wWin && "text-primary"
                        )}
                        style={{
                          fontFamily: "var(--font-mono), ui-monospace, monospace",
                          letterSpacing: "-0.05em",
                        }}
                      >
                        {match.white_score}
                      </span>
                    </div>
                    <span className="text-muted-foreground/30 font-light text-sm">—</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-[24px] font-semibold tabular-nums",
                          bWin && "text-primary"
                        )}
                        style={{
                          fontFamily: "var(--font-mono), ui-monospace, monospace",
                          letterSpacing: "-0.05em",
                        }}
                      >
                        {match.black_score}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground/70">Negro</span>
                      <div className="h-3 w-3 rounded-full bg-zinc-700" style={{ outline: "1.5px solid #555" }} />
                    </div>
                  </div>
                  <ChevronRight
                    className="absolute top-1/2 -translate-y-1/2 right-2 h-3.5 w-3.5 text-muted-foreground/30
                      group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                  />
                </button>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4">
            No hay partidos registrados aún
          </p>
        )}

        <MatchDetailDrawer
          match={selectedMatch}
          open={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
          playersById={playersById}
          motmPlayer={selectedMatchMotm}
        />
      </Section>

      {/* ── Past seasons ── */}
      {seasons.filter(s => s.status === "closed").length > 0 && (
        <Section icon={BarChart3} title="Temporadas" subtitle="Historial cerrado">
          <div className="space-y-2">
            {seasons.filter(s => s.status === "closed").map((season, i) => (
              <div
                key={season.id}
                className="rounded-xl bg-secondary/25 border border-border/20 px-4 py-3 anim-fade-in"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">{season.name}</span>
                  <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5
                    rounded-full bg-secondary/60 text-muted-foreground border border-border/30">
                    CERRADA
                  </span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {season.top_scorer_id && (
                    <div className="flex items-center gap-2">
                      <Medal className="h-3 w-3 text-yellow-500" />
                      Goleador: <span className="font-semibold">{season.top_scorer_goals} goles</span>
                    </div>
                  )}
                  {season.top_motm_id && (
                    <div className="flex items-center gap-2">
                      <Award className="h-3 w-3 text-amber-400" />
                      MOTM: <span className="font-semibold">{season.top_motm_count} veces</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

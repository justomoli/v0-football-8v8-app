import { forwardRef } from "react"
import { Award, Star, Target, Trophy } from "lucide-react"

import type { Match, Player } from "@/lib/types"
import { cn } from "@/lib/utils"

export interface MatchSharePlayerLine {
  player: Player
  goals: number
  rating: number
}

interface MatchShareCardProps {
  match: Match
  whiteTeam: MatchSharePlayerLine[]
  blackTeam: MatchSharePlayerLine[]
  motmPlayer?: Player | null
}

function formatDate(date: string) {
  return new Date(date)
    .toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toUpperCase()
}

function formatRating(value: number) {
  return value.toFixed(1).replace(".", ",")
}

function teamAverage(players: MatchSharePlayerLine[]) {
  if (players.length === 0) return 0
  return players.reduce((sum, entry) => sum + entry.rating, 0) / players.length
}

function resultLabel(match: Match) {
  if (match.white_score === match.black_score) return "EMPATE"
  return match.white_score > match.black_score ? "GANA BLANCO" : "GANA NEGRO"
}

function PlayerRow({
  entry,
  index,
  variant,
}: {
  entry: MatchSharePlayerLine
  index: number
  variant: "white" | "black"
}) {
  const isWhite = variant === "white"
  return (
    <div
      className={cn(
        "grid grid-cols-[26px_1fr_auto_auto] items-center gap-2 rounded-xl px-3 py-2",
        isWhite ? "bg-white/[0.07]" : "bg-black/35",
      )}
    >
      <span className="text-[10px] font-semibold tabular-nums text-white/38">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold leading-tight text-white">
          {entry.player.name}
        </p>
        <p className="text-[9px] uppercase tracking-[0.16em] text-white/35">
          {entry.player.position ?? (entry.player.is_goalkeeper ? "GK" : "MID")}
        </p>
      </div>
      <span className="rounded-lg bg-white/[0.06] px-2 py-1 text-[12px] font-black tabular-nums text-primary">
        {formatRating(entry.rating)}
      </span>
      <span className="min-w-8 text-right text-[12px] font-semibold tabular-nums text-white/70">
        {entry.goals > 0 ? `${entry.goals}G` : "-"}
      </span>
    </div>
  )
}

function TeamColumn({
  title,
  score,
  players,
  variant,
}: {
  title: string
  score: number
  players: MatchSharePlayerLine[]
  variant: "white" | "black"
}) {
  const sorted = [...players].sort((a, b) => b.rating - a.rating || b.goals - a.goals)
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-3 w-3 rounded-full",
              variant === "white" ? "bg-white" : "bg-zinc-950 ring-1 ring-white/35",
            )}
          />
          <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/78">
            {title}
          </h3>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[9px] uppercase tracking-[0.14em] text-white/35">
            AVG {formatRating(teamAverage(players))}
          </span>
          <span className="text-[26px] font-black leading-none tabular-nums text-white">
            {score}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {sorted.map((entry, index) => (
          <PlayerRow key={entry.player.id} entry={entry} index={index} variant={variant} />
        ))}
      </div>
    </section>
  )
}

export const MatchShareCard = forwardRef<HTMLDivElement, MatchShareCardProps>(
  function MatchShareCard({ match, whiteTeam, blackTeam, motmPlayer }, ref) {
    const allPlayers = [...whiteTeam, ...blackTeam]
    const topRatings = [...allPlayers]
      .sort((a, b) => b.rating - a.rating || b.goals - a.goals)
      .slice(0, 3)
    const scorers = [...allPlayers]
      .filter((entry) => entry.goals > 0)
      .sort((a, b) => b.goals - a.goals || b.rating - a.rating)
      .slice(0, 6)

    return (
      <div
        ref={ref}
        className="relative w-[820px] overflow-hidden rounded-[34px] p-8 text-white"
        style={{
          background:
            "radial-gradient(circle at 20% 0%, rgba(34, 255, 156, 0.16), transparent 30%), radial-gradient(circle at 85% 18%, rgba(75, 220, 255, 0.12), transparent 28%), linear-gradient(160deg, #07100d 0%, #08131a 52%, #05080c 100%)",
          boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        }}
      >
        <div className="pitch-grid absolute inset-0 opacity-[0.18]" />
        <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-28 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative">
          <header className="mb-7 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                FutJueves Report
              </p>
              <h2 className="mt-2 text-[34px] font-black leading-none tracking-[-0.04em]">
                Resumen del partido
              </h2>
              <p className="mt-2 text-[12px] font-medium uppercase tracking-[0.16em] text-white/45">
                {formatDate(match.date)}
              </p>
            </div>
            <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/75">
                Resultado
              </p>
              <p className="mt-1 text-[15px] font-black uppercase tracking-[0.08em] text-primary">
                {resultLabel(match)}
              </p>
              {match.is_special_event && (
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300">
                  Superclásico
                </p>
              )}
            </div>
          </header>

          <section className="mb-6 rounded-[28px] border border-white/[0.08] bg-black/24 p-5">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5">
              <div className="text-center">
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-white/55">
                  Blanco
                </p>
                <p className="text-[86px] font-black leading-none tabular-nums tracking-[-0.08em] text-white">
                  {match.white_score}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Trophy className="h-8 w-8 text-primary" />
                <span className="h-12 w-px rounded-full bg-white/12" />
              </div>
              <div className="text-center">
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-white/55">
                  Negro
                </p>
                <p className="text-[86px] font-black leading-none tabular-nums tracking-[-0.08em] text-white">
                  {match.black_score}
                </p>
              </div>
            </div>
          </section>

          <div className="mb-6 grid grid-cols-[1.15fr_0.85fr] gap-4">
            <section className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.07] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-300" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-200">
                  Figura
                </h3>
              </div>
              <p className="text-[26px] font-black leading-none tracking-[-0.04em]">
                {motmPlayer?.name ?? "Sin MOTM"}
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/42">
                Jugador del partido
              </p>
            </section>

            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">
                  Top rating
                </h3>
              </div>
              <div className="space-y-2">
                {topRatings.map((entry, index) => (
                  <div key={entry.player.id} className="flex items-center justify-between gap-3">
                    <span className="truncate text-[13px] font-semibold text-white/85">
                      {index + 1}. {entry.player.name}
                    </span>
                    <span className="text-[13px] font-black tabular-nums text-primary">
                      {formatRating(entry.rating)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {scorers.length > 0 && (
            <section className="mb-6 rounded-3xl border border-primary/15 bg-primary/[0.055] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                  Goleadores
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {scorers.map((entry) => (
                  <div
                    key={entry.player.id}
                    className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2"
                  >
                    <span className="truncate text-[13px] font-semibold text-white/85">
                      {entry.player.name}
                    </span>
                    <span className="text-[13px] font-black tabular-nums text-primary">
                      {entry.goals}G
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid grid-cols-2 gap-4">
            <TeamColumn
              title="Equipo Blanco"
              score={match.white_score}
              players={whiteTeam}
              variant="white"
            />
            <TeamColumn
              title="Equipo Negro"
              score={match.black_score}
              players={blackTeam}
              variant="black"
            />
          </div>

          <footer className="mt-6 flex items-center justify-between border-t border-white/[0.08] pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
              Ratings, goles y performance del partido
            </p>
            <p className="text-[12px] font-black tracking-[0.18em] text-primary">
              #FutJueves
            </p>
          </footer>
        </div>
      </div>
    )
  },
)

import type { Player, Match } from "./types"

interface PlayerLineData {
  player: Player
  goals: number
  rating: number
}

interface BuildMessageInput {
  match: Match
  whiteTeam: PlayerLineData[]
  blackTeam: PlayerLineData[]
  motmPlayer?: Player | null
}

/**
 * Builds a WhatsApp-ready message recapping a match.
 * The format is intentionally compact so it can be pasted directly into a group.
 */
export function buildMatchMessage({
  match,
  whiteTeam,
  blackTeam,
  motmPlayer,
}: BuildMessageInput): string {
  const date = new Date(match.date).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  const dateLine = date.charAt(0).toUpperCase() + date.slice(1)

  const goalEmojis = (g: number) => (g > 0 ? ` ${"⚽".repeat(Math.min(g, 5))}${g > 5 ? ` x${g}` : ""}` : "")
  const rate = (r: number) => r.toFixed(1).replace(".", ",")
  const teamResult = match.white_score === match.black_score
    ? "Empate"
    : match.white_score > match.black_score
      ? "Ganó Blanco"
      : "Ganó Negro"

  const sortDesc = (a: PlayerLineData, b: PlayerLineData) =>
    b.rating - a.rating || b.goals - a.goals

  const allPlayers = [...whiteTeam, ...blackTeam]
  const topRatings = [...allPlayers]
    .sort(sortDesc)
    .slice(0, 3)
    .map((p, i) => `${i + 1}. ${p.player.name} — ${rate(p.rating)}${goalEmojis(p.goals)}`)
    .join("\n")

  const scorers = [...allPlayers]
    .filter((p) => p.goals > 0)
    .sort((a, b) => b.goals - a.goals || b.rating - a.rating)
    .map((p) => `• ${p.player.name} — ${p.goals} gol${p.goals !== 1 ? "es" : ""}`)
    .join("\n")

  const teamAverage = (team: PlayerLineData[]) => {
    if (team.length === 0) return "0,0"
    const avg = team.reduce((sum, p) => sum + p.rating, 0) / team.length
    return rate(avg)
  }

  const whiteLines = [...whiteTeam]
    .sort(sortDesc)
    .map((p) => `• ${p.player.name} — ${rate(p.rating)}${goalEmojis(p.goals)}`)
    .join("\n")

  const blackLines = [...blackTeam]
    .sort(sortDesc)
    .map((p) => `• ${p.player.name} — ${rate(p.rating)}${goalEmojis(p.goals)}`)
    .join("\n")

  const specialBanner = match.is_special_event ? "🏆 *SUPERCLÁSICO / EVENTO ESPECIAL*" : null
  const motmLine = motmPlayer ? `🌟 *MOTM:* ${motmPlayer.name}` : null

  return [
    "⚽ *FUTJUEVES - RESUMEN DEL PARTIDO*",
    `📅 ${dateLine}`,
    specialBanner,
    "",
    `🏁 *${teamResult}*`,
    `⚪ Blanco *${match.white_score}* - *${match.black_score}* Negro ⚫`,
    `Promedios: Blanco ${teamAverage(whiteTeam)} · Negro ${teamAverage(blackTeam)}`,
    motmLine,
    "",
    "⭐ *TOP 3 RATINGS*",
    topRatings || "Sin ratings registrados",
    "",
    "🎯 *GOLEADORES*",
    scorers || "Sin goles individuales cargados",
    "",
    "📊 *DETALLE POR EQUIPO*",
    "",
    `⚪ *Blanco* (${teamAverage(whiteTeam)} avg)`,
    whiteLines,
    "",
    `⚫ *Negro* (${teamAverage(blackTeam)} avg)`,
    blackLines,
    "",
    "_Notas: rating de partido / goles anotados_",
    "#FutJueves",
  ]
    .filter((s): s is string => s !== null)
    .join("\n")
}

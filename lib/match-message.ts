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
 * - Score bold con emoji ⚪ / ⚫
 * - MOTM destacado con 🌟
 * - Listas por equipo ordenadas por rating desc
 * - Goles como ⚽ repetido (cap 5)
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

  const goalEmojis = (g: number) => (g > 0 ? " " + "⚽".repeat(Math.min(g, 5)) : "")
  const rate = (r: number) => r.toFixed(1).replace(".", ",")

  const sortDesc = (a: PlayerLineData, b: PlayerLineData) =>
    b.rating - a.rating || b.goals - a.goals

  const whiteLines = [...whiteTeam]
    .sort(sortDesc)
    .map((p) => `  • ${p.player.name} — ${rate(p.rating)}${goalEmojis(p.goals)}`)
    .join("\n")

  const blackLines = [...blackTeam]
    .sort(sortDesc)
    .map((p) => `  • ${p.player.name} — ${rate(p.rating)}${goalEmojis(p.goals)}`)
    .join("\n")

  const specialBanner = match.is_special_event ? "🏆 *SUPERCLÁSICO* 🏆\n" : ""
  const motmLine = motmPlayer ? `\n🌟 *MOTM:* ${motmPlayer.name} 🐐\n` : ""

  return [
    `⚽ *RESULTADO ${dateLine.toUpperCase()}* ⚽`,
    specialBanner ? specialBanner.trimEnd() : null,
    "",
    `⚪ BLANCO  *${match.white_score}* — *${match.black_score}*  NEGRO ⚫`,
    motmLine.trimEnd(),
    "📊 *RATINGS*",
    "",
    "⚪ *Blanco:*",
    whiteLines,
    "",
    "⚫ *Negro:*",
    blackLines,
    "",
    "#FutJueves · F8",
  ]
    .filter((s) => s !== null)
    .join("\n")
}

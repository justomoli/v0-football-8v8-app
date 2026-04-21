"use server"

import { createClient } from "./server"
import type { Player, PlayerAlias, Season, Match, MatchStats, CurrentMatchSetup } from "../types"

// ============ PLAYERS ============

export async function getPlayers(): Promise<Player[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("name")
  
  if (error) throw error
  return data || []
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .single()
  
  if (error) return null
  return data
}

export async function getPlayerByName(name: string): Promise<Player | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .ilike("name", name)
    .single()
  
  if (error) return null
  return data
}

export async function createPlayer(name: string, rating: number, isAdmin = false): Promise<Player> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("players")
    .insert({ name, dynamic_rating: rating, is_admin: isAdmin })
    .select()
    .single()
  
  if (error) throw error
  
  // Add initial rating to history
  await supabase.from("player_ratings").insert({
    player_id: data.id,
    rating: rating
  })
  
  return data
}

export async function updatePlayer(id: string, updates: Partial<Player>): Promise<Player> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("players")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deletePlayer(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", id)
  
  if (error) throw error
}

// ============ ALIASES ============

export async function getAliases(): Promise<PlayerAlias[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("player_aliases")
    .select("*")
  
  if (error) throw error
  return data || []
}

export async function getAliasesByPlayerId(playerId: string): Promise<PlayerAlias[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("player_aliases")
    .select("*")
    .eq("player_id", playerId)
  
  if (error) throw error
  return data || []
}

export async function findPlayerByAlias(alias: string): Promise<{ player: Player; alias: PlayerAlias } | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("player_aliases")
    .select("*, players(*)")
    .ilike("alias", alias)
    .single()
  
  if (error || !data) return null
  return {
    player: data.players as unknown as Player,
    alias: { id: data.id, player_id: data.player_id, alias: data.alias, created_at: data.created_at }
  }
}

export async function createAlias(playerId: string, alias: string): Promise<PlayerAlias> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("player_aliases")
    .insert({ player_id: playerId, alias })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteAlias(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("player_aliases")
    .delete()
    .eq("id", id)
  
  if (error) throw error
}

// ============ SEASONS ============

export async function getSeasons(): Promise<Season[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("seasons")
    .select("*")
    .order("created_at", { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getActiveSeason(): Promise<Season | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("seasons")
    .select("*")
    .eq("status", "active")
    .single()
  
  if (error) return null
  return data
}

export async function createSeason(name: string): Promise<Season> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("seasons")
    .insert({ name })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function closeSeason(id: string, stats: {
  topScorerId?: string
  topScorerGoals?: number
  bestRatingId?: string
  bestRatingValue?: number
  topMotmId?: string
  topMotmCount?: number
}): Promise<Season> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("seasons")
    .update({
      status: "closed",
      end_date: new Date().toISOString(),
      top_scorer_id: stats.topScorerId,
      top_scorer_goals: stats.topScorerGoals,
      best_rating_id: stats.bestRatingId,
      best_rating_value: stats.bestRatingValue,
      top_motm_id: stats.topMotmId,
      top_motm_count: stats.topMotmCount
    })
    .eq("id", id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// ============ MATCHES ============

export async function getMatches(seasonId?: string): Promise<Match[]> {
  const supabase = await createClient()
  let query = supabase.from("matches").select("*").order("date", { ascending: false })
  
  if (seasonId) {
    query = query.eq("season_id", seasonId)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createMatch(match: {
  seasonId: string
  whiteScore: number
  blackScore: number
  whiteTeam: string[]
  blackTeam: string[]
  isSpecialEvent: boolean
  motmPlayerId?: string
}): Promise<Match> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("matches")
    .insert({
      season_id: match.seasonId,
      white_score: match.whiteScore,
      black_score: match.blackScore,
      white_team: match.whiteTeam,
      black_team: match.blackTeam,
      is_special_event: match.isSpecialEvent,
      motm_player_id: match.motmPlayerId
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

// ============ MATCH STATS ============

export async function getMatchStats(matchId: string): Promise<MatchStats[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("match_stats")
    .select("*")
    .eq("match_id", matchId)
  
  if (error) throw error
  return data || []
}

export async function createMatchStats(stats: {
  matchId: string
  playerId: string
  goalsScored: number
  matchRating: number
}[]): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("match_stats")
    .insert(stats.map(s => ({
      match_id: s.matchId,
      player_id: s.playerId,
      goals_scored: s.goalsScored,
      match_rating: s.matchRating
    })))
  
  if (error) throw error
}

// ============ PLAYER RATINGS ============

export async function addPlayerRating(playerId: string, rating: number, matchId?: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("player_ratings")
    .insert({
      player_id: playerId,
      rating,
      match_id: matchId
    })
  
  if (error) throw error
}

export async function getPlayerRatings(playerId: string): Promise<number[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("player_ratings")
    .select("rating")
    .eq("player_id", playerId)
    .order("created_at", { ascending: true })
  
  if (error) throw error
  return data?.map(r => r.rating) || []
}

// ============ CURRENT MATCH SETUP ============

const SETUP_ID = "00000000-0000-0000-0000-000000000001"

export async function getCurrentMatchSetup(): Promise<CurrentMatchSetup> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("current_match_setup")
    .select("*")
    .eq("id", SETUP_ID)
    .single()
  
  if (error) throw error
  return data
}

export async function updateCurrentMatchSetup(updates: Partial<CurrentMatchSetup>): Promise<CurrentMatchSetup> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("current_match_setup")
    .update(updates)
    .eq("id", SETUP_ID)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function resetCurrentMatchSetup(): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("current_match_setup")
    .update({
      confirmed_players: [],
      white_team: [],
      black_team: []
    })
    .eq("id", SETUP_ID)
  
  if (error) throw error
}

// ============ SESSIONS (Simple Auth) ============

export async function createSession(playerId: string): Promise<string> {
  const supabase = await createClient()
  const token = crypto.randomUUID()
  
  const { error } = await supabase
    .from("sessions")
    .insert({
      player_id: playerId,
      token,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    })
  
  if (error) throw error
  return token
}

export async function getSessionByToken(token: string): Promise<{ session: { id: string; player_id: string; expires_at: string }; player: Player } | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sessions")
    .select("*, players(*)")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .single()
  
  if (error || !data) return null
  return {
    session: { id: data.id, player_id: data.player_id, expires_at: data.expires_at },
    player: data.players as unknown as Player
  }
}

export async function deleteSession(token: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("token", token)
  
  if (error) throw error
}

// ============ COMPLEX QUERIES ============

export async function getSeasonStats(seasonId: string): Promise<{
  topScorers: { player: Player; goals: number }[]
  topMotms: { player: Player; count: number }[]
  matchHistory: Match[]
}> {
  const supabase = await createClient()
  
  // Get all matches for season
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("season_id", seasonId)
    .order("date", { ascending: false })
  
  // Get all match stats for these matches
  const matchIds = matches?.map(m => m.id) || []
  const { data: allStats } = await supabase
    .from("match_stats")
    .select("*, players(*)")
    .in("match_id", matchIds)
  
  // Calculate top scorers
  const goalsByPlayer: Record<string, { player: Player; goals: number }> = {}
  allStats?.forEach(stat => {
    const player = stat.players as unknown as Player
    if (!goalsByPlayer[stat.player_id]) {
      goalsByPlayer[stat.player_id] = { player, goals: 0 }
    }
    goalsByPlayer[stat.player_id].goals += stat.goals_scored
  })
  
  const topScorers = Object.values(goalsByPlayer)
    .filter(e => e.goals > 0)
    .sort((a, b) => b.goals - a.goals)
  
  // Calculate top MOTMs
  const motmByPlayer: Record<string, { player: Player; count: number }> = {}
  const { data: players } = await supabase.from("players").select("*")
  const playersMap = new Map(players?.map(p => [p.id, p]) || [])
  
  matches?.forEach(match => {
    if (match.motm_player_id) {
      const player = playersMap.get(match.motm_player_id)
      if (player) {
        if (!motmByPlayer[match.motm_player_id]) {
          motmByPlayer[match.motm_player_id] = { player, count: 0 }
        }
        motmByPlayer[match.motm_player_id].count++
      }
    }
  })
  
  const topMotms = Object.values(motmByPlayer)
    .sort((a, b) => b.count - a.count)
  
  return {
    topScorers,
    topMotms,
    matchHistory: matches || []
  }
}

// Resolve a name to a player (check exact match, then aliases)
export async function resolvePlayerName(name: string): Promise<{ player: Player; matchType: 'exact' | 'alias' } | null> {
  // Try exact match first
  const exactMatch = await getPlayerByName(name)
  if (exactMatch) {
    return { player: exactMatch, matchType: 'exact' }
  }
  
  // Try alias match
  const aliasMatch = await findPlayerByAlias(name)
  if (aliasMatch) {
    return { player: aliasMatch.player, matchType: 'alias' }
  }
  
  return null
}

import { createClient } from "@/lib/supabase/client"
import type { 
  Player, 
  PlayerAlias, 
  Season, 
  Match, 
  MatchStats, 
  CurrentMatchSetup,
  ParsedPlayer 
} from "./types"

const supabase = createClient()

// ==================== PLAYERS ====================

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data || []
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) return null
  return data
}

export async function createPlayer(name: string, rating: number, isAdmin = false): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .insert({ 
      name, 
      dynamic_rating: rating,
      is_admin: isAdmin 
    })
    .select()
    .single()
  
  if (error) throw error
  
  // Also insert initial rating
  await supabase.from('player_ratings').insert({
    player_id: data.id,
    rating
  })
  
  return data
}

export async function updatePlayer(id: string, updates: Partial<Player>): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deletePlayer(id: string): Promise<void> {
  const { error } = await supabase
    .from('players')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// ==================== ALIASES ====================

export async function getAliases(): Promise<PlayerAlias[]> {
  const { data, error } = await supabase
    .from('player_aliases')
    .select('*')
  
  if (error) throw error
  return data || []
}

export async function getAliasesByPlayerId(playerId: string): Promise<PlayerAlias[]> {
  const { data, error } = await supabase
    .from('player_aliases')
    .select('*')
    .eq('player_id', playerId)
  
  if (error) throw error
  return data || []
}

export async function addAlias(playerId: string, alias: string): Promise<PlayerAlias> {
  const { data, error } = await supabase
    .from('player_aliases')
    .insert({ player_id: playerId, alias: alias.toLowerCase().trim() })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteAlias(id: string): Promise<void> {
  const { error } = await supabase
    .from('player_aliases')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// ==================== NAME NORMALIZATION ====================

export async function findPlayerByNameOrAlias(name: string): Promise<{ player: Player | null, alias: PlayerAlias | null }> {
  const normalizedName = name.toLowerCase().trim()
  
  // First check exact match on player name
  const { data: playerMatch } = await supabase
    .from('players')
    .select('*')
    .ilike('name', normalizedName)
    .single()
  
  if (playerMatch) {
    return { player: playerMatch, alias: null }
  }
  
  // Then check aliases
  const { data: aliasMatch } = await supabase
    .from('player_aliases')
    .select('*, players(*)')
    .ilike('alias', normalizedName)
    .single()
  
  if (aliasMatch && aliasMatch.players) {
    return { 
      player: aliasMatch.players as unknown as Player, 
      alias: { id: aliasMatch.id, player_id: aliasMatch.player_id, alias: aliasMatch.alias, created_at: aliasMatch.created_at }
    }
  }
  
  return { player: null, alias: null }
}

export async function parsePlayersFromText(text: string): Promise<ParsedPlayer[]> {
  // Parse different formats: "1. Name", "1 Name", "Name", comma-separated, line-separated
  const lines = text.split(/[\n,]+/).map(l => l.trim()).filter(Boolean)
  const parsed: ParsedPlayer[] = []
  
  for (const line of lines) {
    // Remove numbering like "1.", "1 ", "1-", etc.
    const name = line.replace(/^\d+[\.\-\)\s]+/, '').trim()
    if (!name) continue
    
    const { player, alias } = await findPlayerByNameOrAlias(name)
    
    parsed.push({
      name,
      existingPlayer: player || undefined,
      alias: alias || undefined,
      isNew: !player,
      suggestedRating: 5
    })
  }
  
  return parsed
}

// ==================== SEASONS ====================

export async function getSeasons(): Promise<Season[]> {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getActiveSeason(): Promise<Season | null> {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('status', 'active')
    .single()
  
  if (error) return null
  return data
}

export async function createSeason(name: string): Promise<Season> {
  const { data, error } = await supabase
    .from('seasons')
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
  const { data, error } = await supabase
    .from('seasons')
    .update({
      status: 'closed',
      end_date: new Date().toISOString(),
      top_scorer_id: stats.topScorerId,
      top_scorer_goals: stats.topScorerGoals,
      best_rating_id: stats.bestRatingId,
      best_rating_value: stats.bestRatingValue,
      top_motm_id: stats.topMotmId,
      top_motm_count: stats.topMotmCount
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// ==================== MATCHES ====================

export async function getMatches(seasonId?: string): Promise<Match[]> {
  let query = supabase.from('matches').select('*').order('date', { ascending: false })
  
  if (seasonId) {
    query = query.eq('season_id', seasonId)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createMatch(match: Omit<Match, 'id' | 'created_at'>): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .insert(match)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getMatchStats(matchId: string): Promise<MatchStats[]> {
  const { data, error } = await supabase
    .from('match_stats')
    .select('*')
    .eq('match_id', matchId)
  
  if (error) throw error
  return data || []
}

export async function saveMatchWithStats(
  seasonId: string,
  whiteScore: number,
  blackScore: number,
  whiteTeam: string[],
  blackTeam: string[],
  stats: { playerId: string; goals: number; rating: number }[],
  isSpecial: boolean,
  motmPlayerId?: string
): Promise<Match> {
  // Create match
  const match = await createMatch({
    season_id: seasonId,
    date: new Date().toISOString(),
    white_score: whiteScore,
    black_score: blackScore,
    white_team: whiteTeam,
    black_team: blackTeam,
    is_special_event: isSpecial,
    motm_player_id: motmPlayerId || null
  })
  
  // Create match stats
  const matchStats = stats.map(s => ({
    match_id: match.id,
    player_id: s.playerId,
    goals_scored: s.goals,
    match_rating: s.rating
  }))
  
  await supabase.from('match_stats').insert(matchStats)
  
  // Update player stats
  for (const stat of stats) {
    // Get current player
    const player = await getPlayerById(stat.playerId)
    if (!player) continue
    
    // Add rating to history
    await supabase.from('player_ratings').insert({
      player_id: stat.playerId,
      rating: stat.rating,
      match_id: match.id
    })
    
    // Get all ratings for dynamic average
    const { data: ratings } = await supabase
      .from('player_ratings')
      .select('rating')
      .eq('player_id', stat.playerId)
    
    const avgRating = ratings 
      ? ratings.reduce((sum, r) => sum + Number(r.rating), 0) / ratings.length
      : stat.rating
    
    // Update player
    await updatePlayer(stat.playerId, {
      total_goals: player.total_goals + stat.goals,
      total_matches: player.total_matches + 1,
      dynamic_rating: Math.round(avgRating * 10) / 10,
      motm_count: motmPlayerId === stat.playerId ? player.motm_count + 1 : player.motm_count
    })
  }
  
  return match
}

// ==================== CURRENT MATCH SETUP ====================

const SETUP_ID = '00000000-0000-0000-0000-000000000001'

export async function getCurrentMatchSetup(): Promise<CurrentMatchSetup | null> {
  const { data, error } = await supabase
    .from('current_match_setup')
    .select('*')
    .eq('id', SETUP_ID)
    .single()
  
  if (error) return null
  return data
}

export async function updateMatchSetup(updates: Partial<CurrentMatchSetup>): Promise<CurrentMatchSetup> {
  const { data, error } = await supabase
    .from('current_match_setup')
    .update(updates)
    .eq('id', SETUP_ID)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function setConfirmedPlayers(playerIds: string[]): Promise<void> {
  await updateMatchSetup({ confirmed_players: playerIds })
}

export async function setTeams(whiteTeam: string[], blackTeam: string[]): Promise<void> {
  await updateMatchSetup({ white_team: whiteTeam, black_team: blackTeam })
}

export async function clearMatchSetup(): Promise<void> {
  await updateMatchSetup({ 
    confirmed_players: [], 
    white_team: [], 
    black_team: [] 
  })
}

// ==================== SESSIONS / AUTH ====================

export async function createSession(playerId: string): Promise<string> {
  const token = crypto.randomUUID()
  
  const { error } = await supabase
    .from('sessions')
    .insert({
      player_id: playerId,
      token,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
  
  if (error) throw error
  return token
}

export async function getSessionPlayer(token: string): Promise<Player | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*, players(*)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()
  
  if (error || !data) return null
  return data.players as unknown as Player
}

export async function deleteSession(token: string): Promise<void> {
  await supabase.from('sessions').delete().eq('token', token)
}

// ==================== STATS HELPERS ====================

export async function getSeasonTopScorers(seasonId: string): Promise<{ player: Player; goals: number }[]> {
  const matches = await getMatches(seasonId)
  const goalsByPlayer: Record<string, number> = {}
  
  for (const match of matches) {
    const stats = await getMatchStats(match.id)
    for (const stat of stats) {
      goalsByPlayer[stat.player_id] = (goalsByPlayer[stat.player_id] || 0) + stat.goals_scored
    }
  }
  
  const players = await getPlayers()
  const playerMap = new Map(players.map(p => [p.id, p]))
  
  return Object.entries(goalsByPlayer)
    .map(([id, goals]) => ({ player: playerMap.get(id)!, goals }))
    .filter(entry => entry.player)
    .sort((a, b) => b.goals - a.goals)
}

export async function getSeasonTopMotms(seasonId: string): Promise<{ player: Player; count: number }[]> {
  const matches = await getMatches(seasonId)
  const motmByPlayer: Record<string, number> = {}
  
  for (const match of matches) {
    if (match.motm_player_id) {
      motmByPlayer[match.motm_player_id] = (motmByPlayer[match.motm_player_id] || 0) + 1
    }
  }
  
  const players = await getPlayers()
  const playerMap = new Map(players.map(p => [p.id, p]))
  
  return Object.entries(motmByPlayer)
    .map(([id, count]) => ({ player: playerMap.get(id)!, count }))
    .filter(entry => entry.player)
    .sort((a, b) => b.count - a.count)
}

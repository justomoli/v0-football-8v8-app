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

export function normalizePlayerKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’`´]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanWhatsappPlayerLine(line: string): string {
  return line
    .replace(/\r/g, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/^(confirmados?|lista|jugadores|anotados|convocados)\s*:\s*/i, '')
    .replace(/^[\s>*_~`-]+/g, '')
    .replace(/^\d+\s*[\.\-\)\:]?\s*/g, '')
    .replace(/^[•·◦▪▫✅☑✔➕➖-]\s*/gu, '')
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, ' ')
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .replace(/\s+(confirmad[oa]|ok|voy|va|presente|juega)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isIgnoredWhatsappLine(line: string): boolean {
  const key = normalizePlayerKey(line.replace(/:$/, ''))
  if (!key || /^[=\-_\s]+$/.test(line)) return true
  if (/\b(fut|futbol|jueves|hora|hs|20)\b/.test(key)) return true

  return [
    'confirmados',
    'lista',
    'lista de confirmados',
    'jueves',
    'futbol',
    'futbol 8',
    'futbol ocho',
    'equipo',
    'equipos',
    'jugadores',
    'anotados',
    'convocados',
  ].includes(key)
}

function findPlayerInCollections(
  name: string,
  players: Player[],
  aliases: PlayerAlias[],
): { player: Player | null; alias: PlayerAlias | null } {
  const key = normalizePlayerKey(name)
  const player = players.find((p) => normalizePlayerKey(p.name) === key)
  if (player) return { player, alias: null }

  const alias = aliases.find((a) => normalizePlayerKey(a.alias) === key)
  if (!alias) return { player: null, alias: null }

  return {
    player: players.find((p) => p.id === alias.player_id) ?? null,
    alias,
  }
}

export async function findPlayerByNameOrAlias(name: string): Promise<{ player: Player | null, alias: PlayerAlias | null }> {
  const normalizedName = name.trim()
  
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

  const [players, aliases] = await Promise.all([getPlayers(), getAliases()])
  const fallbackMatch = findPlayerInCollections(name, players, aliases)
  if (fallbackMatch.player) return fallbackMatch
  
  return { player: null, alias: null }
}

export async function parsePlayersFromText(text: string): Promise<ParsedPlayer[]> {
  // Parse common WhatsApp formats: numbered lists, bullets, checks, commas and line breaks.
  const lines = text.split(/[\n,;]+/).map(l => l.trim()).filter(Boolean)
  const [players, aliases] = await Promise.all([getPlayers(), getAliases()])
  const parsed: ParsedPlayer[] = []
  const seen = new Set<string>()
  
  for (const line of lines) {
    const name = cleanWhatsappPlayerLine(line)
    if (!name || isIgnoredWhatsappLine(name)) continue

    const key = normalizePlayerKey(name)
    if (!key || seen.has(key)) continue
    seen.add(key)
    
    const { player, alias } = findPlayerInCollections(name, players, aliases)
    
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

    // Effective rating: feeling-based rating + goal bonus (cap +1.5)
    // 1 gol → +0.3, 2 → +0.6, 3 → +0.9, 4 → +1.2, 5+ → +1.5
    const goalBonus = Math.min(stat.goals * 0.3, 1.5)
    const effectiveRating = Math.min(10, stat.rating + goalBonus)

    // Add effective rating to history (so future avg reflects the goal contribution)
    await supabase.from('player_ratings').insert({
      player_id: stat.playerId,
      rating: effectiveRating,
      match_id: match.id
    })

    // Get all ratings for dynamic average
    const { data: ratings } = await supabase
      .from('player_ratings')
      .select('rating')
      .eq('player_id', stat.playerId)

    const avgRating = ratings
      ? ratings.reduce((sum, r) => sum + Number(r.rating), 0) / ratings.length
      : effectiveRating

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

// ==================== DELETE MATCHES ====================

async function recomputePlayerStats(playerId: string): Promise<void> {
  const player = await getPlayerById(playerId)
  if (!player) return

  const { data: statsRows } = await supabase
    .from('match_stats')
    .select('goals_scored')
    .eq('player_id', playerId)

  const total_matches = statsRows?.length ?? 0
  const total_goals = statsRows?.reduce((s, r) => s + (Number(r.goals_scored) || 0), 0) ?? 0

  const { count: motmCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('motm_player_id', playerId)

  const { data: ratings } = await supabase
    .from('player_ratings')
    .select('rating')
    .eq('player_id', playerId)

  const avg = ratings && ratings.length > 0
    ? ratings.reduce((s, r) => s + Number(r.rating), 0) / ratings.length
    : player.dynamic_rating

  await updatePlayer(playerId, {
    total_matches,
    total_goals,
    motm_count: motmCount ?? 0,
    dynamic_rating: Math.round(avg * 10) / 10,
  })
}

export async function deleteMatch(matchId: string): Promise<void> {
  const stats = await getMatchStats(matchId)
  const affected = new Set<string>(stats.map((s) => s.player_id))

  const { data: matchRow } = await supabase
    .from('matches')
    .select('motm_player_id')
    .eq('id', matchId)
    .single()
  if (matchRow?.motm_player_id) affected.add(matchRow.motm_player_id)

  await supabase.from('player_ratings').delete().eq('match_id', matchId)
  await supabase.from('match_stats').delete().eq('match_id', matchId)
  const { error } = await supabase.from('matches').delete().eq('id', matchId)
  if (error) throw error

  for (const pid of affected) {
    await recomputePlayerStats(pid)
  }
}

export async function deleteAllMatches(seasonId?: string): Promise<void> {
  // Collect match ids in scope
  let q = supabase.from('matches').select('id')
  if (seasonId) q = q.eq('season_id', seasonId)
  const { data: matchRows, error: mErr } = await q
  if (mErr) throw mErr
  const ids = (matchRows ?? []).map((m) => m.id)
  if (ids.length === 0) return

  await supabase.from('player_ratings').delete().in('match_id', ids)
  await supabase.from('match_stats').delete().in('match_id', ids)
  const { error } = await supabase.from('matches').delete().in('id', ids)
  if (error) throw error

  const players = await getPlayers()
  for (const p of players) {
    await recomputePlayerStats(p.id)
  }
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

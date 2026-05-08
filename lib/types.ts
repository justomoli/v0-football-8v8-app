// Database types matching Supabase schema

export interface Player {
  id: string
  name: string
  dynamic_rating: number
  total_goals: number
  total_matches: number
  motm_count: number
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface PlayerAlias {
  id: string
  player_id: string
  alias: string
  created_at: string
}

export interface Season {
  id: string
  name: string
  status: 'active' | 'closed'
  start_date: string
  end_date?: string
  top_scorer_id?: string
  top_scorer_goals?: number
  best_rating_id?: string
  best_rating_value?: number
  top_motm_id?: string
  top_motm_count?: number
  created_at: string
}

export interface Match {
  id: string
  season_id: string
  date: string
  white_score: number
  black_score: number
  white_team: string[]
  black_team: string[]
  is_special_event: boolean
  motm_player_id?: string
  created_at: string
}

export interface MatchStats {
  id?: string
  match_id?: string
  player_id: string
  goals_scored: number
  match_rating: number
  created_at?: string
}

export interface PlayerRating {
  id: string
  player_id: string
  rating: number
  match_id?: string
  created_at: string
}

export interface Session {
  id: string
  player_id: string
  token: string
  created_at: string
  expires_at: string
}

export interface CurrentMatchSetup {
  id: string
  confirmed_players: string[]
  white_team: string[]
  black_team: string[]
  updated_at: string
}

// For WhatsApp parser - parsed player with potential new player flag
export interface ParsedPlayer {
  name: string
  existingPlayer?: Player
  alias?: PlayerAlias
  isNew: boolean
  suggestedRating?: number
}

// For post-match input
export interface PlayerMatchInput {
  goals: number
  rating: number
}

// Current logged in user context
export interface AuthContext {
  player: Player | null
  isAdmin: boolean
  isLoading: boolean
}

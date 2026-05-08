export interface Player {
  id: string
  name: string
  dynamicRating: number // 1-10
  totalGoals: number
  totalMatches: number
  ratingsHistory: number[]
  motmCount: number // Man of the Match count
}

export interface MatchStats {
  playerId: string
  goalsScored: number
  matchRating: number // 1-10
}

export interface Match {
  id: string
  seasonId: string
  date: string
  whiteScore: number
  blackScore: number
  whiteTeam: string[]
  blackTeam: string[]
  stats: MatchStats[]
  isSpecialEvent: boolean
  motmPlayerId?: string // Man of the Match
}

export interface Season {
  id: string
  name: string
  status: 'active' | 'closed'
  startDate: string
  endDate?: string
  topScorer?: {
    playerId: string
    goals: number
  }
  bestRating?: {
    playerId: string
    rating: number
  }
  topMotm?: {
    playerId: string
    count: number
  }
}

export interface AppState {
  players: Player[]
  matches: Match[]
  seasons: Season[]
  currentSeasonId: string | null
  confirmedPlayers: string[] // player IDs for current match
  whiteTeam: string[]
  blackTeam: string[]
}

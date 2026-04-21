"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Player, Match, Season, AppState, MatchStats } from './types'

// Sample data for demonstration
const samplePlayers: Player[] = [
  { id: '1', name: 'Messi', dynamicRating: 9.5, totalGoals: 12, totalMatches: 8, ratingsHistory: [9, 10, 9, 10, 9], motmCount: 3 },
  { id: '2', name: 'Ronaldo', dynamicRating: 9.2, totalGoals: 10, totalMatches: 8, ratingsHistory: [9, 9, 10, 9, 9], motmCount: 2 },
  { id: '3', name: 'Neymar', dynamicRating: 8.8, totalGoals: 8, totalMatches: 7, ratingsHistory: [8, 9, 9, 9, 8], motmCount: 1 },
  { id: '4', name: 'Mbappé', dynamicRating: 8.5, totalGoals: 7, totalMatches: 8, ratingsHistory: [8, 9, 8, 9, 8], motmCount: 1 },
  { id: '5', name: 'De Bruyne', dynamicRating: 8.3, totalGoals: 4, totalMatches: 8, ratingsHistory: [8, 8, 9, 8, 8], motmCount: 1 },
  { id: '6', name: 'Haaland', dynamicRating: 8.7, totalGoals: 9, totalMatches: 6, ratingsHistory: [9, 9, 8, 9, 8], motmCount: 0 },
  { id: '7', name: 'Salah', dynamicRating: 8.1, totalGoals: 6, totalMatches: 8, ratingsHistory: [8, 8, 8, 8, 8], motmCount: 0 },
  { id: '8', name: 'Modric', dynamicRating: 7.9, totalGoals: 2, totalMatches: 8, ratingsHistory: [8, 8, 7, 8, 8], motmCount: 0 },
  { id: '9', name: 'Kroos', dynamicRating: 7.8, totalGoals: 3, totalMatches: 7, ratingsHistory: [8, 7, 8, 8, 8], motmCount: 0 },
  { id: '10', name: 'Bellingham', dynamicRating: 8.4, totalGoals: 5, totalMatches: 6, ratingsHistory: [8, 9, 8, 9, 8], motmCount: 0 },
]

const sampleSeasons: Season[] = [
  { id: 's1', name: 'Apertura 2026', status: 'active', startDate: '2026-03-01' },
]

interface StoreActions {
  // Player actions
  addPlayer: (name: string, rating: number) => Player
  updatePlayerRating: (playerId: string, newRating: number) => void
  getPlayerById: (id: string) => Player | undefined
  getPlayerByName: (name: string) => Player | undefined
  
  // Match setup
  setConfirmedPlayers: (playerIds: string[]) => void
  generateTeams: () => void
  setTeams: (white: string[], black: string[]) => void
  
  // Match actions
  saveMatch: (whiteScore: number, blackScore: number, stats: MatchStats[], isSpecial?: boolean, motmPlayerId?: string) => void
  
  // Season actions
  closeSeason: () => void
  startNewSeason: (name: string) => void
  
  // Getters
  getSeasonStats: () => { topScorers: { player: Player; goals: number }[]; matchHistory: Match[]; topMotms: { player: Player; count: number }[] }
  getCurrentSeason: () => Season | undefined
}

type Store = AppState & StoreActions

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      players: samplePlayers,
      matches: [],
      seasons: sampleSeasons,
      currentSeasonId: 's1',
      confirmedPlayers: [],
      whiteTeam: [],
      blackTeam: [],

      addPlayer: (name: string, rating: number) => {
        const newPlayer: Player = {
          id: Date.now().toString(),
          name,
          dynamicRating: rating,
          totalGoals: 0,
          totalMatches: 0,
          ratingsHistory: [rating],
          motmCount: 0,
        }
        set((state) => ({ players: [...state.players, newPlayer] }))
        return newPlayer
      },

      updatePlayerRating: (playerId: string, newRating: number) => {
        set((state) => ({
          players: state.players.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  ratingsHistory: [...p.ratingsHistory, newRating],
                  dynamicRating:
                    [...p.ratingsHistory, newRating].reduce((a, b) => a + b, 0) /
                    (p.ratingsHistory.length + 1),
                }
              : p
          ),
        }))
      },

      getPlayerById: (id: string) => get().players.find((p) => p.id === id),

      getPlayerByName: (name: string) =>
        get().players.find((p) => p.name.toLowerCase() === name.toLowerCase()),

      setConfirmedPlayers: (playerIds: string[]) => {
        set({ confirmedPlayers: playerIds })
      },

      generateTeams: () => {
        const { confirmedPlayers, players } = get()
        const confirmedPlayerObjects = confirmedPlayers
          .map((id) => players.find((p) => p.id === id))
          .filter((p): p is Player => p !== undefined)
          .sort((a, b) => b.dynamicRating - a.dynamicRating)

        const white: string[] = []
        const black: string[] = []
        let whiteSum = 0
        let blackSum = 0

        // Snake draft algorithm for balanced teams
        confirmedPlayerObjects.forEach((player, index) => {
          if (index % 4 === 0 || index % 4 === 3) {
            if (whiteSum <= blackSum) {
              white.push(player.id)
              whiteSum += player.dynamicRating
            } else {
              black.push(player.id)
              blackSum += player.dynamicRating
            }
          } else {
            if (blackSum <= whiteSum) {
              black.push(player.id)
              blackSum += player.dynamicRating
            } else {
              white.push(player.id)
              whiteSum += player.dynamicRating
            }
          }
        })

        set({ whiteTeam: white, blackTeam: black })
      },

      setTeams: (white: string[], black: string[]) => {
        set({ whiteTeam: white, blackTeam: black })
      },

      saveMatch: (whiteScore: number, blackScore: number, stats: MatchStats[], isSpecial = false, motmPlayerId?: string) => {
        const { currentSeasonId, whiteTeam, blackTeam, players } = get()
        if (!currentSeasonId) return

        const newMatch: Match = {
          id: Date.now().toString(),
          seasonId: currentSeasonId,
          date: new Date().toISOString(),
          whiteScore,
          blackScore,
          whiteTeam,
          blackTeam,
          stats,
          isSpecialEvent: isSpecial,
          motmPlayerId,
        }

        // Update player stats
        const updatedPlayers = players.map((player) => {
          const playerStats = stats.find((s) => s.playerId === player.id)
          if (!playerStats) return player

          const newRatingsHistory = [...player.ratingsHistory, playerStats.matchRating]
          const newDynamicRating =
            newRatingsHistory.reduce((a, b) => a + b, 0) / newRatingsHistory.length

          // Check if this player is MOTM
          const isMotm = motmPlayerId === player.id

          return {
            ...player,
            totalGoals: player.totalGoals + playerStats.goalsScored,
            totalMatches: player.totalMatches + 1,
            ratingsHistory: newRatingsHistory,
            dynamicRating: Math.round(newDynamicRating * 10) / 10,
            motmCount: isMotm ? player.motmCount + 1 : player.motmCount,
          }
        })

        set((state) => ({
          matches: [...state.matches, newMatch],
          players: updatedPlayers,
          confirmedPlayers: [],
          whiteTeam: [],
          blackTeam: [],
        }))
      },

      closeSeason: () => {
        const { currentSeasonId, matches, players, seasons } = get()
        if (!currentSeasonId) return

        const seasonMatches = matches.filter((m) => m.seasonId === currentSeasonId)
        
        // Calculate top scorer
        const goalsByPlayer: Record<string, number> = {}
        seasonMatches.forEach((match) => {
          match.stats.forEach((stat) => {
            goalsByPlayer[stat.playerId] = (goalsByPlayer[stat.playerId] || 0) + stat.goalsScored
          })
        })

        const topScorerEntry = Object.entries(goalsByPlayer).sort(([, a], [, b]) => b - a)[0]
        
        // Calculate best rating (average across season)
        const ratingsByPlayer: Record<string, number[]> = {}
        seasonMatches.forEach((match) => {
          match.stats.forEach((stat) => {
            if (!ratingsByPlayer[stat.playerId]) ratingsByPlayer[stat.playerId] = []
            ratingsByPlayer[stat.playerId].push(stat.matchRating)
          })
        })

        const avgRatings = Object.entries(ratingsByPlayer).map(([id, ratings]) => ({
          id,
          avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
        }))
        const bestRatingEntry = avgRatings.sort((a, b) => b.avg - a.avg)[0]

        // Calculate top MOTM of the season
        const motmByPlayer: Record<string, number> = {}
        seasonMatches.forEach((match) => {
          if (match.motmPlayerId) {
            motmByPlayer[match.motmPlayerId] = (motmByPlayer[match.motmPlayerId] || 0) + 1
          }
        })
        const topMotmEntry = Object.entries(motmByPlayer).sort(([, a], [, b]) => b - a)[0]

        // Update season
        const updatedSeasons = seasons.map((s) =>
          s.id === currentSeasonId
            ? {
                ...s,
                status: 'closed' as const,
                endDate: new Date().toISOString(),
                topScorer: topScorerEntry
                  ? { playerId: topScorerEntry[0], goals: topScorerEntry[1] }
                  : undefined,
                bestRating: bestRatingEntry
                  ? { playerId: bestRatingEntry.id, rating: Math.round(bestRatingEntry.avg * 10) / 10 }
                  : undefined,
                topMotm: topMotmEntry
                  ? { playerId: topMotmEntry[0], count: topMotmEntry[1] }
                  : undefined,
              }
            : s
        )

        // Reset goals and motmCount for all players but keep dynamic rating
        const resetPlayers = players.map((p) => ({
          ...p,
          totalGoals: 0,
          motmCount: 0,
        }))

        set({
          seasons: updatedSeasons,
          players: resetPlayers,
          currentSeasonId: null,
        })
      },

      startNewSeason: (name: string) => {
        const newSeason: Season = {
          id: Date.now().toString(),
          name,
          status: 'active',
          startDate: new Date().toISOString(),
        }
        set((state) => ({
          seasons: [...state.seasons, newSeason],
          currentSeasonId: newSeason.id,
        }))
      },

      getSeasonStats: () => {
        const { currentSeasonId, matches, players } = get()
        const seasonMatches = matches.filter((m) => m.seasonId === currentSeasonId)

        const goalsByPlayer: Record<string, number> = {}
        seasonMatches.forEach((match) => {
          match.stats.forEach((stat) => {
            goalsByPlayer[stat.playerId] = (goalsByPlayer[stat.playerId] || 0) + stat.goalsScored
          })
        })

        const topScorers = Object.entries(goalsByPlayer)
          .map(([id, goals]) => ({
            player: players.find((p) => p.id === id)!,
            goals,
          }))
          .filter((entry) => entry.player)
          .sort((a, b) => b.goals - a.goals)

        // Calculate MOTM count for current season
        const motmByPlayer: Record<string, number> = {}
        seasonMatches.forEach((match) => {
          if (match.motmPlayerId) {
            motmByPlayer[match.motmPlayerId] = (motmByPlayer[match.motmPlayerId] || 0) + 1
          }
        })

        const topMotms = Object.entries(motmByPlayer)
          .map(([id, count]) => ({
            player: players.find((p) => p.id === id)!,
            count,
          }))
          .filter((entry) => entry.player)
          .sort((a, b) => b.count - a.count)

        return {
          topScorers,
          topMotms,
          matchHistory: seasonMatches.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          ),
        }
      },

      getCurrentSeason: () => {
        const { seasons, currentSeasonId } = get()
        return seasons.find((s) => s.id === currentSeasonId)
      },
    }),
    {
      name: 'futbol8-storage',
    }
  )
)

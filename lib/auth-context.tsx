"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import type { Player, AuthContext as AuthContextType } from "@/lib/types"
import { getSessionPlayer, createSession, deleteSession, getPlayers } from "@/lib/db"

const AUTH_TOKEN_KEY = 'futbol8_session'

const AuthContext = createContext<AuthContextType & {
  login: (playerId: string) => Promise<void>
  logout: () => Promise<void>
  refreshPlayer: () => Promise<void>
}>({
  player: null,
  isAdmin: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  refreshPlayer: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadSession = useCallback(async () => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      if (!token) {
        setPlayer(null)
        return
      }
      
      const sessionPlayer = await getSessionPlayer(token)
      if (sessionPlayer) {
        setPlayer(sessionPlayer)
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        setPlayer(null)
      }
    } catch {
      setPlayer(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const login = async (playerId: string) => {
    try {
      const token = await createSession(playerId)
      localStorage.setItem(AUTH_TOKEN_KEY, token)
      await loadSession()
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      if (token) {
        await deleteSession(token)
        localStorage.removeItem(AUTH_TOKEN_KEY)
      }
      setPlayer(null)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const refreshPlayer = async () => {
    await loadSession()
  }

  return (
    <AuthContext.Provider value={{
      player,
      isAdmin: player?.is_admin ?? false,
      isLoading,
      login,
      logout,
      refreshPlayer,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

// Hook to get all players for login dropdown
export function usePlayersList() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPlayers()
      .then(setPlayers)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { players, loading }
}

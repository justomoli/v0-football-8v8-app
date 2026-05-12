"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import type { Player, AuthContext as AuthContextType } from "@/lib/types"
import { getSessionPlayer, createSession, deleteSession, getPlayers } from "@/lib/db"

const AUTH_TOKEN_KEY = 'futbol8_session'
const GENERAL_SESSION_KEY = 'futjueves_general_session'

const GUEST_DEFAULT_NAME = "Invitado"

// Nombres viejos de la versión "roast" — si están en localStorage los limpiamos.
const LEGACY_ROAST_NAMES = new Set([
  "pecho frío",
  "fantasma táctico",
  "suplente emocional",
  "cono con botines",
  "9 de área chica",
  "líder del banco",
])

function createGeneralPlayer(name = GUEST_DEFAULT_NAME): Player {
  const now = new Date().toISOString()

  return {
    id: "general-user",
    name,
    dynamic_rating: 5,
    total_goals: 0,
    total_matches: 0,
    motm_count: 0,
    is_admin: true,
    is_goalkeeper: false,
    created_at: now,
    updated_at: now,
  }
}

const AuthContext = createContext<AuthContextType & {
  login: (playerId: string) => Promise<void>
  loginGeneral: (displayName?: string) => Promise<void>
  logout: () => Promise<void>
  refreshPlayer: () => Promise<void>
}>({
  player: null,
  isAdmin: false,
  isLoading: true,
  login: async () => {},
  loginGeneral: async () => {},
  logout: async () => {},
  refreshPlayer: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadSession = useCallback(async () => {
    try {
      const rawName = localStorage.getItem(GENERAL_SESSION_KEY)
      if (rawName) {
        // Migración: si el nombre cacheado era un roast viejo, lo limpiamos
        const cleanName = LEGACY_ROAST_NAMES.has(rawName.toLowerCase())
          ? GUEST_DEFAULT_NAME
          : rawName
        if (cleanName !== rawName) {
          localStorage.setItem(GENERAL_SESSION_KEY, cleanName)
        }
        setPlayer(createGeneralPlayer(cleanName))
        return
      }

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
      localStorage.removeItem(GENERAL_SESSION_KEY)
      localStorage.setItem(AUTH_TOKEN_KEY, token)
      await loadSession()
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const loginGeneral = async (displayName?: string) => {
    const name = displayName?.trim() || GUEST_DEFAULT_NAME
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.setItem(GENERAL_SESSION_KEY, name)
    setPlayer(createGeneralPlayer(name))
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      if (token) {
        await deleteSession(token)
        localStorage.removeItem(AUTH_TOKEN_KEY)
      }
      localStorage.removeItem(GENERAL_SESSION_KEY)
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
      // Sin roles: todos pueden usar todas las herramientas de la app
      isAdmin: true,
      isLoading,
      login,
      loginGeneral,
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

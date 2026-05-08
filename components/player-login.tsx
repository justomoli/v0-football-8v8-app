"use client"

import { useState } from "react"
import { useAuth, usePlayersList } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, LogIn, User, Shield } from "lucide-react"

export function PlayerLogin() {
  const { login, player, logout, isLoading: authLoading } = useAuth()
  const { players, loading: playersLoading } = usePlayersList()
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleLogin = async () => {
    if (!selectedPlayerId) return
    setIsLoggingIn(true)
    try {
      await login(selectedPlayerId)
    } catch {
      // Error handled in context
    } finally {
      setIsLoggingIn(false)
    }
  }

  if (authLoading) {
    return (
      <Card className="mx-auto max-w-md border-border/50 bg-card/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (player) {
    return (
      <Card className="mx-auto max-w-md border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/20 p-2">
              {player.is_admin ? (
                <Shield className="h-5 w-5 text-primary" />
              ) : (
                <User className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">Bienvenido, {player.name}</CardTitle>
              <CardDescription className="text-xs">
                {player.is_admin ? "Administrador" : "Jugador"} - Rating: {player.dynamic_rating.toFixed(1)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <span>{player.total_matches} partidos</span>
              <span className="mx-2">|</span>
              <span>{player.total_goals} goles</span>
              <span className="mx-2">|</span>
              <span>{player.motm_count} MOTM</span>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              Salir
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-md border-border/50 bg-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/20 p-2">
            <LogIn className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Iniciar Sesion</CardTitle>
            <CardDescription className="text-xs">
              Selecciona tu nombre para continuar
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select 
          value={selectedPlayerId} 
          onValueChange={setSelectedPlayerId}
          disabled={playersLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={playersLoading ? "Cargando jugadores..." : "Selecciona tu nombre"} />
          </SelectTrigger>
          <SelectContent>
            {players.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <div className="flex items-center gap-2">
                  {p.is_admin && <Shield className="h-3 w-3 text-primary" />}
                  <span>{p.name}</span>
                  <span className="text-muted-foreground">({p.dynamic_rating.toFixed(1)})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button 
          onClick={handleLogin} 
          disabled={!selectedPlayerId || isLoggingIn}
          className="w-full"
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ingresando...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Ingresar
            </>
          )}
        </Button>
        
        <p className="text-center text-xs text-muted-foreground">
          No necesitas contrasena. Solo selecciona tu nombre.
        </p>
      </CardContent>
    </Card>
  )
}

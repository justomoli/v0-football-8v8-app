"use client"

import { useEffect, useState } from "react"

/** Fulbito jueves: humor afilado contra el ego, sin ser odio grave. */
export const DEMOTIVATIONAL_QUOTES: string[] = [
  "Nadie scoutea estos partidos… salvo vos en tu mente.",
  "El equipo te necesita igual que necesita un segundo arco en el medio.",
  "Si estuvieras lesionado igual el resultado sería cinematográfico.",
  "Messi existe para que tus videos de regate parezcan documentales de terror.",
  "Estadísticas no mienten. Vos tampoco cuando decís «estaba cansado».",
  "Ya casi llegás al nivel profesional… del amague del calentamiento.",
  "Motivación gratis: después del partido el asado no corrige fantasmas.",
  "Tu prime fue el minuto antes de que llegue WhatsApp.",
  "No sos malo… sos «en construcción» desde el Clausura anterior.",
  "El VAR no viene a este país; el karma del offside igual factura.",
  "El equipo confía en vos como en el Wi‑Fi del predio.",
  "La cancha tiene memoria corta menos cuando errás ese pase corto.",
  "No es soberbia: es déficit verificado de gambeta.",
  "Correr sin pelota cuenta como cardio pero no como fútbol.",
  "Hay talento en el grupo; en este chat también hay humo.",
  "Si el ego fuera físico estarías lesionado de alta gama desde enero.",
  "El plan era jugar simple. Implementaste filosofía existentialista.",
  "El entrenamiento invisible no suma estadísticas pero suma verdades.",
  "No es falta técnica, es obra abstracta contemporánea del toque.",
  "El banquillo tiene tu nombre provisional en rotulador borrable.",
  "La semana tiene 7 partidos cuando el delirio manda mensajes.",
  "No estás viejo si no podés hacer la bicicleta. Estás en realidad aumentada.",
  "El equipo te banca… geológicamente, con paciencia tectónica.",
  "Decile al ego que llegó tarde: el omnibus del juego ya frenó.",
  "No perdés física perdés contra la narrativa auto–producida.",
  "El control del balón se fue de vacaciones; quedás vos con bronca premium.",
  "La magia existe: es llamarla gambeta y que sea pérdida táctica bonita.",
  "El rating sube cuando el mundo se equivoca vos no cuando la realidad coincide.",
  "El offside existe para recordarte límites aunque en la vida sos libre igual.",
  "No es falta si el árbitro también quiere vivir tranquilo ese jueves.",
  "Ganar bien es mejor que ganar y subir historia con capítulo nuevo de humo.",
  "El equipo es familia; algunos tíos igual quedan en offside sentimental.",
  "Si el resultado duele compilá estadísticas mejor que compilá excusas en HD.",
  "El plantel tiene profundidad. Vos tenés filtros.",
  "No es épica recuperación tras perder dos veces si seguís comiendo la misma gambeta cerebral.",
  "La confianza se gana jugando menos hablando estadísticas fantasmas en grupo.",
  "Si el duelo uno contra uno fue mental, ganó el rival sin transpirar la camiseta.",
  "Hay que leer el juego igual que los términos de Spotify: rápido y con dolor mínimo real.",
]

export function randomDemotivation(exclude?: string): string {
  const n = DEMOTIVATIONAL_QUOTES.length
  if (n === 0) return ""
  if (n === 1) return DEMOTIVATIONAL_QUOTES[0]!
  let pick = DEMOTIVATIONAL_QUOTES[Math.floor(Math.random() * n)]!
  let guard = 0
  while (pick === exclude && guard++ < 32) {
    pick = DEMOTIVATIONAL_QUOTES[Math.floor(Math.random() * n)]!
  }
  return pick
}

/** Nueva frase al montar y cada `intervalMs` (solo en cliente). */
export function useRotatingDemotivation(intervalMs = 48_000): string {
  const [quote, setQuote] = useState<string>(() =>
    DEMOTIVATIONAL_QUOTES.length ? randomDemotivation() : "",
  )

  useEffect(() => {
    if (!DEMOTIVATIONAL_QUOTES.length) return
    const tick = () => setQuote((prev) => randomDemotivation(prev))
    const id = window.setInterval(tick, intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return quote
}

/** Alias cortitos para cuando el usuario entra sin apodo */
export function randomRoastNickname(): string {
  const nick = [
    "pecho frío",
    "recuerdo táctico",
    "fantasma táctico",
    "suplente emocional",
    "cono con botines",
    "9 de área chica",
    "líder del banco",
    "Ídolo regional del amague",
    "Highlights pendientes desde 2019",
    "Firma gratis del mercado de pibes",
    "Capitán del equipo rival",
    "Estrella del calentamiento largo",
  ]
  return nick[Math.floor(Math.random() * nick.length)]!
}

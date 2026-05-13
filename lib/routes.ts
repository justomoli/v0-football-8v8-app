/**
 * Mapeo central de tabs ↔ rutas reales.
 * Cualquier nav o navegación programática debe usar estos paths.
 */
export const ROUTES = {
  home: "/",
  parser: "/jugadores",
  players: "/plantel",
  matchmaker: "/equipos",
  postmatch: "/partido",
  stats: "/stats",
  admin: "/ajustes",
} as const

export type RouteKey = keyof typeof ROUTES
export type RoutePath = (typeof ROUTES)[RouteKey]

/** Reverse map: path → key */
export const PATH_TO_KEY: Record<string, RouteKey> = Object.fromEntries(
  Object.entries(ROUTES).map(([k, v]) => [v, k as RouteKey])
) as Record<string, RouteKey>

/** Resolve a tab key to its full route path. Safe fallback to /. */
export function routeFor(key: string): string {
  return (ROUTES as Record<string, string>)[key] ?? "/"
}

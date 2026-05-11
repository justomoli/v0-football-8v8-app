import type { Player } from "./types"

/**
 * Slugify a name for the photo filename convention.
 *  - lowercased
 *  - accents stripped
 *  - non-alphanumeric → "-"
 *  - collapsed dashes
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")     // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Resolve a photo URL for a player.
 *
 * Priority:
 *  1. Explicit `photo_url` in DB
 *  2. Convention: `/players/<slug>.jpg`
 *
 * If neither exists at request time the consumer should provide a fallback
 * (inicial gradient avatar).
 */
export function getPhotoUrl(player: Player): string {
  if (player.photo_url && player.photo_url.trim().length > 0) {
    return player.photo_url
  }
  return `/players/${slugify(player.name)}.jpg`
}

/**
 * Tier color mapping for player ratings.
 * Used across player cards, lists, and the home dashboard for visual consistency.
 *
 * Tiers:
 *   ≥ 8  → emerald (crack)
 *   ≥ 6  → cyan    (bueno)
 *   ≥ 4  → amber   (promedio)
 *   <  4 → red     (refuerzo)
 */
export const tierColor = (r: number): string =>
  r >= 8 ? "oklch(0.78 0.18 145)" :
  r >= 6 ? "oklch(0.78 0.15 195)" :
  r >= 4 ? "oklch(0.85 0.16 85)"  :
           "oklch(0.7 0.2 25)"

export const tierLabel = (r: number): string =>
  r >= 8 ? "Crack" :
  r >= 6 ? "Bueno" :
  r >= 4 ? "Promedio" :
           "Refuerzo"

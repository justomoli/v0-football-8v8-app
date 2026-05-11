/** Convierte atributos guardados (1–99 legacy o ya 1–10) al rango visible 1–10 con pasos de 0.5 */
export function attributeToTen(
  value: number | null | undefined,
  dynamicRatingFallback: number,
): number {
  let x = dynamicRatingFallback
  if (value != null && !Number.isNaN(value)) {
    if (value > 11.5) {
      x = value / 10
    } else {
      x = value
    }
  }
  const clamped = Math.min(10, Math.max(1, x))
  return Math.round(clamped * 2) / 2
}

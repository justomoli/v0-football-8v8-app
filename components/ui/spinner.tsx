"use client"

import { useEffect, useId, useState, type ComponentProps } from "react"

import { cn } from "@/lib/utils"

/**
 * F8 logotype — sports stencil-cut style.
 *
 * Construction (180×180 viewBox):
 *  - F: notched bold letterform at x≈34–82 with a chamfer cut on top-right
 *      (gives a "ripped jersey number" feel when paired with italic skew).
 *  - 8: figure-of-eight built from two donuts (evenodd holes) at x≈98–146.
 *  - A diagonal speed-slash bar between the letters that cuts both glyphs
 *      via a mask (see SVG below). The slash is rendered as its own path so
 *      the trace animation draws it last like a final brushstroke.
 *
 * The italic skew (~7°) is applied via group transform — keeps the source
 * paths orthogonal/readable while making the glyph feel like motion.
 */
const LOGO_PATHS = [
  // F — bold with chamfered top-right (stencil notch)
  "M34 48 L86 48 L86 56 L74 64 L50 64 L50 84 L76 84 L76 98 L50 98 L50 134 L34 134 Z",
  // 8 — two stacked donuts via evenodd fill-rule
  "M146 72 A24 24 0 1 0 98 72 A24 24 0 1 0 146 72 Z " +
    "M134 72 A12 12 0 1 1 110 72 A12 12 0 1 1 134 72 Z " +
    "M146 112 A24 24 0 1 0 98 112 A24 24 0 1 0 146 112 Z " +
    "M134 112 A12 12 0 1 1 110 112 A12 12 0 1 1 134 112 Z",
] as const

/** Diagonal speed-slash cutting through both glyphs (mask removes it visually). */
const SLASH_RECT = { x: 18, y: 90, w: 150, h: 4 }

type SpinnerProps = ComponentProps<"span"> & {
  /** Tamaño del icono en píxeles (ancho y alto). Por defecto 16. */
  logoSize?: number
}

function Spinner({ className, logoSize, ...props }: SpinnerProps) {
  const clipId = useId().replace(/:/g, "")
  const inner = logoSize ?? undefined

  return (
    <span
      role="status"
      aria-label="Cargando"
      className={cn(
        "relative inline-grid h-5 w-5 shrink-0 place-items-center text-primary",
        "motion-safe:animate-[logoLoaderPulse_1.9s_ease-in-out_infinite]",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className="absolute inset-[-34%] rounded-full bg-primary/14 blur-md motion-safe:animate-[logoLoaderHalo_1.9s_ease-in-out_infinite]"
      />
      <svg
        viewBox="0 0 180 180"
        className="relative h-full w-full drop-shadow-[0_0_12px_oklch(0.8_0.15_195/0.34)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        width={inner}
        height={inner}
        style={
          inner
            ? undefined
            : {
                width: "62%",
                height: "62%",
              }
        }
      >
        <defs>
          <clipPath id={clipId}>
            <rect width="180" height="180" fill="white" />
          </clipPath>
          {/* Mask: black slash cuts a diagonal gap through the glyphs */}
          <mask id={`${clipId}-slice`}>
            <rect width="180" height="180" fill="white" />
            <rect
              x={SLASH_RECT.x}
              y={SLASH_RECT.y}
              width={SLASH_RECT.w}
              height={SLASH_RECT.h}
              fill="black"
              transform="rotate(-9 90 90)"
            />
          </mask>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <g
            mask={`url(#${clipId}-slice)`}
            transform="translate(90 90) scale(1.18) skewX(-7) translate(-90 -90)"
          >
            <g className="opacity-25">
              {LOGO_PATHS.map((d, i) => (
                <path
                  key={`outline-${i}`}
                  d={d}
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="5"
                />
              ))}
            </g>
            {LOGO_PATHS.map((d, i) => (
              <path
                key={`fill-${i}`}
                d={d}
                fill="currentColor"
                fillRule="evenodd"
              />
            ))}
            <g className="logo-loader-trace">
              {LOGO_PATHS.map((d, i) => (
                <path
                  key={`trace-${i}`}
                  d={d}
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="7"
                  pathLength="1"
                />
              ))}
            </g>
            <g className="logo-loader-spark">
              {LOGO_PATHS.map((d, i) => (
                <path
                  key={`spark-${i}`}
                  d={d}
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  pathLength="1"
                />
              ))}
            </g>
            {LOGO_PATHS.map((d, i) => (
              <path
                key={`front-${i}`}
                d={d}
                fill="currentColor"
                fillRule="evenodd"
                className="opacity-80"
              />
            ))}
          </g>
        </g>
      </svg>
    </span>
  )
}

type LoadingStateProps = {
  message?: string
  className?: string
  spinnerClassName?: string
  /**
   * Si es mayor que 0, la pantalla solo aparece tras ese tiempo en milisegundos.
   * Así las cargas muy cortas no muestran overlay. Usa 0 para mostrar al instante.
   */
  delayMs?: number
  /** Centrado en el área de contenido (descuenta header sticky + nav flotante). */
  contentCentered?: boolean
}

function LoadingState({
  message = "Cargando",
  className,
  spinnerClassName,
  delayMs = 380,
  contentCentered = true,
}: LoadingStateProps) {
  const [visible, setVisible] = useState(delayMs <= 0)

  useEffect(() => {
    if (delayMs <= 0) return
    const id = window.setTimeout(() => setVisible(true), delayMs)
    return () => window.clearTimeout(id)
  }, [delayMs])

  if (!visible) return null

  /**
   * Compensación para centrar visualmente entre el header sticky (~64px) y
   * la nav flotante (≈80px de alto + bottom-offset). Se aplica como padding
   * al contenedor flex → el centrado real es entre header y nav.
   */
  const contentPadding = contentCentered ? "pt-16 pb-24" : ""

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-hidden bg-[oklch(0.055_0.016_260)]",
        contentPadding,
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,oklch(0.8_0.15_195/0.12),transparent_34%),radial-gradient(circle_at_18%_82%,oklch(0.75_0.18_160/0.07),transparent_38%),linear-gradient(180deg,oklch(0.08_0.018_250/0.9),oklch(0.045_0.014_265))]" />
      <div className="pitch-grid absolute inset-0 opacity-[0.08]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_30%,oklch(0.025_0.01_265/0.78)_100%)]" />
      <div className="relative z-10 grid place-items-center">
        <Spinner className={cn("h-[8.5rem] w-[8.5rem] md:h-40 md:w-40", spinnerClassName)} />
      </div>
      <span className="sr-only">{message}</span>
    </div>
  )
}

export { Spinner, LoadingState }

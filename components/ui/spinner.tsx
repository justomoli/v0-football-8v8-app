"use client"

import { useEffect, useState, type ComponentProps } from "react"
import { cn } from "@/lib/utils"

/* ── Inline spinner (usado en botones, filas, etc.) ──────────────────────
   Arc ring simple — legible desde h-3 hasta h-8.
   No usa imagen porque a esos tamaños sería invisible.
──────────────────────────────────────────────────────────────────────── */
type SpinnerProps = ComponentProps<"span"> & {
  /** @deprecated no longer used — kept for API compat */
  logoSize?: number
}

function Spinner({ className, logoSize: _logoSize, ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={cn(
        "relative inline-grid h-5 w-5 shrink-0 place-items-center text-primary",
        className,
      )}
      {...props}
    >
      <svg
        className="absolute inset-0 h-full w-full animate-spin"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
        style={{ animationDuration: "0.85s", animationTimingFunction: "linear" }}
      >
        {/* Track */}
        <circle
          cx="16" cy="16" r="12"
          stroke="currentColor"
          strokeWidth="2.5"
          className="opacity-[0.12]"
        />
        {/* Arc */}
        <circle
          cx="16" cy="16" r="12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="28 47"
          style={{ filter: "drop-shadow(0 0 4px currentColor)" }}
        />
      </svg>
      {/* Center dot */}
      <span
        aria-hidden
        className="relative rounded-sm"
        style={{
          width: "28%",
          height: "28%",
          background: "currentColor",
          boxShadow: "0 0 5px currentColor",
        }}
      />
    </span>
  )
}

/* ── LoadingState — pantalla completa con logo.png ───────────────────── */
type LoadingStateProps = {
  message?: string
  className?: string
  spinnerClassName?: string
  delayMs?: number
  contentCentered?: boolean
}

function LoadingState({
  message = "Cargando",
  className,
  delayMs = 380,
  contentCentered = true,
}: LoadingStateProps) {
  const [visible, setVisible] = useState(delayMs <= 0)

  useEffect(() => {
    if (delayMs <= 0) return
    const id = window.setTimeout(() => setVisible(true), delayMs)
    return () => window.clearTimeout(id)
  }, [delayMs])

  useEffect(() => {
    if (!visible) return
    const ov = document.body.style.overflow
    const ta = document.body.style.touchAction
    document.body.style.overflow = "hidden"
    document.body.style.touchAction = "none"
    return () => {
      document.body.style.overflow = ov
      document.body.style.touchAction = ta
    }
  }, [visible])

  if (!visible) return null

  const contentPadding = contentCentered ? "pt-10 pb-40" : ""

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-hidden",
        "bg-[oklch(0.055_0.016_260)]",
        contentPadding,
        className,
      )}
    >
      {/* Background radials */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,oklch(0.8_0.15_195/0.12),transparent_34%),radial-gradient(circle_at_18%_82%,oklch(0.75_0.18_160/0.07),transparent_38%),linear-gradient(180deg,oklch(0.08_0.018_250/0.9),oklch(0.045_0.014_265))]" />
      <div className="pitch-grid absolute inset-0 opacity-[0.08]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_30%,oklch(0.025_0.01_265/0.78)_100%)]" />

      {/* Logo hero */}
      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="logo-loader-wrap relative">

          {/* Outer glow halo */}
          <span
            aria-hidden
            className="logo-loader-halo absolute inset-[-28%] rounded-[2.8rem] pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, oklch(0.78 0.22 145 / 0.22) 0%, oklch(0.78 0.22 145 / 0.06) 55%, transparent 75%)",
              filter: "blur(12px)",
            }}
          />

          {/* Rotating orbit arc */}
          <svg
            aria-hidden
            className="logo-loader-orbit absolute inset-[-14%] h-[128%] w-[128%] pointer-events-none"
            viewBox="0 0 100 100"
            fill="none"
          >
            {/* track */}
            <circle
              cx="50" cy="50" r="46"
              stroke="oklch(0.78 0.22 145 / 0.10)"
              strokeWidth="1"
            />
            {/* arc */}
            <circle
              cx="50" cy="50" r="46"
              stroke="oklch(0.78 0.22 145)"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeDasharray="52 237"
              style={{
                filter: "drop-shadow(0 0 3px oklch(0.78 0.22 145 / 0.9))",
              }}
            />
            {/* bright dot at arc head */}
            <circle
              cx="50" cy="4" r="2.2"
              fill="oklch(0.95 0.22 145)"
              style={{ filter: "drop-shadow(0 0 5px oklch(0.78 0.22 145))" }}
            />
          </svg>

          {/* Counter-rotating second arc — opposite phase */}
          <svg
            aria-hidden
            className="logo-loader-orbit-rev absolute inset-[-14%] h-[128%] w-[128%] pointer-events-none"
            viewBox="0 0 100 100"
            fill="none"
          >
            <circle
              cx="50" cy="50" r="46"
              stroke="oklch(0.78 0.15 195 / 0.35)"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeDasharray="18 271"
              style={{ filter: "drop-shadow(0 0 2px oklch(0.78 0.15 195 / 0.7))" }}
            />
          </svg>

          {/* Logo image */}
          <div
            className="logo-loader-img relative overflow-hidden rounded-[1.6rem]"
            style={{
              width: 128,
              height: 128,
              boxShadow:
                "0 0 0 1.5px oklch(0.78 0.22 145 / 0.30), 0 0 32px oklch(0.78 0.22 145 / 0.25), 0 8px 40px rgba(0,0,0,0.6)",
            }}
          >
            {/* Scan line sweep */}
            <span
              aria-hidden
              className="logo-loader-scan absolute inset-x-0 pointer-events-none"
              style={{
                top: "-10%",
                height: "30%",
                background:
                  "linear-gradient(180deg, transparent, oklch(0.78 0.22 145 / 0.18) 40%, oklch(0.95 0.18 145 / 0.08) 55%, transparent)",
                zIndex: 2,
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="FutJueves"
              className="h-full w-full object-cover"
              draggable={false}
            />
          </div>
        </div>
      </div>

      <span className="sr-only">{message}</span>
    </div>
  )
}

export { Spinner, LoadingState }

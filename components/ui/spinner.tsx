import { useId, type ComponentProps } from "react"

import { cn } from "@/lib/utils"

const LOGO_PATHS = [
  "M101.141 53H136.632C151.023 53 162.689 64.6662 162.689 79.0573V112.904H148.112V79.0573C148.112 78.7105 148.098 78.3662 148.072 78.0251L112.581 112.898C112.701 112.902 112.821 112.904 112.941 112.904H148.112V126.672H112.941C98.5504 126.672 86.5638 114.891 86.5638 100.5V66.7434H101.141V100.5C101.141 101.15 101.191 101.792 101.289 102.422L137.56 66.7816C137.255 66.7563 136.945 66.7434 136.632 66.7434H101.141V53Z",
  "M65.2926 124.136L14 66.7372H34.6355L64.7495 100.436V66.7372H80.1365V118.47C80.1365 126.278 70.4953 129.958 65.2926 124.136Z",
] as const

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
        className="absolute inset-[-34%] rounded-full bg-primary/24 blur-md motion-safe:animate-[logoLoaderHalo_1.9s_ease-in-out_infinite]"
      />
      <svg
        viewBox="0 0 180 180"
        className="relative h-full w-full drop-shadow-[0_0_14px_oklch(0.75_0.18_160/0.45)]"
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
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <g transform="translate(90 90) scale(1.18) translate(-90 -90)">
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
              <path key={`fill-${i}`} d={d} fill="currentColor" />
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
              <path key={`front-${i}`} d={d} fill="currentColor" className="opacity-80" />
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
}

function LoadingState({ message = "Cargando", className, spinnerClassName }: LoadingStateProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-hidden bg-background",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,oklch(0.75_0.18_160/0.13),transparent_34%),radial-gradient(circle_at_50%_62%,oklch(0.8_0.15_195/0.09),transparent_42%)]" />
      <div className="pitch-grid absolute inset-0 opacity-[0.22]" />
      <div className="relative z-10 grid -translate-y-8 place-items-center md:-translate-y-10">
        <Spinner className={cn("h-36 w-36 md:h-40 md:w-40", spinnerClassName)} />
      </div>
      <span className="sr-only">{message}</span>
    </div>
  )
}

export { Spinner, LoadingState }

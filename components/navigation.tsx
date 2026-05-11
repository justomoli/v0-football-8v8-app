"use client"

import { cn } from "@/lib/utils"
import { Home, Users, Shuffle, Trophy, BarChart3, Settings, UserRound } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: "home",       label: "Home",      icon: Home },
  { id: "parser",     label: "Carga",     icon: Users },
  { id: "players",    label: "Plantel",   icon: UserRound },
  { id: "matchmaker", label: "Equipos",   icon: Shuffle },
  { id: "postmatch",  label: "Partido",   icon: Trophy },
  { id: "stats",      label: "Stats",     icon: BarChart3 },
]
const adminTab = { id: "admin", label: "Admin", icon: Settings }

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { isAdmin } = useAuth()
  const allTabs = isAdmin ? [...tabs, adminTab] : tabs

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-3 anim-fade-up delay-3"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="glass-dock mx-auto flex max-w-[calc(100vw-1.5rem)] items-center justify-start gap-1 overflow-x-auto rounded-[2rem] px-2 py-2 sm:justify-center">
        {allTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex items-center gap-2 rounded-full border px-3 py-2.5 text-xs font-semibold tracking-tight",
                "transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45",
                isActive
                  ? "scale-[1.03] border-primary/40 bg-primary/15 text-white shadow-[0_0_22px_oklch(0.75_0.18_160/0.28),inset_0_1px_0_oklch(1_0_0/0.12)] backdrop-blur-xl"
                  : "border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/[0.06] hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute inset-x-3 -bottom-1 h-px bg-gradient-to-r from-transparent via-primary/75 to-transparent" />
              )}
              <Icon
                className={cn(
                  "transition-all duration-300",
                  isActive ? "h-4 w-4 text-primary" : "h-5 w-5"
                )}
              />
              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-all duration-300",
                  isActive ? "max-w-[68px] opacity-100" : "max-w-0 opacity-0"
                )}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

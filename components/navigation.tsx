"use client"

import { cn } from "@/lib/utils"
import { Home, Users, Shuffle, Trophy, BarChart3, Settings } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: "home",       label: "Home",      icon: Home },
  { id: "parser",     label: "Jugadores", icon: Users },
  { id: "matchmaker", label: "Equipos",   icon: Shuffle },
  { id: "postmatch",  label: "Partido",   icon: Trophy },
  { id: "stats",      label: "Stats",     icon: BarChart3 },
]
const adminTab = { id: "admin", label: "Admin", icon: Settings }

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { isAdmin } = useAuth()
  const allTabs = isAdmin ? [...tabs, adminTab] : tabs

  return (
    <nav className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 anim-fade-up delay-3">
      <div className="glass-strong flex items-center gap-1 rounded-full px-2 py-2">
        {allTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex items-center gap-2 rounded-full px-3.5 py-2.5 text-xs font-semibold",
                "transition-all duration-300 ease-out",
                isActive
                  ? "bg-primary text-primary-foreground shadow-[0_0_18px_oklch(0.75_0.18_160/0.6)] scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
              style={{ fontFamily: "var(--font-outfit, Outfit, sans-serif)" }}
            >
              <Icon
                className={cn(
                  "transition-all duration-300",
                  isActive ? "h-4 w-4" : "h-5 w-5"
                )}
              />
              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-all duration-300",
                  isActive ? "max-w-[64px] opacity-100" : "max-w-0 opacity-0"
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

"use client"

import { cn } from "@/lib/utils"
import { Users, Shuffle, Trophy, BarChart3, Sparkles } from "lucide-react"

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: "parser", label: "Jugadores", icon: Users },
  { id: "matchmaker", label: "Equipos", icon: Shuffle },
  { id: "postmatch", label: "Partido", icon: Trophy },
  { id: "stats", label: "Stats", icon: BarChart3 },
]

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all duration-200",
                isActive
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )}
              />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <Sparkles className="absolute -top-1 right-1 h-3 w-3 text-primary animate-pulse" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

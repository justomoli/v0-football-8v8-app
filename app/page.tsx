"use client"

import { useRouter } from "next/navigation"
import { HomeDashboard } from "@/components/home-dashboard"
import { routeFor } from "@/lib/routes"

export default function HomePage() {
  const router = useRouter()
  return <HomeDashboard onNavigate={(key) => router.push(routeFor(key))} />
}

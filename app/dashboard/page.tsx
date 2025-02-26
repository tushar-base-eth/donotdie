"use client"

import { useRouter } from "next/navigation"
import { Moon, Settings, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { MetricsCards } from "@/components/dashboard/metrics-cards"
import { VolumeChart } from "@/components/dashboard/volume-chart"
import { BottomNav } from "@/components/navigation/bottom-nav"

// Mock data
const stats = {
  totalWorkouts: 26,
  totalVolume: 15484,
}

export default function DashboardPage() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 backdrop-blur-lg">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <MetricsCards totalWorkouts={stats.totalWorkouts} totalVolume={stats.totalVolume} />
        <VolumeChart />
      </div>

      <BottomNav />
    </div>
  )
}


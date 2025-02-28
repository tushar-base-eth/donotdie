"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUnitPreference } from "@/lib/hooks/use-unit-preference"

interface MetricsCardsProps {
  totalWorkouts: number
  totalVolume: number
}

export function MetricsCards({ totalWorkouts, totalVolume }: MetricsCardsProps) {
  const { formatWeight } = useUnitPreference()

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalWorkouts}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatWeight(totalVolume)}</div>
        </CardContent>
      </Card>
    </div>
  )
}


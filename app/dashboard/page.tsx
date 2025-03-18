"use client";

import { useDashboardData } from "@/lib/hooks/use-dashboard-data";
import { useUnitPreference } from "@/lib/hooks/use-unit-preference";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { VolumeChart } from "@/components/dashboard/volume-chart";
import { useUserProfile } from "@/contexts/profile-context";
import { motion } from "framer-motion";
import { MetricsSkeleton } from "@/components/loading/metrics-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { state: { profile } } = useUserProfile();
  const { formatWeight } = useUnitPreference();
  const { volumeData, timeRange, setTimeRange, isLoading, error, mutate } = useDashboardData(profile?.id || "");

  if (error) {
    return (
      <div className="p-4 container max-w-5xl mx-auto">
        <Card className="border glass shadow-md card-highlight rounded-[var(--radius)]">
          <CardContent className="p-6">
            Failed to load data.{" "}
            <Button variant="ghost" onClick={() => mutate()} className="text-blue-500 btn-glow rounded-[var(--radius)]">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <div className="container max-w-5xl mx-auto p-4 space-y-6">
          <MetricsSkeleton />
        </div>
      </div>
    );
  }

  if (!profile) {
    return null; // Middleware redirects
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="container max-w-5xl mx-auto p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border glass shadow-md card-highlight rounded-[var(--radius)] overflow-hidden">
            <CardContent className="p-6">
              <MetricsCards
                totalWorkouts={profile.total_workouts ?? 0}
                totalVolume={profile.total_volume ?? 0}
                formatWeight={formatWeight}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="border glass shadow-md card-highlight rounded-[var(--radius)] overflow-hidden">
            <CardContent className="p-6">
              <VolumeChart data={volumeData} timeRange={timeRange} onTimeRangeChange={setTimeRange} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
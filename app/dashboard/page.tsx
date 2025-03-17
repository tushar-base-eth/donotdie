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
import { AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const { state: { profile } } = useUserProfile();
  const { formatWeight } = useUnitPreference();
  const { volumeData, timeRange, setTimeRange, isLoading, error, mutate } = useDashboardData(profile?.id || "");

  if (error) {
    return (
      <div className="p-8 container max-w-5xl mx-auto">
        <Card className="glass shadow-lg rounded-xl">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <div className="space-y-2">
              <p className="text-foreground font-medium">Failed to load your dashboard data</p>
              <Button
                variant="ghost"
                onClick={() => mutate()}
                className="text-primary hover:bg-primary/10 rounded-lg px-4 py-2 transition-all duration-300"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <div className="container max-w-5xl mx-auto p-8 space-y-8">
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
      <div className="container max-w-5xl mx-auto p-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <Card className="glass shadow-lg rounded-xl overflow-hidden">
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
          transition={{ duration: 0.5, ease: "easeInOut", delay: 0.2 }}
        >
          <Card className="glass shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <VolumeChart data={volumeData} timeRange={timeRange} onTimeRangeChange={setTimeRange} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
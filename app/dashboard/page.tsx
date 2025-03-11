"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { VolumeChart } from "@/components/dashboard/volume-chart";
import { useAuth } from "@/contexts/auth-context";
import { motion } from "framer-motion";
import { MetricsSkeleton } from "@/components/loading/metrics-skeleton";
import { useProfile } from "@/lib/hooks/use-profile";
import { useVolumeData } from "@/lib/hooks/data-hooks";
import { useUnitPreference } from "@/lib/hooks/use-unit-preference";
import { formatVolumeData } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

export default function DashboardPage() {
  const { state } = useAuth();
  const { user } = state;
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<"7days" | "8weeks" | "12months">("7days");
  const { formatWeight } = useUnitPreference();
  const { profile, isLoading: profileLoading, error: profileError, mutate: mutateProfile } = useProfile(user?.id || "");
  const { volumeData, isLoading: volumeLoading, isError: volumeError, mutate: mutateVolume } = useVolumeData(
    user?.id || "",
    timeRange
  );

  if (profileError || volumeError) {
    return (
      <div className="p-4 container max-w-5xl mx-auto">
        <Card className="border glass shadow-md rounded-2xl">
          <CardContent className="p-6">
            Failed to load data.{" "}
            <Button
              variant="ghost"
              onClick={() => {
                mutateProfile();
                mutateVolume();
              }}
              className="text-blue-500"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profileLoading || volumeLoading) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <div className="container max-w-5xl mx-auto p-4 space-y-6">
          <MetricsSkeleton />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 container max-w-5xl mx-auto">
        <Card className="border glass shadow-md rounded-2xl">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">No profile data available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formattedVolumeData = formatVolumeData(volumeData, timeRange);

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="container max-w-5xl mx-auto p-4 space-y-6">
        {/* Metrics Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border glass shadow-md rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <MetricsCards
                totalWorkouts={profile.total_workouts ?? 0}
                totalVolume={profile.total_volume ?? 0}
                formatWeight={formatWeight}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Volume Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="border glass shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-2">
              <CardTitle className="text-xl flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                Volume Progress
              </CardTitle>
              <CardDescription>Track your volume over time</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <VolumeChart data={formattedVolumeData} timeRange={timeRange} onTimeRangeChange={setTimeRange} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// Removed the local Bell component since we're using the Lucide icon directly
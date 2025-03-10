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
      <div className="p-4">
        Failed to load data.{" "}
        <button
          onClick={() => {
            mutateProfile();
            mutateVolume();
          }}
          className="text-blue-500 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (profileLoading || volumeLoading) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <div className="p-4 space-y-6">
          <MetricsSkeleton />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4">
        <p className="text-center text-muted-foreground">No profile data available.</p>
      </div>
    );
  }

  const formattedVolumeData = formatVolumeData(volumeData, timeRange);

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass p-4 rounded-3xl shadow-md"
        >
          <MetricsCards
            totalWorkouts={profile.total_workouts ?? 0}
            totalVolume={profile.total_volume ?? 0}
            formatWeight={formatWeight}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="glass p-4 rounded-3xl shadow-md"
        >
          <VolumeChart data={formattedVolumeData} timeRange={timeRange} onTimeRangeChange={setTimeRange} />
        </motion.div>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { VolumeChart } from "@/components/dashboard/volume-chart";
import { useAuth } from "@/contexts/auth-context";
import ProtectedRoute from "@/components/auth/protected-route";
import {
  format,
  subDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isSameWeek,
  isSameMonth,
  parse,
} from "date-fns";
import { motion } from "framer-motion";
import { MetricsSkeleton } from "@/components/loading/metrics-skeleton";
import { formatUtcToLocalDate } from "@/lib/utils";
import { useProfile, useVolumeData } from "@/lib/hooks/data-hooks";
import { useUnitPreference } from "@/lib/hooks/use-unit-preference";

interface VolumeData {
  date: string;
  volume: number;
}

export default function DashboardPage() {
  const { state } = useAuth();
  const { user } = state;
  const isLoading = state.status === "loading";
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<"7days" | "8weeks" | "12months">("7days");
  const { formatWeight, formatHeight } = useUnitPreference();

  const { profile, isLoading: profileLoading, error: profileError, mutate: mutateProfile } = useProfile(user?.id || "");
  const { volumeData, isLoading: volumeLoading, error: volumeError, mutate: mutateVolume } = useVolumeData(
    user?.id || "",
    timeRange
  );

  if (!user && !isLoading) {
    router.push("/auth");
    return null;
  }

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
      <ProtectedRoute>
        <div className="min-h-screen bg-background pb-16">
          <div className="p-4 space-y-6">
            <MetricsSkeleton />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return (
      <div className="p-4">
        <p className="text-center text-muted-foreground">No profile data available.</p>
      </div>
    );
  }

  const formattedVolumeData: VolumeData[] = (() => {
    const today = new Date();
    let formattedData: VolumeData[] = [];

    const localVolumeData = (volumeData || []).map((d) => ({
      date: formatUtcToLocalDate(d.date + "T00:00:00Z"),
      volume: Math.round(d.volume * 100) / 100,
    }));

    if (timeRange === "7days") {
      const days = eachDayOfInterval({ start: subDays(today, 6), end: today });
      formattedData = days.map((day) => {
        const dayVolume = localVolumeData
          .filter((d) => d.date === format(day, "yyyy-MM-dd"))
          .reduce((sum, d) => sum + d.volume, 0);
        return { date: format(day, "MMM d"), volume: dayVolume };
      });
    } else if (timeRange === "8weeks") {
      const weeks = eachWeekOfInterval({ start: subDays(today, 55), end: today }, { weekStartsOn: 1 });
      formattedData = weeks.map((weekStart) => {
        const weekVolume = localVolumeData
          .filter((d) => isSameWeek(parse(d.date, "yyyy-MM-dd", new Date()), weekStart, { weekStartsOn: 1 }))
          .reduce((sum, d) => sum + d.volume, 0);
        return { date: format(weekStart, "MMM d"), volume: weekVolume };
      });
    } else {
      const months = eachMonthOfInterval({ start: subDays(today, 364), end: today });
      formattedData = months.map((monthStart) => {
        const monthVolume = localVolumeData
          .filter((d) => isSameMonth(parse(d.date, "yyyy-MM-dd", new Date()), monthStart))
          .reduce((sum, d) => sum + d.volume, 0);
        return { date: format(monthStart, "MMM yyyy"), volume: monthVolume };
      });
    }

    return formattedData;
  })();

  return (
    <ProtectedRoute>
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
              formatHeight={formatHeight}
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
    </ProtectedRoute>
  );
}
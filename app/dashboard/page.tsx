"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { VolumeChart } from "@/components/dashboard/volume-chart";
import { useAuth } from "@/contexts/auth-context";
import { fetchProfileData, fetchVolumeData } from "@/lib/supabaseUtils";
import type { Database } from "@/types/database";
import ProtectedRoute from "@/components/auth/protected-route";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, isSameWeek, isSameMonth } from "date-fns";
import { motion } from "framer-motion";
import { MetricsSkeleton } from "@/components/loading/metrics-skeleton";

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

  // Fetch profile data with SWR, with null check for user
  const { data: profileData, error: profileError, mutate: mutateProfile } = useSWR(
    user ? ["profile", user.id] : null,
    () => user ? fetchProfileData(user.id) : null
  );

  // Fetch volume data with SWR, re-fetches when timeRange changes, with null check for user
  const { data: rawVolumeData, error: volumeError, mutate: mutateVolume } = useSWR(
    user ? ["volume", user.id, timeRange] : null,
    () => user ? fetchVolumeData(user.id, timeRange) : null
  );

  // Redirect to auth if no user and not loading
  if (!user && !isLoading) {
    router.push("/auth");
  }

  // Handle errors with a retry option
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

  // Show skeleton while loading initial data
  if (!profileData || !rawVolumeData) {
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

  // Format volume data based on timeRange
  const volumeData: VolumeData[] = (() => {
    const today = new Date();
    let formattedData: VolumeData[] = [];

    if (timeRange === "7days") {
      const days = eachDayOfInterval({ start: subDays(today, 6), end: today });
      formattedData = days.map((day) => ({
        date: format(day, "MMM d"),
        volume: rawVolumeData?.find((d) => isSameDay(new Date(d.date), day))?.volume || 0,
      }));
    } else if (timeRange === "8weeks") {
      const weeks = eachWeekOfInterval({ start: subDays(today, 55), end: today }, { weekStartsOn: 1 });
      formattedData = weeks.map((weekStart) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weekVolume = rawVolumeData
          ?.filter((d) => isSameWeek(new Date(d.date), weekStart, { weekStartsOn: 1 }))
          .reduce((sum, day) => sum + day.volume, 0) || 0;
        return { date: format(weekStart, "MMM d"), volume: weekVolume };
      });
    } else {
      const months = eachMonthOfInterval({ start: subDays(today, 364), end: today });
      formattedData = months.map((monthStart) => {
        const monthEnd = endOfMonth(monthStart);
        const monthVolume = rawVolumeData
          ?.filter((d) => isSameMonth(new Date(d.date), monthStart))
          .reduce((sum, day) => sum + day.volume, 0) || 0;
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
            className="glass p-4 rounded-lg shadow-md"
          >
            <MetricsCards totalWorkouts={profileData.total_workouts ?? 0} totalVolume={profileData.total_volume ?? 0} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="glass p-4 rounded-lg shadow-md"
          >
            <VolumeChart data={volumeData} timeRange={timeRange} onTimeRangeChange={setTimeRange} />
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
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
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, parseISO, isSameDay, isSameWeek, isSameMonth } from "date-fns";
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

  const { data: profileData, error: profileError, mutate: mutateProfile } = useSWR(
    user ? ["profile", user.id] : null,
    () => user ? fetchProfileData(user.id) : null
  );

  const { data: rawVolumeData, error: volumeError, mutate: mutateVolume } = useSWR(
    user ? ["volume", user.id, timeRange] : null,
    () => user ? fetchVolumeData(user.id, timeRange) : null
  );

  if (!user && !isLoading) {
    router.push("/auth");
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

  const volumeData: VolumeData[] = (() => {
    const today = new Date();
    let formattedData: VolumeData[] = [];

    // Convert rawVolumeData (UTC dates) to local dates and round volume
    const localVolumeData = rawVolumeData.map((d) => {
      const utcDate = parseISO(d.date + 'T00:00:00Z');
      const localDate = new Date(utcDate.getTime() - (new Date().getTimezoneOffset() * 60000));
      return { date: localDate, volume: Math.round(d.volume * 100) / 100 }; // Round to 2 decimals
    });

    if (timeRange === "7days") {
      const days = eachDayOfInterval({ start: subDays(today, 6), end: today });
      formattedData = days.map((day) => {
        const dayVolume = localVolumeData
          .filter((d) => isSameDay(d.date, day))
          .reduce((sum, d) => sum + d.volume, 0);
        return { date: format(day, "MMM d"), volume: dayVolume };
      });
    } else if (timeRange === "8weeks") {
      const weeks = eachWeekOfInterval({ start: subDays(today, 55), end: today }, { weekStartsOn: 1 });
      formattedData = weeks.map((weekStart) => {
        const weekVolume = localVolumeData
          .filter((d) => isSameWeek(d.date, weekStart, { weekStartsOn: 1 }))
          .reduce((sum, d) => sum + d.volume, 0);
        return { date: format(weekStart, "MMM d"), volume: weekVolume };
      });
    } else {
      const months = eachMonthOfInterval({ start: subDays(today, 364), end: today });
      formattedData = months.map((monthStart) => {
        const monthVolume = localVolumeData
          .filter((d) => isSameMonth(d.date, monthStart))
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
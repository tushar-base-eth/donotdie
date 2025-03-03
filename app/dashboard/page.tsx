"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { VolumeChart } from "@/components/dashboard/volume-chart";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/auth-context";
import type { Database } from "@/types/database";
import ProtectedRoute from "@/components/auth/protected-route"; 
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, isSameWeek, isSameMonth } from "date-fns";
import { motion } from "framer-motion";

interface VolumeData {
  date: string;
  volume: number;
}

export default function DashboardPage() {
  const { state } = useAuth();
  const { user } = state;
  const isLoading = state.status === "loading";
  const router = useRouter();
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [totalWorkouts, setTotalWorkouts] = useState<number>(0);
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [timeRange, setTimeRange] = useState<"7days" | "8weeks" | "12months">("7days");

  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/auth");
    } else if (user) {
      fetchDashboardData();
    }
  }, [user, isLoading, timeRange, router, user?.unitPreference]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Updated to fetch from "profiles" instead of "users" to match the revised schema
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("total_volume, total_workouts")
        .eq("id", user.id)
        .single();

      if (profileError) throw new Error(profileError.message);

      setTotalVolume(profileData.total_volume ?? 0);
      setTotalWorkouts(profileData.total_workouts ?? 0);

      const daysToFetch = timeRange === "7days" ? 7 : timeRange === "8weeks" ? 56 : 365;
      const { data: volumeByDay, error: volumeError } = await supabase.rpc(
        "get_volume_by_day",
        { p_user_id: user.id, p_days: daysToFetch }
      ) as { data: Database["public"]["Functions"]["get_volume_by_day"]["Returns"]; error: any };

      if (volumeError) throw new Error(volumeError.message);

      let formattedVolumeData: VolumeData[] = [];
      const today = new Date();

      if (timeRange === "7days") {
        const days = eachDayOfInterval({ start: subDays(today, 6), end: today });
        formattedVolumeData = days.map(day => ({
          date: format(day, "MMM d"),
          volume: volumeByDay?.find(d => isSameDay(new Date(d.date), day))?.volume || 0,
        }));
      } else if (timeRange === "8weeks") {
        const weeks = eachWeekOfInterval({ start: subDays(today, 55), end: today }, { weekStartsOn: 1 });
        formattedVolumeData = weeks.map(weekStart => {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          const weekVolume = volumeByDay
            ?.filter(d => isSameWeek(new Date(d.date), weekStart, { weekStartsOn: 1 }))
            .reduce((sum, day) => sum + day.volume, 0) || 0;
          return { date: format(weekStart, "MMM d"), volume: weekVolume };
        });
      } else {
        const months = eachMonthOfInterval({ start: subDays(today, 364), end: today });
        formattedVolumeData = months.map(monthStart => {
          const monthEnd = endOfMonth(monthStart);
          const monthVolume = volumeByDay
            ?.filter(d => isSameMonth(new Date(d.date), monthStart))
            .reduce((sum, day) => sum + day.volume, 0) || 0;
          return { date: format(monthStart, "MMM yyyy"), volume: monthVolume };
        });
      }

      setVolumeData(formattedVolumeData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

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
            <MetricsCards totalWorkouts={totalWorkouts} totalVolume={totalVolume} />
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
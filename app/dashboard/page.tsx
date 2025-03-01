"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Moon, Settings, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { VolumeChart } from "@/components/dashboard/volume-chart";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/auth-context";
import type { Database } from "@/types/database";
import { ProtectedRoute } from '@/components/auth/protected-route';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, isSameWeek, isSameMonth } from 'date-fns';

interface VolumeData {
  date: string;
  volume: number;
}

export default function DashboardPage() {
  const { state } = useAuth();
  const { user } = state;
  const isLoading = state.status === 'loading';
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [totalWorkouts, setTotalWorkouts] = useState<number>(0);
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [timeRange, setTimeRange] = useState<"7days" | "8weeks" | "12months">("7days");

  // Fetch data when user or time range changes
  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/auth");
    } else if (user) {
      fetchDashboardData();
    }
  }, [user, isLoading, timeRange, router, user?.unitPreference]);

  // Fetch dashboard data from Supabase
  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch user stats
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("total_volume, total_workouts")
        .eq("id", user.id)
        .single();

      if (userError) throw new Error(userError.message);

      setTotalVolume(userData.total_volume ?? 0);
      setTotalWorkouts(userData.total_workouts ?? 0);

      // Fetch volume data based on time range
      const daysToFetch = timeRange === "7days" ? 7 : timeRange === "8weeks" ? 56 : 365;
      const { data: volumeByDay, error: volumeError } = await supabase.rpc(
        "get_volume_by_day",
        { p_user_id: user.id, p_days: daysToFetch }
      ) as { data: Database["public"]["Functions"]["get_volume_by_day"]["Returns"]; error: any };

      if (volumeError) throw new Error(volumeError.message);

      let formattedVolumeData: VolumeData[] = [];
      const today = new Date();

      if (timeRange === "7days") {
        // Format data for last 7 days
        const days = eachDayOfInterval({ start: subDays(today, 6), end: today });
        formattedVolumeData = days.map(day => ({
          date: format(day, 'MMM d'),
          volume: volumeByDay?.find(d => isSameDay(new Date(d.date), day))?.volume || 0,
        }));
      } else if (timeRange === "8weeks") {
        // Format data for last 8 weeks
        const weeks = eachWeekOfInterval({ start: subDays(today, 55), end: today }, { weekStartsOn: 1 });
        formattedVolumeData = weeks.map(weekStart => {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          const weekVolume = volumeByDay
            ?.filter(d => isSameWeek(new Date(d.date), weekStart, { weekStartsOn: 1 }))
            .reduce((sum, day) => sum + day.volume, 0) || 0;
          return { date: format(weekStart, 'MMM d'), volume: weekVolume };
        });
      } else {
        // Format data for last 12 months
        const months = eachMonthOfInterval({ start: subDays(today, 364), end: today });
        formattedVolumeData = months.map(monthStart => {
          const monthEnd = endOfMonth(monthStart);
          const monthVolume = volumeByDay
            ?.filter(d => isSameMonth(new Date(d.date), monthStart))
            .reduce((sum, day) => sum + day.volume, 0) || 0;
          return { date: format(monthStart, 'MMM yyyy'), volume: monthVolume };
        });
      }

      setVolumeData(formattedVolumeData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        {/* Header with theme toggle and settings */}
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

        {/* Dashboard content */}
        <div className="p-4 space-y-6 w-full"> {/* Updated to w-full for wider chart */}
          <MetricsCards totalWorkouts={totalWorkouts} totalVolume={totalVolume} />
          <VolumeChart data={volumeData} timeRange={timeRange} onTimeRangeChange={setTimeRange} />
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
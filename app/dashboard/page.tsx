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
  const [timeRange, setTimeRange] = useState<"7days" | "4weeks" | "6months">(
    "7days"
  );

  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/auth");
    } else if (user) {
      console.log("Fetching dashboard data for user:", user.id);
      fetchDashboardData();
    }
  }, [user, isLoading, timeRange, router, user?.unitPreference]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch user stats
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("total_volume, total_workouts")
        .eq("id", user.id)
        .single();

      if (userError) {
        console.error("Error fetching user stats:", userError.message);
        return;
      }

      console.log("User stats:", userData);
      setTotalVolume(userData.total_volume ?? 0);
      setTotalWorkouts(userData.total_workouts ?? 0);

      // Fetch volume data
      const daysToFetch =
        timeRange === "7days" ? 7 : timeRange === "4weeks" ? 28 : 180;
      console.log("Fetching volume data for days:", daysToFetch);

      const { data: volumeByDay, error: volumeError } = (await supabase.rpc(
        "get_volume_by_day",
        {
          p_user_id: user.id,
          p_days: daysToFetch,
        }
      )) as {
        data: Database["public"]["Functions"]["get_volume_by_day"]["Returns"];
        error: any;
      };

      if (volumeError) {
        console.error("Error fetching volume by day:", volumeError.message);
        return;
      }

      console.log("Raw volume data:", volumeByDay);

      let formattedVolumeData: VolumeData[] = [];
      if (timeRange === "7days") {
        formattedVolumeData = volumeByDay.map((entry) => ({
          date: new Date(entry.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          volume: entry.volume || 0,
        }));
      } else if (timeRange === "4weeks") {
        formattedVolumeData = aggregateByWeek(volumeByDay, 4);
      } else if (timeRange === "6months") {
        formattedVolumeData = aggregateByMonth(volumeByDay, 6);
      }

      console.log("Formatted volume data:", formattedVolumeData);
      setVolumeData(formattedVolumeData);
    } catch (error) {
      console.error("Error in fetchDashboardData:", error);
    }
  };

  const aggregateByWeek = (
    data: Database["public"]["Functions"]["get_volume_by_day"]["Returns"],
    weeks: number
  ) => {
    const result: VolumeData[] = [];
    const daysPerWeek = 7;
    const totalDays = weeks * daysPerWeek;
    const sortedData = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const latestDays = sortedData.slice(-totalDays);

    for (let i = 0; i < weeks; i++) {
      const startIdx = i * daysPerWeek;
      const weekData = latestDays.slice(startIdx, startIdx + daysPerWeek);
      const weekVolume = weekData.reduce((sum, day) => sum + day.volume, 0);
      const weekStartDate =
        weekData[0]?.date ||
        new Date(
          Date.now() - (weeks - i - 1) * daysPerWeek * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0];
      result.push({
        date: `${new Date(weekStartDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`,
        volume: weekVolume,
      });
    }
    return result.reverse();
  };

  const aggregateByMonth = (
    data: Database["public"]["Functions"]["get_volume_by_day"]["Returns"],
    months: number
  ) => {
    const result: VolumeData[] = [];
    const sortedData = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const latestDays = sortedData.slice(-months * 30);
    const monthlyData: { [key: string]: number } = {};
    latestDays.forEach((entry) => {
      const date = new Date(entry.date);
      const monthKey = date.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + entry.volume;
    });
    Object.entries(monthlyData)
      .slice(-months)
      .forEach(([month, volume]) => {
        result.push({ date: month, volume });
      });
    return result.reverse();
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background p-4">Loading...</div>;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 backdrop-blur-lg">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/settings")}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <MetricsCards totalWorkouts={totalWorkouts} totalVolume={totalVolume} />
          <VolumeChart
            data={volumeData}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}

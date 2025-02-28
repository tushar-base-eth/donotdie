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
  const [timeRange, setTimeRange] = useState<"7days" | "8weeks" | "12months">(
    "7days"
  );

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

      setTotalVolume(userData.total_volume ?? 0);
      setTotalWorkouts(userData.total_workouts ?? 0);

      // Fetch volume data
      const daysToFetch =
        timeRange === "7days" ? 7 : timeRange === "8weeks" ? 56 : 365;

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

      let formattedVolumeData: VolumeData[] = [];
      if (timeRange === "7days") {
        // Create array of last 7 days
        const days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date.toISOString().split('T')[0];
        });

        // Map each day to its volume, using 0 for days without data
        formattedVolumeData = days.map(day => ({
          date: new Date(day).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          volume: volumeByDay?.find(d => d.date === day)?.volume || 0,
        }));
      } else if (timeRange === "8weeks") {
        // Create array of last 8 weeks
        const weeks = Array.from({ length: 8 }, (_, i) => {
          const endDate = new Date();
          endDate.setDate(endDate.getDate() - (i * 7));
          const startDate = new Date(endDate);
          startDate.setDate(startDate.getDate() - 6);
          return {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
            displayDate: startDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
          };
        }).reverse();

        formattedVolumeData = weeks.map(week => ({
          date: week.displayDate,
          volume: volumeByDay
            ?.filter(d => d.date >= week.start && d.date <= week.end)
            .reduce((sum, day) => sum + day.volume, 0) || 0,
        }));
      } else {
        // Create array of last 12 months
        const months = Array.from({ length: 12 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (11 - i));
          const year = date.getFullYear();
          const month = date.getMonth();
          return {
            month: date.toLocaleString("en-US", {
              month: "short",
              year: "numeric",
            }),
            monthStart: `${year}-${String(month + 1).padStart(2, '0')}-01`,
            monthEnd: `${year}-${String(month + 1).padStart(2, '0')}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, '0')}`,
          };
        });

        formattedVolumeData = months.map(month => {
          const monthVolume = volumeByDay
            ?.filter(d => d.date >= month.monthStart && d.date <= month.monthEnd)
            .reduce((sum, day) => sum + (day.volume || 0), 0) || 0;
          
          return {
            date: month.month,
            volume: monthVolume,
          };
        });
      }

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

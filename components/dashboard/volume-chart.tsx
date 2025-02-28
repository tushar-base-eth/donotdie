"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUnitPreference } from "@/lib/hooks/use-unit-preference";

interface VolumeChartProps {
  data: { date: string; volume: number }[];
  timeRange: "7days" | "4weeks" | "6months";
  onTimeRangeChange: (value: "7days" | "4weeks" | "6months") => void;
}

export function VolumeChart({
  data,
  timeRange,
  onTimeRangeChange,
}: VolumeChartProps) {
  const { formatWeight, convertFromKg, unitLabel } = useUnitPreference();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volume</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={timeRange} onValueChange={(value) => onTimeRangeChange(value as "7days" | "4weeks" | "6months")}>
          <TabsList className="w-full bg-muted/50 p-1">
            <TabsTrigger value="7days" className="flex-1">
              Last 7 Days
            </TabsTrigger>
            <TabsTrigger value="4weeks" className="flex-1">
              Last 4 Weeks
            </TabsTrigger>
            <TabsTrigger value="6months" className="flex-1">
              Last 6 Months
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.map(d => ({ ...d, volume: convertFromKg(d.volume) }))}>
                <XAxis
                  dataKey="date"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}${unitLabel}`}
                  width={45}
                  padding={{ top: 20 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Volume
                              </span>
                              <span className="font-bold text-muted-foreground">
                                {formatWeight(payload[0].payload.volume)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="volume"
                  fill="currentColor"
                  radius={[4, 4, 0, 0]}
                  className="fill-[#4B7BFF] dark:fill-red-500"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

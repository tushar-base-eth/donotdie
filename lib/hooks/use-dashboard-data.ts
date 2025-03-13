import { useState } from "react";
import { useVolumeData } from "@/lib/hooks/data-hooks";
import { formatVolumeData } from "@/lib/utils";

export function useDashboardData(userId: string, initialTimeRange: "7days" | "8weeks" | "12months" = "7days") {
  const [timeRange, setTimeRange] = useState<"7days" | "8weeks" | "12months">(initialTimeRange);
  const { volumeData, isLoading, isError, mutate } = useVolumeData(userId, timeRange);

  const formattedVolumeData = formatVolumeData(volumeData, timeRange);

  return {
    volumeData: formattedVolumeData,
    timeRange,
    setTimeRange,
    isLoading,
    error: isError,
    mutate,
  };
}
import { useState } from "react";
import { useProfile } from "@/lib/hooks/use-profile";
import { useVolumeData } from "@/lib/hooks/data-hooks";
import { useUnitPreference } from "@/lib/hooks/use-unit-preference";
import { formatVolumeData } from "@/lib/utils";

export function useDashboardData(userId: string, initialTimeRange: "7days" | "8weeks" | "12months" = "7days") {
  const [timeRange, setTimeRange] = useState<"7days" | "8weeks" | "12months">(initialTimeRange);
  const { formatWeight } = useUnitPreference(); // Already imported and used
  const { profile, isLoading: profileLoading, error: profileError, mutate: mutateProfile } = useProfile(userId);
  const { volumeData, isLoading: volumeLoading, isError: volumeError, mutate: mutateVolume } = useVolumeData(userId, timeRange);

  const formattedVolumeData = formatVolumeData(volumeData, timeRange);

  return {
    profile,
    volumeData: formattedVolumeData,
    timeRange,
    setTimeRange,
    isLoading: profileLoading || volumeLoading,
    error: profileError || volumeError,
    mutate: () => {
      mutateProfile();
      mutateVolume();
    },
    formatWeight, // Explicitly return formatWeight
  };
}
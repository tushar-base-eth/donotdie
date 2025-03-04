import { Card, CardContent } from "@/components/ui/card";
import { useUnitPreference } from "@/lib/hooks/use-unit-preference";

interface MetricsCardsProps {
  totalWorkouts: number;
  totalVolume: number;
}

const formatNumber = (num: number, decimals: number = 2): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toFixed(decimals);
};

export function MetricsCards({ totalWorkouts, totalVolume }: MetricsCardsProps) {
  const { convertFromKg, unitLabel } = useUnitPreference();
  const volumeInPreferredUnit = convertFromKg(totalVolume);
  const displayVolume = Math.abs(volumeInPreferredUnit) < 0.0001 ? 0 : volumeInPreferredUnit;
  const formattedVolume = formatNumber(displayVolume) + " " + unitLabel;

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="border-0 glass shadow-md rounded-3xl">
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm mb-1">Total Workouts</p>
          <p className="text-xl font-bold text-foreground">{formatNumber(totalWorkouts)}</p>
        </CardContent>
      </Card>
      <Card className="border-0 glass shadow-md rounded-3xl">
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm mb-1">Total Volume</p>
          <p className="text-xl font-bold text-foreground">{formattedVolume}</p>
        </CardContent>
      </Card>
    </div>
  );
}
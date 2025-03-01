import { Card, CardContent } from "@/components/ui/card";
import { useUnitPreference } from "@/lib/hooks/use-unit-preference";

interface MetricsCardsProps {
  totalWorkouts: number;
  totalVolume: number;
}

export function MetricsCards({ totalWorkouts, totalVolume }: MetricsCardsProps) {
  const { formatWeight } = useUnitPreference();

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Total Workouts Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">Total Workouts</div>
          <div className="text-2xl font-bold">{totalWorkouts}</div>
        </CardContent>
      </Card>
      {/* Total Volume Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">Total Volume</div>
          <div className="text-2xl font-bold">{formatWeight(totalVolume)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
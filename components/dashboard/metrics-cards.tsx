import { Card, CardContent } from "@/components/ui/card";

interface MetricsCardsProps {
  totalWorkouts: number;
  totalVolume: number;
  formatWeight: (weight: number, decimals?: number) => string;
}

export function MetricsCards({ totalWorkouts, totalVolume, formatWeight }: MetricsCardsProps) {
  const displayVolume = formatWeight(totalVolume, 0);

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card className="glass shadow-lg rounded-xl">
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm font-medium mb-2">Total Workouts</p>
          <p className="text-2xl font-semibold text-foreground">{totalWorkouts}</p>
        </CardContent>
      </Card>
      <Card className="glass shadow-lg rounded-xl">
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm font-medium mb-2">Total Volume</p>
          <p className="text-2xl font-semibold text-foreground">{displayVolume}</p>
        </CardContent>
      </Card>
    </div>
  );
}
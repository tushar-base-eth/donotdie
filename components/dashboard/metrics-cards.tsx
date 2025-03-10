import { Card, CardContent } from "@/components/ui/card";

interface MetricsCardsProps {
  totalWorkouts: number;
  totalVolume: number;
  formatWeight: (weight: number, decimals?: number) => string;
}

export function MetricsCards({ totalWorkouts, totalVolume, formatWeight }: MetricsCardsProps) {
  const displayVolume = formatWeight(totalVolume, 0);

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="border-0 glass shadow-md rounded-3xl">
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm mb-1">Total Workouts</p>
          <p className="text-xl font-bold text-foreground">{totalWorkouts}</p>
        </CardContent>
      </Card>
      <Card className="border-0 glass shadow-md rounded-3xl">
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm mb-1">Total Volume</p>
          <p className="text-xl font-bold text-foreground">{displayVolume}</p>
        </CardContent>
      </Card>
    </div>
  );
}
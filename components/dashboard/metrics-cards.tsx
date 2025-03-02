import { Card, CardContent } from "@/components/ui/card";

interface MetricsCardsProps {
  totalWorkouts: number;
  totalVolume: number;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

export function MetricsCards({ totalWorkouts, totalVolume }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="border-0 glass shadow-md">
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm mb-1">Total Workouts</p>
          <p className="text-3xl font-bold text-foreground">{formatNumber(totalWorkouts)}</p>
        </CardContent>
      </Card>
      <Card className="border-0 glass shadow-md">
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm mb-1">Total Volume</p>
          <p className="text-3xl font-bold text-foreground">{formatNumber(totalVolume)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
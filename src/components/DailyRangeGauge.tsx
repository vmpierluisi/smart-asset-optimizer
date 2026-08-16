import { cn } from "@/lib/utils";

interface DailyRangeGaugeProps {
  low: number;
  high: number;
  current: number;
  open: number;
}

// Daily range gauge component
const DailyRangeGauge = ({ low, high, current, open }: DailyRangeGaugeProps): JSX.Element => {
  if (low == null || high == null || current == null || open == null || high <= low) {
    return (
      <div className="text-xs text-muted-foreground text-center py-1">
        Daily Range: N/A
      </div>
    );
  }

  const range = high - low;
  const openPercentage = ((open - low) / range) * 100;
  const currentPercentage = ((current - low) / range) * 100;

  // Clamp percentages between 0 and 100
  const clampedOpenPercentage = Math.max(0, Math.min(100, openPercentage));
  const clampedCurrentPercentage = Math.max(0, Math.min(100, currentPercentage));

  const color = current >= open ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="w-full my-1">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Low: ${low.toFixed(2)}</span>
        <span>High: ${high.toFixed(2)}</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full relative overflow-hidden">
        {/* Background bar */}
        <div className="absolute inset-0"></div>
        
        {/* Current price marker (thicker line) */}
        <div 
          className={cn("absolute top-0 bottom-0 w-1 transform -translate-x-1/2", color)} 
          style={{ left: `${clampedCurrentPercentage}%` }}
          title={`Current: $${current.toFixed(2)}`}
        />

        {/* Open price marker (thin grey line) */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-gray-400 transform -translate-x-1/2"
          style={{ left: `${clampedOpenPercentage}%` }}
          title={`Open: $${open.toFixed(2)}`}
        />
      </div>
    </div>
  );
};

export default DailyRangeGauge;

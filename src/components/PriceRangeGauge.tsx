import React from 'react';
import { cn } from "@/lib/utils";

interface PriceRangeGaugeProps {
  low: number;
  high: number;
  current: number;
  label?: string;
  height?: string; // e.g., 'h-2'
  showLabels?: boolean;
}

// Price range gauge component
const PriceRangeGauge = ({ 
  low, 
  high, 
  current, 
  label,
  height = 'h-2', // Default height
  showLabels = true // Default to showing labels
}: PriceRangeGaugeProps): JSX.Element => {
  if (low == null || high == null || current == null || high <= low) {
    return (
      <div className="text-xs text-muted-foreground text-center py-1">
        {label ? `${label}: ` : ''}N/A
      </div>
    );
  }

  const percentage = ((current - low) / (high - low)) * 100;
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div className="w-full my-1">
      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{label ? label : 'Range Low'}: ${low.toFixed(2)}</span>
          <span>{label ? 'Range High' : 'High'}: ${high.toFixed(2)}</span>
        </div>
      )}
      <div className={cn("w-full bg-muted rounded-full relative overflow-hidden", height)}>
        <div 
          className="bg-primary h-full rounded-full"
          style={{ width: `${clampedPercentage}%` }}
        />
        {/* Optional: Add a marker for the current price */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-foreground transform -translate-x-1/2"
          style={{ left: `${clampedPercentage}%` }}
          title={`Current: $${current.toFixed(2)}`}
        />
      </div>
    </div>
  );
};

export default PriceRangeGauge;

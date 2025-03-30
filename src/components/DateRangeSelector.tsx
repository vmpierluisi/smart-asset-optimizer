import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";

interface DateRangeSelectorProps {
  value: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
  benchmarks: string[];
  onBenchmarksChange: (benchmarks: string[]) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ 
  value, 
  onChange, 
  benchmarks, 
  onBenchmarksChange 
}) => {
  // Calculate which preset is active based on the current start date
  const getActivePreset = (): string => {
    const end = new Date();
    const diffMonths = Math.round((end.getTime() - value.start.getTime()) / (30 * 24 * 60 * 60 * 1000));
    
    if (diffMonths <= 6) return "6m";
    if (diffMonths <= 12) return "1y";
    if (diffMonths <= 24) return "2y";
    if (diffMonths <= 36) return "3y";
    if (diffMonths <= 60) return "5y";
    return "";
  };

  const handlePresetChange = (preset: string) => {
    const end = new Date();
    let start = new Date();
    
    switch (preset) {
      case "6m":
        start.setMonth(end.getMonth() - 6);
        break;
      case "1y":
        start.setFullYear(end.getFullYear() - 1);
        break;
      case "2y":
        start.setFullYear(end.getFullYear() - 2);
        break;
      case "3y":
        start.setFullYear(end.getFullYear() - 3);
        break;
      case "5y":
        start.setFullYear(end.getFullYear() - 5);
        break;
      default:
        start.setFullYear(end.getFullYear() - 1);
    }
    
    onChange({ start, end });
  };

  const handleBenchmarkChange = (values: string[]) => {
    // Ensure at least one benchmark is selected
    if (values.length === 0 && benchmarks.length > 0) {
      return;
    }
    onBenchmarksChange(values);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          Select Date Range
        </Label>
        <ToggleGroup 
          type="single" 
          value={getActivePreset()} 
          onValueChange={handlePresetChange}
          className="flex flex-wrap justify-start gap-1 w-full"
        >
          <ToggleGroupItem value="6m" className="flex-1">6M</ToggleGroupItem>
          <ToggleGroupItem value="1y" className="flex-1">1Y</ToggleGroupItem>
          <ToggleGroupItem value="2y" className="flex-1">2Y</ToggleGroupItem>
          <ToggleGroupItem value="3y" className="flex-1">3Y</ToggleGroupItem>
          <ToggleGroupItem value="5y" className="flex-1">5Y</ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          Select Benchmarks (Multiple)
        </Label>
        <ToggleGroup 
          type="multiple" 
          value={benchmarks} 
          onValueChange={handleBenchmarkChange}
          className="flex flex-wrap justify-start gap-1 w-full"
        >
          <ToggleGroupItem value="SPY" className="flex-1 text-xs">S&P 500</ToggleGroupItem>
          <ToggleGroupItem value="DIA" className="flex-1 text-xs">DOW</ToggleGroupItem>
          <ToggleGroupItem value="QQQ" className="flex-1 text-xs">NASDAQ</ToggleGroupItem>
          <ToggleGroupItem value="FEZ" className="flex-1 text-xs">EURO 50</ToggleGroupItem>
          <ToggleGroupItem value="STOXX" className="flex-1 text-xs">EURO 600</ToggleGroupItem>
          <ToggleGroupItem value="URTH" className="flex-1 text-xs">MSCI</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};

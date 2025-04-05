import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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

  const handleBenchmarkChange = (benchmark: string) => {
    // Toggle benchmark selection
    if (benchmarks.includes(benchmark)) {
      // Don't allow removing the last benchmark
      if (benchmarks.length > 1) {
        onBenchmarksChange(benchmarks.filter(b => b !== benchmark));
      }
    } else {
      onBenchmarksChange([...benchmarks, benchmark]);
    }
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
          className="flex justify-between gap-1 w-full"
        >
          <ToggleGroupItem value="6m" className="min-w-0 text-sm px-2 py-1">6M</ToggleGroupItem>
          <ToggleGroupItem value="1y" className="min-w-0 text-sm px-2 py-1">1Y</ToggleGroupItem>
          <ToggleGroupItem value="2y" className="min-w-0 text-sm px-2 py-1">2Y</ToggleGroupItem>
          <ToggleGroupItem value="3y" className="min-w-0 text-sm px-2 py-1">3Y</ToggleGroupItem>
          <ToggleGroupItem value="5y" className="min-w-0 text-sm px-2 py-1">5Y</ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          Select Benchmarks (Multiple)
        </Label>
        <div className="grid grid-cols-3 gap-1">
          <Button
            variant={benchmarks.includes("SPY") ? "default" : "outline"}
            size="sm"
            onClick={() => handleBenchmarkChange("SPY")}
            className="text-xs py-1 h-auto"
          >
            S&P 500
          </Button>
          <Button
            variant={benchmarks.includes("DIA") ? "default" : "outline"}
            size="sm"
            onClick={() => handleBenchmarkChange("DIA")}
            className="text-xs py-1 h-auto"
          >
            DOW
          </Button>
          <Button
            variant={benchmarks.includes("QQQ") ? "default" : "outline"}
            size="sm"
            onClick={() => handleBenchmarkChange("QQQ")}
            className="text-xs py-1 h-auto"
          >
            NASDAQ
          </Button>
          <Button
            variant={benchmarks.includes("FEZ") ? "default" : "outline"}
            size="sm"
            onClick={() => handleBenchmarkChange("FEZ")}
            className="text-xs py-1 h-auto"
          >
            EURO 50
          </Button>
          <Button
            variant={benchmarks.includes("STOXX") ? "default" : "outline"}
            size="sm"
            onClick={() => handleBenchmarkChange("STOXX")}
            className="text-xs py-1 h-auto"
          >
            EURO 600
          </Button>
          <Button
            variant={benchmarks.includes("URTH") ? "default" : "outline"}
            size="sm"
            onClick={() => handleBenchmarkChange("URTH")}
            className="text-xs py-1 h-auto"
          >
            MSCI
          </Button>
        </div>
      </div>
    </div>
  );
};

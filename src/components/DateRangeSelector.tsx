
import React from 'react';
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface DateRangeSelectorProps {
  value: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
  benchmark: string;
  onBenchmarkChange: (benchmark: string) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ 
  value, 
  onChange, 
  benchmark, 
  onBenchmarkChange 
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

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Date Range
        </label>
        <ToggleGroup 
          type="single" 
          value={getActivePreset()} 
          onValueChange={handlePresetChange}
          className="justify-start w-full"
        >
          <ToggleGroupItem value="6m">6 Months</ToggleGroupItem>
          <ToggleGroupItem value="1y">1 Year</ToggleGroupItem>
          <ToggleGroupItem value="2y">2 Years</ToggleGroupItem>
          <ToggleGroupItem value="3y">3 Years</ToggleGroupItem>
          <ToggleGroupItem value="5y">5 Years</ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Benchmark
        </label>
        <RadioGroup 
          value={benchmark} 
          onValueChange={onBenchmarkChange}
          className="grid grid-cols-2 gap-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="SPY" id="benchmark-spy" />
            <Label htmlFor="benchmark-spy">S&P 500</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="DIA" id="benchmark-dow" />
            <Label htmlFor="benchmark-dow">DOW Jones</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="QQQ" id="benchmark-nasdaq" />
            <Label htmlFor="benchmark-nasdaq">Nasdaq</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="FEZ" id="benchmark-euro50" />
            <Label htmlFor="benchmark-euro50">Euro Stoxx 50</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="STOXX" id="benchmark-euro600" />
            <Label htmlFor="benchmark-euro600">Euro Stoxx 600</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="URTH" id="benchmark-msci" />
            <Label htmlFor="benchmark-msci">MSCI World Index</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};

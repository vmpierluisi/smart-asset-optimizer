
import React from 'react';
import {
  Slider
} from "@/components/ui/slider";

interface RiskAversionInputProps {
  value: number;
  onChange: (value: number) => void;
}

export const RiskAversionInput: React.FC<RiskAversionInputProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Risk Aversion (γ)
        <span className="ml-2 text-sm text-gray-500">
          Current: {value.toFixed(1)}
        </span>
      </label>
      <Slider
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        min={1}
        max={10}
        step={0.1}
        className="w-full"
      />
      <p className="text-xs text-gray-500">
        Higher values (1-10) indicate greater risk aversion
      </p>
    </div>
  );
};

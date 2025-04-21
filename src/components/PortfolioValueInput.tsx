
import React from 'react';

interface PortfolioValueInputProps {
  value: number;
  onChange: (value: number) => void;
}

export const PortfolioValueInput: React.FC<PortfolioValueInputProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">

      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={0}
          step={1000}
          className="input-field w-full pl-8"
        />
      </div>
    </div>
  );
};

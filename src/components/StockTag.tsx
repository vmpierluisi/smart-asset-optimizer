
import React from 'react';
import { X } from 'lucide-react';

interface StockTagProps {
  symbol: string;
  onRemove: (symbol: string) => void;
}

export const StockTag: React.FC<StockTagProps> = ({ symbol, onRemove }) => {
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
      <span className="text-sm font-mono">{symbol}</span>
      <button
        onClick={() => onRemove(symbol)}
        className="text-gray-500 hover:text-gray-700"
      >
        <X size={14} />
      </button>
    </div>
  );
};


import React from 'react';
import { useState } from 'react';
import { X } from 'lucide-react';

interface StockInputProps {
  stocks: string[];
  onChange: (stocks: string[]) => void;
}

export const StockInput: React.FC<StockInputProps> = ({ stocks, onChange }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      const newStock = input.trim().toUpperCase();
      if (!stocks.includes(newStock)) {
        onChange([...stocks, newStock]);
      }
      setInput('');
    }
  };

  const removeStock = (stockToRemove: string) => {
    onChange(stocks.filter(stock => stock !== stockToRemove));
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Enter Stock Symbols
      </label>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter stock symbol and press Enter"
        className="input-field w-full"
      />
      <div className="flex flex-wrap gap-2">
        {stocks.map((stock) => (
          <div
            key={stock}
            className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full"
          >
            <span className="text-sm font-mono">{stock}</span>
            <button
              onClick={() => removeStock(stock)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

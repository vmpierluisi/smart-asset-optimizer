import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { searchStocks, StockSuggestion } from '../utils/fmpFinanceUtils';
import { StockSuggestionsList } from './StockSuggestionsList';
import { StockTag } from './StockTag';

interface StockInputProps {
  stocks: string[];
  onChange: (stocks: string[]) => void;
}

export const StockInput: React.FC<StockInputProps> = ({ stocks, onChange }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search for stock suggestions based on input
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (input.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      const stockSuggestions = await searchStocks(input.trim());
      setSuggestions(stockSuggestions);
      setShowSuggestions(stockSuggestions.length > 0);
      setIsLoading(false);
    };

    const debounceTimer = setTimeout(() => {
      if (input.trim().length >= 2) {
        fetchSuggestions();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      const newStock = input.trim().toUpperCase();
      if (!stocks.includes(newStock)) {
        onChange([...stocks, newStock]);
      }
      setInput('');
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: StockSuggestion) => {
    if (!stocks.includes(suggestion.symbol)) {
      onChange([...stocks, suggestion.symbol]);
      toast({
        title: "Stock Added",
        description: `${suggestion.name} (${suggestion.symbol}) added to your portfolio.`,
      });
    }
    setInput('');
    setShowSuggestions(false);
  };

  const removeStock = (stockToRemove: string) => {
    onChange(stocks.filter(stock => stock !== stockToRemove));
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">

      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => input.trim().length >= 2 && setShowSuggestions(true)}
          placeholder="Search for companies or enter stock symbol"
          className="input-field w-full pl-10"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <StockSuggestionsList
            ref={suggestionsRef}
            suggestions={suggestions}
            onSelectSuggestion={handleSelectSuggestion}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {stocks.map((stock) => (
          <StockTag 
            key={stock} 
            symbol={stock} 
            onRemove={removeStock} 
          />
        ))}
      </div>
    </div>
  );
};

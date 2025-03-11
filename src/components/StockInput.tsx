
import React, { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import * as yahooFinance from 'yahoo-finance2';
import { toast } from "@/hooks/use-toast";

interface StockInputProps {
  stocks: string[];
  onChange: (stocks: string[]) => void;
}

interface StockSuggestion {
  symbol: string;
  name: string;
  exchange: string;
}

// Type guard to check if a quote has the necessary properties
const isValidQuote = (quote: any): boolean => {
  return !!quote.symbol && !!(quote.shortname || quote.longname);
};

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
    const searchStocks = async () => {
      if (input.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const query = input.trim();
        
        // Using yahooFinance.search correctly
        const results = await yahooFinance.default.search(query, { quotesCount: 6, newsCount: 0 });
        
        if (results.quotes && results.quotes.length > 0) {
          const filteredSuggestions = results.quotes
            .filter(isValidQuote)
            .map(quote => ({
              symbol: quote.symbol as string,
              name: (quote.shortname || quote.longname || quote.symbol) as string,
              exchange: (quote.exchDisp || quote.exchange || '') as string
            }));
          
          setSuggestions(filteredSuggestions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Error searching stocks:', error);
        toast({
          title: "Search Error",
          description: "Unable to fetch stock suggestions at this time.",
          variant: "destructive",
        });
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      if (input.trim().length >= 2) {
        searchStocks();
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
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Enter Company Name or Stock Symbol
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
        {showSuggestions && suggestions.length > 0 && (
          <div 
            ref={suggestionsRef}
            className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 overflow-auto"
          >
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.symbol}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                <div>
                  <div className="font-medium">{suggestion.symbol}</div>
                  <div className="text-sm text-gray-500">{suggestion.name}</div>
                </div>
                <div className="text-xs text-gray-400">{suggestion.exchange}</div>
              </div>
            ))}
          </div>
        )}
      </div>

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

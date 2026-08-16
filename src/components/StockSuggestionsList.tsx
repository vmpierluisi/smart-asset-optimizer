import { forwardRef } from 'react';
import { StockSuggestion } from '../utils/fmpFinanceUtils';

interface StockSuggestionsListProps {
  suggestions: StockSuggestion[];
  onSelectSuggestion: (suggestion: StockSuggestion) => void;
}

export const StockSuggestionsList = forwardRef<HTMLDivElement, StockSuggestionsListProps>(
  ({ suggestions, onSelectSuggestion }, ref) => {
    if (suggestions.length === 0) return null;

    return (
      <div 
        ref={ref}
        className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 overflow-auto"
      >
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.symbol}
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
            onClick={() => onSelectSuggestion(suggestion)}
          >
            <div>
              <div className="font-medium">{suggestion.symbol}</div>
              <div className="text-sm text-gray-500">{suggestion.name}</div>
            </div>
            <div className="text-xs text-gray-400">{suggestion.exchange}</div>
          </div>
        ))}
      </div>
    );
  }
);

StockSuggestionsList.displayName = 'StockSuggestionsList';

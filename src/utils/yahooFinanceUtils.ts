
import * as yahooFinance from 'yahoo-finance2';
import { toast } from "@/hooks/use-toast";

export interface StockSuggestion {
  symbol: string;
  name: string;
  exchange: string;
}

// Search for stocks using Yahoo Finance API
export const searchStocks = async (query: string): Promise<StockSuggestion[]> => {
  try {
    // Polyfill for process in browser environment
    if (typeof window !== 'undefined' && !window.process) {
      (window as any).process = { env: {} };
    }
    
    const results = await yahooFinance.default.search(query, { quotesCount: 6, newsCount: 0 });
    
    if (results.quotes && results.quotes.length > 0) {
      // Process quotes to extract the information we need
      const suggestions: StockSuggestion[] = [];
      
      for (const quote of results.quotes) {
        // Make sure the quote is a valid object with the properties we need
        if (quote && typeof quote === 'object') {
          // Try to extract the symbol
          let symbol: string | undefined;
          if ('symbol' in quote && typeof quote.symbol === 'string') {
            symbol = quote.symbol;
          } else if ('index' in quote && typeof quote.index === 'string') {
            symbol = quote.index;
          }
          
          // If we have a symbol, create a suggestion
          if (symbol) {
            // Extract name - check different possible properties
            let name: string = symbol;
            if ('shortname' in quote && quote.shortname) {
              name = quote.shortname;
            } else if ('longname' in quote && quote.longname) {
              name = quote.longname;
            } else if ('name' in quote && quote.name) {
              name = quote.name;
            }
            
            // Extract exchange
            let exchange: string = '';
            if ('exchDisp' in quote && quote.exchDisp) {
              exchange = quote.exchDisp;
            } else if ('exchange' in quote && quote.exchange) {
              exchange = quote.exchange;
            }
            
            suggestions.push({
              symbol,
              name,
              exchange
            });
          }
        }
      }
      
      return suggestions;
    }
    return [];
  } catch (error) {
    console.error('Error searching stocks:', error);
    toast({
      title: "Search Error",
      description: "Unable to fetch stock suggestions at this time.",
      variant: "destructive",
    });
    return [];
  }
};

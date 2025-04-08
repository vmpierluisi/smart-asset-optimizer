// Mock stock data for common companies (fallback when API is unavailable)
const COMMON_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms Inc.", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ" },
  { symbol: "BRK-B", name: "Berkshire Hathaway Inc.", exchange: "NYSE" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", exchange: "NYSE" },
  { symbol: "JNJ", name: "Johnson & Johnson", exchange: "NYSE" },
  { symbol: "V", name: "Visa Inc.", exchange: "NYSE" },
  { symbol: "PG", name: "Procter & Gamble Co.", exchange: "NYSE" },
  { symbol: "UNH", name: "UnitedHealth Group Inc.", exchange: "NYSE" },
  { symbol: "HD", name: "Home Depot Inc.", exchange: "NYSE" },
  { symbol: "BAC", name: "Bank of America Corp.", exchange: "NYSE" },
  { symbol: "XOM", name: "Exxon Mobil Corporation", exchange: "NYSE" },
  { symbol: "PFE", name: "Pfizer Inc.", exchange: "NYSE" },
  { symbol: "NFLX", name: "Netflix, Inc.", exchange: "NASDAQ" },
  { symbol: "DIS", name: "The Walt Disney Company", exchange: "NYSE" },
  { symbol: "CSCO", name: "Cisco Systems, Inc.", exchange: "NASDAQ" },
  { symbol: "ADBE", name: "Adobe Inc.", exchange: "NASDAQ" },
  { symbol: "INTC", name: "Intel Corporation", exchange: "NASDAQ" },
  { symbol: "CRM", name: "Salesforce, Inc.", exchange: "NYSE" },
  { symbol: "VZ", name: "Verizon Communications Inc.", exchange: "NYSE" },
  { symbol: "IBM", name: "International Business Machines", exchange: "NYSE" },
  { symbol: "CMCSA", name: "Comcast Corporation", exchange: "NASDAQ" },
  { symbol: "KO", name: "The Coca-Cola Company", exchange: "NYSE" },
  { symbol: "PEP", name: "PepsiCo, Inc.", exchange: "NASDAQ" },
  { symbol: "MRK", name: "Merck & Co., Inc.", exchange: "NYSE" },
  { symbol: "WMT", name: "Walmart Inc.", exchange: "NYSE" },
  { symbol: "ABT", name: "Abbott Laboratories", exchange: "NYSE" },
  { symbol: "TMO", name: "Thermo Fisher Scientific Inc.", exchange: "NYSE" },
  { symbol: "COST", name: "Costco Wholesale Corporation", exchange: "NASDAQ" },
  { symbol: "ABBV", name: "AbbVie Inc.", exchange: "NYSE" },
  { symbol: "AVGO", name: "Broadcom Inc.", exchange: "NASDAQ" },
  { symbol: "ACN", name: "Accenture plc", exchange: "NYSE" },
  { symbol: "DHR", name: "Danaher Corporation", exchange: "NYSE" },
  { symbol: "MCD", name: "McDonald's Corporation", exchange: "NYSE" },
  { symbol: "PYPL", name: "PayPal Holdings, Inc.", exchange: "NASDAQ" },
  { symbol: "NKE", name: "NIKE, Inc.", exchange: "NYSE" }
];

export interface StockSuggestion {
  symbol: string;
  name: string;
  exchange: string;
}

export interface HistoricalPrice {
  date: Date;
  close: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  peRatio: number;
  dividendYield: number;
  volume: string;
  avgVolume: string;
  exchange: string;
  high52Week: number;
  low52Week: number;
}

export interface StockPriceChanges {
  symbol: string;
  returns: {
    period: string;
    value: number;
    direction: 'up' | 'down';
  }[];
}

// Search for stocks using the FMP API through Supabase Edge Function
export const searchStocks = async (query: string): Promise<StockSuggestion[]> => {
  try {
    if (!query || query.length < 2) return [];
    
    // Use local static data as fallback when in development or if API fails
    const useFallback = import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_STOCK_DATA === 'true';
    
    if (useFallback) {
      // Simulate network delay to make it feel like a real API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const lowerQuery = query.toLowerCase().trim();
      
      // Filter stocks based on the search query
      const results = COMMON_STOCKS.filter(stock => 
        stock.symbol.toLowerCase().includes(lowerQuery) || 
        stock.name.toLowerCase().includes(lowerQuery)
      ).slice(0, 6); // Limit to 6 results
      
      return results;
    }
    
    // Call the Supabase Edge Function that interfaces with FMP API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/search-stocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ query: query.trim() }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FMP API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    return data as StockSuggestion[];
    
  } catch (error) {
    console.error('Error searching stocks with FMP API:', error);
    
    // Fall back to static data if API call fails
    const lowerQuery = query.toLowerCase().trim();
    const results = COMMON_STOCKS.filter(stock => 
      stock.symbol.toLowerCase().includes(lowerQuery) || 
      stock.name.toLowerCase().includes(lowerQuery)
    ).slice(0, 6);
    
    return results;
  }
};

// Fetch stock quote data using the FMP API
export const fetchStockQuote = async (symbol: string): Promise<StockQuote> => {
  try {
    // Call the Supabase Edge Function that interfaces with FMP API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    // Call the stock-quote edge function
    const response = await fetch(`${supabaseUrl}/functions/v1/stock-quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ symbol }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FMP API error: ${response.status} ${errorText}`);
    }
    
    const stockQuote = await response.json();
    return stockQuote as StockQuote;
    
  } catch (error) {
    console.error('Error fetching stock quote with FMP API:', error);
    throw error;
  }
};

// Fetch historical stock prices using the FMP API
export const fetchHistoricalPrices = async (
  symbol: string, 
  startDate?: Date, 
  endDate?: Date
): Promise<HistoricalPrice[]> => {
  try {
    // Call the Supabase Edge Function that interfaces with FMP API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/historical-prices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        symbol,
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FMP API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error(`No data received for symbol ${symbol}`);
    }
    
    // Process the data
    return data.map((item: any) => ({
      date: new Date(item.date),
      close: parseFloat(item.close),
    }));
    
  } catch (error) {
    console.error('Error fetching historical prices with FMP API:', error);
    throw error;
  }
};

// Fetch historical stock price changes using the FMP API
export const fetchStockPriceChanges = async (symbol: string): Promise<StockPriceChanges> => {
  try {
    // Call the Supabase Edge Function that interfaces with FMP API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/stock-price-change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ symbol }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FMP API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.returns || !Array.isArray(data.returns)) {
      throw new Error(`Invalid price change data received for symbol ${symbol}`);
    }
    
    return data as StockPriceChanges;
    
  } catch (error) {
    console.error('Error fetching stock price changes with FMP API:', error);
    throw error;
  }
};

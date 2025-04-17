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
  open?: number;
}

export interface StockPriceChanges {
  symbol: string;
  returns: {
    period: string;
    value: number;
    direction: 'up' | 'down';
  }[];
  volatility?: number;
  sharpeRatio?: number;
  beta?: number;
  alpha?: number;
}

export interface ValuationData {
  peRatio: string;
  forwardPE: string;
  pegRatio: string;
  priceToBook: string;
  priceToSales: string;
  evToEbitda: string;
  dividendYield: string;
  dividendGrowth5Y: string;
  fairValueLow: number;
  fairValueHigh: number;
  eps: string;
}

// New Interfaces
export interface FinancialHealthData {
  symbol: string;
  debtToEquity: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  healthScore: number | null; // Calculated or from FMP? Assuming calculated for now
  
  // Additional fields from Twelve Data statistics
  // Financials
  fiscal_year_ends?: string;
  most_recent_quarter?: string;
  
  // Income statement
  revenue_ttm?: number;
  revenue_per_share_ttm?: number;
  quarterly_revenue_growth?: number;
  gross_profit_ttm?: number;
  ebitda?: number;
  net_income_to_common_ttm?: number;
  diluted_eps_ttm?: number;
  quarterly_earnings_growth_yoy?: number;
  
  // Balance sheet
  total_cash_mrq?: number;
  total_cash_per_share_mrq?: number;
  total_debt_mrq?: number;
  total_debt_to_equity_mrq?: number;
  book_value_per_share_mrq?: number;
  
  // Cash flow
  operating_cash_flow_ttm?: number;
  levered_free_cash_flow_ttm?: number;
  
  // Dividend data
  forward_annual_dividend_rate?: number;
  forward_annual_dividend_yield?: number;
  trailing_annual_dividend_rate?: number;
  trailing_annual_dividend_yield?: number;
  five_year_average_dividend_yield?: number;
  payout_ratio?: number;
  dividend_frequency?: string;
  dividend_date?: string;
  ex_dividend_date?: string;
}

export interface TechnicalIndicatorData {
  symbol: string;
  ma50: number | null;
  ma200: number | null;
  rsi: number | null;
  macdSignal: 'Bullish' | 'Bearish' | 'Neutral' | null; // Or specific values
  macdSignals: string[] | null; // Array of MACD signal types
  bollingerPosition: 'Upper' | 'Middle' | 'Lower' | null; // Example
  support: number | null;
  resistance: number | null;
  signalSummary: 'Buy' | 'Sell' | 'Neutral' | null; // Example
  priceTarget: PriceTarget | null; // Added price target data
}

export interface NewsItem {
  title: string;
  sentiment: string; // Changed from enum to string to match Alpha Vantage labels
  sentimentColor?: string; // Added for color coding based on sentiment
  source: string;
  date: string; // Or Date object if needed
  rawDate?: string; // Original date format from API
  url: string; // For news article links
  imageUrl?: string; // Banner image URL
}

export interface AnalystRatings {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  consensus: string;
}

export interface PriceTarget {
  targetHigh: number;
  targetLow: number;
  targetConsensus: number;
  targetMedian: number;
}

export interface NewsSentimentData {
  symbol: string;
  recentNews: NewsItem[];
  analystRatings: AnalystRatings | null;
  averagePriceTarget: number | null;
  sentimentScore: number | null; // 0-100
}

export interface RiskAnalysisData {
  symbol: string;
  beta: number | null;
  maxDrawdown: number | null; // Percentage
  valueAtRisk: number | null; // Percentage
  standardDeviation: number | null; // Percentage
  downsideRisk: number | null; // Percentage
  correlationSP500: number | null;
  riskScore: number | null; // Calculated or from FMP? Assuming calculated
}

// Interface for MACD data
export interface MacdData {
  symbol: string;
  timeframe: string;
  signalStrength: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  latestValues: {
    macd: number | null;
    signal: number | null;
    histogram: number | null;
    timestamp: number | null;
  };
  signals: {
    bullish_crossover: number[];
    bearish_crossover: number[];
    bullish_zero_crossover: number[];
    bearish_zero_crossover: number[];
    histogram_bullish_turn: number[];
    histogram_bearish_turn: number[];
  };
  values: {
    timestamp: number;
    value: number;
    signal: number;
    histogram: number;
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

// Fetch valuation ratios using the FMP API
export const fetchValuationRatios = async (symbol: string): Promise<ValuationData> => {
  try {
    // Call the Supabase Edge Function that interfaces with FMP API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    // Call the stock-ratios edge function
    const response = await fetch(`${supabaseUrl}/functions/v1/stock-ratios`, {
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
    
    const valuationData = await response.json();
    return valuationData as ValuationData;
    
  } catch (error) {
    console.error('Error fetching valuation ratios with FMP API:', error);
    
    // Return default/fallback values if API call fails
    return {
      peRatio: 'N/A',
      forwardPE: 'N/A',
      pegRatio: 'N/A',
      priceToBook: 'N/A',
      priceToSales: 'N/A',
      evToEbitda: 'N/A',
      dividendYield: '0.00',
      dividendGrowth5Y: '0.00',
      fairValueLow: 0,
      fairValueHigh: 0,
      eps: 'N/A'
    };
  }
};

// Fetch Financial Health Data
export const fetchFinancialHealth = async (symbol: string): Promise<FinancialHealthData | null> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      return null; // Return null or throw error based on desired handling
    }

    // Fetch data from Financial Modeling Prep API
    const response = await fetch(`${supabaseUrl}/functions/v1/financial-health`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ symbol }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching financial health for ${symbol}: ${response.status} ${errorText}`);
      return null;
    }

    // Parse FMP financial health data
    const fmpData = await response.json() as FinancialHealthData;

    // Import Twelve Data API function
    const { fetchStockStatistics } = await import('./twelveDataUtils');
    
    // Fetch additional financial data from Twelve Data API
    const tdData = await fetchStockStatistics(symbol);
    
    // If Twelve Data API returned data, merge it with FMP data
    if (tdData && tdData.statistics && tdData.statistics.financials) {
      const financials = tdData.statistics.financials;
      const balanceSheet = financials.balance_sheet;
      const incomeStatement = financials.income_statement;
      const cashFlow = financials.cash_flow;
      const dividendsAndSplits = tdData.statistics.dividends_and_splits;
      
      // Merge the data
      const mergedData: FinancialHealthData = {
        ...fmpData,
        // Financials
        fiscal_year_ends: financials.fiscal_year_ends,
        most_recent_quarter: financials.most_recent_quarter,
        
        // Override these values with Twelve Data API values
        currentRatio: balanceSheet.current_ratio_mrq || fmpData.currentRatio,
        returnOnEquity: financials.return_on_equity_ttm || fmpData.returnOnEquity,
        returnOnAssets: financials.return_on_assets_ttm || fmpData.returnOnAssets,
        netMargin: financials.profit_margin || fmpData.netMargin,
        grossMargin: financials.gross_margin || fmpData.grossMargin,
        operatingMargin: financials.operating_margin || fmpData.operatingMargin,
        
        // Income statement
        revenue_ttm: incomeStatement.revenue_ttm,
        revenue_per_share_ttm: incomeStatement.revenue_per_share_ttm,
        quarterly_revenue_growth: incomeStatement.quarterly_revenue_growth,
        gross_profit_ttm: incomeStatement.gross_profit_ttm,
        ebitda: incomeStatement.ebitda,
        net_income_to_common_ttm: incomeStatement.net_income_to_common_ttm,
        diluted_eps_ttm: incomeStatement.diluted_eps_ttm,
        quarterly_earnings_growth_yoy: incomeStatement.quarterly_earnings_growth_yoy,
        
        // Balance sheet
        total_cash_mrq: balanceSheet.total_cash_mrq,
        total_cash_per_share_mrq: balanceSheet.total_cash_per_share_mrq,
        total_debt_mrq: balanceSheet.total_debt_mrq,
        total_debt_to_equity_mrq: balanceSheet.total_debt_to_equity_mrq,
        book_value_per_share_mrq: balanceSheet.book_value_per_share_mrq,
        quickRatio: balanceSheet.current_ratio_mrq ? (balanceSheet.total_cash_mrq / balanceSheet.total_debt_mrq) : fmpData.quickRatio,
        
        // Cash flow
        operating_cash_flow_ttm: cashFlow.operating_cash_flow_ttm,
        levered_free_cash_flow_ttm: cashFlow.levered_free_cash_flow_ttm,
        
        // Dividend data
        forward_annual_dividend_rate: dividendsAndSplits.forward_annual_dividend_rate,
        forward_annual_dividend_yield: dividendsAndSplits.forward_annual_dividend_yield,
        trailing_annual_dividend_rate: dividendsAndSplits.trailing_annual_dividend_rate,
        trailing_annual_dividend_yield: dividendsAndSplits.trailing_annual_dividend_yield,
        five_year_average_dividend_yield: dividendsAndSplits.five_year_average_dividend_yield,
        payout_ratio: dividendsAndSplits.payout_ratio,
        dividend_frequency: dividendsAndSplits.dividend_frequency,
        dividend_date: dividendsAndSplits.dividend_date,
        ex_dividend_date: dividendsAndSplits.ex_dividend_date,
      };
      
      return mergedData;
    }
    
    // If Twelve Data API failed, return just the FMP data
    return fmpData;
  } catch (error) {
    console.error('Error fetching financial health data:', error);
    return null; // Return null on fetch error
  }
};

// Fetch Technical Indicator Data
export const fetchTechnicalIndicators = async (symbol: string): Promise<TechnicalIndicatorData | null> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      return null;
    }

    // Fetch the RSI from Polygon API
    const rsiData = await fetchRsiFromPolygon(symbol);
    
    // Fetch the MACD data from dedicated endpoint
    const macdData = await fetchMacdData(symbol);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/technical-indicators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ symbol }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching technical indicators for ${symbol}: ${response.status} ${errorText}`);
      return null;
    }

    const data = await response.json() as TechnicalIndicatorData;
    
    // Override the RSI with the value from Polygon API if available
    if (rsiData !== null) {
      data.rsi = rsiData;
    }
    
    // Set MACD data from dedicated endpoint if available
    if (macdData !== null) {
      // Convert signalStrength to macdSignal format
      let macdSignal: 'Bullish' | 'Bearish' | 'Neutral' | null = null;
      
      switch (macdData.signalStrength) {
        case 'strong_buy':
        case 'buy':
          macdSignal = 'Bullish';
          break;
        case 'strong_sell':
        case 'sell':
          macdSignal = 'Bearish';
          break;
        case 'neutral':
        default:
          macdSignal = 'Neutral';
          break;
      }
      
      data.macdSignal = macdSignal;
      
      // Generate array of MACD signals
      const macdSignals: string[] = [];
      
      // Define a function to check if a timestamp is recent (within the last 3 days)
      const isRecentSignal = (timestamp: number) => {
        const now = new Date().getTime();
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
        return (now - timestamp) < threeDaysMs;
      };
      
      // Check for active bullish signals - only add if the condition is fulfilled (array has elements)
      // and if the signal occurred recently
      const hasBullishCrossover = macdData.signals.bullish_crossover.some(isRecentSignal);
      const hasBullishZeroCross = macdData.signals.bullish_zero_crossover.some(isRecentSignal);
      const hasHistogramBullish = macdData.signals.histogram_bullish_turn.some(isRecentSignal);
      
      // Check for active bearish signals - only add if the condition is fulfilled (array has elements)
      // and if the signal occurred recently
      const hasBearishCrossover = macdData.signals.bearish_crossover.some(isRecentSignal);
      const hasBearishZeroCross = macdData.signals.bearish_zero_crossover.some(isRecentSignal);
      const hasHistogramBearish = macdData.signals.histogram_bearish_turn.some(isRecentSignal);
      
      // Add signals only if they are active and recent
      if (hasBullishCrossover) {
        macdSignals.push('Bullish Crossover');
      }
      if (hasBullishZeroCross) {
        macdSignals.push('Bullish Zero Cross');
      }
      if (hasHistogramBullish) {
        macdSignals.push('Histogram Bullish');
      }
      if (hasBearishCrossover) {
        macdSignals.push('Bearish Crossover');
      }
      if (hasBearishZeroCross) {
        macdSignals.push('Bearish Zero Cross');
      }
      if (hasHistogramBearish) {
        macdSignals.push('Histogram Bearish');
      }
      
      // Check current MACD position - only add if the condition is fulfilled
      if (macdData.latestValues.macd !== null && macdData.latestValues.signal !== null) {
        // Only add one of these position signals
        if (macdData.latestValues.macd > macdData.latestValues.signal) {
          macdSignals.push('MACD Above Signal');
        } else if (macdData.latestValues.macd < macdData.latestValues.signal) {
          macdSignals.push('MACD Below Signal');
        }
        
        // Only add one of these zero line signals
        if (macdData.latestValues.macd > 0) {
          macdSignals.push('MACD Above Zero');
        } else if (macdData.latestValues.macd < 0) {
          macdSignals.push('MACD Below Zero');
        }
      }
      
      data.macdSignals = macdSignals.length > 0 ? macdSignals : null;
    }
    
    return data;

  } catch (error) {
    console.error('Error fetching technical indicator data:', error);
    return null;
  }
};

// Fetch RSI from Polygon.io API
export const fetchRsiFromPolygon = async (symbol: string): Promise<number | null> => {
  try {
    // Get Supabase environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      return null;
    }
    
    // Call the rsi-indicator edge function that interfaces with Polygon API
    const response = await fetch(`${supabaseUrl}/functions/v1/rsi-indicator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ symbol }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching RSI for ${symbol}: ${response.status} ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    
    // Extract the RSI values from the response structure
    if (data && data.rsiValues && Array.isArray(data.rsiValues) && data.rsiValues.length > 0) {
      return Number(data.averageRsi.toFixed(2)); // Return the average RSI from the edge function
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching RSI from edge function:', error);
    return null;
  }
};

// Fetch News and Sentiment Data
export const fetchNewsSentiment = async (symbol: string): Promise<NewsSentimentData | null> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      return null;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/news-sentiment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ symbol }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching news and sentiment for ${symbol}: ${response.status} ${errorText}`);
      return null;
    }

    const data = await response.json();
    // Ensure recentNews is always an array
    if (data && !Array.isArray(data.recentNews)) {
        data.recentNews = [];
    }
    return data as NewsSentimentData;

  } catch (error) {
    console.error('Error fetching news and sentiment data:', error);
    return null;
  }
};

// Fetch Risk Analysis Data
export const fetchRiskAnalysis = async (symbol: string): Promise<RiskAnalysisData | null> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      return null;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/risk-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ symbol }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching risk analysis for ${symbol}: ${response.status} ${errorText}`);
      return null;
    }

    const data = await response.json();
    return data as RiskAnalysisData;

  } catch (error) {
    console.error('Error fetching risk analysis data:', error);
    return null;
  }
};

// Fetch MACD data from dedicated edge function
export const fetchMacdData = async (symbol: string): Promise<MacdData | null> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      return null;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/macd-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ symbol }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching MACD data for ${symbol}: ${response.status} ${errorText}`);
      return null;
    }

    const data = await response.json();
    return data as MacdData;

  } catch (error) {
    console.error('Error fetching MACD data:', error);
    return null;
  }
};

// Fetch Analyst Ratings and Price Target data
export const fetchAnalystRatings = async (symbol: string): Promise<AnalystRatings | null> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      return null; // Return null directly
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/analyst-ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ symbol }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching analyst ratings for ${symbol}: ${response.status} ${errorText}`);
      return null;
    }

    const data = await response.json();
    return data as AnalystRatings;

  } catch (error) {
    console.error('Error fetching analyst ratings:', error);
    return null;
  }
};
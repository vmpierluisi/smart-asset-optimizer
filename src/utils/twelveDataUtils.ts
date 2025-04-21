import { StockQuote } from './fmpFinanceUtils';

// Enhanced StockQuote interface with additional fields from Twelve Data
export interface TwelveDataStockQuote extends StockQuote {
  open: number;
  high: number;
  low: number;
  previousClose: number;
  datetime: string;
  isMarketOpen: boolean;
  currency: string;
  extendedHoursPrice?: number;
  extendedHoursChange?: number;
  extendedHoursChangePercent?: number;
  rolling1dChange?: number;
  rolling7dChange?: number;
  rollingPeriodChange?: number;
}

// Interface for company logo data
export interface CompanyLogoData {
  meta: {
    symbol: string;
    name: string;
    currency: string;
    exchange: string;
    mic_code: string;
    exchange_timezone: string;
  };
  url: string;
}

/**
 * Interface for company profile data from Twelve Data
 */
export interface CompanyProfileData {
  symbol: string;
  name: string;
  exchange: string;
  mic_code: string;
  sector: string;
  industry: string;
  employees: number;
  website: string;
  description: string;
  type: string;
  CEO: string;
  address: string;
  address2: string;
  city: string;
  zip: string;
  state: string;
  country: string;
  phone: string;
}

/**
 * Interface for stock recommendations data from Twelve Data
 */
export interface RecommendationsData {
  meta: {
    symbol: string;
    name: string;
    currency: string;
    exchange_timezone: string;
    exchange: string;
    mic_code: string;
    type: string;
  };
  trends: {
    current_month: {
      strong_buy: number;
      buy: number;
      hold: number;
      sell: number;
      strong_sell: number;
    };
    previous_month: {
      strong_buy: number;
      buy: number;
      hold: number;
      sell: number;
      strong_sell: number;
    };
    '2_months_ago': {
      strong_buy: number;
      buy: number;
      hold: number;
      sell: number;
      strong_sell: number;
    };
    '3_months_ago': {
      strong_buy: number;
      buy: number;
      hold: number;
      sell: number;
      strong_sell: number;
    };
  };
  rating: number;
  status: string;
}

/**
 * Interface for historical time series data from Twelve Data
 */
export interface TimeSeriesData {
  symbol: string;
  data: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  meta: {
    symbol: string;
    interval: string;
    currency: string;
    exchange_timezone: string;
    exchange: string;
    mic_code: string;
    type: string;
  };
}

/**
 * Interface for dividend data returned from the twelve-dividend edge function
 */
export interface DividendYieldData {
  symbol: string;
  name: string;
  price: number;
  dividendAmount: number;
  annualDividend: number;
  dividendYield: number;
  currency: string;
  exchange: string;
  lastExDate: string;
}

/**
 * Interface for price target data returned from the twelve-price-target edge function
 */
export interface PriceTargetData {
  meta: {
    symbol: string;
    name: string;
    currency: string;
    exchange_timezone: string;
    exchange: string;
    mic_code: string;
    type: string;
  };
  price_target: {
    high: number;
    median: number;
    low: number;
    average: number;
    current: number;
  };
  status: string;
}

/**
 * Interface for stock statistics data from Twelve Data
 */
export interface StockStatisticsData {
  meta: {
    symbol: string;
    name: string;
    currency: string;
    exchange: string;
    mic_code: string;
    exchange_timezone: string;
  };
  statistics: {
    valuations_metrics: {
      market_capitalization: number;
      enterprise_value: number;
      trailing_pe: number;
      forward_pe: number;
      peg_ratio: number;
      price_to_sales_ttm: number;
      price_to_book_mrq: number;
      enterprise_to_revenue: number;
      enterprise_to_ebitda: number;
    };
    financials: {
      fiscal_year_ends: string;
      most_recent_quarter: string;
      gross_margin: number;
      profit_margin: number;
      operating_margin: number;
      return_on_assets_ttm: number;
      return_on_equity_ttm: number;
      income_statement: {
        revenue_ttm: number;
        revenue_per_share_ttm: number;
        quarterly_revenue_growth: number;
        gross_profit_ttm: number;
        ebitda: number;
        net_income_to_common_ttm: number;
        diluted_eps_ttm: number;
        quarterly_earnings_growth_yoy: number;
      };
      balance_sheet: {
        revenue_ttm: number;
        total_cash_mrq: number;
        total_cash_per_share_mrq: number;
        total_debt_mrq: number;
        total_debt_to_equity_mrq: number;
        current_ratio_mrq: number;
        book_value_per_share_mrq: number;
      };
      cash_flow: {
        operating_cash_flow_ttm: number;
        levered_free_cash_flow_ttm: number;
      };
    };
    stock_statistics: {
      shares_outstanding: number;
      float_shares: number;
      avg_10_volume: number;
      avg_90_volume: number;
      shares_short: number;
      short_ratio: number;
      short_percent_of_shares_outstanding: number;
      percent_held_by_insiders: number;
      percent_held_by_institutions: number;
    };
    stock_price_summary: {
      fifty_two_week_low: number;
      fifty_two_week_high: number;
      fifty_two_week_change: number;
      beta: number;
      day_50_ma: number;
      day_200_ma: number;
    };
    dividends_and_splits: {
      forward_annual_dividend_rate: number;
      forward_annual_dividend_yield: number;
      trailing_annual_dividend_rate: number;
      trailing_annual_dividend_yield: number;
      five_year_average_dividend_yield: number;
      payout_ratio: number;
      dividend_frequency: string;
      dividend_date: string;
      ex_dividend_date: string;
      last_split_factor: string;
      last_split_date: string;
    };
  };
}

// Interface for SMA data response from our edge function
export interface SMAData {
  symbol: string;
  meta: {
    symbol: string;
    interval: string;
    currency: string;
    exchange_timezone: string;
    exchange: string;
    mic_code: string;
    type: string;
    indicator: {
      name: string;
      ma_type: string;
      series_type: string;
      time_period: number;
    }
  };
  values: {
    datetime: string;
    ma: string;
  }[];
  status: string;
}

// Interface for EMA data response from our edge function
// Using the same structure as SMA data since both APIs return the same format
export interface EMAData extends SMAData {}

// Interface for MACD data response from our edge function
export interface MACDData {
  symbol: string;
  meta: {
    symbol: string;
    interval: string;
    currency: string;
    exchange_timezone: string;
    exchange: string;
    mic_code: string;
    type: string;
    indicator: {
      name: string;
      fast_period: number;
      series_type: string;
      signal_period: number;
      slow_period: number;
    }
  };
  values: {
    datetime: string;
    macd: string;
    macd_signal: string;
    macd_hist: string;
  }[];
  status: string;
}

// Interface for RSI data response from our edge function
export interface RSIData {
  symbol: string;
  meta: {
    symbol: string;
    interval: string;
    currency: string;
    exchange_timezone: string;
    exchange: string;
    mic_code: string;
    type: string;
    indicator: {
      name: string;
      series_type: string;
      time_period: number;
    }
  };
  values: {
    datetime: string;
    rsi: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
  }[];
  status: string;
}

/**
 * Interface for MACD value with price data included for divergence analysis
 */
export interface MACDValue {
  datetime: string;
  macd: number;
  macd_signal: number;
  macd_hist: number;
  price: number; // Include price for divergence analysis
}

/**
 * Interface for MACD signals detected in analysis
 */
export interface MACDSignals {
  bullishCrossover: boolean;
  bearishCrossover: boolean;
  bullishZeroCrossover: boolean;
  bearishZeroCrossover: boolean;
  bullishDivergence?: boolean;
  bearishDivergence?: boolean;
  histogramIncreasing: boolean;
  histogramDecreasing: boolean;
}

/**
 * Analyzes MACD data to detect technical signals
 * @param current Current MACD value with price
 * @param previous Previous MACD value with price
 * @param historicalData Array of historical MACD values (for divergence analysis)
 * @returns Object containing detected MACD signals
 */
export function analyzeMACDSignals(
  current: MACDValue,
  previous?: MACDValue,
  historicalData?: MACDValue[] // For divergence
): MACDSignals {
  const signals: MACDSignals = {
    bullishCrossover: false,
    bearishCrossover: false,
    bullishZeroCrossover: false,
    bearishZeroCrossover: false,
    histogramIncreasing: false,
    histogramDecreasing: false,
  };

  if (previous) {
    // 1. MACD Line and Signal Line Crossovers
    signals.bullishCrossover = previous.macd < previous.macd_signal && current.macd > current.macd_signal;
    signals.bearishCrossover = previous.macd > previous.macd_signal && current.macd < current.macd_signal;

    // 2. Zero Line Crossovers
    signals.bullishZeroCrossover = previous.macd <= 0 && current.macd > 0;
    signals.bearishZeroCrossover = previous.macd >= 0 && current.macd < 0;

    // 5. Histogram Interpretation
    signals.histogramIncreasing = Math.abs(current.macd_hist) > Math.abs(previous.macd_hist) && Math.sign(current.macd_hist) === Math.sign(previous.macd_hist);
    signals.histogramDecreasing = Math.abs(current.macd_hist) < Math.abs(previous.macd_hist) && Math.sign(current.macd_hist) === Math.sign(previous.macd_hist);
  }

  // 3. Divergence (Checking against a history of data)
  if (historicalData && historicalData.length >= 2) {
    const n = 2; // Check the last 2 points for a simple divergence

    // Bullish Divergence: Price makes lower lows, MACD makes higher lows
    const priceLows = historicalData.slice(-n).map(item => item.price);
    const macdLows = historicalData.slice(-n).map(item => item.macd);
    if (priceLows[0] > priceLows[1] && macdLows[0] < macdLows[1]) {
      signals.bullishDivergence = true;
    }

    // Bearish Divergence: Price makes higher highs, MACD makes lower highs
    const priceHighs = historicalData.slice(-n).map(item => item.price);
    const macdHighs = historicalData.slice(-n).map(item => item.macd);
    if (priceHighs[0] < priceHighs[1] && macdHighs[0] > macdHighs[1]) {
      signals.bearishDivergence = true;
    }
  }

  return signals;
}

/**
 * Processes MACD data with price data to detect recent signals
 * @param macdData MACD data from Twelve Data API
 * @param timeSeriesData Time series data for the same period (for price information)
 * @returns Object containing recent MACD signals for display
 */
export function getRecentMACDSignals(macdData: MACDData, timeSeriesData: TimeSeriesData): { 
  recentSignals: MACDSignals, 
  macdValues: MACDValue[] 
} {
  if (!macdData?.values || !timeSeriesData?.data || macdData.values.length === 0 || timeSeriesData.data.length === 0) {
    return { 
      recentSignals: {
        bullishCrossover: false,
        bearishCrossover: false,
        bullishZeroCrossover: false,
        bearishZeroCrossover: false,
        histogramIncreasing: false,
        histogramDecreasing: false
      },
      macdValues: []
    };
  }

  // Create a map of dates to prices for quick lookup
  const priceMap = new Map<string, number>();
  timeSeriesData.data.forEach(item => {
    priceMap.set(item.date, item.close);
  });

  // Convert MACD string values to numbers and add price data
  const macdValues: MACDValue[] = macdData.values.map(item => {
    // Extract date in format that matches the time series data
    const dateStr = item.datetime.split('T')[0];
    const price = priceMap.get(dateStr) || 0;

    return {
      datetime: item.datetime,
      macd: parseFloat(item.macd),
      macd_signal: parseFloat(item.macd_signal),
      macd_hist: parseFloat(item.macd_hist),
      price
    };
  }).filter(item => item.price > 0); // Filter out items without matching price data

  // Get the most recent 2 days of data for signal analysis
  if (macdValues.length < 2) {
    return {
      recentSignals: {
        bullishCrossover: false,
        bearishCrossover: false,
        bullishZeroCrossover: false,
        bearishZeroCrossover: false,
        histogramIncreasing: false,
        histogramDecreasing: false
      },
      macdValues
    };
  }

  // Get the two most recent data points
  const current = macdValues[macdValues.length - 1];
  const previous = macdValues[macdValues.length - 2];

  // Use the last 5 data points for divergence analysis
  const historicalData = macdValues.slice(-5);

  // Analyze the signals
  const recentSignals = analyzeMACDSignals(current, previous, historicalData);

  return { recentSignals, macdValues };
}

/**
 * Fetches a company logo from the Twelve Data API via Supabase Edge Function
 * @param symbol The stock symbol to fetch the logo for (e.g. AAPL)
 * @returns Company logo data including the logo URL
 */
export const fetchCompanyLogo = async (symbol: string): Promise<CompanyLogoData | null> => {
  try {
    // Use local static data as fallback when in development or if API fails
    const useFallback = import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_STOCK_DATA === 'true';
    
    if (useFallback) {
      // Simulate network delay to make it feel like a real API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Return mock data for development
      return {
        meta: {
          symbol: symbol,
          name: `${symbol} Inc.`,
          currency: 'USD',
          exchange: 'NASDAQ',
          mic_code: 'XNAS',
          exchange_timezone: 'America/New_York'
        },
        url: `https://api.twelvedata.com/logo/placeholder.com`
      };
    }
    
    // Call the Supabase Edge Function that interfaces with Twelve Data API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/company-logo?symbol=${encodeURIComponent(symbol.trim())}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twelve Data Logo API error:', errorText);
      throw new Error(`Twelve Data Logo API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error fetching company logo from Twelve Data:', error);
    // Return null instead of throwing to gracefully handle missing logos
    return null;
  }
};

/**
 * Fetches a stock quote from the Twelve Data API via Supabase Edge Function
 * @param symbol The stock symbol to fetch (e.g. AAPL)
 * @returns Enhanced stock quote data with additional fields
 */
export const fetchTwelveDataQuote = async (symbol: string): Promise<TwelveDataStockQuote> => {
  try {
    // Use local static data as fallback when in development or if API fails
    const useFallback = import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_STOCK_DATA === 'true';
    
    if (useFallback) {
      // Simulate network delay to make it feel like a real API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Return mock data for development
      return {
        symbol: symbol,
        name: `${symbol} Inc.`,
        price: 150.25,
        change: 2.5,
        changePercent: 1.75,
        marketCap: '2.45T',
        peRatio: 28.5,
        dividendYield: 0.65,
        volume: '63.2M',
        avgVolume: '75.4M',
        exchange: 'NASDAQ',
        high52Week: 180.45,
        low52Week: 120.35,
        open: 148.10,
        high: 151.20,
        low: 147.90,
        previousClose: 147.75,
        datetime: new Date().toISOString().split('T')[0],
        isMarketOpen: false,
        currency: 'USD',
        extendedHoursPrice: 150.35,
        extendedHoursChange: 0.10,
        extendedHoursChangePercent: 0.07,
        rolling1dChange: 1.25,
        rolling7dChange: 2.75,
        rollingPeriodChange: 5.50
      };
    }
    
    // Call the Supabase Edge Function that interfaces with Twelve Data API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/twelve-data-quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ symbol: symbol.trim() }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twelve Data API error:', errorText);
      throw new Error(`Twelve Data API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Convert to our expected interface
    const stockQuote: TwelveDataStockQuote = {
      ...data,
      // Ensure these fields exist and are of correct type
      peRatio: data.peRatio ?? 0, // Twelve Data doesn't provide PE ratio directly
      dividendYield: data.dividendYield ?? 0 // Might need calculation if not provided
    };
    
    return stockQuote;
    
  } catch (error) {
    console.error('Error fetching stock quote from Twelve Data:', error);
    throw error;
  }
};

/**
 * Fetches a company profile from the Twelve Data API via Supabase Edge Function
 * @param symbol The stock symbol to fetch the profile for (e.g. AAPL)
 * @returns Company profile data including description, sector, industry, etc.
 */
export const fetchCompanyProfile = async (symbol: string): Promise<CompanyProfileData | null> => {
  try {
    // Use local static data as fallback when in development or if API fails
    const useFallback = import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_STOCK_DATA === 'true';
    
    if (useFallback) {
      // Simulate network delay to make it feel like a real API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Return mock data for development
      return {
        symbol: symbol,
        name: `${symbol} Inc.`,
        exchange: "NASDAQ",
        mic_code: "XNAS",
        sector: "Technology",
        industry: "Consumer Electronics",
        employees: 147000,
        website: `https://www.${symbol.toLowerCase()}.com`,
        description: `${symbol} Inc. is a fictional company used for demonstration purposes in this application.`,
        type: "Common Stock",
        CEO: `John Doe`,
        address: "123 Main Street",
        address2: "",
        city: "San Francisco",
        zip: "94105",
        state: "CA",
        country: "US",
        phone: "123-456-7890"
      };
    }
    
    // Call the Supabase Edge Function that interfaces with Twelve Data API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/company-description?symbol=${encodeURIComponent(symbol.trim())}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twelve Data Profile API error:', errorText);
      throw new Error(`Twelve Data Profile API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error fetching company profile from Twelve Data:', error);
    // Return null instead of throwing to gracefully handle missing profiles
    return null;
  }
};

/**
 * Fetches historical time series data from the Twelve Data API via Supabase Edge Function
 * @param symbol The stock symbol to fetch (e.g. AAPL)
 * @param period The time period to fetch (1day, 1week, 1month, 1year, ytd, max)
 * @param cacheTimestamp Optional timestamp to prevent caching between requests
 * @returns Historical time series data for the specified symbol and period
 */
export const fetchTimeSeries = async (symbol: string, period: string = '1month', cacheTimestamp?: number): Promise<TimeSeriesData> => {
  try {
    // Use local static data as fallback when in development or if API fails
    const useFallback = import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_STOCK_DATA === 'true';
    
    // Generate different mock data for different periods
    if (useFallback) {
      // Simulate network delay to make it feel like a real API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Determine data length based on period
      let dataLength = 30; // Default for 1month
      
      switch(period) {
        case '1day':
          dataLength = 24; // Hourly for a day
          break;
        case '1week':
          dataLength = 7; // Daily for a week
          break;
        case '1month':
          dataLength = 30; // Daily for a month
          break;
        case '3month':
          dataLength = 90; // Daily for 3 months
          break;
        case '6month':
          dataLength = 180; // Daily for 6 months
          break;
        case 'ytd':
          // Calculate days from Jan 1 to today
          const now = new Date();
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          dataLength = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
          break;
        case '1year':
          dataLength = 252; // Trading days in a year
          break;
        case 'max':
          dataLength = 1000; // Long historical data
          break;
      }
      
      // Generate some mock time series data
      const today = new Date();
      const mockData = Array.from({ length: dataLength }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (dataLength - i));
        const basePrice = 150 + Math.sin(i / (dataLength/10)) * 15;
        return {
          date: date.toISOString().split('T')[0],
          open: parseFloat((basePrice - 2 + Math.random() * 4).toFixed(2)),
          high: parseFloat((basePrice + 2 + Math.random() * 3).toFixed(2)),
          low: parseFloat((basePrice - 4 - Math.random() * 2).toFixed(2)),
          close: parseFloat((basePrice + Math.random() * 6 - 3).toFixed(2)),
          volume: Math.floor(Math.random() * 10000000) + 5000000
        };
      });
      
      return {
        symbol: symbol,
        data: mockData,
        meta: {
          symbol: symbol,
          interval: '1day',
          currency: 'USD',
          exchange_timezone: 'America/New_York',
          exchange: 'NASDAQ',
          mic_code: 'XNAS',
          type: 'Common Stock'
        }
      };
    }
    
    // Call the Supabase Edge Function that interfaces with Twelve Data API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    // Add cache busting parameter to URL if timestamp is provided
    const cacheBuster = cacheTimestamp ? `?_t=${cacheTimestamp}` : '';
    
    const response = await fetch(`${supabaseUrl}/functions/v1/twelve-time-series${cacheBuster}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ 
        symbol: symbol.trim(),
        period
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twelve Data Time Series API error:', errorText);
      throw new Error(`Twelve Data Time Series API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data as TimeSeriesData;
    
  } catch (error) {
    console.error('Error fetching time series data from Twelve Data:', error);
    throw error;
  }
};

/**
 * Fetches dividend yield data from the Twelve Data API via Supabase Edge Function
 * @param symbol The stock symbol to fetch (e.g. AAPL)
 * @returns Dividend yield data including amount, annual yield, and ex-date
 */
export const fetchDividendYield = async (symbol: string): Promise<DividendYieldData | null> => {
  try {
    // Use local static data as fallback when in development or if API fails
    const useFallback = import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_STOCK_DATA === 'true';
    
    if (useFallback) {
      // Simulate network delay to make it feel like a real API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Return mock data for development
      return {
        symbol: symbol,
        name: `${symbol} Inc.`,
        price: 150.25,
        dividendAmount: 0.25,
        annualDividend: 1.00, // quarterly dividend * 4
        dividendYield: 0.67, // annualDividend / price * 100
        currency: 'USD',
        exchange: 'NASDAQ',
        lastExDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      };
    }
    
    // Call the Supabase Edge Function that interfaces with Twelve Data API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/twelve-dividend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ symbol: symbol.trim() }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twelve Data Dividend API error:', errorText);
      // Return null instead of throwing to gracefully handle stocks without dividend data
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Twelve Data Dividend API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error fetching dividend yield from Twelve Data:', error);
    return null;
  }
};

/**
 * Fetches 5-year historical time series data from the Twelve Data API via Supabase Edge Function
 * This is optimized for calculating historical returns and will always fetch 5 years of data
 * @param symbol The stock symbol to fetch data for (e.g. AAPL)
 * @param cacheTimestamp Optional timestamp for cache busting
 * @returns Time series data with 5 years of historical daily prices
 */
export const fetchHistoricalTimeSeries = async (symbol: string, cacheTimestamp?: number): Promise<TimeSeriesData> => {
  try {
    // Use local static data as fallback when in development or if API fails
    const useFallback = import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_STOCK_DATA === 'true';
    
    if (useFallback) {
      // Simulate network delay to make it feel like a real API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Always generate 5 years of daily data (approx 1250 trading days)
      const dataLength = 1250;
      
      // Generate some mock time series data
      const today = new Date();
      const mockData = Array.from({ length: dataLength }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (dataLength - i));
        const basePrice = 150 + Math.sin(i / (dataLength/10)) * 15;
        return {
          date: date.toISOString().split('T')[0],
          open: parseFloat((basePrice - 2 + Math.random() * 4).toFixed(2)),
          high: parseFloat((basePrice + 2 + Math.random() * 3).toFixed(2)),
          low: parseFloat((basePrice - 4 - Math.random() * 2).toFixed(2)),
          close: parseFloat((basePrice + Math.random() * 6 - 3).toFixed(2)),
          volume: Math.floor(Math.random() * 10000000) + 5000000
        };
      });
      
      return {
        symbol: symbol,
        data: mockData,
        meta: {
          symbol: symbol,
          interval: '1day',
          currency: 'USD',
          exchange_timezone: 'America/New_York',
          exchange: 'NASDAQ',
          mic_code: 'XNAS',
          type: 'Common Stock'
        }
      };
    }
    
    // Call the Supabase Edge Function that interfaces with Twelve Data API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    // Add cache busting parameter to URL if timestamp is provided
    const cacheBuster = cacheTimestamp ? `?_t=${cacheTimestamp}` : '';
    
    const response = await fetch(`${supabaseUrl}/functions/v1/twelve-historical${cacheBuster}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ 
        symbol: symbol.trim()
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twelve Data Historical API error:', errorText);
      throw new Error(`Twelve Data Historical API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data as TimeSeriesData;
    
  } catch (error) {
    console.error('Error fetching historical time series data from Twelve Data:', error);
    throw error;
  }
};

/**
 * Fetches comprehensive stock statistics from the Twelve Data API via Supabase Edge Function
 * @param symbol The stock symbol to fetch statistics for (e.g. AAPL)
 * @returns Comprehensive statistics data including valuation metrics, financials, and more
 */
export const fetchStockStatistics = async (symbol: string): Promise<StockStatisticsData | null> => {
  try {
    // Use local static data as fallback when in development or if API fails
    const useFallback = import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_STOCK_DATA === 'true';
    
    if (useFallback) {
      // Simulate network delay to make it feel like a real API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Return mock data for development
      return {
        meta: {
          symbol: symbol,
          name: `${symbol} Inc`,
          currency: 'USD',
          exchange: 'NASDAQ',
          mic_code: 'XNAS',
          exchange_timezone: 'America/New_York'
        },
        statistics: {
          valuations_metrics: {
            market_capitalization: 2546807865344,
            enterprise_value: 2620597731328,
            trailing_pe: 30.162493,
            forward_pe: 26.982489,
            peg_ratio: 1.4,
            price_to_sales_ttm: 7.336227,
            price_to_book_mrq: 39.68831,
            enterprise_to_revenue: 7.549,
            enterprise_to_ebitda: 23.623
          },
          financials: {
            fiscal_year_ends: '2020-09-26',
            most_recent_quarter: '2021-06-26',
            gross_margin: 46.57807,
            profit_margin: 0.25004,
            operating_margin: 0.28788,
            return_on_assets_ttm: 0.19302,
            return_on_equity_ttm: 1.27125,
            income_statement: {
              revenue_ttm: 347155005440,
              revenue_per_share_ttm: 20.61,
              quarterly_revenue_growth: 0.364,
              gross_profit_ttm: 104956000000,
              ebitda: 110934999040,
              net_income_to_common_ttm: 86801997824,
              diluted_eps_ttm: 5.108,
              quarterly_earnings_growth_yoy: 0.932
            },
            balance_sheet: {
              revenue_ttm: 347155005440,
              total_cash_mrq: 61696000000,
              total_cash_per_share_mrq: 3.732,
              total_debt_mrq: 135491002368,
              total_debt_to_equity_mrq: 210.782,
              current_ratio_mrq: 1.062,
              book_value_per_share_mrq: 3.882
            },
            cash_flow: {
              operating_cash_flow_ttm: 104414003200,
              levered_free_cash_flow_ttm: 80625876992
            }
          },
          stock_statistics: {
            shares_outstanding: 16530199552,
            float_shares: 16513305231,
            avg_10_volume: 72804757,
            avg_90_volume: 77013078,
            shares_short: 93105968,
            short_ratio: 1.19,
            short_percent_of_shares_outstanding: 0.0056,
            percent_held_by_insiders: 0.00071000005,
            percent_held_by_institutions: 0.58474
          },
          stock_price_summary: {
            fifty_two_week_low: 103.1,
            fifty_two_week_high: 157.26,
            fifty_two_week_change: 0.375625,
            beta: 1.201965,
            day_50_ma: 148.96686,
            day_200_ma: 134.42506
          },
          dividends_and_splits: {
            forward_annual_dividend_rate: 0.88,
            forward_annual_dividend_yield: 0.0057,
            trailing_annual_dividend_rate: 0.835,
            trailing_annual_dividend_yield: 0.0053832764,
            five_year_average_dividend_yield: 1.27,
            payout_ratio: 0.16309999,
            dividend_frequency: 'Quarterly',
            dividend_date: '2021-08-12',
            ex_dividend_date: '2021-08-06',
            last_split_factor: '4-for-1 split',
            last_split_date: '2020-08-31'
          }
        }
      };
    }
    
    // Call the Supabase Edge Function that interfaces with Twelve Data API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/twelve-stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ 
        symbol: symbol.trim()
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twelve Data Statistics API error:', errorText);
      throw new Error(`Twelve Data Statistics API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data as StockStatisticsData;
    
  } catch (error) {
    console.error('Error fetching stock statistics from Twelve Data:', error);
    // Return null instead of throwing to gracefully handle missing data
    return null;
  }
};

/**
 * Fetches price target data from the Twelve Data API via Supabase Edge Function
 * @param symbol The stock symbol to fetch price target for (e.g. AAPL)
 * @returns Price target data including high, low, median, average, and current price points
 */
export const fetchPriceTarget = async (symbol: string): Promise<PriceTargetData | null> => {
  try {
    // Use local static data as fallback when in development or if API fails
    const useFallback = import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_STOCK_DATA === 'true';
    
    if (useFallback) {
      // Simulate network delay to make it feel like a real API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Return mock data for development
      return {
        meta: {
          symbol: symbol,
          name: `${symbol} Inc`,
          currency: 'USD',
          exchange_timezone: 'America/New_York',
          exchange: 'NASDAQ',
          mic_code: 'XNGS',
          type: 'Common Stock'
        },
        price_target: {
          high: 220,
          median: 185,
          low: 136,
          average: 184.01,
          current: 169.57
        },
        status: 'ok'
      };
    }
    
    // Call the Supabase Edge Function that interfaces with Twelve Data API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/twelve-price-target`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ symbol: symbol.trim() }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twelve Data Price Target API error:', errorText);
      // Return null instead of throwing to gracefully handle errors
      return null;
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error fetching price target from Twelve Data:', error);
    return null;
  }
};

/**
 * Fetches 20-day Simple Moving Average (SMA) data from the Twelve Data API via Supabase Edge Function
 * @param symbol The stock symbol to fetch SMA data for (e.g. AAPL)
 * @param timeframe The timeframe to fetch data for (3M, 6M, 1Y)
 * @returns SMA data including historical values for the specified timeframe
 */
export const fetchSMA20 = async (symbol: string, timeframe: string = '3M'): Promise<SMAData | null> => {
  try {
    // Use local static data as fallback when in development or if API fails
    const useFallback = import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_STOCK_DATA === 'true';
    
    if (useFallback) {
      // Simulate network delay to make it feel like a real API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Determine the number of days to generate based on timeframe
      let dataLength = 90; // Default 3M
      if (timeframe === '6M') dataLength = 180;
      if (timeframe === '1Y') dataLength = 365;
      
      // Generate mock SMA data for the specified timeframe
      const today = new Date();
      const mockData = Array.from({ length: dataLength }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (dataLength - i));
        const basePrice = 150 + Math.sin(i / 15) * 15;
        return {
          datetime: date.toISOString().split('T')[0],
          ma: (basePrice + Math.random() * 3 - 1.5).toFixed(2)
        };
      });
      
      const mockResponse = {
        symbol: symbol,
        meta: {
          symbol: symbol,
          interval: "1day",
          currency: "USD",
          exchange_timezone: "America/New_York",
          exchange: "NASDAQ",
          mic_code: "XNAS",
          type: "Common Stock",
          indicator: {
            name: "Simple Moving Average",
            ma_type: "SMA",
            series_type: "close",
            time_period: 20
          }
        },
        values: mockData,
        status: "ok"
      };
      
      console.log('Using mock SMA-20 data:', mockResponse);
      return mockResponse;
    }
    
    // Call the Supabase Edge Function that interfaces with Twelve Data API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    console.log(`Fetching SMA-20 data for ${symbol} from ${supabaseUrl}/functions/v1/twelve-sma-20`);
    
    // Convert timeframe to date range
    let startDate = new Date();
    if (timeframe === '3M') startDate.setMonth(startDate.getMonth() - 3);
    else if (timeframe === '6M') startDate.setMonth(startDate.getMonth() - 6);
    else if (timeframe === '1Y') startDate.setFullYear(startDate.getFullYear() - 1);
    
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(new Date());
    
    const response = await fetch(`${supabaseUrl}/functions/v1/twelve-sma-20`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ 
        symbol: symbol.trim(),
        start_date: startDateStr,
        end_date: endDateStr
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twelve Data SMA-20 API error:', errorText);
      throw new Error(`Twelve Data SMA-20 API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('SMA-20 API response:', data);
    
    // Verify data structure before returning
    if (!data || !data.values || !Array.isArray(data.values)) {
      console.error('Invalid SMA data structure:', data);
      
      // If API returned error format, throw with the error message
      if (data && data.error) {
        throw new Error(`API Error: ${data.error}`);
      }
      
      throw new Error('Invalid SMA data structure received from API');
    }
    
    return data as SMAData;
    
  } catch (error) {
    console.error('Error fetching SMA-20 data from Twelve Data:', error);
    return null;
  }
};

/**
 * Fetches 50-day Simple Moving Average (SMA) data from the Twelve Data API via Supabase Edge Function
 * @param symbol The stock symbol to fetch SMA data for (e.g. AAPL)
 * @param timeframe The timeframe to fetch data for (3M, 6M, 1Y)
 * @returns SMA data including historical values for the specified timeframe
 */
export const fetchSMA50 = async (symbol: string, timeframe: string = '3M'): Promise<SMAData | null> => {
  try {
    // Use local static data as fallback when in development or if API fails
    const useFallback = import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_STOCK_DATA === 'true';
    
    if (useFallback) {
      // Simulate network delay to make it feel like a real API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Determine the number of days to generate based on timeframe
      let dataLength = 90; // Default 3M
      if (timeframe === '6M') dataLength = 180;
      if (timeframe === '1Y') dataLength = 365;
      
      // Generate mock SMA data for the specified timeframe
      const today = new Date();
      const mockData = Array.from({ length: dataLength }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (dataLength - i));
        // Create slightly different values for SMA-50 compared to SMA-20
        const basePrice = 145 + Math.sin(i / 20) * 20;
        return {
          datetime: date.toISOString().split('T')[0],
          ma: (basePrice + Math.random() * 3 - 1.5).toFixed(2)
        };
      });
      
      const mockResponse = {
        symbol: symbol,
        meta: {
          symbol: symbol,
          interval: "1day",
          currency: "USD",
          exchange_timezone: "America/New_York",
          exchange: "NASDAQ",
          mic_code: "XNAS",
          type: "Common Stock",
          indicator: {
            name: "Simple Moving Average",
            ma_type: "SMA",
            series_type: "close",
            time_period: 50
          }
        },
        values: mockData,
        status: "ok"
      };
      
      console.log('Using mock SMA-50 data:', mockResponse);
      return mockResponse;
    }
    
    // Call the Supabase Edge Function that interfaces with Twelve Data API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    console.log(`Fetching SMA-50 data for ${symbol} from ${supabaseUrl}/functions/v1/twelve-sma-50`);
    
    // Convert timeframe to date range
    let startDate = new Date();
    if (timeframe === '3M') startDate.setMonth(startDate.getMonth() - 3);
    else if (timeframe === '6M') startDate.setMonth(startDate.getMonth() - 6);
    else if (timeframe === '1Y') startDate.setFullYear(startDate.getFullYear() - 1);
    
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(new Date());
    
    const response = await fetch(`${supabaseUrl}/functions/v1/twelve-sma-50`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ 
        symbol: symbol.trim(),
        start_date: startDateStr,
        end_date: endDateStr
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twelve Data SMA-50 API error:', errorText);
      throw new Error(`Twelve Data SMA-50 API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('SMA-50 API response:', data);
    
    // Verify data structure before returning
    if (!data || !data.values || !Array.isArray(data.values)) {
      console.error('Invalid SMA data structure:', data);
      
      // If API returned error format, throw with the error message
      if (data && data.error) {
        throw new Error(`API Error: ${data.error}`);
      }
      
      throw new Error('Invalid SMA data structure received from API');
    }
    
    return data as SMAData;
    
  } catch (error) {
    console.error('Error fetching SMA-50 data from Twelve Data:', error);
    return null;
  }
};

/**
 * Fetches 200-day Simple Moving Average (SMA) data from the Twelve Data API via Supabase Edge Function
 * @param symbol The stock symbol to fetch SMA data for (e.g. AAPL)
 * @param timeframe The timeframe to fetch data for (3M, 6M, 1Y)
 * @returns SMA data including historical values for the specified timeframe
 */
export const fetchSMA200 = async (symbol: string, timeframe: string = '3M'): Promise<SMAData | null> => {
  try {
    // Use local static data as fallback when in development or if API fails
    const useFallback = import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_STOCK_DATA === 'true';
    
    if (useFallback) {
      // Simulate network delay to make it feel like a real API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Determine the number of days to generate based on timeframe
      let dataLength = 90; // Default 3M
      if (timeframe === '6M') dataLength = 180;
      if (timeframe === '1Y') dataLength = 365;
      
      // Generate mock SMA data for the specified timeframe
      const today = new Date();
      const mockData = Array.from({ length: dataLength }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (dataLength - i));
        // Create slightly different values for SMA-200 (more stable, less volatile)
        const basePrice = 140 + Math.sin(i / 30) * 10;
        return {
          datetime: date.toISOString().split('T')[0],
          ma: (basePrice + Math.random() * 2 - 1).toFixed(2)
        };
      });
      
      const mockResponse = {
        symbol: symbol,
        meta: {
          symbol: symbol,
          interval: "1day",
          currency: "USD",
          exchange_timezone: "America/New_York",
          exchange: "NASDAQ",
          mic_code: "XNAS",
          type: "Common Stock",
          indicator: {
            name: "Simple Moving Average",
            ma_type: "SMA",
            series_type: "close",
            time_period: 200
          }
        },
        values: mockData,
        status: "ok"
      };
      
      console.log('Using mock SMA-200 data:', mockResponse);
      return mockResponse;
    }
    
    // Call the Supabase Edge Function that interfaces with Twelve Data API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    console.log(`Fetching SMA-200 data for ${symbol} from ${supabaseUrl}/functions/v1/twelve-sma-200`);
    
    // Convert timeframe to date range
    let startDate = new Date();
    if (timeframe === '3M') startDate.setMonth(startDate.getMonth() - 3);
    else if (timeframe === '6M') startDate.setMonth(startDate.getMonth() - 6);
    else if (timeframe === '1Y') startDate.setFullYear(startDate.getFullYear() - 1);
    
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(new Date());
    
    const response = await fetch(`${supabaseUrl}/functions/v1/twelve-sma-200`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ 
        symbol: symbol.trim(),
        start_date: startDateStr,
        end_date: endDateStr
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twelve Data SMA-200 API error:', errorText);
      throw new Error(`Twelve Data SMA-200 API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('SMA-200 API response:', data);
    
    // Verify data structure before returning
    if (!data || !data.values || !Array.isArray(data.values)) {
      console.error('Invalid SMA data structure:', data);
      
      // If API returned error format, throw with the error message
      if (data && data.error) {
        throw new Error(`API Error: ${data.error}`);
      }
      
      throw new Error('Invalid SMA data structure received from API');
    }
    
    return data as SMAData;
    
  } catch (error) {
    console.error('Error fetching SMA-200 data from Twelve Data:', error);
    return null;
  }
};

/**
 * Fetches 20-day Exponential Moving Average (EMA) data from the Twelve Data API via Supabase Edge Function
 * @param symbol The stock symbol to fetch EMA data for (e.g. AAPL)
 * @param timeframe The timeframe to fetch data for (3M, 6M, 1Y)
 * @returns EMA data including historical values for the specified timeframe
 */
export const fetchEMA20 = async (symbol: string, timeframe: string = '3M'): Promise<EMAData | null> => {
  try {
    // Use local static data as fallback when in development or if API fails
    const useFallback = import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_STOCK_DATA === 'true';
    
    if (useFallback) {
      // Simulate network delay to make it feel like a real API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Determine the number of days to generate based on timeframe
      let dataLength = 90; // Default 3M
      if (timeframe === '6M') dataLength = 180;
      if (timeframe === '1Y') dataLength = 365;
      
      // Generate mock EMA data for the specified timeframe
      const today = new Date();
      const mockData = Array.from({ length: dataLength }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (dataLength - i));
        const basePrice = 152 + Math.sin(i / 14) * 16; // Slightly different from SMA for variation
        return {
          datetime: date.toISOString().split('T')[0],
          ma: (basePrice + Math.random() * 3 - 1.5).toFixed(2)
        };
      });
      
      const mockResponse = {
        symbol: symbol,
        meta: {
          symbol: symbol,
          interval: "1day",
          currency: "USD",
          exchange_timezone: "America/New_York",
          exchange: "NASDAQ",
          mic_code: "XNAS",
          type: "Common Stock",
          indicator: {
            name: "Exponential Moving Average",
            ma_type: "EMA",
            series_type: "close",
            time_period: 20
          }
        },
        values: mockData,
        status: "ok"
      };
      
      console.log('Using mock EMA-20 data:', mockResponse);
      return mockResponse;
    }
    
    // Call the Supabase Edge Function that interfaces with Twelve Data API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    console.log(`Fetching EMA-20 data for ${symbol} from ${supabaseUrl}/functions/v1/twelve-ema-20`);
    
    // Convert timeframe to date range
    let startDate = new Date();
    if (timeframe === '3M') startDate.setMonth(startDate.getMonth() - 3);
    else if (timeframe === '6M') startDate.setMonth(startDate.getMonth() - 6);
    else if (timeframe === '1Y') startDate.setFullYear(startDate.getFullYear() - 1);
    
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(new Date());
    
    const response = await fetch(`${supabaseUrl}/functions/v1/twelve-ema-20`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ 
        symbol: symbol.trim(),
        start_date: startDateStr,
        end_date: endDateStr
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twelve Data EMA-20 API error:', errorText);
      throw new Error(`Twelve Data EMA-20 API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('EMA-20 API response:', data);
    
    // Verify data structure before returning
    if (!data || !data.values || !Array.isArray(data.values)) {
      console.error('Invalid EMA data structure:', data);
      
      // If API returned error format, throw with the error message
      if (data && data.error) {
        throw new Error(`API Error: ${data.error}`);
      }
      
      throw new Error('Invalid EMA data structure received from API');
    }
    
    return data as EMAData;
    
  } catch (error) {
    console.error('Error fetching EMA-20 data from Twelve Data:', error);
    return null;
  }
};

/**
 * Fetches 50-day Exponential Moving Average (EMA) data from the Twelve Data API via Supabase Edge Function
 * @param symbol The stock symbol to fetch EMA data for (e.g. AAPL)
 * @param timeframe The timeframe to fetch data for (3M, 6M, 1Y)
 * @returns EMA data including historical values for the specified timeframe
 */
export const fetchEMA50 = async (symbol: string, timeframe: string = '3M'): Promise<EMAData | null> => {
  try {
    // Use local static data as fallback when in development or if API fails
    const useFallback = import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_STOCK_DATA === 'true';
    
    if (useFallback) {
      // Simulate network delay to make it feel like a real API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Determine the number of days to generate based on timeframe
      let dataLength = 90; // Default 3M
      if (timeframe === '6M') dataLength = 180;
      if (timeframe === '1Y') dataLength = 365;
      
      // Generate mock EMA data for the specified timeframe
      const today = new Date();
      const mockData = Array.from({ length: dataLength }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (dataLength - i));
        // Create slightly different values for EMA-50 compared to EMA-20
        const basePrice = 146 + Math.sin(i / 19) * 18;
        return {
          datetime: date.toISOString().split('T')[0],
          ma: (basePrice + Math.random() * 3 - 1.5).toFixed(2)
        };
      });
      
      const mockResponse = {
        symbol: symbol,
        meta: {
          symbol: symbol,
          interval: "1day",
          currency: "USD",
          exchange_timezone: "America/New_York",
          exchange: "NASDAQ",
          mic_code: "XNAS",
          type: "Common Stock",
          indicator: {
            name: "Exponential Moving Average",
            ma_type: "EMA",
            series_type: "close",
            time_period: 50
          }
        },
        values: mockData,
        status: "ok"
      };
      
      console.log('Using mock EMA-50 data:', mockResponse);
      return mockResponse;
    }
    
    // Call the Supabase Edge Function that interfaces with Twelve Data API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    console.log(`Fetching EMA-50 data for ${symbol} from ${supabaseUrl}/functions/v1/twelve-ema-50`);
    
    // Convert timeframe to date range
    let startDate = new Date();
    if (timeframe === '3M') startDate.setMonth(startDate.getMonth() - 3);
    else if (timeframe === '6M') startDate.setMonth(startDate.getMonth() - 6);
    else if (timeframe === '1Y') startDate.setFullYear(startDate.getFullYear() - 1);
    
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(new Date());
    
    const response = await fetch(`${supabaseUrl}/functions/v1/twelve-ema-50`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ 
        symbol: symbol.trim(),
        start_date: startDateStr,
        end_date: endDateStr
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twelve Data EMA-50 API error:', errorText);
      throw new Error(`Twelve Data EMA-50 API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('EMA-50 API response:', data);
    
    // Verify data structure before returning
    if (!data || !data.values || !Array.isArray(data.values)) {
      console.error('Invalid EMA data structure:', data);
      
      // If API returned error format, throw with the error message
      if (data && data.error) {
        throw new Error(`API Error: ${data.error}`);
      }
      
      throw new Error('Invalid EMA data structure received from API');
    }
    
    return data as EMAData;
    
  } catch (error) {
    console.error('Error fetching EMA-50 data from Twelve Data:', error);
    return null;
  }
};

/**
 * Fetches 200-day Exponential Moving Average (EMA) data from the Twelve Data API via Supabase Edge Function
 * @param symbol The stock symbol to fetch EMA data for (e.g. AAPL)
 * @param timeframe The timeframe to fetch data for (3M, 6M, 1Y)
 * @returns EMA data including historical values for the specified timeframe
 */
export const fetchEMA200 = async (symbol: string, timeframe: string = '3M'): Promise<EMAData | null> => {
  try {
    // Use local static data as fallback when in development or if API fails
    const useFallback = import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_STOCK_DATA === 'true';
    
    if (useFallback) {
      // Simulate network delay to make it feel like a real API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Determine the number of days to generate based on timeframe
      let dataLength = 90; // Default 3M
      if (timeframe === '6M') dataLength = 180;
      if (timeframe === '1Y') dataLength = 365;
      
      // Generate mock EMA data for the specified timeframe
      const today = new Date();
      const mockData = Array.from({ length: dataLength }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (dataLength - i));
        // Create values for EMA-200 (more stable, less volatile than shorter EMAs)
        const basePrice = 142 + Math.sin(i / 25) * 12;
        return {
          datetime: date.toISOString().split('T')[0],
          ma: (basePrice + Math.random() * 2 - 1).toFixed(2)
        };
      });
      
      const mockResponse = {
        symbol: symbol,
        meta: {
          symbol: symbol,
          interval: "1day",
          currency: "USD",
          exchange_timezone: "America/New_York",
          exchange: "NASDAQ",
          mic_code: "XNAS",
          type: "Common Stock",
          indicator: {
            name: "Exponential Moving Average",
            ma_type: "EMA",
            series_type: "close",
            time_period: 200
          }
        },
        values: mockData,
        status: "ok"
      };
      
      console.log('Using mock EMA-200 data:', mockResponse);
      return mockResponse;
    }
    
    // Call the Supabase Edge Function that interfaces with Twelve Data API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    console.log(`Fetching EMA-200 data for ${symbol} from ${supabaseUrl}/functions/v1/twelve-ema-200`);
    
    // Convert timeframe to date range
    let startDate = new Date();
    if (timeframe === '3M') startDate.setMonth(startDate.getMonth() - 3);
    else if (timeframe === '6M') startDate.setMonth(startDate.getMonth() - 6);
    else if (timeframe === '1Y') startDate.setFullYear(startDate.getFullYear() - 1);
    
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(new Date());
    
    const response = await fetch(`${supabaseUrl}/functions/v1/twelve-ema-200`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ 
        symbol: symbol.trim(),
        start_date: startDateStr,
        end_date: endDateStr
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twelve Data EMA-200 API error:', errorText);
      throw new Error(`Twelve Data EMA-200 API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('EMA-200 API response:', data);
    
    // Verify data structure before returning
    if (!data || !data.values || !Array.isArray(data.values)) {
      console.error('Invalid EMA data structure:', data);
      
      // If API returned error format, throw with the error message
      if (data && data.error) {
        throw new Error(`API Error: ${data.error}`);
      }
      
      throw new Error('Invalid EMA data structure received from API');
    }
    
    return data as EMAData;
    
  } catch (error) {
    console.error('Error fetching EMA-200 data from Twelve Data:', error);
    return null;
  }
};

/**
 * Fetches Relative Strength Index (RSI) data from the Twelve Data API via Supabase Edge Function
 * @param symbol The stock symbol to fetch RSI data for (e.g. AAPL)
 * @param timeframe The timeframe to fetch data for (3M, 6M, 1Y)
 * @returns RSI data including historical values for the specified timeframe
 */
export const fetchRSI = async (symbol: string, timeframe: string = '3M'): Promise<RSIData | null> => {
  try {
    // Use local static data as fallback when in development or if API fails
    const useFallback = import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_STOCK_DATA === 'true';
    
    if (useFallback) {
      // Simulate network delay to make it feel like a real API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Determine the number of days to generate based on timeframe
      let dataLength = 90; // Default 3M
      if (timeframe === '6M') dataLength = 180;
      if (timeframe === '1Y') dataLength = 365;
      
      // Generate mock RSI data for the specified timeframe
      const today = new Date();
      const mockData = Array.from({ length: dataLength }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (dataLength - i));
        // Generate RSI values between 0 and 100, with some oscillation
        const rsiBase = 50 + Math.sin(i / 10) * 30;
        const rsi = Math.max(0, Math.min(100, rsiBase + (Math.random() * 20 - 10)));
        
        // Generate OHLC data for the same period
        const basePrice = 150 + Math.sin(i / 15) * 15;
        const open = parseFloat((basePrice - 2 + Math.random() * 4).toFixed(2));
        const close = parseFloat((basePrice + Math.random() * 6 - 3).toFixed(2));
        
        return {
          datetime: date.toISOString().split('T')[0],
          rsi: rsi.toFixed(2),
          open,
          high: parseFloat((Math.max(open, close) + 1 + Math.random() * 2).toFixed(2)),
          low: parseFloat((Math.min(open, close) - 1 - Math.random() * 2).toFixed(2)),
          close
        };
      });
      
      const mockResponse = {
        symbol: symbol,
        meta: {
          symbol: symbol,
          interval: "1day",
          currency: "USD",
          exchange_timezone: "America/New_York",
          exchange: "NASDAQ",
          mic_code: "XNAS",
          type: "Common Stock",
          indicator: {
            name: "RSI - Relative Strength Index",
            series_type: "close",
            time_period: 14
          }
        },
        values: mockData,
        status: "ok"
      };
      
      console.log('Using mock RSI data:', mockResponse);
      return mockResponse;
    }
    
    // Call the Supabase Edge Function that interfaces with Twelve Data API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    console.log(`Fetching RSI data for ${symbol} from ${supabaseUrl}/functions/v1/twelve-rsi`);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/twelve-rsi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ 
        symbol: symbol.trim(),
        timeframe
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twelve Data RSI API error:', errorText);
      throw new Error(`Twelve Data RSI API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('RSI API response:', data);
    
    // Verify data structure before returning
    if (!data || !data.values || !Array.isArray(data.values)) {
      console.error('Invalid RSI data structure:', data);
      
      // If API returned error format, throw with the error message
      if (data && data.error) {
        throw new Error(`API Error: ${data.error}`);
      }
      
      throw new Error('Invalid RSI data structure received from API');
    }
    
    return data as RSIData;
    
  } catch (error) {
    console.error('Error fetching RSI data from Twelve Data:', error);
    return null;
  }
};

/**
 * Fetches stock recommendations data from the Twelve Data API via Supabase Edge Function
 * @param symbol The stock symbol to fetch recommendations for (e.g. AAPL)
 * @returns Recommendations data including analyst ratings and trends
 */
export const fetchRecommendations = async (symbol: string): Promise<RecommendationsData | null> => {
  try {
    // Use local static data as fallback when in development or if API fails
    const useFallback = import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_STOCK_DATA === 'true';
    
    if (useFallback) {
      // Simulate network delay to make it feel like a real API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Return mock data for development
      return {
        meta: {
          symbol: symbol,
          name: `${symbol} Inc`,
          currency: 'USD',
          exchange_timezone: 'America/New_York',
          exchange: 'NASDAQ',
          mic_code: 'XNAS',
          type: 'Common Stock'
        },
        trends: {
          current_month: {
            strong_buy: 11,
            buy: 21,
            hold: 6,
            sell: 0,
            strong_sell: 0
          },
          previous_month: {
            strong_buy: 14,
            buy: 24,
            hold: 8,
            sell: 0,
            strong_sell: 0
          },
          '2_months_ago': {
            strong_buy: 14,
            buy: 24,
            hold: 8,
            sell: 0,
            strong_sell: 0
          },
          '3_months_ago': {
            strong_buy: 13,
            buy: 20,
            hold: 8,
            sell: 0,
            strong_sell: 0
          }
        },
        rating: 8.2,
        status: 'ok'
      };
    }
    
    // Call the Supabase Edge Function that interfaces with Twelve Data API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    console.log(`Fetching recommendations data for ${symbol} from ${supabaseUrl}/functions/v1/twelve-recommend`);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/twelve-recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ 
        symbol: symbol.trim()
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twelve Data Recommendations API error:', errorText);
      // Return null instead of throwing to gracefully handle errors
      return null;
    }
    
    const data = await response.json();
    console.log('Recommendations API response:', data);
    
    return data as RecommendationsData;
    
  } catch (error) {
    console.error('Error fetching recommendations from Twelve Data:', error);
    return null;
  }
};

/**
 * Fetches Moving Average Convergence Divergence (MACD) data from the Twelve Data API via Supabase Edge Function
 * @param symbol The stock symbol to fetch MACD data for (e.g. AAPL)
 * @param timeframe The timeframe to fetch data for (3M, 6M, 1Y)
 * @returns MACD data including macd, signal line, and histogram values for the specified timeframe
 */
export const fetchMACD = async (symbol: string, timeframe: string = '3M'): Promise<MACDData | null> => {
  try {
    // Use local static data as fallback when in development or if API fails
    const useFallback = import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_STOCK_DATA === 'true';
    
    if (useFallback) {
      // Simulate network delay to make it feel like a real API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Determine the number of days to generate based on timeframe
      let dataLength = 90; // Default 3M
      if (timeframe === '6M') dataLength = 180;
      if (timeframe === '1Y') dataLength = 365;
      
      // Generate mock MACD data for the specified timeframe
      const today = new Date();
      const mockData = Array.from({ length: dataLength }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (dataLength - i));
        
        // Create oscillating MACD values
        const macdBase = Math.sin(i / 20) * 3;
        const macd = (macdBase).toFixed(2);
        
        // Signal line follows MACD with some lag
        const signalBase = Math.sin((i - 5) / 20) * 2.8;
        const macd_signal = (signalBase).toFixed(2);
        
        // Histogram is the difference between MACD and signal
        const macd_hist = (macdBase - signalBase).toFixed(2);
        
        return {
          datetime: date.toISOString().split('T')[0],
          macd,
          macd_signal,
          macd_hist
        };
      });
      
      const mockResponse = {
        symbol: symbol,
        meta: {
          symbol: symbol,
          interval: "1day",
          currency: "USD",
          exchange_timezone: "America/New_York",
          exchange: "NASDAQ",
          mic_code: "XNAS",
          type: "Common Stock",
          indicator: {
            name: "MACD - Moving Average Convergence Divergence",
            fast_period: 12,
            series_type: "close",
            signal_period: 9,
            slow_period: 26
          }
        },
        values: mockData,
        status: "ok"
      };
      
      console.log('Using mock MACD data:', mockResponse);
      return mockResponse;
    }
    
    // Call the Supabase Edge Function that interfaces with Twelve Data API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing');
      throw new Error('Supabase environment variables are missing');
    }
    
    console.log(`Fetching MACD data for ${symbol} from ${supabaseUrl}/functions/v1/twelve-macd`);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/twelve-macd`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ 
        symbol: symbol.trim(),
        timeframe
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twelve Data MACD API error:', errorText);
      throw new Error(`Twelve Data MACD API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('MACD API response:', data);
    
    // Verify data structure before returning
    if (!data || !data.values || !Array.isArray(data.values)) {
      console.error('Invalid MACD data structure:', data);
      
      // If API returned error format, throw with the error message
      if (data && data.error) {
        throw new Error(`API Error: ${data.error}`);
      }
      
      throw new Error('Invalid MACD data structure received from API');
    }
    
    return data as MACDData;
    
  } catch (error) {
    console.error('Error fetching MACD data from Twelve Data:', error);
    return null;
  }
};
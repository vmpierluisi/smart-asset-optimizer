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
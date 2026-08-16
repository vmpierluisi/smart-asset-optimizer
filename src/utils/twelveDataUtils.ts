import { StockQuote } from './fmpFinanceUtils';
import { invokeFunction } from '@/lib/apiClient';

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

// EMA data shares the SMA response shape.
export type EMAData = SMAData;

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

// Technical-indicator analysis lives in ./indicators (kept re-exported here for callers).
export { analyzeMACDSignals, getRecentMACDSignals } from './indicators';
export type { MACDValue, MACDSignals } from './indicators';


/**
 * Fetches a company logo from the Twelve Data API via Supabase Edge Function
 * @param symbol The stock symbol to fetch the logo for (e.g. AAPL)
 * @returns Company logo data including the logo URL
 */
export const fetchCompanyLogo = async (symbol: string): Promise<CompanyLogoData | null> => {
  try {
    return await invokeFunction<CompanyLogoData>('company-logo', { symbol: symbol.trim() });
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
  const data = await invokeFunction<TwelveDataStockQuote>('twelve-data-quote', {
    symbol: symbol.trim(),
  });

  // Twelve Data doesn't provide PE ratio / dividend yield on the quote endpoint,
  // so ensure these optional fields are present with sane defaults.
  return {
    ...data,
    peRatio: data.peRatio ?? 0,
    dividendYield: data.dividendYield ?? 0,
  };
};

/**
 * Fetches a company profile from the Twelve Data API via Supabase Edge Function
 * @param symbol The stock symbol to fetch the profile for (e.g. AAPL)
 * @returns Company profile data including description, sector, industry, etc.
 */
export const fetchCompanyProfile = async (symbol: string): Promise<CompanyProfileData | null> => {
  try {
    return await invokeFunction<CompanyProfileData>('company-description', { symbol: symbol.trim() });
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
export const fetchTimeSeries = async (symbol: string, period: string = '1month', _cacheTimestamp?: number): Promise<TimeSeriesData> => {
  return invokeFunction<TimeSeriesData>('twelve-time-series', {
    symbol: symbol.trim(),
    period,
  });
};

/**
 * Fetches dividend yield data from the Twelve Data API via Supabase Edge Function
 * @param symbol The stock symbol to fetch (e.g. AAPL)
 * @returns Dividend yield data including amount, annual yield, and ex-date
 */
export const fetchDividendYield = async (symbol: string): Promise<DividendYieldData | null> => {
  try {
    return await invokeFunction<DividendYieldData>('twelve-dividend', { symbol: symbol.trim() });
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
export const fetchHistoricalTimeSeries = async (symbol: string, _cacheTimestamp?: number): Promise<TimeSeriesData> => {
  return invokeFunction<TimeSeriesData>('twelve-historical', { symbol: symbol.trim() });
};

/**
 * Fetches comprehensive stock statistics from the Twelve Data API via Supabase Edge Function
 * @param symbol The stock symbol to fetch statistics for (e.g. AAPL)
 * @returns Comprehensive statistics data including valuation metrics, financials, and more
 */
export const fetchStockStatistics = async (symbol: string): Promise<StockStatisticsData | null> => {
  try {
    return await invokeFunction<StockStatisticsData>('twelve-stats', { symbol: symbol.trim() });
  } catch (error) {
    console.error('Error fetching stock statistics from Twelve Data:', error);
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
    return await invokeFunction<PriceTargetData>('twelve-price-target', { symbol: symbol.trim() });
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
export const fetchMovingAverage = async (
  symbol: string,
  maType: 'SMA' | 'EMA',
  period: number,
  timeframe: string = '3M',
): Promise<SMAData | null> => {
  try {
    const months = timeframe === '1Y' ? 12 : timeframe === '6M' ? 6 : 3;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const toDate = (d: Date) => d.toISOString().split('T')[0];

    const data = await invokeFunction<SMAData>('twelve-moving-average', {
      symbol: symbol.trim(),
      ma_type: maType,
      time_period: period,
      timeframe,
      start_date: toDate(startDate),
      end_date: toDate(new Date()),
    });

    if (!data || !Array.isArray(data.values)) {
      throw new Error('Invalid moving-average data structure received from API');
    }
    return data;
  } catch (error) {
    console.error(`Error fetching ${maType}-${period} data from Twelve Data:`, error);
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
    const data = await invokeFunction<RSIData>('twelve-rsi', { symbol: symbol.trim(), timeframe });
    if (!data || !Array.isArray(data.values)) {
      throw new Error('Invalid RSI data structure received from API');
    }
    return data;
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
    return await invokeFunction<RecommendationsData>('twelve-recommend', { symbol: symbol.trim() });
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
    const data = await invokeFunction<MACDData>('twelve-macd', { symbol: symbol.trim(), timeframe });
    if (!data || !Array.isArray(data.values)) {
      throw new Error('Invalid MACD data structure received from API');
    }
    return data;
  } catch (error) {
    console.error('Error fetching MACD data from Twelve Data:', error);
    return null;
  }
};
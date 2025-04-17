import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// For TypeScript in Deno
declare global {
  interface Window {
    Deno: {
      env: {
        get(key: string): string | undefined;
      };
    }
  }
}

// Get API key from environment variables
const TWELVE_DATA_API_KEY = Deno.env.get('TWELVE_DATA_API_KEY');

// Interface for stock statistics response
interface StockStatisticsResponse {
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

// Interface for error response
interface TwelveDataErrorResponse {
  status: string;
  code: number;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { symbol } = await req.json();
    
    if (!symbol || typeof symbol !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Symbol must be a valid string' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!TWELVE_DATA_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Twelve Data API key not configured on the server' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Fetch statistics data from Twelve Data API
    const statisticsUrl = `https://api.twelvedata.com/statistics?symbol=${encodeURIComponent(symbol)}&apikey=${TWELVE_DATA_API_KEY}`;
    
    console.log(`Fetching statistics data from Twelve Data API for symbol: ${symbol}`);
    
    const response = await fetch(statisticsUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Twelve Data API error response: ${errorText}`);
      throw new Error(`Twelve Data API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check if we received an error from the API
    if ('status' in data && data.status === 'error') {
      const errorResponse = data as TwelveDataErrorResponse;
      return new Response(
        JSON.stringify({ error: errorResponse.message || 'Error from Twelve Data API' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Return the statistics data (already in the required format)
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in twelve-stats function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 
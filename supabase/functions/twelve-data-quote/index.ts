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

// Interface for the response data from Twelve Data API
interface TwelveDataQuoteResponse {
  symbol: string;
  name: string;
  exchange: string;
  mic_code: string;
  currency: string;
  datetime: string;
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  previous_close: string;
  change: string;
  percent_change: string;
  average_volume: string;
  rolling_1d_change?: string;
  rolling_7d_change?: string;
  rolling_period_change?: string;
  is_market_open: boolean;
  fifty_two_week: {
    low: string;
    high: string;
    low_change: string;
    high_change: string;
    low_change_percent: string;
    high_change_percent: string;
    range: string;
  };
  extended_change?: string;
  extended_percent_change?: string;
  extended_price?: string;
  extended_timestamp?: number;
  last_quote_at?: number;
}

// Interface for error response from Twelve Data API
interface TwelveDataErrorResponse {
  status: string;
  code: number;
  message: string;
}

// Interface for our transformed stock quote
interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: string; // Not provided by Twelve Data
  volume: string;
  avgVolume: string;
  exchange: string;
  high52Week: number;
  low52Week: number;
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

    // Fetch quote data from Twelve Data API
    const quoteUrl = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${TWELVE_DATA_API_KEY}&dp=2`;
    
    console.log(`Fetching quote data from Twelve Data API for symbol: ${symbol}`);
    
    const quoteResponse = await fetch(quoteUrl);
    
    if (!quoteResponse.ok) {
      const errorText = await quoteResponse.text();
      console.error(`Twelve Data API error response: ${errorText}`);
      throw new Error(`Twelve Data API error: ${quoteResponse.status} ${quoteResponse.statusText}`);
    }
    
    const responseData = await quoteResponse.json();
    
    // Check if we received an error from the API (it returns a status field when there's an error)
    if ('status' in responseData && responseData.status === 'error') {
      const errorResponse = responseData as TwelveDataErrorResponse;
      return new Response(
        JSON.stringify({ error: errorResponse.message || 'Error from Twelve Data API' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const quoteData = responseData as TwelveDataQuoteResponse;
    
    // Transform the data to match the format expected by the client
    const stockQuote: StockQuote = {
      symbol: quoteData.symbol,
      name: quoteData.name,
      price: parseFloat(quoteData.close),
      change: parseFloat(quoteData.change),
      changePercent: parseFloat(quoteData.percent_change),
      volume: quoteData.volume,
      avgVolume: quoteData.average_volume,
      exchange: quoteData.exchange,
      high52Week: parseFloat(quoteData.fifty_two_week.high),
      low52Week: parseFloat(quoteData.fifty_two_week.low),
      open: parseFloat(quoteData.open),
      high: parseFloat(quoteData.high),
      low: parseFloat(quoteData.low),
      previousClose: parseFloat(quoteData.previous_close),
      datetime: quoteData.datetime,
      isMarketOpen: quoteData.is_market_open,
      currency: quoteData.currency,
    };
    
    // Add optional fields if they exist
    if (quoteData.extended_price) {
      stockQuote.extendedHoursPrice = parseFloat(quoteData.extended_price);
    }
    
    if (quoteData.extended_change) {
      stockQuote.extendedHoursChange = parseFloat(quoteData.extended_change);
    }
    
    if (quoteData.extended_percent_change) {
      stockQuote.extendedHoursChangePercent = parseFloat(quoteData.extended_percent_change);
    }
    
    if (quoteData.rolling_1d_change) {
      stockQuote.rolling1dChange = parseFloat(quoteData.rolling_1d_change);
    }
    
    if (quoteData.rolling_7d_change) {
      stockQuote.rolling7dChange = parseFloat(quoteData.rolling_7d_change);
    }
    
    if (quoteData.rolling_period_change) {
      stockQuote.rollingPeriodChange = parseFloat(quoteData.rolling_period_change);
    }
    
    return new Response(
      JSON.stringify(stockQuote),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in twelve-data-quote function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 
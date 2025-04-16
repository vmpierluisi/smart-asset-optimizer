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

// Interface for the dividend response from Twelve Data API
interface TwelveDataDividendResponse {
  meta: {
    symbol: string;
    name: string;
    currency: string;
    exchange: string;
    mic_code: string;
    exchange_timezone: string;
  };
  dividends: Array<{
    ex_date: string;
    amount: number;
  }>;
}

// Interface for error response from Twelve Data API
interface TwelveDataErrorResponse {
  status: string;
  code: number;
  message: string;
}

// Interface for quote response to get current price
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
}

// Interface for our dividend yield calculation
interface DividendYieldResult {
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
 * Fetches stock quote data from Twelve Data API
 * This is abstracted to be reusable within this function
 */
async function fetchStockQuote(symbol: string): Promise<TwelveDataQuoteResponse> {
  if (!TWELVE_DATA_API_KEY) {
    throw new Error('Twelve Data API key not configured on the server');
  }

  const quoteUrl = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${TWELVE_DATA_API_KEY}`;
  
  console.log(`Fetching quote data for price from Twelve Data API for symbol: ${symbol}`);
  
  const quoteResponse = await fetch(quoteUrl);
  
  if (!quoteResponse.ok) {
    const errorText = await quoteResponse.text();
    console.error(`Twelve Data API error response for quote: ${errorText}`);
    throw new Error(`Twelve Data API error for quote: ${quoteResponse.status} ${quoteResponse.statusText}`);
  }
  
  const quoteData = await quoteResponse.json();
  
  // Check if we received an error from the API
  if ('status' in quoteData && quoteData.status === 'error') {
    const errorResponse = quoteData as TwelveDataErrorResponse;
    throw new Error(errorResponse.message || 'Error from Twelve Data API');
  }
  
  return quoteData as TwelveDataQuoteResponse;
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

    // Fetch dividend data from Twelve Data API
    const dividendUrl = `https://api.twelvedata.com/dividends?symbol=${encodeURIComponent(symbol)}&apikey=${TWELVE_DATA_API_KEY}`;
    
    console.log(`Fetching dividend data from Twelve Data API for symbol: ${symbol}`);
    
    const dividendResponse = await fetch(dividendUrl);
    
    if (!dividendResponse.ok) {
      const errorText = await dividendResponse.text();
      console.error(`Twelve Data API error response: ${errorText}`);
      throw new Error(`Twelve Data API error: ${dividendResponse.status} ${dividendResponse.statusText}`);
    }
    
    const dividendData = await dividendResponse.json();
    
    // Check if we received an error from the API
    if ('status' in dividendData && dividendData.status === 'error') {
      const errorResponse = dividendData as TwelveDataErrorResponse;
      return new Response(
        JSON.stringify({ error: errorResponse.message || 'Error from Twelve Data API' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const typedDividendData = dividendData as TwelveDataDividendResponse;
    
    // Ensure we have dividend data
    if (!typedDividendData.dividends || typedDividendData.dividends.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No dividend data available for this symbol' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Get the most recent dividend
    const latestDividend = typedDividendData.dividends[0];
    
    // Fetch current price data to calculate yield
    const stockQuote = await fetchStockQuote(symbol);
    
    // Extract the current price
    const currentPrice = parseFloat(stockQuote.close);
    
    if (isNaN(currentPrice) || currentPrice <= 0) {
      return new Response(
        JSON.stringify({ error: 'Unable to get valid current price for yield calculation' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Calculate annual dividend (multiply quarterly dividend by 4)
    const dividendAmount = latestDividend.amount;
    const annualDividend = dividendAmount * 4;
    
    // Get dividend yield directly from calculation and multiply by 100
    // This is what TwelveData API would do internally
    const dividendYield = (annualDividend / currentPrice) * 100;
    
    // Prepare result
    const result: DividendYieldResult = {
      symbol: typedDividendData.meta.symbol,
      name: typedDividendData.meta.name,
      price: currentPrice,
      dividendAmount: dividendAmount,
      annualDividend: annualDividend,
      dividendYield: dividendYield,
      currency: typedDividendData.meta.currency,
      exchange: typedDividendData.meta.exchange,
      lastExDate: latestDividend.ex_date
    };
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in twelve-dividend function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 
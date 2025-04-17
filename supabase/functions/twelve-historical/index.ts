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

// Interface for time period options (kept for compatibility)
enum TimePeriod {
  DAY = '1day',
  WEEK = '1week',
  MONTH = '1month',
  THREE_MONTH = '3month',
  SIX_MONTH = '6month',
  YEAR = '1year',
  YTD = 'ytd',
  MAX = 'max'
}

// Interface for a single candle in the time series
interface TimeSeriesCandle {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

// Interface for Twelve Data API time series response
interface TwelveDataTimeSeriesResponse {
  meta: {
    symbol: string;
    interval: string;
    currency: string;
    exchange_timezone: string;
    exchange: string;
    mic_code: string;
    type: string;
  };
  values: TimeSeriesCandle[];
  status: string;
}

// Interface for error response from Twelve Data API
interface TwelveDataErrorResponse {
  status: string;
  code: number;
  message: string;
}

/**
 * Calculate start date for historical data - always set to 5 years ago
 * Regardless of the period parameter, this function always returns a date 5 years ago
 */
function calculateHistoricalStartDate(): string {
  const today = new Date();
  const startDate = new Date();
  
  // Set to 5 years ago from today
  startDate.setFullYear(today.getFullYear() - 5);
  
  return startDate.toISOString().split('T')[0];
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

    // Always use current date as end date
    const endDate = new Date().toISOString().split('T')[0];
    // Always fetch 5 years of historical data
    const startDate = calculateHistoricalStartDate();
    
    // Determine the appropriate interval based on the data range
    // For 5 years of data, use daily intervals to keep data size manageable
    // but detailed enough for good historical return calculations
    const interval = '1day';
    
    console.log(`Fetching historical data for ${symbol} from ${startDate} to ${endDate} with interval ${interval}`);
    
    // Build the Twelve Data API URL with all required parameters
    const apiUrl = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&dp=2&start_date=${startDate}&end_date=${endDate}&adjust=all&apikey=${TWELVE_DATA_API_KEY}`;
    
    const apiResponse = await fetch(apiUrl);
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`Twelve Data API error response: ${errorText}`);
      throw new Error(`Twelve Data API error: ${apiResponse.status} ${apiResponse.statusText}`);
    }
    
    const responseData = await apiResponse.json();
    
    // Check if we received an error from the API
    if (responseData.status === 'error') {
      const errorResponse = responseData as TwelveDataErrorResponse;
      return new Response(
        JSON.stringify({ error: errorResponse.message || 'Error from Twelve Data API' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Transform the data for the client
    const timeSeriesData = responseData as TwelveDataTimeSeriesResponse;
    
    // Format the data for charting purposes
    const formattedData = timeSeriesData.values.map(candle => ({
      date: candle.datetime,
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      volume: parseInt(candle.volume, 10)
    })); // Remove the .reverse() call to keep original order (newest first)
    
    return new Response(
      JSON.stringify({
        symbol: timeSeriesData.meta.symbol,
        data: formattedData,
        meta: timeSeriesData.meta
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in twelve-historical function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 
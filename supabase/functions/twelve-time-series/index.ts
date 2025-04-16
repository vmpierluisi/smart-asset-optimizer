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

// Interface for time period options
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

// Calculate start date based on time period
function calculateStartDate(period: string): string {
  const today = new Date();
  let startDate = new Date();
  
  switch (period) {
    case TimePeriod.DAY:
      startDate.setDate(today.getDate() - 1);
      break;
    case TimePeriod.WEEK:
      startDate.setDate(today.getDate() - 7);
      break;
    case TimePeriod.MONTH:
      startDate.setMonth(today.getMonth() - 1);
      break;
    case TimePeriod.THREE_MONTH:
      startDate.setMonth(today.getMonth() - 3);
      break;
    case TimePeriod.SIX_MONTH:
      startDate.setMonth(today.getMonth() - 6);
      break;
    case TimePeriod.YEAR:
      startDate.setFullYear(today.getFullYear() - 1);
      break;
    case TimePeriod.YTD:
      startDate = new Date(today.getFullYear(), 0, 1); // January 1st of current year
      break;
    case TimePeriod.MAX:
      startDate.setFullYear(today.getFullYear() - 5); // Changed from 2000 to 5 years ago
      break;
    default:
      startDate.setMonth(today.getMonth() - 1); // Default to 1 month
  }
  
  return startDate.toISOString().split('T')[0];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { symbol, period = TimePeriod.MONTH } = await req.json();
    
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

    // Calculate dates based on the requested period
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = calculateStartDate(period);
    
    // Determine the appropriate interval based on period
    let interval = '1day'; // Default interval
    let adjustedStartDate = startDate;
    let adjustedEndDate = endDate;
    
    // For 1D, use 5-minute intervals for intraday data
    if (period === TimePeriod.DAY) {
      interval = '5min';
      
      // For intraday data, we need today's date with time
      const now = new Date();
      adjustedEndDate = now.toISOString().replace('Z', ''); // Format: YYYY-MM-DDTHH:MM:SS
      
      // Set start date to beginning of today (24 hours ago)
      const yesterdayDate = new Date(now);
      yesterdayDate.setDate(now.getDate() - 1);
      adjustedStartDate = yesterdayDate.toISOString().replace('Z', '');
      
      console.log(`Using intraday data with 5min interval from ${adjustedStartDate} to ${adjustedEndDate}`);
    }
    // For longer periods, use a different interval to avoid too many data points
    else if (period === TimePeriod.MAX) {
      interval = '1week';
    }
    
    console.log(`Fetching time series for ${symbol} from ${adjustedStartDate} to ${adjustedEndDate} with interval ${interval}`);
    
    // Build the Twelve Data API URL with all required parameters
    const apiUrl = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&dp=2&start_date=${adjustedStartDate}&end_date=${adjustedEndDate}&adjust=all&apikey=${TWELVE_DATA_API_KEY}`;
    
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
    })).reverse(); // Reverse to get chronological order (oldest to newest)
    
    return new Response(
      JSON.stringify({
        symbol: timeSeriesData.meta.symbol,
        data: formattedData,
        meta: timeSeriesData.meta
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in twelve-time-series function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
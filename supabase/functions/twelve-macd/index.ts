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

// Interface for Twelve Data API MACD response
interface TwelveDataMACDResponse {
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
  values: Array<{ 
    datetime: string; 
    macd: string;
    macd_signal: string;
    macd_hist: string;
  }>;
  status: string;
}

// Interface for error response from Twelve Data API
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
    const { symbol, timeframe, end_date } = await req.json();
    
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

    console.log(`Fetching MACD for ${symbol}`);
    
    // Calculate date range: today and historical period based on timeframe
    const endDate = end_date ? new Date(end_date) : new Date();
    let startDate = new Date(endDate);
    
    // Set start_date based on timeframe (3M, 6M, or 1Y)
    switch (timeframe) {
      case '6M':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case '3M':
      default:
        startDate.setMonth(startDate.getMonth() - 3);
        break;
    }
    
    // Format dates as YYYY-MM-DD for the API
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };
    
    const endDateStr = formatDate(endDate);
    const startDateStr = formatDate(startDate);
    
    console.log(`Date range: ${startDateStr} to ${endDateStr}`);
    
    // Build the Twelve Data API URL with all required parameters
    const apiUrl = `https://api.twelvedata.com/macd?symbol=${encodeURIComponent(symbol)}&interval=1day&dp=2&start_date=${startDateStr}&end_date=${endDateStr}&apikey=${TWELVE_DATA_API_KEY}`;
    
    console.log(`Calling Twelve Data API: ${apiUrl.replace(TWELVE_DATA_API_KEY, 'API_KEY_HIDDEN')}`);
    
    const apiResponse = await fetch(apiUrl);
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`Twelve Data API error response: ${errorText}`);
      throw new Error(`Twelve Data API error: ${apiResponse.status} ${apiResponse.statusText}`);
    }
    
    const responseData = await apiResponse.json();
    console.log('Twelve Data API raw response:', JSON.stringify(responseData).slice(0, 500) + '...');
    
    // Check if we received an error from the API
    if (responseData.status === 'error') {
      const errorResponse = responseData as TwelveDataErrorResponse;
      return new Response(
        JSON.stringify({ error: errorResponse.message || 'Error from Twelve Data API' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Transform the data if needed and ensure it matches the expected client format
    const macdData = responseData as TwelveDataMACDResponse;
    
    // Ensure the response has all expected properties
    const response = {
      symbol: macdData.meta.symbol,
      meta: macdData.meta,
      values: macdData.values || [],
      status: macdData.status
    };
    
    console.log('Formatted response:', JSON.stringify(response).slice(0, 500) + '...');
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in twelve-macd function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 
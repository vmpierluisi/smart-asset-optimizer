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

// Interface for Twelve Data API RSI response
interface TwelveDataRSIResponse {
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
  values: Array<{ 
    datetime: string; 
    rsi: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
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
    const { symbol, timeframe } = await req.json();
    
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

    console.log(`Fetching RSI data for ${symbol} with timeframe ${timeframe || '3M'}`);
    
    // Calculate date range based on timeframe (default to 3M if not provided)
    const endDate = new Date(); // Today
    const startDate = new Date();
    
    // Set start date based on timeframe
    switch (timeframe?.toUpperCase() || '3M') {
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
    const apiUrl = `https://api.twelvedata.com/rsi?symbol=${encodeURIComponent(symbol)}&interval=1day&dp=2&include_ohlc=true&start_date=${startDateStr}&end_date=${endDateStr}&apikey=${TWELVE_DATA_API_KEY}`;
    
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
    
    // Transform the data to match the expected client format
    // Ensure we're working with proper number values for OHLC data
    if (responseData.values && Array.isArray(responseData.values)) {
      responseData.values = responseData.values.map((item: any) => ({
        datetime: item.datetime,
        rsi: item.rsi,
        open: typeof item.open === 'string' ? parseFloat(item.open) : item.open,
        high: typeof item.high === 'string' ? parseFloat(item.high) : item.high,
        low: typeof item.low === 'string' ? parseFloat(item.low) : item.low,
        close: typeof item.close === 'string' ? parseFloat(item.close) : item.close
      }));
    }
    
    // Construct the proper response format
    const response = {
      symbol: symbol,
      meta: responseData.meta || {
        symbol: symbol,
        interval: "1day",
        indicator: {
          name: "RSI - Relative Strength Index",
          series_type: "close",
          time_period: 14
        }
      },
      values: responseData.values || [],
      status: responseData.status || 'ok'
    };
    
    console.log('Formatted response:', JSON.stringify(response).slice(0, 500) + '...');
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in twelve-rsi function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 
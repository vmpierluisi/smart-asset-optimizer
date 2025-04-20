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

// Interface for Twelve Data API SMA response
interface TwelveDataSMAResponse {
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
  values: Array<{ 
    datetime: string; 
    ma: string;
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
    const { symbol, start_date, end_date } = await req.json();
    
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

    console.log(`Fetching 50-day SMA for ${symbol}`);
    
    // Calculate date range: today and 3 months ago (default if not provided)
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date ? new Date(start_date) : new Date();
    
    if (!start_date) {
      startDate.setMonth(startDate.getMonth() - 3);
    }
    
    // Format dates as YYYY-MM-DD for the API
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };
    
    const endDateStr = formatDate(endDate);
    const startDateStr = formatDate(startDate);
    
    console.log(`Date range: ${startDateStr} to ${endDateStr}`);
    
    // Build the Twelve Data API URL with all required parameters
    const apiUrl = `https://api.twelvedata.com/ma?symbol=${encodeURIComponent(symbol)}&interval=1day&ma_type=SMA&time_period=50&dp=2&start_date=${startDateStr}&end_date=${endDateStr}&apikey=${TWELVE_DATA_API_KEY}`;
    
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
    const smaData = responseData as TwelveDataSMAResponse;
    
    // Ensure the response has all expected properties
    const response = {
      symbol: smaData.meta.symbol,
      meta: smaData.meta,
      values: smaData.values || [],
      status: smaData.status
    };
    
    console.log('Formatted response:', JSON.stringify(response).slice(0, 500) + '...');
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in twelve-sma-50 function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 
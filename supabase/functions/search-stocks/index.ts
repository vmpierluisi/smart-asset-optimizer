import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const FMP_API_KEY = Deno.env.get('FMP_API_KEY');
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Parse request body
    const { query } = await req.json();
    
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Query must be a string with at least 2 characters' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!FMP_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'FMP API key not configured on the server' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Call FMP API to search for stocks using the stable/search-name endpoint
    const fmpUrl = `https://financialmodelingprep.com/api/v3/search-name?query=${encodeURIComponent(query.trim())}&limit=10&apikey=${FMP_API_KEY}`;
    
    const response = await fetch(fmpUrl);
    
    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform the data to match our existing StockSuggestion interface
    const stockSuggestions = data.map((item: any) => ({
      symbol: item.symbol,
      name: item.name,
      exchange: item.exchangeShortName || 'Unknown',
    })).slice(0, 6); // Limit to 6 results like the previous implementation

    return new Response(
      JSON.stringify(stockSuggestions),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in search-stocks function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 
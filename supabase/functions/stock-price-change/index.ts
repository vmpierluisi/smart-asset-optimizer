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
    const { symbol } = await req.json();
    
    if (!symbol || typeof symbol !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Symbol must be a valid string' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!FMP_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'FMP API key not configured on the server' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Get stock price changes from FMP API
    const url = `https://financialmodelingprep.com/api/v3/stock-price-change/${encodeURIComponent(symbol)}?apikey=${FMP_API_KEY}`;
    
    console.log(`Fetching stock price changes from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`FMP API error response: ${errorText}`);
      throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error("No price change data found in response");
      return new Response(
        JSON.stringify({ error: 'No price change data found for this symbol' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Transform the data into the format expected by the client
    const priceChanges = data[0];
    
    const result = {
      symbol: priceChanges.symbol,
      returns: [
        { period: "1D", value: priceChanges["1D"], direction: priceChanges["1D"] >= 0 ? "up" : "down" },
        { period: "5D", value: priceChanges["5D"], direction: priceChanges["5D"] >= 0 ? "up" : "down" },
        { period: "1M", value: priceChanges["1M"], direction: priceChanges["1M"] >= 0 ? "up" : "down" },
        { period: "3M", value: priceChanges["3M"], direction: priceChanges["3M"] >= 0 ? "up" : "down" },
        { period: "6M", value: priceChanges["6M"], direction: priceChanges["6M"] >= 0 ? "up" : "down" },
        { period: "YTD", value: priceChanges["ytd"], direction: priceChanges["ytd"] >= 0 ? "up" : "down" },
        { period: "1Y", value: priceChanges["1Y"], direction: priceChanges["1Y"] >= 0 ? "up" : "down" },
        { period: "3Y", value: priceChanges["3Y"], direction: priceChanges["3Y"] >= 0 ? "up" : "down" },
        { period: "5Y", value: priceChanges["5Y"], direction: priceChanges["5Y"] >= 0 ? "up" : "down" }
      ]
    };
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in stock-price-change function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 
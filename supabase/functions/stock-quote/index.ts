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

    // Get quote data from FMP API
    const quoteUrl = `https://financialmodelingprep.com/api/v3/quote/${encodeURIComponent(symbol)}?apikey=${FMP_API_KEY}`;
    const profileUrl = `https://financialmodelingprep.com/api/v3/profile/${encodeURIComponent(symbol)}?apikey=${FMP_API_KEY}`;
    
    console.log(`Fetching quote data from: ${quoteUrl}`);
    
    // Fetch both quote and profile data in parallel
    const [quoteResponse, profileResponse] = await Promise.all([
      fetch(quoteUrl),
      fetch(profileUrl)
    ]);
    
    if (!quoteResponse.ok) {
      const errorText = await quoteResponse.text();
      console.error(`FMP API error response (quote): ${errorText}`);
      throw new Error(`FMP API error: ${quoteResponse.status} ${quoteResponse.statusText}`);
    }
    
    const quoteData = await quoteResponse.json();
    
    if (!Array.isArray(quoteData) || quoteData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No quote data found for this symbol' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Get profile data (for additional information)
    let profileData = null;
    if (profileResponse.ok) {
      const profileResult = await profileResponse.json();
      if (Array.isArray(profileResult) && profileResult.length > 0) {
        profileData = profileResult[0];
      }
    }
    
    const quote = quoteData[0];
    
    // Format market cap
    const formatLargeNumber = (num: number): string => {
      if (num >= 1e12) {
        return `${(num / 1e12).toFixed(2)}T`;
      } else if (num >= 1e9) {
        return `${(num / 1e9).toFixed(2)}B`;
      } else if (num >= 1e6) {
        return `${(num / 1e6).toFixed(2)}M`;
      } else {
        return `${num.toFixed(2)}`;
      }
    };
    
    // Transform the data to match the format expected by the client
    const stockQuote = {
      symbol: quote.symbol,
      name: quote.name || (profileData?.companyName || quote.symbol),
      price: quote.price || 0,
      change: quote.change || 0,
      changePercent: quote.changesPercentage || 0,
      marketCap: formatLargeNumber(quote.marketCap || 0),
      peRatio: quote.pe || 0,
      dividendYield: (quote.dividend ? ((quote.dividend / quote.price) * 100) : 0) || (profileData?.lastDiv ? profileData.lastDiv : 0),
      volume: formatLargeNumber(quote.volume || 0),
      avgVolume: formatLargeNumber(quote.avgVolume || 0),
      exchange: quote.exchange || (profileData?.exchange || 'Unknown'),
      high52Week: quote.yearHigh || 0,
      low52Week: quote.yearLow || 0
    };
    
    return new Response(
      JSON.stringify(stockQuote),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in stock-quote function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 
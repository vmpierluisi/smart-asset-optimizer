import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const FMP_API_KEY = Deno.env.get('FMP_API_KEY');
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface for growth data
interface GrowthData {
  dividendPerShareGrowth?: number;
  [key: string]: any;
}

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

    // Get ratios data from FMP API
    const ratiosUrl = `https://financialmodelingprep.com/api/v3/ratios/${encodeURIComponent(symbol)}?apikey=${FMP_API_KEY}`;
    const keyMetricsUrl = `https://financialmodelingprep.com/api/v3/key-metrics/${encodeURIComponent(symbol)}?apikey=${FMP_API_KEY}`;
    const growthUrl = `https://financialmodelingprep.com/api/v3/financial-growth/${encodeURIComponent(symbol)}?apikey=${FMP_API_KEY}`;
    
    console.log(`Fetching ratios data from: ${ratiosUrl}`);
    
    // Fetch ratios, key metrics, and growth data in parallel
    const [ratiosResponse, keyMetricsResponse, growthResponse] = await Promise.all([
      fetch(ratiosUrl),
      fetch(keyMetricsUrl),
      fetch(growthUrl)
    ]);
    
    if (!ratiosResponse.ok) {
      const errorText = await ratiosResponse.text();
      console.error(`FMP API error response (ratios): ${errorText}`);
      throw new Error(`FMP API error: ${ratiosResponse.status} ${ratiosResponse.statusText}`);
    }
    
    const ratiosData = await ratiosResponse.json();
    
    if (!Array.isArray(ratiosData) || ratiosData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No ratios data found for this symbol' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Get key metrics and growth data (for additional valuation metrics)
    let keyMetricsData = null;
    let growthData: GrowthData | null = null;
    
    if (keyMetricsResponse.ok) {
      const keyMetricsResult = await keyMetricsResponse.json();
      if (Array.isArray(keyMetricsResult) && keyMetricsResult.length > 0) {
        keyMetricsData = keyMetricsResult[0];
      }
    }
    
    if (growthResponse.ok) {
      const growthResult = await growthResponse.json();
      if (Array.isArray(growthResult) && growthResult.length > 0) {
        growthData = growthResult[0] as GrowthData;
      }
    }
    
    // Get the most recent data point
    const ratios = ratiosData[0];
    
    // Calculate fair value range (simple example - you might want to use a more sophisticated model)
    const currentPE = ratios.priceEarningsRatio || 0;
    const averagePE = 20; // Industry average PE or historical average (simplified)
    const eps = ratios.netIncomePerShare || 0;
    const fairValue = eps * averagePE;
    const fairValueLow = fairValue * 0.8; // 20% below fair value
    const fairValueHigh = fairValue * 1.2; // 20% above fair value
    
    // Get dividend growth rate from growth data
    const dividendGrowth5Y = growthData?.dividendPerShareGrowth 
      ? (growthData.dividendPerShareGrowth * 100).toFixed(2)
      : '0.00';
    
    // Format and round decimal values
    const formatNumber = (value: number | null | undefined): string => {
      if (value === null || value === undefined) return 'N/A';
      return value.toFixed(2);
    };
    
    // Transform the data to match the format expected by the client
    const valuationData = {
      // PE Ratios
      peRatio: formatNumber(ratios.priceEarningsRatio),
      forwardPE: formatNumber(ratios.priceEarningsToGrowthRatio), // Using PEG as a fallback for forward PE
      pegRatio: formatNumber(ratios.priceEarningsToGrowthRatio),
      
      // Price Ratios
      priceToBook: formatNumber(ratios.priceToBookRatio),
      priceToSales: formatNumber(ratios.priceSalesRatio),
      evToEbitda: formatNumber(ratios.enterpriseValueMultiple),
      
      // Dividend information
      dividendYield: formatNumber(ratios.dividendYield ? ratios.dividendYield * 100 : 0),
      dividendGrowth5Y: dividendGrowth5Y,
      
      // Fair value estimation
      fairValueLow: parseFloat(fairValueLow.toFixed(2)),
      fairValueHigh: parseFloat(fairValueHigh.toFixed(2)),
      
      // Earnings Per Share
      eps: formatNumber(ratios.netIncomePerShare)
    };
    
    return new Response(
      JSON.stringify(valuationData),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in stock-ratios function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Assuming FMP_API_KEY is set in Supabase secrets
const FMP_API_KEY = Deno.env.get('FMP_API_KEY')
const FMP_BASE_URL = 'https://financialmodelingprep.com/api'

interface FinancialHealthData {
  symbol: string;
  debtToEquity: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  healthScore: number | null; // Calculated score
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { symbol } = await req.json()
    if (!symbol) {
      throw new Error('Missing stock symbol')
    }
    if (!FMP_API_KEY) {
      throw new Error('Missing FMP API key')
    }

    console.log(`Processing financial health request for symbol: ${symbol}`);

    // --- Fetch data from FMP ---
    // Try using key-metrics endpoint which should be more reliable
    const metricsUrl = `${FMP_BASE_URL}/v3/key-metrics-ttm/${symbol}?apikey=${FMP_API_KEY}`
    const ratiosUrl = `${FMP_BASE_URL}/v3/ratios-ttm/${symbol}?apikey=${FMP_API_KEY}`

    console.log(`Fetching metrics data from: ${metricsUrl.replace(FMP_API_KEY, 'HIDDEN')}`);
    
    // Return a default empty response if we can't get data
    const defaultResponse = {
      symbol: symbol,
      debtToEquity: null,
      currentRatio: null,
      quickRatio: null,
      returnOnEquity: null,
      returnOnAssets: null,
      grossMargin: null,
      operatingMargin: null,
      netMargin: null,
      healthScore: null
    };

    try {
      // Try fetching from metrics first 
      const metricsResponse = await fetch(metricsUrl);
      const metricsData = await metricsResponse.json();
      
      if (!metricsResponse.ok || !metricsData || metricsData.length === 0) {
        console.warn(`No metrics data found for ${symbol}, status: ${metricsResponse.status}`);
        // Return graceful fallback
        return new Response(JSON.stringify(defaultResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      // Try ratios if metrics succeeded
      const ratiosResponse = await fetch(ratiosUrl);
      const ratiosData = await ratiosResponse.json();

      // --- Process and Map Data ---
      const metrics = metricsData[0] || {};
      const ratios = ratiosData && ratiosData.length > 0 ? ratiosData[0] : {};

      // Calculate health score
      const calculateHealthScore = (metrics: any, ratios: any): number | null => {
        if (!metrics && !ratios) return null;
        
        let score = 50; // Start mid-range
        
        // Use either source depending on what's available
        const debtToEquity = metrics.debtToEquity || ratios.debtEquityRatio || null;
        const currentRatio = metrics.currentRatio || ratios.currentRatio || null;
        const roe = metrics.returnOnEquity || ratios.returnOnEquity || null;
        const netMargin = metrics.netProfitMargin || ratios.netProfitMargin || null;
        
        if (debtToEquity !== null) {
          if (debtToEquity < 1) score += 10;
          else if (debtToEquity > 2) score -= 10;
        }
        
        if (currentRatio !== null) {
          if (currentRatio > 1.5) score += 10;
          else if (currentRatio < 1) score -= 10;
        }
        
        if (roe !== null) {
          if (roe > 0.15) score += 10;
          else if (roe < 0) score -= 10;
        }
        
        if (netMargin !== null) {
          if (netMargin > 0.1) score += 10;
          else if (netMargin < 0) score -= 10;
        }
        
        return Math.max(0, Math.min(100, score)); // Clamp score between 0-100
      }

      const healthData: FinancialHealthData = {
        symbol: symbol,
        debtToEquity: metrics.debtToEquity || ratios.debtEquityRatio || null,
        currentRatio: metrics.currentRatio || ratios.currentRatio || null,
        quickRatio: metrics.quickRatio || ratios.quickRatio || null,
        returnOnEquity: metrics.returnOnEquity || ratios.returnOnEquity || null,
        returnOnAssets: metrics.returnOnAssets || ratios.returnOnAssets || null,
        grossMargin: metrics.grossProfitMargin || ratios.grossProfitMargin || null,
        operatingMargin: metrics.operatingProfitMargin || ratios.operatingProfitMargin || null,
        netMargin: metrics.netProfitMargin || ratios.netProfitMargin || null,
        healthScore: calculateHealthScore(metrics, ratios)
      };

      return new Response(JSON.stringify(healthData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (apiError) {
      console.error(`API fetch error: ${apiError.message}`);
      // Return fallback data instead of error
      return new Response(JSON.stringify(defaultResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
  } catch (error) {
    console.error('Error processing request:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}) 
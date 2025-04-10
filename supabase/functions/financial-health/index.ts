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
  healthScore: number | null; // Needs calculation logic
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

    // --- Fetch data from FMP ---
    const ratiosUrl = `${FMP_BASE_URL}/v3/ratios/${symbol}?limit=1&apikey=${FMP_API_KEY}`
    const metricsUrl = `${FMP_BASE_URL}/v3/key-metrics/${symbol}?limit=1&apikey=${FMP_API_KEY}`

    const [ratiosResponse, metricsResponse] = await Promise.all([
      fetch(ratiosUrl),
      fetch(metricsUrl),
    ])

    if (!ratiosResponse.ok || !metricsResponse.ok) {
      console.error(`FMP API Error: Ratios ${ratiosResponse.status}, Metrics ${metricsResponse.status}`);
      // Consider returning partial data or a more specific error
      throw new Error('Failed to fetch data from FMP API')
    }

    const ratiosData = await ratiosResponse.json()
    const metricsData = await metricsResponse.json()

    // --- Process and Map Data ---
    // FMP returns arrays, take the first element (most recent)
    const latestRatios = ratiosData?.[0]
    const latestMetrics = metricsData?.[0]

    if (!latestRatios || !latestMetrics) {
      console.warn(`No recent ratios or metrics found for ${symbol}`);
      // Return null or default values if data is missing
       return new Response(JSON.stringify(null), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 404 // Not Found might be appropriate
       })
    }

    // TODO: Implement Health Score Calculation
    const calculateHealthScore = (ratios: any, metrics: any): number | null => {
        // Example: Simple scoring based on a few metrics. Needs refinement.
        let score = 50; // Start mid-range
        if (ratios.debtEquityRatio < 1) score += 10; else if (ratios.debtEquityRatio > 2) score -= 10;
        if (ratios.currentRatio > 1.5) score += 10; else if (ratios.currentRatio < 1) score -= 10;
        if (metrics.returnOnEquity > 0.15) score += 10; else if (metrics.returnOnEquity < 0) score -= 10;
        if (metrics.netProfitMargin > 0.1) score += 10; else if (metrics.netProfitMargin < 0) score -=10;
        return Math.max(0, Math.min(100, score)); // Clamp score between 0-100
    }

    const healthData: FinancialHealthData = {
      symbol: symbol,
      debtToEquity: latestRatios?.debtEquityRatio ?? null,
      currentRatio: latestRatios?.currentRatio ?? null,
      quickRatio: latestRatios?.quickRatio ?? null,
      returnOnEquity: latestMetrics?.roe ?? latestRatios?.returnOnEquity ?? null, // Check both sources
      returnOnAssets: latestMetrics?.roa ?? latestRatios?.returnOnAssets ?? null, // Check both sources
      grossMargin: latestRatios?.grossProfitMargin ?? null,
      operatingMargin: latestRatios?.operatingProfitMargin ?? null,
      netMargin: latestMetrics?.netProfitMargin ?? latestRatios?.netProfitMargin ?? null, // Check both sources
      healthScore: calculateHealthScore(latestRatios, latestMetrics)
    }

    return new Response(JSON.stringify(healthData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error processing request:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}) 
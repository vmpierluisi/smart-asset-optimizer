import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

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

    console.log(`Processing financial health request for symbol: ${symbol}`);
    
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
      // Call our consolidated FMP data service
      const dataServiceUrl = new URL('/functions/v1/fmp-data-service', Deno.env.get('SUPABASE_URL'))
      const dataServiceResponse = await fetch(dataServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          symbol,
          endpoints: ['ratios-ttm', 'key-metrics-ttm']
        }),
      })
      
      if (!dataServiceResponse.ok) {
        console.warn(`Error from data service: ${dataServiceResponse.status}`)
        return new Response(JSON.stringify(defaultResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
      
      const serviceData = await dataServiceResponse.json()
      
      if (serviceData.status !== 'success' || !serviceData.data) {
        console.warn(`No data returned from service for ${symbol}`)
        return new Response(JSON.stringify(defaultResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      // Extract data from service response
      const metrics = serviceData.data['key-metrics-ttm'] || {}
      const ratios = serviceData.data['ratios-ttm'] || {}

      // Calculate health score
      const calculateHealthScore = (metrics: any, ratios: any): number | null => {
        if (!metrics && !ratios) return null;
        
        let score = 50; // Start mid-range
        
        // Use either source depending on what's available
        const debtToEquity = metrics.debtToEquity || ratios.debtEquityRatioTTM || null;
        const currentRatio = metrics.currentRatioTTM || ratios.currentRatioTTM || null;
        const roe = metrics.returnOnEquityTTM || ratios.returnOnEquityTTM || null;
        const netMargin = metrics.netProfitMarginTTM || ratios.netProfitMarginTTM || null;
        
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
        debtToEquity: metrics.debtToEquityTTM || ratios.debtEquityRatioTTM || null,
        currentRatio: metrics.currentRatioTTM || ratios.currentRatioTTM || null,
        quickRatio: metrics.quickRatioTTM || ratios.quickRatioTTM || null,
        returnOnEquity: metrics.returnOnEquityTTM || ratios.returnOnEquityTTM || null,
        returnOnAssets: metrics.returnOnAssetsTTM || ratios.returnOnAssetsTTM || null,
        grossMargin: metrics.grossProfitMarginTTM || ratios.grossProfitMarginTTM || null,
        operatingMargin: metrics.operatingProfitMarginTTM || ratios.operatingProfitMarginTTM || null,
        netMargin: metrics.netProfitMarginTTM || ratios.netProfitMarginTTM || null,
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
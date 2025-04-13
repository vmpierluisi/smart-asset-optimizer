import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface RiskAnalysisData {
  symbol: string;
  beta: number | null;
  maxDrawdown: number | null; // Percentage
  valueAtRisk: number | null; // Percentage
  standardDeviation: number | null; // Percentage (Volatility)
  downsideRisk: number | null; // Percentage
  correlationSP500: number | null;
  riskScore: number | null; // Needs calculation
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { symbol } = await req.json()
    if (!symbol) throw new Error('Missing stock symbol')

    console.log(`Processing risk analysis request for symbol: ${symbol}`);

    // Default response in case of failures
    const defaultResponse = {
      symbol: symbol,
      beta: null,
      maxDrawdown: null,
      valueAtRisk: null,
      standardDeviation: null,
      downsideRisk: null, 
      correlationSP500: null,
      riskScore: null
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
          endpoints: ['profile', 'key-metrics-ttm']
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
      const profile = serviceData.data['profile'] || {}
      const metrics = serviceData.data['key-metrics-ttm'] || {}

      const beta = profile.beta ?? null;
      const standardDeviation = metrics.volatility ?? null; // Use volatility if available

      // --- Calculate Risk Score ---
      const calculateRiskScore = (beta: number | null, standardDeviation: number | null): number | null => {
        if (beta === null && standardDeviation === null) return null;
        
        let score = 50; // Start at neutral risk
        
        // Add points based on beta
        if (beta !== null) {
          if (beta < 0.8) score -= 15;
          else if (beta < 1.0) score -= 5;
          else if (beta > 1.2) score += 5;
          else if (beta > 1.5) score += 15;
        }
        
        // Add points based on volatility/standardDeviation if available
        if (standardDeviation !== null) {
          if (standardDeviation < 0.15) score -= 10;
          else if (standardDeviation > 0.30) score += 10;
        }
        
        return Math.max(0, Math.min(100, score)); // Clamp score 0-100
      };

      const riskData: RiskAnalysisData = {
        symbol: symbol,
        beta: beta,
        maxDrawdown: null, // Not available from basic API
        valueAtRisk: null, // Not available from basic API
        standardDeviation: standardDeviation,
        downsideRisk: null, // Not available from basic API
        correlationSP500: null, // Not available from basic API
        riskScore: calculateRiskScore(beta, standardDeviation)
      };

      return new Response(JSON.stringify(riskData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
      
    } catch (apiError) {
      console.error(`API fetch error: ${apiError.message}`);
      // Return fallback data without failing
      return new Response(JSON.stringify(defaultResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

  } catch (error) {
    console.error('Error processing request:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
}); 
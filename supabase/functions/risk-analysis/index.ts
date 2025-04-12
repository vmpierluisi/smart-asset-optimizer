import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const FMP_API_KEY = Deno.env.get('FMP_API_KEY')
const FMP_BASE_URL = 'https://financialmodelingprep.com/api'

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
    if (!FMP_API_KEY) throw new Error('Missing FMP API key')

    console.log(`Processing risk analysis request for symbol: ${symbol}`);

    // --- Fetch Data ---
    // Try company profile first for beta
    const profileUrl = `${FMP_BASE_URL}/v3/profile/${symbol}?apikey=${FMP_API_KEY}`
    // Try key metrics for additional data
    const metricsUrl = `${FMP_BASE_URL}/v3/key-metrics-ttm/${symbol}?apikey=${FMP_API_KEY}`
    
    console.log(`Fetching from profile URL: ${profileUrl.replace(FMP_API_KEY, 'HIDDEN_API_KEY')}`);
    
    try {
      const profileResponse = await fetch(profileUrl);
      const profileData = await profileResponse.json();

      if (!profileResponse.ok || !Array.isArray(profileData) || profileData.length === 0) {
        console.warn(`No profile data found for ${symbol}, status: ${profileResponse.status}`);
        // Return fallback data without failing
        return new Response(JSON.stringify({
          symbol: symbol,
          beta: null,
          maxDrawdown: null,
          valueAtRisk: null,
          standardDeviation: null,
          downsideRisk: null, 
          correlationSP500: null,
          riskScore: null
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      // --- Process and Map Data ---
      const profile = profileData[0] || {};
      
      // Try to fetch additional metrics if profile was successful
      let metrics = {};
      try {
        const metricsResponse = await fetch(metricsUrl);
        const metricsData = await metricsResponse.json();
        if (metricsResponse.ok && Array.isArray(metricsData) && metricsData.length > 0) {
          metrics = metricsData[0];
        }
      } catch (metricsError) {
        console.warn(`Failed to fetch metrics for ${symbol}: ${metricsError.message}`);
        // Continue with just profile data
      }

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
      return new Response(JSON.stringify({
        symbol: symbol,
        beta: null,
        maxDrawdown: null,
        valueAtRisk: null,
        standardDeviation: null,
        downsideRisk: null,
        correlationSP500: null,
        riskScore: null
      }), {
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
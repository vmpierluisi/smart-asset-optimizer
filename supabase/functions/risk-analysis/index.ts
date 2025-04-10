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

    // --- Fetch Data ---
    // Beta is often available in company profile or key stats endpoints
    const profileUrl = `${FMP_BASE_URL}/v3/profile/${symbol}?apikey=${FMP_API_KEY}`
    // Standard Deviation (Volatility) might be in a technical endpoint or require historical data calc
    // Correlation to SP500 often requires historical data calculation comparing to ^GSPC or SPY

    const profileResponse = await fetch(profileUrl);

    if (!profileResponse.ok) {
        console.error(`Failed to fetch profile (for beta) for ${symbol}: ${profileResponse.status} ${await profileResponse.text()}`);
         // Decide how to handle - throw, return null, etc.
         // Returning null for now if profile fetch fails
         return new Response(JSON.stringify(null), {
             headers: { ...corsHeaders, 'Content-Type': 'application/json' },
             status: 404 // Or another appropriate status
         });
    }

    const profileData = await profileResponse.json();

    // --- Process and Map Data ---
    const latestProfile = profileData?.[0];

    const beta = latestProfile?.beta ?? null;

    // --- Placeholder values for complex metrics ---
    const maxDrawdown = null; // Requires historical data calculation
    const valueAtRisk = null; // Requires historical data calculation & assumptions
    const standardDeviation = latestProfile?.volAvg ?? null; // Use average volume as a rough proxy? Or calc volatility
    const downsideRisk = null; // Requires historical data calculation
    const correlationSP500 = null; // Requires historical data calculation
    const riskScore = null; // Requires aggregation and calculation logic

     // TODO: Implement Risk Score Calculation (if desired)
    const calculateRiskScore = (beta: number | null /*, other metrics */): number | null => {
        if (beta === null) return null;
        // Example: Score based primarily on Beta. Needs refinement.
        let score = 50;
        if (beta < 0.8) score -= 15;
        else if (beta < 1.0) score -= 5;
        else if (beta > 1.2) score += 5;
        else if (beta > 1.5) score += 15;
        // Add points based on volatility, drawdown etc. if calculated
        return Math.max(0, Math.min(100, score)); // Clamp score 0-100
    }


    const riskData: RiskAnalysisData = {
      symbol: symbol,
      beta: beta,
      maxDrawdown: maxDrawdown,
      valueAtRisk: valueAtRisk,
      standardDeviation: standardDeviation, // Needs proper volatility calc ideally
      downsideRisk: downsideRisk,
      correlationSP500: correlationSP500,
      riskScore: calculateRiskScore(beta /*, other metrics... */)
    };

    return new Response(JSON.stringify(riskData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing request:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
}); 
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const FMP_API_KEY = Deno.env.get('FMP_API_KEY')
const FMP_BASE_URL = 'https://financialmodelingprep.com/api'

interface AnalystRatings {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  consensus: string;
}

interface PriceTarget {
  targetHigh: number;
  targetLow: number;
  targetConsensus: number;
  targetMedian: number;
}

interface AnalystData {
  symbol: string;
  analystRatings: AnalystRatings | null;
  priceTarget: PriceTarget | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { symbol } = await req.json()
    if (!symbol) throw new Error('Missing stock symbol')
    
    if (!FMP_API_KEY) throw new Error('Missing FMP API key')

    // Prepare URLs for API calls
    const ratingsUrl = `${FMP_BASE_URL}/stable/grades-consensus?symbol=${symbol}&apikey=${FMP_API_KEY}`;
    const priceTargetUrl = `${FMP_BASE_URL}/stable/price-target-consensus?symbol=${symbol}&apikey=${FMP_API_KEY}`;

    // Fetch ratings and price target data
    const [ratingsResponse, targetResponse] = await Promise.all([
      fetch(ratingsUrl),
      fetch(priceTargetUrl)
    ]);

    if (!ratingsResponse.ok) {
      console.warn(`Failed to fetch ratings for ${symbol}: ${ratingsResponse.status} ${await ratingsResponse.text()}`);
    }
    if (!targetResponse.ok) {
      console.warn(`Failed to fetch price target for ${symbol}: ${targetResponse.status} ${await targetResponse.text()}`);
    }

    const ratingsData = ratingsResponse.ok ? await ratingsResponse.json() : [];
    const targetData = targetResponse.ok ? await targetResponse.json() : [];

    // Process data
    const latestRating = ratingsData?.[0]; // Get the consensus data
    const analystRatings: AnalystRatings | null = latestRating ? {
        strongBuy: latestRating.strongBuy ?? 0,
        buy: latestRating.buy ?? 0,
        hold: latestRating.hold ?? 0,
        sell: latestRating.sell ?? 0,
        strongSell: latestRating.strongSell ?? 0,
        consensus: latestRating.consensus ?? 'N/A'
    } : null;

    const latestPriceTarget = targetData?.[0]; // Get the price target data
    const priceTarget: PriceTarget | null = latestPriceTarget ? {
        targetHigh: latestPriceTarget.targetHigh ?? 0,
        targetLow: latestPriceTarget.targetLow ?? 0,
        targetConsensus: latestPriceTarget.targetConsensus ?? 0,
        targetMedian: latestPriceTarget.targetMedian ?? 0
    } : null;

    const result: AnalystData = {
        symbol: symbol,
        analystRatings: analystRatings,
        priceTarget: priceTarget,
    };

    return new Response(JSON.stringify(result), {
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
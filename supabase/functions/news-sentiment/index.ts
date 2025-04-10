import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const FMP_API_KEY = Deno.env.get('FMP_API_KEY')
const FMP_BASE_URL = 'https://financialmodelingprep.com/api'

interface NewsItem {
  title: string;
  sentiment: 'positive' | 'negative' | 'neutral'; // FMP might return score instead
  source: string;
  date: string; // FMP provides ISO string typically
}

interface AnalystRatings {
  buy: number;
  hold: number;
  sell: number;
}

interface NewsSentimentData {
  symbol: string;
  recentNews: NewsItem[];
  analystRatings: AnalystRatings | null;
  averagePriceTarget: number | null;
  sentimentScore: number | null;
}

// Basic sentiment mapping (example - adjust based on FMP data)
function mapSentiment(fmpSentiment?: number | string): 'positive' | 'negative' | 'neutral' {
    if (typeof fmpSentiment === 'number') {
        if (fmpSentiment > 0.2) return 'positive';
        if (fmpSentiment < -0.2) return 'negative';
    }
    // Add more checks if fmpSentiment is a string like 'Bullish'/'Bearish'
    return 'neutral';
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
    // Note: Adjust endpoints and parameters based on exact FMP API capabilities
    const newsUrl = `${FMP_BASE_URL}/v3/stock_news?tickers=${symbol}&limit=5&apikey=${FMP_API_KEY}`; // Get latest 5 news items
    const ratingsUrl = `${FMP_BASE_URL}/v3/analyst-estimates/${symbol}?limit=1&apikey=${FMP_API_KEY}`; // Get latest analyst ratings
    const priceTargetUrl = `${FMP_BASE_URL}/v4/price-target-consensus?symbol=${symbol}&apikey=${FMP_API_KEY}`; // Consensus price target
    // FMP might have a dedicated sentiment endpoint, e.g., v4/sentiment?symbol=...
    // For now, we'll derive sentiment from news if possible or leave score null

    const [newsResponse, ratingsResponse, targetResponse] = await Promise.all([
      fetch(newsUrl),
      fetch(ratingsUrl),
      fetch(priceTargetUrl)
    ]);

    // Check responses (allow ratings/target to fail gracefully if needed)
    if (!newsResponse.ok) {
        console.error(`Failed to fetch news for ${symbol}: ${newsResponse.status} ${await newsResponse.text()}`);
        // Optionally throw or return partial data
    }
     if (!ratingsResponse.ok) {
        console.warn(`Failed to fetch ratings for ${symbol}: ${ratingsResponse.status} ${await ratingsResponse.text()}`);
    }
     if (!targetResponse.ok) {
        console.warn(`Failed to fetch price target for ${symbol}: ${targetResponse.status} ${await targetResponse.text()}`);
    }

    const newsData = newsResponse.ok ? await newsResponse.json() : [];
    const ratingsData = ratingsResponse.ok ? await ratingsResponse.json() : [];
    const targetData = targetResponse.ok ? await targetResponse.json() : [];


    // --- Process and Map Data ---
    const recentNews: NewsItem[] = (newsData || []).map((item: any) => ({
      title: item.title,
      // FMP news endpoint might not have sentiment score directly, map it if available
      sentiment: mapSentiment(item.sentimentScore /* or similar field */),
      source: item.site,
      date: item.publishedDate, // Assuming FMP provides this field
    }));

    const latestRating = ratingsData?.[0]; // Get the most recent rating set
    const analystRatings: AnalystRatings | null = latestRating ? {
        buy: (latestRating.ratingBuy ?? 0) + (latestRating.ratingOverweight ?? 0) + (latestRating.ratingStrongBuy ?? 0),
        hold: latestRating.ratingHold ?? 0,
        sell: (latestRating.ratingSell ?? 0) + (latestRating.ratingUnderweight ?? 0) + (latestRating.ratingStrongSell ?? 0),
    } : null;

    const averagePriceTarget = targetData?.[0]?.targetConsensus ?? null;

    // Placeholder for sentiment score - potentially derived from news or separate endpoint
    const sentimentScore = null;

    const result: NewsSentimentData = {
        symbol: symbol,
        recentNews: recentNews,
        analystRatings: analystRatings,
        averagePriceTarget: averagePriceTarget,
        sentimentScore: sentimentScore
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
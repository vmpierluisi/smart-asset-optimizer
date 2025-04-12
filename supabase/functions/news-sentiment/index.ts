import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const FMP_API_KEY = Deno.env.get('FMP_API_KEY')
const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY')
const FMP_BASE_URL = 'https://financialmodelingprep.com/api'
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co'

interface NewsItem {
  title: string;
  sentiment: string; // Alpha Vantage sentiment label
  sentimentColor: string; // Added color code for sentiment
  source: string;
  date: string; // Formatted date
  rawDate: string; // Keep original date format for reference
  url: string;
  imageUrl?: string;
}

interface AnalystRatings {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  consensus: string;
}

interface NewsSentimentData {
  symbol: string;
  recentNews: NewsItem[];
  analystRatings: AnalystRatings | null;
  averagePriceTarget: number | null;
  sentimentScore: number | null;
}

interface AlphaVantageNewsItem {
  title: string;
  url: string;
  time_published: string;
  authors: string[];
  summary: string;
  banner_image: string;
  source: string;
  category_within_source: string;
  source_domain: string;
  topics: {
    topic: string;
    relevance_score: string;
  }[];
  overall_sentiment_score: number;
  overall_sentiment_label: string;
  ticker_sentiment: {
    ticker: string;
    relevance_score: string;
    ticker_sentiment_score: string;
    ticker_sentiment_label: string;
  }[];
}

// Format Alpha Vantage date (20250412T120120) to human-readable format (2025-04-12)
function formatDate(dateString: string): string {
  if (!dateString || dateString.length < 8) return 'Unknown Date';

  try {
    // Extract year, month, day only
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.warn('Error parsing date:', error);
    return 'Invalid Date';
  }
}

// Get color for sentiment label
function getSentimentColor(sentiment: string): string {
  // Alpha Vantage returns these exact labels, so we need to match exactly
  switch (sentiment) {
    case 'Bullish':
      return '#22c55e'; // green-500
    case 'Somewhat-Bullish':
      return '#4ade80'; // green-400
    case 'Neutral':
      return '#f59e0b'; // amber-500
    case 'Somewhat-Bearish':
      return '#fb7185'; // red-400
    case 'Bearish':
      return '#ef4444'; // red-500
    default:
      // Log unknown sentiment for debugging
      console.log(`Unknown sentiment label: ${sentiment}`);
      return '#f59e0b'; // amber-500 default
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { symbol } = await req.json()
    if (!symbol) throw new Error('Missing stock symbol')
    
    // Check for Alpha Vantage API key first, fall back to FMP for analyst data
    if (!ALPHA_VANTAGE_API_KEY) throw new Error('Missing Alpha Vantage API key')
    if (!FMP_API_KEY) console.warn('Missing FMP API key - analyst ratings may be unavailable')

    // --- Fetch Data ---
    // Use Alpha Vantage for news
    const newsUrl = `${ALPHA_VANTAGE_BASE_URL}/query?function=NEWS_SENTIMENT&tickers=${symbol}&limit=3&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    // Still use FMP for analyst and price target data if available
    let ratingsUrl, priceTargetUrl;
    if (FMP_API_KEY) {
      ratingsUrl = `${FMP_BASE_URL}/stable/grades-consensus?symbol=${symbol}&apikey=${FMP_API_KEY}`;
      priceTargetUrl = `${FMP_BASE_URL}/stable/price-target-summary?symbol=${symbol}&apikey=${FMP_API_KEY}`;
    }

    // Fetch news data from Alpha Vantage
    const newsResponse = await fetch(newsUrl);
    if (!newsResponse.ok) {
      console.error(`Failed to fetch news for ${symbol}: ${newsResponse.status} ${await newsResponse.text()}`);
    }
    const newsData = newsResponse.ok ? await newsResponse.json() : { feed: [] };

    // Fetch ratings and target data if FMP API key is available
    let ratingsData: any[] = [], targetData: any[] = [];
    if (FMP_API_KEY) {
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

      ratingsData = ratingsResponse.ok ? await ratingsResponse.json() : [];
      targetData = targetResponse.ok ? await targetResponse.json() : [];
    }

    // --- Process and Map Data ---
    const feed = newsData.feed || [];
    const recentNews: NewsItem[] = feed.slice(0, 3).map((item: AlphaVantageNewsItem) => ({
      title: item.title,
      sentiment: item.overall_sentiment_label,
      sentimentColor: getSentimentColor(item.overall_sentiment_label),
      source: item.source,
      date: formatDate(item.time_published),
      rawDate: item.time_published,
      url: item.url,
      imageUrl: item.banner_image
    }));

    // Calculate average sentiment score from Alpha Vantage data
    const averageSentimentScore = feed.length > 0
      ? feed.slice(0, 3).reduce((sum: number, item: AlphaVantageNewsItem) => sum + item.overall_sentiment_score, 0) / Math.min(feed.length, 3)
      : null;

    const latestRating = ratingsData?.[0]; // Get the consensus data
    const analystRatings: AnalystRatings | null = latestRating ? {
        strongBuy: latestRating.strongBuy ?? 0,
        buy: latestRating.buy ?? 0,
        hold: latestRating.hold ?? 0,
        sell: latestRating.sell ?? 0,
        strongSell: latestRating.strongSell ?? 0,
        consensus: latestRating.consensus ?? 'N/A'
    } : null;

    const averagePriceTarget = targetData?.[0]?.lastMonthAvgPriceTarget ?? null;

    // Use the average sentiment score directly from Alpha Vantage
    // Convert to 0-100 scale for consistency with the UI
    const sentimentScore = averageSentimentScore !== null
      ? (averageSentimentScore + 1) * 50 // Convert from -1 to 1 scale to 0 to 100 scale
      : null;

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
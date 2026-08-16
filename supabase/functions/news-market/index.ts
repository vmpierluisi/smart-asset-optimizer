import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY')
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

interface MarketNewsData {
  recentNews: NewsItem[];
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

// Calculate date from 24 hours ago in ISO format
function get24HoursAgo(): string {
  const date = new Date();
  date.setHours(date.getHours() - 24);
  return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check for Alpha Vantage API key
    if (!ALPHA_VANTAGE_API_KEY) {
      console.error('Missing Alpha Vantage API key in environment variables');
      throw new Error('Missing Alpha Vantage API key')
    }

    // Set the topics as specified
    const topics = "blockchain,earnings,ipo,mergers_and_acquisitions,financial_markets,economy_fiscal,economy_monetary,economy_macro,energy_transportation,finance,life_sciences,manufacturing,real_estate,retail_wholesale,technology";
    
    // Set time_from to 24 hours ago
    const timeFrom = get24HoursAgo();

    // --- Fetch Data ---
    // Use Alpha Vantage for news
    const newsUrl = `${ALPHA_VANTAGE_BASE_URL}/query?function=NEWS_SENTIMENT&topics=${topics}&time_from=${timeFrom}&limit=10&apikey=${ALPHA_VANTAGE_API_KEY}`;
    console.log(`Fetching Alpha Vantage news data from time: ${timeFrom}`);
    
    // Fetch news data from Alpha Vantage
    let newsData = { feed: [] };
    try {
      const newsResponse = await fetch(newsUrl);
      if (!newsResponse.ok) {
        const errorText = await newsResponse.text();
        console.error(`Failed to fetch market news: ${newsResponse.status} ${errorText}`);
        
        // Check for specific Alpha Vantage error responses
        if (newsResponse.status === 401) {
          throw new Error('Invalid Alpha Vantage API key');
        }
        if (newsResponse.status === 429) {
          throw new Error('Alpha Vantage API rate limit exceeded');
        }
      } else {
        newsData = await newsResponse.json();
        console.log(`Retrieved ${newsData.feed?.length || 0} news items from Alpha Vantage`);
        
        // Check if we received expected data structure
        if (!newsData.feed || !Array.isArray(newsData.feed)) {
          console.error('Unexpected response format from Alpha Vantage:', newsData);
          newsData = { feed: [] };
        }
      }
    } catch (fetchError) {
      console.error('Error during Alpha Vantage API fetch:', fetchError.message);
      throw new Error(`Alpha Vantage API error: ${fetchError.message}`);
    }

    // --- Process and Map Data ---
    const feed = newsData.feed || [];
    
    if (feed.length === 0) {
      console.warn('No news items found in Alpha Vantage response');
      // Return empty result instead of throwing error
      return new Response(JSON.stringify({ 
        recentNews: [],
        sentimentScore: null,
        message: 'No news items found for the given topics and time range'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    const recentNews: NewsItem[] = feed.map((item: AlphaVantageNewsItem) => ({
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
      ? feed.reduce((sum: number, item: AlphaVantageNewsItem) => sum + item.overall_sentiment_score, 0) / feed.length
      : null;

    // Use the average sentiment score directly from Alpha Vantage
    // Convert to 0-100 scale for consistency with the UI
    const sentimentScore = averageSentimentScore !== null
      ? (averageSentimentScore + 1) * 50 // Convert from -1 to 1 scale to 0 to 100 scale
      : null;

    const result: MarketNewsData = {
        recentNews: recentNews,
        sentimentScore: sentimentScore
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing request:', error.message);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString(),
      source: 'news-market edge function'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
}); 
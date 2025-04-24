// Types for Marketaux API response
export interface MarketauxNewsResponse {
  meta: {
    found: number;
    returned: number;
    limit: number;
    page: number;
  };
  data: NewsArticle[];
}

// Available industries for filtering general news
export const AVAILABLE_INDUSTRIES = [
  "Technology",
  "Industrials",
  "N/A",
  "Consumer Cyclical",
  "Healthcare",
  "Communication Services",
  "Financial Services",
  "Consumer Defensive",
  "Basic Materials",
  "Real Estate",
  "Energy",
  "Utilities",
  "Financial",
  "Services",
  "Consumer Goods",
  "Industrial Goods"
];

export interface NewsArticle {
  uuid: string;
  title: string;
  description: string;
  keywords: string;
  snippet: string;
  url: string;
  image_url: string;
  language: string;
  published_at: string;
  source: string;
  relevance_score: number | null;
  entities: Entity[];
  similar: any[];
  // Extended properties for processed articles
  formattedDate?: string;
  overallSentiment?: number;
}

export interface Entity {
  symbol: string;
  name: string;
  exchange: string | null;
  exchange_long: string | null;
  country: string;
  type: string;
  industry: string;
  match_score: number;
  sentiment_score: number;
  highlights: Highlight[];
}

export interface Highlight {
  highlight: string;
  sentiment: number;
  highlighted_in: string;
}

/**
 * Interface for articles after being processed by extractNewsData
 */
export interface ProcessedNewsArticle {
  id: string;
  title: string;
  description: string;
  snippet: string;
  url: string;
  imageUrl: string; // camelCase version of image_url
  publishedAt: Date;
  source: string;
  formattedDate: string;
  overallSentiment: number;
  mainEntity: {
    symbol: string;
    name: string;
    type: string;
    sentimentScore: number;
  } | null;
}

/**
 * Fetches breaking news from the Supabase Edge Function
 */
export async function fetchBreakingNews(): Promise<MarketauxNewsResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch('https://hymucchmkpgemxcxngpe.supabase.co/functions/v1/news-breaking', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response from news API: ${response.status}`, errorText);
      // Don't throw, just return null to prevent infinite loops
      return null;
    }
    
    const data = await response.json();
    return data as MarketauxNewsResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('Request timed out after 10 seconds');
    } else {
      console.error('Failed to fetch breaking news:', error);
    }
    return null;
  }
}

/**
 * Fetches general news from the Supabase Edge Function
 * @param options Optional parameters for filtering news
 */
export async function fetchGeneralNews(options?: {
  symbol?: string;
  sortBy?: 'relevance' | 'sentiment' | 'date';
  industries?: string[];
}): Promise<MarketauxNewsResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch('https://hymucchmkpgemxcxngpe.supabase.co/functions/v1/news-general', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        symbol: options?.symbol || '',
        sortBy: options?.sortBy || 'date',
        industries: options?.industries || AVAILABLE_INDUSTRIES
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response from general news API: ${response.status}`, errorText);
      // Don't throw, just return null to prevent infinite loops
      return null;
    }
    
    const data = await response.json();
    return data as MarketauxNewsResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('Request timed out after 10 seconds');
    } else {
      console.error('Failed to fetch general news:', error);
    }
    return null;
  }
}

/**
 * Extracts relevant information from news articles
 * @returns Array of ProcessedNewsArticle
 */
export function extractNewsData(newsResponse: MarketauxNewsResponse | null): ProcessedNewsArticle[] {
  if (!newsResponse || !newsResponse.data || newsResponse.data.length === 0) {
    return [];
  }
  
  try {
    return newsResponse.data.map(article => ({
      id: article.uuid,
      title: article.title,
      description: article.description,
      snippet: article.snippet,
      url: article.url,
      imageUrl: article.image_url,
      publishedAt: new Date(article.published_at),
      source: article.source,
      formattedDate: article.formattedDate || formatPublishedDate(article.published_at),
      overallSentiment: article.overallSentiment || 0,
      // Extract the main entity if available
      mainEntity: article.entities && article.entities.length > 0 ? {
        symbol: article.entities[0].symbol,
        name: article.entities[0].name,
        type: article.entities[0].type,
        sentimentScore: article.entities[0].sentiment_score
      } : null
    }));
  } catch (error) {
    console.error('Error processing news data:', error);
    return [];
  }
}

/**
 * Returns the average overallSentiment from an array of news articles
 */
export function getAverageMarketSentiment(articles: { overallSentiment?: number }[]): number {
  if (!articles || articles.length === 0) return 0;
  const sentiments = articles.map(a => typeof a.overallSentiment === 'number' ? a.overallSentiment : 0);
  const avg = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
  return Number(avg.toFixed(3));
}

/**
 * Converts a sentiment score from -1 to 1 scale to 0-100 scale for UI display
 */
export function convertSentimentToDisplayScale(sentiment: number): number {
  // Convert from [-1, 1] to [0, 100]
  return Math.round((sentiment + 1) * 50);
}

/**
 * Formats the published date to a readable format
 */
export function formatPublishedDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Gets sentiment classification based on sentiment score
 */
export function getSentimentClass(score: number | null): 'positive' | 'negative' | 'neutral' {
  if (score === null) return 'neutral';
  if (score > 0.2) return 'positive';
  if (score < -0.2) return 'negative';
  return 'neutral';
}

/**
 * Fetches and processes the breaking news data
 */
export async function getProcessedBreakingNews() {
  const newsResponse = await fetchBreakingNews();
  return extractNewsData(newsResponse);
}

/**
 * Fetches and processes the general news data
 * @param options Optional parameters for filtering news
 */
export async function getProcessedGeneralNews(options?: {
  symbol?: string;
  sortBy?: 'relevance' | 'sentiment' | 'date';
  industries?: string[];
}) {
  const newsResponse = await fetchGeneralNews(options);
  return extractNewsData(newsResponse);
}
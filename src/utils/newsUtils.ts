/**
 * Market-news data layer — consolidated onto a single provider (Marketaux)
 * through the unified `invokeFunction` client. (Previously this mixed Marketaux
 * for breaking/general news with Alpha Vantage for "market" news and hardcoded
 * the old Supabase project URL.)
 */
import { invokeFunction } from '@/lib/apiClient';

export interface MarketauxNewsResponse {
  meta: { found: number; returned: number; limit: number; page: number };
  data: NewsArticle[];
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
  similar: unknown[];
  formattedDate?: string;
  overallSentiment?: number;
}

/** Article shape consumed by the news UI. */
export interface ProcessedNewsArticle {
  id: string;
  title: string;
  description: string;
  snippet: string;
  url: string;
  imageUrl: string;
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

/** Industries available for filtering general news. */
export const AVAILABLE_INDUSTRIES = [
  'Technology', 'Industrials', 'N/A', 'Consumer Cyclical', 'Healthcare',
  'Communication Services', 'Financial Services', 'Consumer Defensive',
  'Basic Materials', 'Real Estate', 'Energy', 'Utilities', 'Financial',
  'Services', 'Consumer Goods', 'Industrial Goods',
];

// --- fetchers (all Marketaux via invokeFunction) ---------------------------

export async function fetchBreakingNews(): Promise<MarketauxNewsResponse | null> {
  try {
    return await invokeFunction<MarketauxNewsResponse>('news-breaking', {});
  } catch (error) {
    console.error('Failed to fetch breaking news:', error);
    return null;
  }
}

export async function fetchGeneralNews(options?: {
  symbol?: string;
  sortBy?: 'relevance' | 'sentiment' | 'date';
  industries?: string[];
}): Promise<MarketauxNewsResponse | null> {
  try {
    return await invokeFunction<MarketauxNewsResponse>('news-general', {
      symbol: options?.symbol || '',
      sortBy: options?.sortBy || 'date',
      industries: options?.industries || AVAILABLE_INDUSTRIES,
    });
  } catch (error) {
    console.error('Failed to fetch general news:', error);
    return null;
  }
}

export async function fetchMarketNews(): Promise<MarketauxNewsResponse | null> {
  try {
    return await invokeFunction<MarketauxNewsResponse>('news-market', {});
  } catch (error) {
    console.error('Failed to fetch market news:', error);
    return null;
  }
}

// --- processing / helpers --------------------------------------------------

export function extractNewsData(newsResponse: MarketauxNewsResponse | null): ProcessedNewsArticle[] {
  if (!newsResponse?.data?.length) return [];
  try {
    return newsResponse.data.map((article) => ({
      id: article.uuid,
      title: article.title,
      description: article.description,
      snippet: article.snippet,
      url: article.url,
      imageUrl: article.image_url,
      publishedAt: new Date(article.published_at),
      source: article.source,
      formattedDate: article.formattedDate || formatPublishedDate(article.published_at),
      overallSentiment: article.overallSentiment ?? article.entities?.[0]?.sentiment_score ?? 0,
      mainEntity: article.entities?.length
        ? {
            symbol: article.entities[0].symbol,
            name: article.entities[0].name,
            type: article.entities[0].type,
            sentimentScore: article.entities[0].sentiment_score,
          }
        : null,
    }));
  } catch (error) {
    console.error('Error processing news data:', error);
    return [];
  }
}

/** Average `overallSentiment` across a set of articles. */
export function getAverageMarketSentiment(articles: { overallSentiment?: number }[]): number {
  if (!articles?.length) return 0;
  const sum = articles.reduce((acc, a) => acc + (typeof a.overallSentiment === 'number' ? a.overallSentiment : 0), 0);
  return Number((sum / articles.length).toFixed(3));
}

/** Convert a sentiment score from [-1, 1] to a 0–100 display scale. */
export function convertSentimentToDisplayScale(sentiment: number): number {
  return Math.round((sentiment + 1) * 50);
}

export function formatPublishedDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateString));
}

export function getSentimentClass(score: number | null): 'positive' | 'negative' | 'neutral' {
  if (score === null) return 'neutral';
  if (score > 0.2) return 'positive';
  if (score < -0.2) return 'negative';
  return 'neutral';
}

// --- fetch + process convenience wrappers ----------------------------------

export async function getProcessedBreakingNews(): Promise<ProcessedNewsArticle[]> {
  return extractNewsData(await fetchBreakingNews());
}

export async function getProcessedGeneralNews(options?: {
  symbol?: string;
  sortBy?: 'relevance' | 'sentiment' | 'date';
  industries?: string[];
}): Promise<ProcessedNewsArticle[]> {
  return extractNewsData(await fetchGeneralNews(options));
}

export async function getProcessedMarketNews(): Promise<ProcessedNewsArticle[]> {
  return extractNewsData(await fetchMarketNews());
}

/** Alias kept for the market-news carousel. */
export async function getProcessedMarketTrendNews(): Promise<ProcessedNewsArticle[]> {
  return extractNewsData(await fetchMarketNews());
}

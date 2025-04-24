// To allow public (unauthenticated) access to this Edge Function, ensure JWT verification is disabled for this function in your Supabase project settings.
// See: https://supabase.com/docs/guides/functions/securing-functions#disable-jwt-verification-for-a-function
// If your project requires JWT by default, you must explicitly disable it for this function in the dashboard or via CLI.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

console.log('News general function started')

// Simple in-memory cache to reduce API calls
interface CacheEntry {
  data: any;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration
const cache = new Map<string, CacheEntry>();

// Define CORS headers directly in this file instead of importing
function getCorsHeaders(origin: string | null) {
  // Allow localhost:8080 for local dev, otherwise allow all
  let allowOrigin = '*';
  if (origin && (origin === 'http://localhost:8080' || origin === 'http://127.0.0.1:8080')) {
    allowOrigin = origin;
  }
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

const MARKETAUX_DATA_API_KEY = Deno.env.get('MARKETAUX_DATA_API_KEY')
const MARKETAUX_BASE_URL = 'https://api.marketaux.com/v1/news/all'

// Define the industries to include
const INDUSTRIES = [
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

interface MarketNewsEntity {
  symbol: string;
  name: string;
  exchange: string | null;
  exchange_long: string | null;
  country: string;
  type: string;
  industry: string;
  match_score: number;
  sentiment_score: number;
  highlights: Array<{
    highlight: string;
    sentiment: number;
    highlighted_in: string;
  }>;
}

interface MarketNewsItem {
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
  entities: MarketNewsEntity[];
  similar: any[];
}

interface MarketNewsResponse {
  meta: {
    found: number;
    returned: number;
    limit: number;
    page: number;
  };
  data: MarketNewsItem[];
}

// Format the current date and time in the format required by Marketaux API
function getCurrentDateTimeFormatted(): string {
  const now = new Date();
  
  // Format: YYYY-MM-DDThh:mm
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Get yesterday's date and time formatted for the API
function getYesterdayDateTimeFormatted(): string {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  
  // Format: YYYY-MM-DDThh:mm:ss
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  const hours = String(yesterday.getHours()).padStart(2, '0');
  const minutes = String(yesterday.getMinutes()).padStart(2, '0');
  const seconds = String(yesterday.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// Process news data to extract useful information
function processNewsData(newsData: MarketNewsResponse) {
  // Preserve the original structure but add some additional processing
  return {
    meta: newsData.meta,
    data: newsData.data.map(item => ({
      ...item, // Keep all original properties
      // Add additional processed properties
      formattedDate: formatNewsDate(item.published_at),
      overallSentiment: calculateAverageSentiment(item.entities) || 0
    }))
  };
}

// Format the date from ISO string to a more readable format
function formatNewsDate(dateString: string): string {
  if (!dateString) return 'Unknown Date';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.warn('Error parsing date:', error);
    return 'Invalid Date';
  }
}

// Calculate average sentiment score from entities
function calculateAverageSentiment(entities: MarketNewsEntity[]): number | null {
  if (!entities || entities.length === 0) return null;
  const sum = entities.reduce((acc, entity) => acc + entity.sentiment_score, 0);
  return sum / entities.length;
}

// Verify the API key is valid before serving requests
async function verifyApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;
  
  try {
    // Make a minimal request to the API to verify the key
    const url = new URL(MARKETAUX_BASE_URL);
    url.searchParams.append('api_token', apiKey);
    url.searchParams.append('limit', '1');
    
    const response = await fetch(url.toString());
    
    // If we get a 200 OK or similar, the key is valid
    return response.ok;
  } catch (error) {
    console.error('Error verifying API key:', error);
    return false;
  }
}

// Serve handler with improved CORS and error handling
serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  // Handle CORS preflight (OPTIONS) requests
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight (OPTIONS) received');
    return new Response(null, {
      status: 204, // No content status
      headers: {
        ...getCorsHeaders(origin),
        'Access-Control-Max-Age': '86400', // 24 hours caching for preflight requests
      }
    });
  }

  try {
    // Allow unauthenticated access: do not check for or require any user authentication.
    // Only require the Marketaux API key for backend requests.
    if (!MARKETAUX_DATA_API_KEY) {
      console.error('Marketaux API key not configured');
      return new Response(
        JSON.stringify({
          error: 'Server configuration error: Missing API key',
        }),
        {
          headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
          status: 500, // Use 500 instead of 401 to avoid confusion with JWT auth
        }
      );
    }

    // Parse request parameters (optional)
    let symbol = '';
    let sortBy: 'relevance' | 'sentiment' | 'date' = 'date';
    let selectedIndustries = [...INDUSTRIES]; // Default to all industries
    
    // Try to parse the request body if it exists
    try {
      const { symbol: reqSymbol, sortBy: reqSortBy, industries: reqIndustries } = await req.json();
      if (reqSymbol) symbol = reqSymbol;
      if (reqSortBy && ['relevance', 'sentiment', 'date'].includes(reqSortBy)) {
        sortBy = reqSortBy as 'relevance' | 'sentiment' | 'date';
      }
      if (reqIndustries && Array.isArray(reqIndustries) && reqIndustries.length > 0) {
        // Filter to ensure only valid industries are included
        selectedIndustries = reqIndustries.filter(industry => 
          INDUSTRIES.includes(industry)
        );
      }
    } catch (e) {
      // If parsing fails, continue with defaults
      console.log('No request body or invalid JSON, using defaults');
    }

    // Create cache key based on request parameters
    const cacheKey = `general-${symbol}-${sortBy}-${selectedIndustries.sort().join(',')}`;
    
    // Check if we have a valid cache entry
    const cacheEntry = cache.get(cacheKey);
    if (cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION) {
      console.log(`Using cached data for ${cacheKey}`);
      return new Response(JSON.stringify(cacheEntry.data), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Get yesterday's date and time formatted for the API
    const publishedAfter = getYesterdayDateTimeFormatted();
    
    // Build the URL with required parameters
    const url = new URL(MARKETAUX_BASE_URL);
    url.searchParams.append('countries', 'global');
    url.searchParams.append('filter_entities', 'true');
    url.searchParams.append('limit', '10'); // Increased limit for general news
    url.searchParams.append('language', 'en');
    url.searchParams.append('published_after', publishedAfter);
    
    // Add symbol filter if provided
    if (symbol) {
      url.searchParams.append('symbols', symbol);
    }
    
    // Add industry filter
    if (selectedIndustries.length > 0 && selectedIndustries.length < INDUSTRIES.length) {
      url.searchParams.append('industry', selectedIndustries.join(','));
    }
    
    url.searchParams.append('api_token', MARKETAUX_DATA_API_KEY);

    // Log the URL for debugging (without exposing full API key)
    const debugUrl = url.toString().replace(MARKETAUX_DATA_API_KEY, '***API_KEY***');
    console.log('Fetching from Marketaux API:', debugUrl);

    // Fetch general news from Marketaux
    const response = await fetch(url.toString());
    
    // Log response status and headers for debugging
    console.log('Marketaux API response status:', response.status);
    console.log('Marketaux API response headers:', JSON.stringify(Object.fromEntries([...response.headers])));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch general news: ${response.status} ${errorText}`);
      
      if (response.status === 429) {
        // Rate limit exceeded - return a more helpful error
        console.log('Rate limit exceeded, returning cached data if available');
        
        // Check if we have ANY cached data to return as fallback
        const fallbackEntries = Array.from(cache.entries())
          .filter(([key, entry]) => key.startsWith('general-') && entry.data && entry.data.data && entry.data.data.length > 0)
          .sort((a, b) => b[1].timestamp - a[1].timestamp); // Sort by most recent
        
        if (fallbackEntries.length > 0) {
          // Return the most recent cached data with a warning
          const [fallbackKey, fallbackEntry] = fallbackEntries[0];
          console.log(`Using fallback cache: ${fallbackKey}`);
          
          // Add a warning to the response
          const responseWithWarning = {
            ...fallbackEntry.data,
            warning: 'API rate limit exceeded. Showing cached data.',
            cached: true,
            cacheTime: new Date(fallbackEntry.timestamp).toISOString()
          };
          
          return new Response(JSON.stringify(responseWithWarning), {
            headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
            status: 200, // Return 200 with cached data and warning
          });
        }
        
        // No cache available, return the rate limit error
        return new Response(JSON.stringify({ 
          error: 'API rate limit exceeded. Please try again later.',
          details: errorText,
          retryAfter: response.headers.get('retry-after') || '60'
        }), {
          headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
          status: 429,
        });
      } else if (response.status === 401) {
        // 401 from Marketaux
        return new Response(JSON.stringify({ error: 'Marketaux API unauthorized: Invalid or missing API key', details: errorText }), {
          headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
          status: 401,
        });
      }
      
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const newsData: MarketNewsResponse = await response.json();
    
    // Process the news data to extract useful information
    const processedData = processNewsData(newsData);
    
    // Sort the news based on the sortBy parameter
    if (sortBy === 'relevance') {
      processedData.data.sort((a, b) => {
        const aMaxScore = Math.max(...a.entities.map(e => e.match_score), 0);
        const bMaxScore = Math.max(...b.entities.map(e => e.match_score), 0);
        return bMaxScore - aMaxScore;
      });
    } else if (sortBy === 'sentiment') {
      processedData.data.sort((a, b) => b.overallSentiment - a.overallSentiment);
    } else {
      // Default sort by date (newest first)
      processedData.data.sort((a, b) => 
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      );
    }

    // Cache the processed data
    cache.set(cacheKey, {
      data: processedData,
      timestamp: Date.now()
    });
    
    // Return the processed response
    return new Response(JSON.stringify(processedData), {
      headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // If the error is a Response (e.g., from above), return it directly
    if (error instanceof Response) {
      return error;
    }
    
    console.error('Error processing request:', error && error.message ? error.message : String(error));
    
    // Check if we have ANY cached data to return as fallback for server errors
    const fallbackEntries = Array.from(cache.entries())
      .filter(([key, entry]) => key.startsWith('general-') && entry.data && entry.data.data && entry.data.data.length > 0)
      .sort((a, b) => b[1].timestamp - a[1].timestamp); // Sort by most recent
    
    if (fallbackEntries.length > 0) {
      // Return the most recent cached data with a warning
      const [fallbackKey, fallbackEntry] = fallbackEntries[0];
      console.log(`Server error, using fallback cache: ${fallbackKey}`);
      
      // Add a warning to the response
      const responseWithWarning = {
        ...fallbackEntry.data,
        warning: 'Server error occurred. Showing cached data.',
        cached: true,
        cacheTime: new Date(fallbackEntry.timestamp).toISOString()
      };
      
      return new Response(JSON.stringify(responseWithWarning), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        status: 200, // Return 200 with cached data and warning
      });
    }
    
    // No cache available, return the error
    return new Response(JSON.stringify({ error: error && error.message ? error.message : String(error) }), {
      headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

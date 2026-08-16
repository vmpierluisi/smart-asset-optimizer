import { useState, useEffect, useCallback } from 'react';
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { ProcessedNewsArticle, getProcessedMarketTrendNews } from "@/utils/newsUtils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// News topics available in the Alpha Vantage API
const NEWS_TOPICS = [
  { id: 'all', label: 'All', value: '' },
  { id: 'blockchain', label: 'Blockchain', value: 'blockchain' },
  { id: 'earnings', label: 'Earnings', value: 'earnings' },
  { id: 'ipo', label: 'IPO', value: 'ipo' },
  { id: 'mergers', label: 'M&A', value: 'mergers_and_acquisitions' },
  { id: 'markets', label: 'Markets', value: 'financial_markets' },
  { id: 'economy', label: 'Economy', value: 'economy_macro' },
  { id: 'energy', label: 'Energy', value: 'energy_transportation' },
  { id: 'tech', label: 'Tech', value: 'technology' },
  { id: 'real_estate', label: 'Real Estate', value: 'real_estate' }
];

// Fallback news articles to display when API returns empty results
const FALLBACK_NEWS: ProcessedNewsArticle[] = [
  {
    id: 'fallback-1',
    title: 'Markets React to Economic Reports as Investors Watch Fed Signals',
    description: 'Global markets are adjusting to the latest economic data while closely monitoring Federal Reserve communications for clues on future monetary policy.',
    snippet: 'Investors are parsing economic reports and Fed statements for direction.',
    url: 'https://www.reuters.com/markets/',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1470&auto=format&fit=crop',
    publishedAt: new Date(),
    source: 'Market Trends',
    formattedDate: new Date().toLocaleDateString(),
    overallSentiment: 0.2,
    mainEntity: {
      symbol: 'SPY',
      name: 'S&P 500',
      type: 'Index',
      sentimentScore: 0.2
    }
  },
  {
    id: 'fallback-2',
    title: 'Tech Sector Shows Resilience Amid Market Volatility',
    description: 'Technology companies are demonstrating strength despite broader market uncertainty, with AI-focused firms leading the gains.',
    snippet: 'Tech companies remain strong performers in uncertain market conditions.',
    url: 'https://www.bloomberg.com/technology',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1470&auto=format&fit=crop',
    publishedAt: new Date(),
    source: 'Tech Insider',
    formattedDate: new Date().toLocaleDateString(),
    overallSentiment: 0.6,
    mainEntity: {
      symbol: 'QQQ',
      name: 'Nasdaq 100',
      type: 'Index',
      sentimentScore: 0.6
    }
  },
  {
    id: 'fallback-3',
    title: 'Energy Prices Rise on Supply Concerns',
    description: 'Oil and natural gas prices are increasing as geopolitical tensions and production cuts create a tight supply environment.',
    snippet: 'Energy commodities gain as supply constraints persist.',
    url: 'https://www.cnbc.com/energy/',
    imageUrl: 'https://images.unsplash.com/photo-1516937941344-00b4e0337589?q=80&w=1470&auto=format&fit=crop',
    publishedAt: new Date(),
    source: 'Energy Watch',
    formattedDate: new Date().toLocaleDateString(),
    overallSentiment: 0.4,
    mainEntity: {
      symbol: 'XLE',
      name: 'Energy Sector',
      type: 'Sector',
      sentimentScore: 0.4
    }
  }
];

const CACHE_KEY = 'cachedMarketTrendNews';
const CACHE_TIMESTAMP_KEY = 'marketTrendNewsLastUpdated';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

const MarketNewsCarousel = () => {
  const [newsArticles, setNewsArticles] = useState<ProcessedNewsArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<ProcessedNewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTopic, setCurrentTopic] = useState('all');
  const [lastUpdated, setLastUpdated] = useState<string>("");
  
  // News cache with timestamp
  const [newsCache, setNewsCache] = useState<{ 
    articles: ProcessedNewsArticle[], 
    timestamp: number,
    topics: Record<string, ProcessedNewsArticle[]>
  } | null>(null);
  
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slides: {
      perView: 'auto',
      spacing: 40,
    },
    drag: true,
    mode: "snap",
    renderMode: "performance",
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
  });

  // Load cached data from localStorage
  const loadCachedData = useCallback(() => {
    try {
      const cachedDataStr = localStorage.getItem(CACHE_KEY);
      const lastUpdatedStr = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cachedDataStr) {
        const cachedData = JSON.parse(cachedDataStr);
        setNewsCache(cachedData);
        
        // If cache is recent (< 15 min), use it immediately to speed up initial load
        const now = Date.now();
        if ((now - cachedData.timestamp) < CACHE_DURATION) {
          setNewsArticles(cachedData.articles);
          setFilteredArticles(currentTopic === 'all' ? 
            cachedData.articles : 
            cachedData.topics[currentTopic] || []);
          setError("");
        }
      }
      
      // Update last updated timestamp display
      if (lastUpdatedStr) {
        setLastUpdated(new Date(lastUpdatedStr).toLocaleString());
      }
    } catch (err) {
      console.error('Error loading cached market trend news:', err);
      // Invalid cache, will fetch fresh data
    }
  }, [currentTopic]);

  // Save cache to localStorage
  const saveToLocalStorage = useCallback((cacheData: { 
    articles: ProcessedNewsArticle[], 
    timestamp: number,
    topics: Record<string, ProcessedNewsArticle[]>
  }) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date(cacheData.timestamp).toISOString());
      setLastUpdated(new Date(cacheData.timestamp).toLocaleString());
    } catch (err) {
      console.error('Error saving market trend news cache to localStorage:', err);
    }
  }, []);

  // Fetch news articles
  const fetchNews = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError("");
      
      const now = Date.now();
      
      // Check if we have valid cached data and aren't forcing a refresh
      if (!forceRefresh && 
          newsCache && 
          (now - newsCache.timestamp) < CACHE_DURATION && 
          newsCache.articles.length > 0) {
        
        setNewsArticles(newsCache.articles);
        setFilteredArticles(currentTopic === 'all' ? 
          newsCache.articles : 
          newsCache.topics[currentTopic] || []);
        setError("");
        return;
      }
      
      try {
        // Fetch fresh data from the Alpha Vantage API via our news-market endpoint
        const articles = await getProcessedMarketTrendNews();
        
        
        if (articles && articles.length > 0) {
          // Group articles by topic
          const topicMap: Record<string, ProcessedNewsArticle[]> = {};
          
          // For each topic, filter articles that have that topic
          NEWS_TOPICS.forEach(topic => {
            if (topic.id !== 'all') {
              // Match articles that have the topic in title or description 
              // This is a simplified approach since we don't have direct topic data in the processed articles
              topicMap[topic.id] = articles.filter(article => 
                (article.title.toLowerCase().includes(topic.id.toLowerCase()) || 
                 (article.description && article.description.toLowerCase().includes(topic.id.toLowerCase())))
              );
            }
          });
          
          // Create new cache object
          const newCache = {
            articles,
            timestamp: now,
            topics: topicMap
          };
          
          // Update state cache
          setNewsCache(newCache);
          
          // Save to localStorage
          saveToLocalStorage(newCache);
          
          // Update state with articles
          setNewsArticles(articles);
          setFilteredArticles(currentTopic === 'all' ? 
            articles : 
            topicMap[currentTopic] || []);
          setError("");
        } else {
          console.warn('API returned empty article array or null', articles);
          
          // If we got an empty array but have stale cache, use it
          if (newsCache && newsCache.articles.length > 0) {
            setNewsArticles(newsCache.articles);
            setFilteredArticles(currentTopic === 'all' ? 
              newsCache.articles : 
              newsCache.topics[currentTopic] || []);
            setError("Unable to refresh news. Showing cached content.");
          } else {
            // No articles and no cache - use fallback articles
            const fallbackTopicMap: Record<string, ProcessedNewsArticle[]> = {};
            
            // Create topic mappings for fallback news
            NEWS_TOPICS.forEach(topic => {
              if (topic.id !== 'all') {
                fallbackTopicMap[topic.id] = FALLBACK_NEWS.filter(article => 
                  (article.title.toLowerCase().includes(topic.id.toLowerCase()) || 
                  (article.description && article.description.toLowerCase().includes(topic.id.toLowerCase())))
                );
              }
            });
            
            const fallbackCache = {
              articles: FALLBACK_NEWS,
              timestamp: now,
              topics: fallbackTopicMap
            };
            
            setNewsCache(fallbackCache);
            saveToLocalStorage(fallbackCache);
            setNewsArticles(FALLBACK_NEWS);
            setFilteredArticles(currentTopic === 'all' ? 
              FALLBACK_NEWS : 
              fallbackTopicMap[currentTopic] || []);
            setError("Using sample market news while waiting for API.");
          }
        }
      } catch (err) {
        console.error("Error fetching market trend news:", err);
        
        // If API call fails but we have stale cache, use it as fallback
        if (newsCache && newsCache.articles.length > 0) {
          setNewsArticles(newsCache.articles);
          setFilteredArticles(currentTopic === 'all' ? 
            newsCache.articles : 
            newsCache.topics[currentTopic] || []);
          setError("Unable to refresh news (rate limit). Showing cached content.");
          setLastUpdated(`${new Date(newsCache.timestamp).toLocaleString()} (cached)`);
        } else {
          // No cache available - use fallback articles
          const fallbackTopicMap: Record<string, ProcessedNewsArticle[]> = {};
          
          // Create topic mappings for fallback news
          NEWS_TOPICS.forEach(topic => {
            if (topic.id !== 'all') {
              fallbackTopicMap[topic.id] = FALLBACK_NEWS.filter(article => 
                (article.title.toLowerCase().includes(topic.id.toLowerCase()) || 
                (article.description && article.description.toLowerCase().includes(topic.id.toLowerCase())))
              );
            }
          });
          
          const fallbackCache = {
            articles: FALLBACK_NEWS,
            timestamp: now,
            topics: fallbackTopicMap
          };
          
          setNewsCache(fallbackCache);
          saveToLocalStorage(fallbackCache);
          setNewsArticles(FALLBACK_NEWS);
          setFilteredArticles(currentTopic === 'all' ? 
            FALLBACK_NEWS : 
            fallbackTopicMap[currentTopic] || []);
          setError("Using sample market news while API connection is restored.");
        }
      }
    } catch (err) {
      console.error("Error in fetchNews function:", err);
      setError("Failed to fetch news articles. Please try again later.");
      
      // Use fallback articles in case of any error
      setNewsArticles(FALLBACK_NEWS);
      setFilteredArticles(FALLBACK_NEWS);
    } finally {
      setIsLoading(false);
    }
  }, [currentTopic, newsCache, saveToLocalStorage]);

  // Load cached data and fetch news on initial mount
  useEffect(() => {
    // First try to load from cache
    loadCachedData();
    
    // Then fetch news (which will use cache if valid)
    fetchNews();
    
    // Set up a refresh interval (5 minutes)
    const refreshInterval = setInterval(() => fetchNews(), 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
    // Run once on mount; fetchNews/loadCachedData are stable enough for this
    // intent and including them causes a re-fetch loop (fetchNews depends on
    // newsCache, which it also sets).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to filter news when the topic changes
  useEffect(() => {
    if (newsCache) {
      if (currentTopic === 'all') {
        setFilteredArticles(newsCache.articles);
      } else {
        setFilteredArticles(newsCache.topics[currentTopic] || []);
      }
    }
  }, [currentTopic, newsCache]);

  // Re-measure the slider whenever the slide set changes (loading -> data, or a
  // topic filter). Without this keen-slider keeps stale positions and the cards
  // overlap.
  useEffect(() => {
    const id = setTimeout(() => instanceRef.current?.update(), 0);
    return () => clearTimeout(id);
  }, [filteredArticles, newsArticles, isLoading, instanceRef]);

  // Handle topic change
  const handleTopicChange = (topic: string) => {
    setCurrentTopic(topic);
    // Reset to first slide
    if (instanceRef.current) {
      instanceRef.current.moveToIdx(0);
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    fetchNews(true); // Force refresh
  };

  // Calculate number of dots for the slider
  const numDots = filteredArticles.length > 0 ? 
    Math.min(filteredArticles.length, 5) : 
    Math.min(newsArticles.length, 5);

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      <div className="w-full flex flex-row justify-between items-center">
        <h3 className="text-xl font-semibold">Market Highlights</h3>
        <div className="flex items-center">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground mr-2">
              Updated: {lastUpdated}
            </span>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isLoading}
            className="text-sm"
          >
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="w-full" onValueChange={handleTopicChange}>
        <TabsList className="mb-4 flex w-full overflow-x-auto">
          {NEWS_TOPICS.map((topic) => (
            <TabsTrigger key={topic.id} value={topic.id} className="text-xs whitespace-nowrap">
              {topic.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      <div 
        ref={sliderRef} 
        className="keen-slider w-full"
        style={{ 
          overscrollBehaviorX: "none", 
          touchAction: "none",
          WebkitOverflowScrolling: "touch",
          position: "relative",
          zIndex: 10
        }}
      >
        {isLoading ? (
          // Display loading skeletons
          [...Array(3)].map((_, idx) => (
            <div key={idx} className="keen-slider__slide flex items-center justify-center min-w-[480px]">
              <div className="w-[480px] h-[340px] bg-neutral-100 rounded-xl flex items-center justify-center animate-pulse">
                <p className="text-neutral-400">Loading news...</p>
              </div>
            </div>
          ))
        ) : error && filteredArticles.length === 0 ? (
          // Display error message if fetching fails
          <div className="keen-slider__slide flex items-center justify-center min-w-[480px]">
            <div className="w-[480px] h-[340px] bg-neutral-50 rounded-xl flex items-center justify-center flex-col p-6">
              <p className="text-red-500 font-medium mb-2">{error}</p>
              {error.includes("rate limit") ? (
                <p className="text-sm text-gray-600 text-center">
                  The free API plan has limited requests. We're showing cached articles until the rate limit resets.
                </p>
              ) : error.includes("API keys") ? (
                <p className="text-sm text-gray-600 text-center">
                  Make sure the ALPHA_VANTAGE_API_KEY environment variable is set correctly in your Supabase Edge Function.
                </p>
              ) : (
                <p className="text-sm text-gray-600 text-center">
                  Try again later or check the console for more details.
                </p>
              )}
              <Button 
                onClick={handleRefresh} 
                className="mt-4" 
                variant="outline" 
                disabled={isLoading}
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : filteredArticles.length > 0 ? (
          // Display filtered news articles
          filteredArticles.map((article, idx) => (
            <div
              key={idx}
              className="keen-slider__slide flex items-center justify-center min-w-[480px]"
            >
              <div className="w-[480px] h-[340px] bg-gradient-to-br from-slate-200 to-slate-400 rounded-xl overflow-hidden relative group">
                {/* News image (falls back to the gradient when absent or broken) */}
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
                    alt=""
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                
                {/* Sentiment badge */}
                <div className="absolute top-3 right-3 z-10">
                  <div 
                    className={`px-2 py-1 rounded-full text-xs font-medium shadow-sm backdrop-blur-sm`}
                    style={{ 
                      backgroundColor: article.mainEntity?.sentimentScore 
                        ? (article.mainEntity.sentimentScore > 0.3 ? 'rgba(34, 197, 94, 0.8)' 
                          : article.mainEntity.sentimentScore > -0.3 ? 'rgba(245, 158, 11, 0.8)' 
                          : 'rgba(239, 68, 68, 0.8)')
                        : 'rgba(245, 158, 11, 0.8)',
                      color: 'white'
                    }}
                  >
                    {article.mainEntity?.sentimentScore 
                      ? (article.mainEntity.sentimentScore > 0.3 ? 'Bullish' 
                        : article.mainEntity.sentimentScore > -0.3 ? 'Neutral' 
                        : 'Bearish')
                      : 'Neutral'}
                  </div>
                </div>
                
                {/* Title banner */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-4 transition-all duration-300 group-hover:bg-black/70">
                  <h3 className="text-white font-medium line-clamp-2">{article.title}</h3>
                  <p className="text-white/80 text-sm mt-1">{article.source} • {article.formattedDate}</p>
                </div>
                
                {/* Clickable overlay */}
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="absolute inset-0 z-20 cursor-pointer" 
                  aria-label={`Read article: ${article.title}`}
                />
              </div>
            </div>
          ))
        ) : newsArticles.length > 0 ? (
          // If no filtered articles but we have news articles, show them instead
          newsArticles.map((article, idx) => (
            <div
              key={idx}
              className="keen-slider__slide flex items-center justify-center min-w-[480px]"
            >
              <div className="w-[480px] h-[340px] bg-neutral-50 rounded-xl overflow-hidden relative group">
                <img 
                  src={article.imageUrl || '/placeholder-news.jpg'} 
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3 z-10">
                  <div 
                    className={`px-2 py-1 rounded-full text-xs font-medium shadow-sm backdrop-blur-sm`}
                    style={{ 
                      backgroundColor: article.mainEntity?.sentimentScore 
                        ? (article.mainEntity.sentimentScore > 0.3 ? 'rgba(34, 197, 94, 0.8)' 
                          : article.mainEntity.sentimentScore > -0.3 ? 'rgba(245, 158, 11, 0.8)' 
                          : 'rgba(239, 68, 68, 0.8)')
                        : 'rgba(245, 158, 11, 0.8)',
                      color: 'white'
                    }}
                  >
                    {article.mainEntity?.sentimentScore 
                      ? (article.mainEntity.sentimentScore > 0.3 ? 'Bullish' 
                        : article.mainEntity.sentimentScore > -0.3 ? 'Neutral' 
                        : 'Bearish')
                      : 'Neutral'}
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-4 transition-all duration-300 group-hover:bg-black/70">
                  <h3 className="text-white font-medium line-clamp-2">{article.title}</h3>
                  <p className="text-white/80 text-sm mt-1">{article.source} • {article.formattedDate}</p>
                </div>
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="absolute inset-0 z-20 cursor-pointer" 
                  aria-label={`Read article: ${article.title}`}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="w-full text-center py-10">
            <p>No news articles available for this topic.</p>
          </div>
        )}
      </div>
      
      {/* Navigation dots */}
      {(filteredArticles.length > 0 || newsArticles.length > 0) && (
        <div className="flex justify-center mt-2 space-x-1">
          {[...Array(numDots)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => instanceRef.current?.moveToIdx(idx)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 border-none focus:outline-none ${
                currentSlide === idx ? "bg-primary" : "bg-neutral-300"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketNewsCarousel; 
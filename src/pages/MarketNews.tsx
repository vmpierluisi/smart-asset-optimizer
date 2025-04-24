import React, { useState, useEffect, useCallback } from "react";
import { getProcessedBreakingNews, getProcessedGeneralNews, ProcessedNewsArticle, Entity, getAverageMarketSentiment, convertSentimentToDisplayScale, AVAILABLE_INDUSTRIES } from "@/utils/newsUtils";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  ArrowDown, 
  ArrowUp, 
  BarChart, 
  Clock, 
  Coffee, 
  DollarSign, 
  Flame, 
  Info, 
  RefreshCw, 
  Sparkles, 
  TrendingDown, 
  TrendingUp 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import GaugeChart from "@/components/GaugeChart";
import { Separator } from "@/components/ui/separator";
import "keen-slider/keen-slider.min.css";
import { useKeenSlider } from "keen-slider/react";

const MarketNews = () => {
  const [newsArticles, setNewsArticles] = useState<ProcessedNewsArticle[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [headlines, setHeadlines] = useState<Array<{title: string, url: string}>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newsError, setNewsError] = useState<string>("");
  
  // Cache for breaking news to handle rate limiting
  const [breakingNewsCache, setBreakingNewsCache] = useState<{
    articles: ProcessedNewsArticle[];
    headlines: Array<{title: string, url: string}>;
    timestamp: number;
  } | null>(null);

  // Market news data
  const marketPulse = {
    sentiment: 35,
    headline: "Markets Cautious as Inflation Data Looms"
  };

  const insights = [
    {
      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
      title: "Tech Sector Resilience",
      content: "Tech stocks showing strength despite broader market uncertainty, with semiconductor companies leading gains.",
      why: "Continued AI demand and infrastructure spending are providing a buffer against economic concerns."
    },
    {
      icon: <TrendingDown className="h-5 w-5 text-red-500" />,
      title: "Bond Yield Pressure",
      content: "10-year Treasury yields climbing to 3-month highs as inflation expectations adjust.",
      why: "Markets are pricing in fewer rate cuts this year, impacting growth stock valuations."
    },
    {
      icon: <Flame className="h-5 w-5 text-orange-500" />,
      title: "Energy Sector Heating Up",
      content: "Oil prices surged 3% on supply concerns, boosting energy stocks.",
      why: "Geopolitical tensions and production cuts are creating a tight supply environment."
    }
  ];

  const fearGreedIndex = {
    value: 42,
    label: "Fear",
    change: -8,
    description: "Investors are showing caution ahead of key economic data releases this week."
  };

  const assetCategories = [
    {
      id: "indices",
      label: "Major Indices",
      assets: [
        { symbol: "SPY", name: "S&P 500", value: "5,218.65", change: -0.32, direction: "down" },
        { symbol: "QQQ", name: "Nasdaq 100", value: "18,247.39", change: -0.18, direction: "down" },
        { symbol: "DIA", name: "Dow Jones", value: "39,875.12", change: -0.45, direction: "down" },
        { symbol: "IWM", name: "Russell 2000", value: "2,092.56", change: -0.62, direction: "down" },
        { symbol: "VGK", name: "STOXX Europe 600", value: "507.32", change: -0.28, direction: "down" }
      ]
    },
    {
      id: "crypto",
      label: "Cryptocurrencies",
      assets: [
        { symbol: "BTC", name: "Bitcoin", value: "68,245.78", change: 1.24, direction: "up" },
        { symbol: "ETH", name: "Ethereum", value: "3,478.92", change: 0.87, direction: "up" },
        { symbol: "SOL", name: "Solana", value: "142.56", change: 2.35, direction: "up" },
        { symbol: "ADA", name: "Cardano", value: "0.58", change: -0.42, direction: "down" },
        { symbol: "DOT", name: "Polkadot", value: "7.82", change: 0.65, direction: "up" }
      ]
    },
    {
      id: "commodities",
      label: "Commodities",
      assets: [
        { symbol: "GC", name: "Gold", value: "2,345.60", change: 0.75, direction: "up" },
        { symbol: "SI", name: "Silver", value: "27.85", change: 1.12, direction: "up" },
        { symbol: "CL", name: "Crude Oil", value: "82.45", change: 3.05, direction: "up" },
        { symbol: "NG", name: "Natural Gas", value: "1.85", change: -1.25, direction: "down" },
        { symbol: "HG", name: "Copper", value: "4.12", change: 0.32, direction: "up" }
      ]
    },
    {
      id: "forex",
      label: "Forex",
      assets: [
        { symbol: "EUR/USD", name: "Euro/USD", value: "1.0765", change: -0.15, direction: "down" },
        { symbol: "GBP/USD", name: "Pound/USD", value: "1.2645", change: -0.22, direction: "down" },
        { symbol: "USD/JPY", name: "USD/Yen", value: "151.85", change: 0.35, direction: "up" },
        { symbol: "USD/CAD", name: "USD/CAD", value: "1.3542", change: 0.18, direction: "up" },
        { symbol: "AUD/USD", name: "AUD/USD", value: "0.6578", change: -0.28, direction: "down" }
      ]
    }
  ];

  // Function to fetch breaking news headlines from the Supabase Edge Function with caching
  const getBreakingNews = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setNewsError("");
      
      // Cache duration - 15 minutes (in milliseconds)
      const CACHE_DURATION = 15 * 60 * 1000;
      const now = Date.now();
      
      // Check if we have valid cached data and aren't forcing a refresh
      if (!forceRefresh && 
          breakingNewsCache && 
          (now - breakingNewsCache.timestamp) < CACHE_DURATION && 
          breakingNewsCache.articles.length > 0) {
        
        console.log('Using cached breaking news');
        setHeadlines(breakingNewsCache.headlines);
        setNewsArticles(breakingNewsCache.articles);
        setLastUpdated(new Date(breakingNewsCache.timestamp).toLocaleString());
        return;
      }
      
      try {
        // Use the utility function to fetch and process breaking news
        const processedNews = await getProcessedBreakingNews();
        
        if (!processedNews || processedNews.length === 0) {
          // If no news but we have cache, use it as fallback
          if (breakingNewsCache) {
            console.log('No new breaking news, using cached data');
            setHeadlines(breakingNewsCache.headlines);
            setNewsArticles(breakingNewsCache.articles);
            setLastUpdated(new Date(breakingNewsCache.timestamp).toLocaleString());
            return;
          }
          
          setNewsError("No breaking news available at this time.");
          setHeadlines([]);
          return;
        }
        
        // Format the headlines for the ticker
        const formattedHeadlines = processedNews.map(item => ({
          title: item.title,
          url: item.url
        }));
        
        // Update cache
        const newCache = {
          articles: processedNews,
          headlines: formattedHeadlines,
          timestamp: now
        };
        setBreakingNewsCache(newCache);
        
        // Update state
        setHeadlines(formattedHeadlines);
        setNewsArticles(processedNews);
        setLastUpdated(new Date().toLocaleString());
        
        // Store the last update time in localStorage
        localStorage.setItem('newsLastUpdated', new Date().toISOString());
      } catch (apiError) {
        console.error('API error fetching breaking news:', apiError);
        
        // If API call fails but we have cache, use it as fallback
        if (breakingNewsCache) {
          console.log('API error, using cached breaking news');
          setHeadlines(breakingNewsCache.headlines);
          setNewsArticles(breakingNewsCache.articles);
          setNewsError("Unable to refresh news (rate limit). Showing cached content.");
          setLastUpdated(`${new Date(breakingNewsCache.timestamp).toLocaleString()} (cached)`);
          return;
        }
        
        // No cache fallback, propagate the error
        throw apiError;
      }
    } catch (error) {
      setNewsError(error instanceof Error ? error.message : String(error));
      console.error('Error fetching breaking news:', error);
    } finally {
      setIsLoading(false);
    }
  }, [breakingNewsCache]);

  // Load headlines and check if we need to refresh the news data
  const loadHeadlines = useCallback(() => {
    const lastUpdatedStr = localStorage.getItem('newsLastUpdated');
    
    // Try to load cached breaking news from localStorage on initial load
    const cachedNewsStr = localStorage.getItem('cachedBreakingNews');
    if (cachedNewsStr) {
      try {
        const cachedData = JSON.parse(cachedNewsStr);
        setBreakingNewsCache(cachedData);
        
        // If cache is recent (< 15 min), use it immediately to speed up initial load
        const now = Date.now();
        if ((now - cachedData.timestamp) < 15 * 60 * 1000) {
          setHeadlines(cachedData.headlines);
          setNewsArticles(cachedData.articles);
          setLastUpdated(new Date(cachedData.timestamp).toLocaleString());
        }
      } catch (e) {
        console.error('Error parsing cached news:', e);
        // Invalid cache, ignore and continue with fresh fetch
      }
    }
    
    // Fetch the latest headlines when the component mounts
    getBreakingNews(false); // Don't force refresh on initial load
    
    // Still update the last updated time display if we have it in localStorage
    if (lastUpdatedStr) {
      setLastUpdated(new Date(lastUpdatedStr).toLocaleString());
    }
  }, [getBreakingNews]);
  
  // Function to check if we should refresh based on time (for manual checks)
  const shouldRefreshNews = useCallback(() => {
    const lastUpdatedStr = localStorage.getItem('newsLastUpdated');
    
    if (!lastUpdatedStr) return true;
    
    const lastUpdatedTime = new Date(lastUpdatedStr).getTime();
    const currentTime = new Date().getTime();
    const sixHoursInMs = 6 * 60 * 60 * 1000;
    
    return currentTime - lastUpdatedTime > sixHoursInMs;
  }, []);

  // Initialize news data on component mount
  useEffect(() => {
    loadHeadlines();
  }, [loadHeadlines]);
  
  // Save breaking news cache to localStorage when it changes
  useEffect(() => {
    if (breakingNewsCache) {
      try {
        localStorage.setItem('cachedBreakingNews', JSON.stringify(breakingNewsCache));
      } catch (e) {
        console.error('Error saving news cache to localStorage:', e);
      }
    }
  }, [breakingNewsCache]);

  // Handle manual refresh - force refresh from API
  const handleRefresh = () => {
    getBreakingNews(true); // Force refresh
  };

  return (
    <div className="w-full h-full p-4 space-y-4">
      {/* Breaking News Ticker */}
      <div className="rounded-lg p-2 flex items-center overflow-hidden bg-neutral-50">
        <Badge variant="outline" className="mr-2 bg-red-100 text-red-800 border-red-200 shrink-0">
          BREAKING
        </Badge>
        <div className="overflow-hidden whitespace-nowrap relative flex-1">
          {newsError ? (
            <div className="py-1 px-2 text-red-600 flex items-center">
              {newsError}
              {newsError.includes("rate limit") && (
                <span className="ml-2 text-xs text-gray-500">(Using cached news)</span>
              )}
            </div>
          ) : headlines.length > 0 ? (
            <div className="animate-marquee inline-block">
              {headlines.map((news, index) => (
                <a 
                  key={index} 
                  href={news.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mr-8 inline-flex items-center hover:text-primary transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2"></span>
                  {news.title}
                </a>
              ))}
            </div>
          ) : (
            <div className="py-1 px-2">
              {isLoading ? "Loading headlines..." : "No breaking news available"}
            </div>
          )}
        </div>
        <div className="hidden sm:flex items-center text-sm text-muted-foreground ml-2 shrink-0">
          <Clock className="h-3 w-3 mr-1" />
          <span className="hidden md:inline">Last updated: {lastUpdated || "Never"}</span>
          <span className="md:hidden">Updated: {lastUpdated ? lastUpdated.split(', ')[1] : "Never"}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-2" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Market Pulse Section */}
      <Card className="w-full overflow-hidden bg-neutral-50 border-0 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl flex items-center">
              Today's Market Pulse
              <BarChart className="ml-2 h-5 w-5 text-primary" />
            </CardTitle>
          </div>

        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>


            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="text-xl font-bold">{marketPulse.headline}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Snapshot & Sentiment Side-by-Side */}
      <div className="w-full flex flex-col lg:flex-row gap-4">
        {/* Market Snapshot Section */}
        <Card className="overflow-hidden bg-neutral-50 border-0 shadow-none flex-1 basis-full lg:basis-2/3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl">Market Snapshot</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm sm:text-base lg:text-lg">
              Markets are trading cautiously today as investors await key inflation data. 
              <Badge variant="outline" className="mx-1 bg-red-100 text-red-800 border-red-200 inline-flex items-center">
                <ArrowDown className="h-3 w-3 mr-1" /> S&P 500
              </Badge> 
              and 
              <Badge variant="outline" className="mx-1 bg-red-100 text-red-800 border-red-200 inline-flex items-center">
                <ArrowDown className="h-3 w-3 mr-1" /> Nasdaq
              </Badge> 
              are both slightly down, while 
              <Badge variant="outline" className="mx-1 bg-green-100 text-green-800 border-green-200 inline-flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" /> Gold
              </Badge> 
              and 
              <Badge variant="outline" className="mx-1 bg-green-100 text-green-800 border-green-200 inline-flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" /> Oil
              </Badge> 
              are showing strength. 
              <Badge variant="outline" className="mx-1 bg-green-100 text-green-800 border-green-200 inline-flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" /> Crypto
              </Badge> 
              markets are rebounding after yesterday's pullback.
            </div>
          </CardContent>
        </Card>
        {/* Market Sentiment Section */}
        <Card className="overflow-hidden bg-neutral-50 border-0 shadow-none flex-1 basis-full lg:basis-1/3 max-w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl">Market Sentiment</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              {/* GaugeChart for sentiment */}
              <GaugeChart value={convertSentimentToDisplayScale(getAverageMarketSentiment(newsArticles))} min={0} max={100} label="Market Sentiment" />
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center mt-2 text-sm">
                  {fearGreedIndex.change < 0 ? (
                    <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                  ) : (
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                  )}
                  <span>{Math.abs(fearGreedIndex.change)} points from last week</span>
                </div>
                <p className="mt-4 text-muted-foreground">{fearGreedIndex.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Insights Section */}
      <Card className="w-full overflow-hidden bg-neutral-50 border-0 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="pr-2">
            <CardTitle className="text-lg sm:text-xl flex items-center">
              Smart Insights
              <Sparkles className="ml-2 h-5 w-5 text-yellow-500" />
            </CardTitle>
          </div>

        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {insights.map((insight, index) => (
              <Card key={index} className="overflow-hidden w-full bg-neutral-50 border-0 shadow-none">
                <CardHeader className="flex flex-row items-center justify-between p-3">
                  <div className="flex items-center pr-2">
                    {insight.icon}
                    <h4 className="font-semibold ml-2 truncate">{insight.title}</h4>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-sm">{insight.content}</p>
                  <Separator className="my-3" />
                  <div>
                    <div className="flex items-center text-sm font-medium text-muted-foreground">
                      <Info className="h-4 w-4 mr-1 shrink-0" />
                      <span className="truncate">Why This Matters</span>
                    </div>
                    <p className="text-sm mt-1">{insight.why}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Keen-slider Carousel for Blank Cards */}
      <div className="w-full py-1">
        <CarouselBlankCards />
      </div>



      {/* Asset Performance Dashboard */}
      <Card className="w-full overflow-hidden bg-neutral-50 border-0 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="pr-2">
            <CardTitle className="text-lg sm:text-xl flex items-center">
              Asset Performance
              <DollarSign className="ml-2 h-5 w-5 text-primary" />
            </CardTitle>
          </div>

        </CardHeader>
        <CardContent className="overflow-x-auto p-2 sm:p-4">
          <Tabs defaultValue="indices" className="w-full">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 mb-4 max-w-full">
              {assetCategories.map((category) => (
                <TabsTrigger key={category.id} value={category.id} className="text-xs sm:text-sm px-2">
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {assetCategories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-4">
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-full border-collapse rounded-md border text-sm">
                    <thead>
                      <tr className="bg-muted border-b">
                        <th className="p-2 text-left font-medium">Symbol</th>
                        <th className="p-2 text-left font-medium">Name</th>
                        <th className="p-2 text-right font-medium">Price</th>
                        <th className="p-2 text-right font-medium">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.assets.map((asset, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="p-2 font-mono font-medium">{asset.symbol}</td>
                          <td className="p-2 truncate max-w-[150px]">{asset.name}</td>
                          <td className="p-2 text-right font-mono">{asset.value}</td>
                          <td className={`p-2 text-right font-mono flex items-center justify-end ${
                            asset.direction === "up" ? "text-green-600" : "text-red-600"
                          }`}>
                            {asset.direction === "up" ? (
                              <ArrowUp className="h-3 w-3 mr-1 shrink-0" />
                            ) : (
                              <ArrowDown className="h-3 w-3 mr-1 shrink-0" />
                            )}
                            {asset.change.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
const CarouselBlankCards = () => {
  const [newsArticles, setNewsArticles] = useState<ProcessedNewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const numDots = 3; // Limit to 3 cards based on API limit
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderDomRef = React.useRef<HTMLDivElement | null>(null);
  
  // Filter state
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  
  // Filter out "N/A" industry and create a filtered list of industries for badges
  const filteredIndustries = AVAILABLE_INDUSTRIES.filter(industry => industry !== "N/A");
  
  // Cache for news articles by industry to reduce API calls
  const [newsCache, setNewsCache] = useState<Record<string, { articles: ProcessedNewsArticle[], timestamp: number }>>({});
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    // When the slider is created, mark it as loaded
    created() {
      console.log("Slider created");
    },
    loop: true,
    slides: {
      perView: 'auto',
      spacing: 40,
    },
    drag: {
      rubberband: false,  // Disable rubberband effect for smoother scrolling
    },
    mode: "snap",  // Ensure it snaps to slides for better UX
    renderMode: "performance",  // Prioritize performance
    dragSpeed: 0.5,  // Reduce drag speed to make carousel less responsive
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
  });

  // Fetch news articles on component mount
  // Fetch news articles based on selected industry with caching
  useEffect(() => {
    // Cache duration - 5 minutes (in milliseconds)
    const CACHE_DURATION = 5 * 60 * 1000;
    
    const fetchNews = async (retryCount: number = 0) => {
      try {
        setIsLoading(true);
        
        // Create a cache key based on the selected industry
        const cacheKey = selectedIndustry || 'all';
        const now = Date.now();
        
        // Check if we have valid cached data
        if (newsCache[cacheKey] && 
            (now - newsCache[cacheKey].timestamp) < CACHE_DURATION && 
            newsCache[cacheKey].articles.length > 0) {
          
          console.log(`Using cached news for ${cacheKey}`);
          setNewsArticles(newsCache[cacheKey].articles);
          setError("");
        } else {
          // No valid cache, fetch from API
          let articles = [];
          
          try {
            if (selectedIndustry) {
              // Fetch news for the selected industry
              articles = await getProcessedGeneralNews({
                industries: [selectedIndustry],
                sortBy: "date"
              });
            } else {
              // Fetch general news from all industries (except N/A)
              articles = await getProcessedGeneralNews({
                industries: filteredIndustries,
                sortBy: "date"
              });
            }
            
            console.log(`Fetched news articles for ${selectedIndustry || 'all industries'}:`, articles);
            
            // Only update cache if we actually got articles back
            if (articles && articles.length > 0) {
              setNewsCache(prev => ({
                ...prev,
                [cacheKey]: {
                  articles,
                  timestamp: now
                }
              }));
              
              setNewsArticles(articles);
              setError("");
            } else {
              // If we got an empty array but have stale cache, use it
              if (newsCache[cacheKey] && newsCache[cacheKey].articles.length > 0) {
                console.log(`Empty response but using stale cache for ${cacheKey}`);
                setNewsArticles(newsCache[cacheKey].articles);
                setError("Unable to refresh news. Showing cached content.");
              } else {
                // No articles and no cache
                setNewsArticles([]);
                setError("No news articles available at this time.");
              }
            }
          } catch (err) {
            // If API call fails but we have stale cache, use it as fallback
            if (newsCache[cacheKey] && newsCache[cacheKey].articles.length > 0) {
              console.log(`API error but using stale cache for ${cacheKey}`);
              setNewsArticles(newsCache[cacheKey].articles);
              setError("Unable to refresh news (rate limit). Showing cached content.");
            } else {
              // No cache available, show empty state instead of rethrowing
              console.error("No cached data available and API call failed:", err);
              setNewsArticles([]);
              setError("Failed to fetch news articles. Please try again later.");
            }
          }
        }
        
        // Reset to first slide when changing industries
        if (instanceRef.current) {
          instanceRef.current.moveToIdx(0);
        }
      } catch (err) {
        // This catch block will only run for errors outside the API call
        setError("Failed to fetch news articles. Please try again later.");
        console.error("Error in fetchNews function:", err);
        // Ensure we always have something to display
        if (!newsArticles.length) {
          setNewsArticles([]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    // Implement retry mechanism with backoff
    const MAX_RETRIES = 3;
    const BACKOFF_DELAY = 500; // 500ms
    
    const attemptFetch = async (retryCount: number) => {
      try {
        await fetchNews(retryCount);
      } catch (err) {
        if (retryCount < MAX_RETRIES) {
          console.log(`Retry ${retryCount + 1} in ${BACKOFF_DELAY}ms...`);
          setTimeout(() => attemptFetch(retryCount + 1), BACKOFF_DELAY);
        } else {
          console.error("Max retries exceeded. Giving up.");
          setError("Failed to fetch news articles after multiple retries.");
        }
      }
    };
    
    attemptFetch(0);
  }, [selectedIndustry, filteredIndustries, newsCache]);

  // Add global event handlers to completely block browser history navigation during carousel interaction
  React.useEffect(() => {
    // First, add a preventive measure at the document level to capture and prevent all 
    // horizontal swipe gestures that might trigger browser navigation
    const preventBrowserBack = (e: Event) => {
      // This blocks the 'swipe to navigate' browser gesture entirely
      e.preventDefault();
    };
    
    // Register a preventive handler for all relevant navigation events
    window.addEventListener('popstate', preventBrowserBack);
    
    // Handle trackpad and touch swipes directly on the carousel
    const sliderEl = sliderDomRef.current;
    if (!sliderEl || !instanceRef.current) return;
    
    // Handler for wheel events with reduced responsiveness
    const handleWheel = (e: WheelEvent) => {
      // Block all horizontal wheel events in the carousel to prevent browser history navigation
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        e.stopPropagation();
        
        // Add a threshold to make the carousel less responsive
        // Only process events with significant horizontal movement
        if (Math.abs(e.deltaX) < 5) return;
        
        const inst = instanceRef.current;
        if (!inst) return;
        
        // With loop enabled, we can simply call next/prev without checking boundaries
        if (e.deltaX > 0) {
          inst.next();
        } else if (e.deltaX < 0) {
          inst.prev();
        }
      }
    };
    
    // Handle touch events with reduced responsiveness
    let touchStartX = 0;
    let touchMoveX = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      // Prevent browser navigation
      e.preventDefault();
      e.stopPropagation();
      
      touchMoveX = e.touches[0].clientX;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const deltaX = touchStartX - touchMoveX;
      
      // Only respond to significant swipes (higher threshold = less responsive)
      if (Math.abs(deltaX) < 50) return;
      
      const inst = instanceRef.current;
      if (!inst) return;
      
      // With loop enabled, we can simply call next/prev without checking boundaries
      if (deltaX > 0) {
        inst.next();
      } else {
        inst.prev();
      }
    };
    
    // Add capture phase event listeners to ensure we handle events before they propagate
    sliderEl.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    sliderEl.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
    sliderEl.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    sliderEl.addEventListener('touchend', handleTouchEnd, { passive: true, capture: true });
    
    // Clean up all event listeners
    return () => {
      window.removeEventListener('popstate', preventBrowserBack);
      sliderEl.removeEventListener('wheel', handleWheel, { capture: true });
      sliderEl.removeEventListener('touchstart', handleTouchStart, { capture: true });
      sliderEl.removeEventListener('touchmove', handleTouchMove, { capture: true });
      sliderEl.removeEventListener('touchend', handleTouchEnd, { capture: true });
    };
  }, [sliderRef, instanceRef]);

  // Use a callback ref to assign both the keen-slider ref and the DOM ref
  const combinedSliderRef = React.useCallback((node: HTMLDivElement | null) => {
    sliderRef(node);
    sliderDomRef.current = node;
  }, [sliderRef]);

  // Debounce timer ref
  const debounceTimerRef = React.useRef<number | null>(null);
  
  // Handle industry selection with debounce
  const handleIndustrySelect = (industry: string | null) => {
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    
    // Prevent unnecessary re-renders if selecting the same industry
    if (industry === selectedIndustry) return;
    
    // Show loading state immediately
    setIsLoading(true);
    
    // Debounce the actual industry change (250ms)
    debounceTimerRef.current = window.setTimeout(() => {
      setSelectedIndustry(industry);
      debounceTimerRef.current = null;
    }, 250);
  };
  
  return (
    <div className="w-full flex flex-col items-center space-y-4">
      {/* Industry filter badges */}
      <div className="flex flex-wrap gap-2 justify-center pb-2 w-full max-w-[900px]">
        <Badge 
          variant={selectedIndustry === null ? "default" : "outline"}
          className={`cursor-pointer transition-all ${selectedIndustry === null ? 'bg-primary hover:bg-primary/90' : 'hover:bg-secondary'}`}
          onClick={() => handleIndustrySelect(null)}
        >
          General
        </Badge>
        
        {filteredIndustries.map((industry) => (
          <Badge
            key={industry}
            variant={selectedIndustry === industry ? "default" : "outline"}
            className={`cursor-pointer transition-all ${selectedIndustry === industry ? 'bg-primary hover:bg-primary/90' : 'hover:bg-secondary'}`}
            onClick={() => handleIndustrySelect(industry)}
          >
            {industry}
          </Badge>
        ))}
      </div>
      
      <div 
        ref={combinedSliderRef} 
        className="keen-slider w-full"
        style={{ 
          overscrollBehaviorX: "none", 
          touchAction: "none", // Prevent all touch actions to avoid browser history navigation
          WebkitOverflowScrolling: "touch", // Better touch handling
          position: "relative", // Ensure proper stacking context
          zIndex: 10 // Higher z-index to ensure events are captured
        }}
        onTouchStart={(e) => e.stopPropagation()} // Additional protection against touch propagation
      >
        {isLoading ? (
          // Display loading skeletons while fetching news
          [...Array(3)].map((_, idx) => (
            <div key={idx} className="keen-slider__slide flex items-center justify-center">
              <div className="w-[480px] h-[340px] bg-neutral-100 rounded-xl flex items-center justify-center animate-pulse">
                <p className="text-neutral-400">Loading news...</p>
              </div>
            </div>
          ))
        ) : error ? (
          // Display error message if fetching fails
          <div className="keen-slider__slide flex items-center justify-center">
            <div className="w-[480px] h-[340px] bg-neutral-50 rounded-xl flex items-center justify-center flex-col p-6">
              <p className="text-red-500 font-medium mb-2">{error}</p>
              {error.includes("rate limit") && (
                <p className="text-sm text-gray-600 text-center">
                  The free API plan has limited requests. We're showing cached articles until the rate limit resets.
                </p>
              )}
            </div>
          </div>
        ) : (
          // Display news articles
          newsArticles.slice(0, 3).map((article, idx) => {
            // Get the industry from the mainEntity property (if available)
            const primaryIndustry = article.mainEntity ? article.mainEntity.type : "News";
              
            return (
              <div
                key={idx}
                className="keen-slider__slide flex items-center justify-center"
              >
                <div className="w-[480px] h-[340px] bg-neutral-50 rounded-xl overflow-hidden relative group">
                  {/* News image taking up the whole card */}
                  <img 
                    src={article.imageUrl || '/placeholder-news.jpg'} 
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Industry badge in top right */}
                  <div className="absolute top-3 right-3 z-10">
                    <Badge 
                      variant="secondary" 
                      className="bg-white/80 text-primary font-medium shadow-sm backdrop-blur-sm hover:bg-white/90"
                    >
                      {primaryIndustry}
                    </Badge>
                  </div>
                  
                  {/* Semi-transparent title banner at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-4 transition-all duration-300 group-hover:bg-black/70">
                    <h3 className="text-white font-medium line-clamp-2">{article.title}</h3>
                    <p className="text-white/80 text-sm mt-1">{article.source} • {article.formattedDate}</p>
                  </div>
                  
                  {/* Clickable overlay for the entire card */}
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="absolute inset-0 z-20 cursor-pointer" 
                    aria-label={`Read article: ${article.title}`}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="flex justify-center mt-4 space-x-1">
        {[...Array(Math.min(numDots, newsArticles.length))].map((_, idx) => (
          <button
            key={idx}
            onClick={() => instanceRef.current?.moveToIdx(idx)}
            className={`w-2 h-2 rounded-full transition-colors duration-200 border-none focus:outline-none ${currentSlide === idx ? "bg-primary" : "bg-neutral-300"}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default MarketNews;
 
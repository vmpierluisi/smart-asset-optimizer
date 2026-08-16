import { useState, useEffect, useCallback } from "react";
import { getProcessedBreakingNews, ProcessedNewsArticle, getAverageMarketSentiment, convertSentimentToDisplayScale } from "@/utils/newsUtils";
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
  DollarSign, 
  Flame, 
  Info, 
  RefreshCw, 
  Sparkles, 
  TrendingDown, 
  TrendingUp 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import GaugeChart from "@/components/GaugeChart";
import { Separator } from "@/components/ui/separator";
import MarketNewsCarousel from "@/components/MarketNewsCarousel";

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

  // Initialize news data once on mount. loadHeadlines is intentionally omitted:
  // it depends on the cache it also sets, so including it causes a fetch loop.
  useEffect(() => {
    loadHeadlines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
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
        <MarketNewsCarousel />
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

export default MarketNews;
 
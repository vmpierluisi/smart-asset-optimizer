import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowDown, 
  ArrowUp, 
  BarChart2, 
  Briefcase,
  ChevronDown,
  ChevronLeft,
  Cpu, 
  DollarSign, 
  LineChart, 
  PieChart,
  Search, 
  Star,
  TrendingDown, 
  TrendingUp,
  Building,
  Building2,
  Factory,
  Heart,
  Home,
  Lightbulb,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Truck,
  Wallet
} from "lucide-react";
import { AIExplanationPopup } from "@/components/AIExplanationPopup";
import { 
  searchStocks, 
  StockSuggestion, 
  fetchStockQuote, 
  StockQuote, 
  fetchStockPriceChanges, 
  StockPriceChanges, 
  fetchValuationRatios, 
  ValuationData,
  FinancialHealthData,
  fetchFinancialHealth,
  TechnicalIndicatorData,
  fetchTechnicalIndicators,
  NewsSentimentData,
  fetchNewsSentiment,
  RiskAnalysisData,
  fetchRiskAnalysis
} from "@/utils/fmpFinanceUtils";
import { PriceChart } from "@/components/PriceChart";
import { useStockPrices } from "@/hooks/useStockPrices";
import { toast } from "@/hooks/use-toast";

// Define CSS keyframes for animations
const fadeGrowKeyframes = `
  @keyframes fadeGrow {
    0% {
      opacity: 0;
      transform: scale(0.7);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

// Move SkeletonLoader definition here
const SkeletonLoader = ({ className = '', count = 1 }: { className?: string, count?: number }) => {
  return (
    <>
      {Array(count).fill(0).map((_, index) => (
        <div key={index} className={`animate-pulse bg-muted rounded ${className}`}></div>
      ))}
    </>
  );
};

// Mock chart component - would be replaced with actual chart library
const MockChart = ({ type, height = 200 }: { type: string, height?: number }) => {
  return (
    <div 
      className="w-full rounded-md border border-dashed flex items-center justify-center"
      style={{ height: `${height}px` }}
    >
      <div className="text-muted-foreground flex flex-col items-center">
        <LineChart className="h-8 w-8 mb-2" />
        <span>{type} Chart</span>
      </div>
    </div>
  );
};

// Mock gauge component
const GaugeChart = ({ value, min = 0, max = 100, label }: { value: number, min?: number, max?: number, label: string }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16 overflow-hidden">
        <div className="absolute w-32 h-32 rounded-full border-8 border-muted bottom-0"></div>
        <div 
          className="absolute w-32 h-32 rounded-full border-8 border-primary bottom-0"
          style={{ 
            clipPath: `polygon(50% 50%, 0 50%, ${percentage < 50 ? percentage * 2 : 100}% 50%)` 
          }}
        ></div>
        <div 
          className="absolute w-32 h-32 rounded-full border-8 border-primary bottom-0"
          style={{ 
            clipPath: percentage > 50 
              ? `polygon(50% 50%, 100% 50%, 100% ${100 - (percentage - 50) * 2}%, 50% 50%)` 
              : 'none'
          }}
        ></div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-black"></div>
      </div>
      <div className="mt-2 text-center">
        <div className="text-xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );
};

// Define market sectors based on GICS
const marketSectors = [
  { 
    id: "energy", 
    name: "Energy", 
    icon: <Lightbulb size={40} strokeWidth={1.5} />,
    stocks: [
      { symbol: "XOM", name: "Exxon Mobil Corp." },
      { symbol: "CVX", name: "Chevron Corp." },
      { symbol: "COP", name: "ConocoPhillips" },
      { symbol: "SLB", name: "Schlumberger Ltd." },
      { symbol: "EOG", name: "EOG Resources Inc." },
    ]
  },
  { 
    id: "materials", 
    name: "Materials", 
    icon: <Truck size={40} strokeWidth={1.5} />,
    stocks: [
      { symbol: "LIN", name: "Linde plc" },
      { symbol: "APD", name: "Air Products & Chemicals" },
      { symbol: "FCX", name: "Freeport-McMoRan Inc." },
      { symbol: "NEM", name: "Newmont Corp." },
      { symbol: "DOW", name: "Dow Inc." },
    ]
  },
  { 
    id: "industrials", 
    name: "Industrials", 
    icon: <Factory size={40} strokeWidth={1.5} />,
    stocks: [
      { symbol: "HON", name: "Honeywell International" },
      { symbol: "UPS", name: "United Parcel Service" },
      { symbol: "UNP", name: "Union Pacific Corp." },
      { symbol: "RTX", name: "Raytheon Technologies" },
      { symbol: "CAT", name: "Caterpillar Inc." },
    ]
  },
  { 
    id: "utilities", 
    name: "Utilities", 
    icon: <Building2 size={40} strokeWidth={1.5} />,
    stocks: [
      { symbol: "NEE", name: "NextEra Energy Inc." },
      { symbol: "DUK", name: "Duke Energy Corp." },
      { symbol: "SO", name: "Southern Company" },
      { symbol: "D", name: "Dominion Energy" },
      { symbol: "AEP", name: "American Electric Power" },
    ]
  },
  { 
    id: "healthcare", 
    name: "Healthcare", 
    icon: <Heart size={40} strokeWidth={1.5} />,
    stocks: [
      { symbol: "JNJ", name: "Johnson & Johnson" },
      { symbol: "UNH", name: "UnitedHealth Group" },
      { symbol: "PFE", name: "Pfizer Inc." },
      { symbol: "MRK", name: "Merck & Co." },
      { symbol: "ABT", name: "Abbott Laboratories" },
    ]
  },
  { 
    id: "financials", 
    name: "Financials", 
    icon: <Wallet size={40} strokeWidth={1.5} />,
    stocks: [
      { symbol: "JPM", name: "JPMorgan Chase & Co." },
      { symbol: "BAC", name: "Bank of America Corp." },
      { symbol: "WFC", name: "Wells Fargo & Co." },
      { symbol: "MS", name: "Morgan Stanley" },
      { symbol: "GS", name: "Goldman Sachs Group" },
    ]
  },
  { 
    id: "discretionary", 
    name: "Consumer Discretionary", 
    icon: <ShoppingBag size={40} strokeWidth={1.5} />,
    stocks: [
      { symbol: "AMZN", name: "Amazon.com Inc." },
      { symbol: "TSLA", name: "Tesla Inc." },
      { symbol: "HD", name: "Home Depot Inc." },
      { symbol: "MCD", name: "McDonald's Corp." },
      { symbol: "NKE", name: "Nike Inc." },
    ]
  },
  { 
    id: "staples", 
    name: "Consumer Staples", 
    icon: <ShoppingCart size={40} strokeWidth={1.5} />,
    stocks: [
      { symbol: "PG", name: "Procter & Gamble Co." },
      { symbol: "KO", name: "Coca-Cola Co." },
      { symbol: "PEP", name: "PepsiCo Inc." },
      { symbol: "WMT", name: "Walmart Inc." },
      { symbol: "COST", name: "Costco Wholesale" },
    ]
  },
  { 
    id: "technology", 
    name: "Information Technology", 
    icon: <Cpu size={40} strokeWidth={1.5} />,
    stocks: [
      { symbol: "AAPL", name: "Apple Inc." },
      { symbol: "MSFT", name: "Microsoft Corp." },
      { symbol: "NVDA", name: "NVIDIA Corp." },
      { symbol: "AVGO", name: "Broadcom Inc." },
      { symbol: "ADBE", name: "Adobe Inc." },
    ]
  },
  { 
    id: "communications", 
    name: "Communication Services", 
    icon: <Smartphone size={40} strokeWidth={1.5} />,
    stocks: [
      { symbol: "GOOGL", name: "Alphabet Inc. Class A" },
      { symbol: "META", name: "Meta Platforms Inc." },
      { symbol: "NFLX", name: "Netflix Inc." },
      { symbol: "DIS", name: "Walt Disney Co." },
      { symbol: "CMCSA", name: "Comcast Corp." },
    ]
  },
  { 
    id: "realestate", 
    name: "Real Estate", 
    icon: <Home size={40} strokeWidth={1.5} />,
    stocks: [
      { symbol: "AMT", name: "American Tower Corp." },
      { symbol: "PLD", name: "Prologis Inc." },
      { symbol: "CCI", name: "Crown Castle Inc." },
      { symbol: "EQIX", name: "Equinix Inc." },
      { symbol: "PSA", name: "Public Storage" },
    ]
  },
];

// First part of the component declaration - we'll complete it in subsequent edits
const StockAnalysis = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState("1Y");
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stockData, setStockData] = useState<StockQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [priceChanges, setPriceChanges] = useState<StockPriceChanges | null>(null);
  const [isLoadingPriceChanges, setIsLoadingPriceChanges] = useState(false);
  const [valuationData, setValuationData] = useState<ValuationData | null>(null);
  const [isLoadingValuation, setIsLoadingValuation] = useState(false);
  const [financialHealthData, setFinancialHealthData] = useState<FinancialHealthData | null>(null);
  const [isLoadingFinancialHealth, setIsLoadingFinancialHealth] = useState(false);
  const [technicalData, setTechnicalData] = useState<TechnicalIndicatorData | null>(null);
  const [isLoadingTechnical, setIsLoadingTechnical] = useState(false);
  const [newsData, setNewsData] = useState<NewsSentimentData | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [riskData, setRiskData] = useState<RiskAnalysisData | null>(null);
  const [isLoadingRisk, setIsLoadingRisk] = useState(false);
  const [showAIExplanation, setShowAIExplanation] = useState<{
    isOpen: boolean;
    title: string;
    cardContext: any;
    section: string;
  }>({
    isOpen: false,
    title: "",
    cardContext: {},
    section: ""
  });

  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const [visibleView, setVisibleView] = useState<'sectors' | 'stocks' | 'transition'>('sectors');

  // Get historical price data using our custom hook
  const { data: priceData, loading: priceLoading, error: priceError } = useStockPrices(selectedStock, timeframe);

  // Fetch stock suggestions when search query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      const stockSuggestions = await searchStocks(searchQuery.trim());
      setSuggestions(stockSuggestions);
      setIsLoading(false);
    };

    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        fetchSuggestions();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Fetch stock quote data when selected stock changes
  useEffect(() => {
    const getStockQuote = async () => {
      if (!selectedStock) return;
      
      setIsLoadingQuote(true);
      try {
        const quote = await fetchStockQuote(selectedStock);
        setStockData(quote);
      } catch (error) {
        console.error('Error fetching stock quote:', error);
        toast({
          title: "Error",
          description: `Failed to fetch quote for ${selectedStock}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      } finally {
        setIsLoadingQuote(false);
      }
    };
    
    getStockQuote();
  }, [selectedStock]);

  // Fetch stock price changes when selected stock changes
  useEffect(() => {
    const getStockPriceChanges = async () => {
      if (!selectedStock) return;
      
      setIsLoadingPriceChanges(true);
      try {
        const changes = await fetchStockPriceChanges(selectedStock);
        setPriceChanges(changes);
      } catch (error) {
        console.error('Error fetching stock price changes:', error);
        toast({
          title: "Error",
          description: `Failed to fetch price changes for ${selectedStock}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      } finally {
        setIsLoadingPriceChanges(false);
      }
    };
    
    getStockPriceChanges();
  }, [selectedStock]);

  // Fetch valuation ratios when selected stock changes
  useEffect(() => {
    const getValuationRatios = async () => {
      if (!selectedStock) return;
      
      setIsLoadingValuation(true);
      try {
        const ratios = await fetchValuationRatios(selectedStock);
        setValuationData(ratios);
      } catch (error) {
        console.error('Error fetching valuation ratios:', error);
        toast({
          title: "Error",
          description: `Failed to fetch valuation ratios for ${selectedStock}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      } finally {
        setIsLoadingValuation(false);
      }
    };
    
    getValuationRatios();
  }, [selectedStock]);

  // Fetch Financial Health data
  useEffect(() => {
    const getFinancialHealth = async () => {
      if (!selectedStock) return;
      
      setIsLoadingFinancialHealth(true);
      try {
        const data = await fetchFinancialHealth(selectedStock);
        setFinancialHealthData(data);
      } catch (error) {
        console.error('Error fetching financial health data:', error);
        toast({
          title: "Error",
          description: `Failed to fetch financial health for ${selectedStock}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
        setFinancialHealthData(null); // Clear data on error
      } finally {
        setIsLoadingFinancialHealth(false);
      }
    };
    
    getFinancialHealth();
  }, [selectedStock]);

  // Fetch Technical Indicator data
  useEffect(() => {
    const getTechnicalIndicators = async () => {
      if (!selectedStock) return;
      
      setIsLoadingTechnical(true);
      try {
        const data = await fetchTechnicalIndicators(selectedStock);
        setTechnicalData(data);
      } catch (error) {
        console.error('Error fetching technical indicators:', error);
        toast({
          title: "Error",
          description: `Failed to fetch technical indicators for ${selectedStock}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
        setTechnicalData(null);
      } finally {
        setIsLoadingTechnical(false);
      }
    };
    
    getTechnicalIndicators();
  }, [selectedStock]);

  // Fetch News and Sentiment data
  useEffect(() => {
    const getNewsSentiment = async () => {
      if (!selectedStock) return;
      
      setIsLoadingNews(true);
      try {
        const data = await fetchNewsSentiment(selectedStock);
        setNewsData(data);
      } catch (error) {
        console.error('Error fetching news & sentiment:', error);
        toast({
          title: "Error",
          description: `Failed to fetch news & sentiment for ${selectedStock}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
        setNewsData(null);
      } finally {
        setIsLoadingNews(false);
      }
    };
    
    getNewsSentiment();
  }, [selectedStock]);

  // Fetch Risk Analysis data
  useEffect(() => {
    const getRiskAnalysis = async () => {
      if (!selectedStock) return;
      
      setIsLoadingRisk(true);
      try {
        const data = await fetchRiskAnalysis(selectedStock);
        setRiskData(data);
      } catch (error) {
        console.error('Error fetching risk analysis:', error);
        toast({
          title: "Error",
          description: `Failed to fetch risk analysis for ${selectedStock}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
        setRiskData(null);
      } finally {
        setIsLoadingRisk(false);
      }
    };
    
    getRiskAnalysis();
  }, [selectedStock]);

  // Handle selection of a stock suggestion from search or sector list
  const handleSelectStock = (symbol: string, name: string) => {
    setSelectedStock(symbol);
    setSearchQuery("");
    setSuggestions([]);
    toast({
      title: "Stock Selected",
      description: `${name} (${symbol}) selected for analysis.`,
    });
  };

  // Handle selection from search suggestions list
  const handleSelectSuggestion = (suggestion: StockSuggestion) => {
    handleSelectStock(suggestion.symbol, suggestion.name);
  };

  // Handle sector selection with animation
  const handleSelectSector = (sectorId: string) => {
    setIsAnimating(true);
    
    // Slide out sectors
    setVisibleView('transition');
    
    // After sectors slide out, switch to stocks view
    setTimeout(() => {
      setSelectedSector(sectorId);
      setVisibleView('stocks');
      
      // End animation after stocks have appeared
      setTimeout(() => {
        setIsAnimating(false);
      }, 500);
    }, 300);
  };

  // Handle back to sectors with animation
  const handleBackToSectors = () => {
    setIsAnimating(true);
    
    // Fade out stocks
    setVisibleView('transition');
    
    // After stocks fade out, switch to sectors view
    setTimeout(() => {
      setVisibleView('sectors');
      
      // Only reset the selected sector after animation completes
      setTimeout(() => {
        setSelectedSector(null);
        setIsAnimating(false);
      }, 300);
    }, 300);
  };

  // Handle search input key press (Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      
      // First check if there's an exact match in suggestions
      const exactMatch = suggestions.find(
        s => s.symbol.toUpperCase() === searchQuery.trim().toUpperCase()
      );
      
      if (exactMatch) {
        handleSelectSuggestion(exactMatch);
      } else if (suggestions.length > 0) {
        // If no exact match but we have suggestions, use the first one
        handleSelectSuggestion(suggestions[0]);
      } else {
        // Try to use the input as a stock symbol directly, assuming name is same as symbol for toast
        handleSelectStock(searchQuery.trim().toUpperCase(), searchQuery.trim().toUpperCase());
      }
    }
  };

  // Week range formatting
  const formatWeekRange = () => {
    if (!stockData) return "N/A";
    return `$${stockData.low52Week.toFixed(2)} - $${stockData.high52Week.toFixed(2)}`;
  };

  // AI explanation content for different sections
  const aiExplanations = {
    overview: {
      title: "Stock Overview",
      content: "This section provides a summary of the stock's current performance and key metrics. The price chart shows historical price movements, and you can adjust the timeframe using the buttons above the chart. Key metrics like market cap, P/E ratio, and dividend yield help you understand the stock's basic characteristics."
    },
    performance: {
      title: "Performance Analysis",
      content: "This section shows how the stock has performed over different time periods. The returns are shown for various timeframes from 1 day to 5 years. Volatility measures price fluctuations, while the Sharpe ratio indicates risk-adjusted returns (higher is better). Beta shows the stock's sensitivity to market movements (above 1 means more volatile than the market)."
    },
    financial: {
      title: "Financial Health",
      content: "This dashboard evaluates the company's financial stability and profitability. Debt-to-equity ratio measures financial leverage (lower is generally safer). Current and quick ratios assess short-term liquidity. Return metrics (ROE, ROA) show how efficiently the company generates profits. Margin percentages indicate profitability at different operational levels."
    },
    valuation: {
      title: "Valuation Analysis",
      content: "This section helps determine if the stock is fairly priced. P/E ratio compares price to earnings (lower might indicate better value). PEG ratio factors in growth expectations. Price-to-book and price-to-sales compare price to fundamental metrics. The fair value range provides an estimated valuation range based on various models."
    },
    technical: {
      title: "Technical Indicators",
      content: "Technical analysis uses price and volume data to forecast future price movements. Moving averages show trend direction over different periods. RSI (Relative Strength Index) indicates overbought or oversold conditions. MACD signals potential trend changes. Bollinger Bands show volatility and potential price targets. Support and resistance levels are price points where the stock historically reverses direction."
    },
    news: {
      title: "News & Sentiment",
      content: "This section aggregates recent news and market sentiment about the stock. News articles are analyzed for positive or negative sentiment. Analyst ratings show professional opinions (buy/hold/sell). The sentiment score combines news sentiment, social media mentions, and analyst outlook into a single metric from 0-100."
    },
    risk: {
      title: "Risk Analysis",
      content: "This section evaluates the stock's risk profile. Beta measures volatility relative to the market. Maximum drawdown shows the largest historical price drop. Value at Risk (VaR) estimates the potential loss in a bad day. Standard deviation measures overall price volatility. Correlation shows how the stock moves in relation to the broader market."
    }
  };

  const handleAIExplanationOpen = (title: string, section: string, cardData: any) => {
    setShowAIExplanation({
      isOpen: true,
      title,
      cardContext: cardData,
      section
    });
  };

  const handleAIExplanationClose = () => {
    setShowAIExplanation({
      ...showAIExplanation,
      isOpen: false
    });
  };

  // Replace the mock valuation data with the real one or fallback to default values
  const getValuationDataOrDefault = (): ValuationData & { eps: string } => {
    if (isLoadingValuation) {
      return {
        peRatio: "Loading...",
        forwardPE: "Loading...",
        pegRatio: "Loading...",
        priceToBook: "Loading...",
        priceToSales: "Loading...",
        evToEbitda: "Loading...",
        dividendYield: "Loading...",
        dividendGrowth5Y: "Loading...",
        fairValueLow: 0,
        fairValueHigh: 0,
        eps: "Loading..."
      };
    }
    
    return valuationData as (ValuationData & { eps: string }) || {
      peRatio: "N/A",
      forwardPE: "N/A",
      pegRatio: "N/A",
      priceToBook: "N/A",
      priceToSales: "N/A",
      evToEbitda: "N/A",
      dividendYield: "0.00",
      dividendGrowth5Y: "0.00",
      fairValueLow: 0,
      fairValueHigh: 0,
      eps: "N/A"
    };
  };

  // Beginning of the return statement
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Add CSS keyframes */}
      <style dangerouslySetInnerHTML={{ __html: fadeGrowKeyframes }} />
      
      {/* Stock Search Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Stock Analysis</CardTitle>
          <CardDescription>Search or select a stock to analyze</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by ticker or company name..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {isLoading && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              )}
              {suggestions.length > 0 && searchQuery.trim() && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2">
                    {suggestions.map((suggestion) => (
                      <div 
                        key={suggestion.symbol}
                        className="flex items-center space-x-2 rounded-md p-2 hover:bg-muted cursor-pointer"
                        onClick={() => handleSelectSuggestion(suggestion)}
                      >
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold">{suggestion.symbol.substring(0, 4)}</span>
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-medium truncate">{suggestion.name}</div>
                          <div className="text-sm text-muted-foreground truncate">{suggestion.exchange}: {suggestion.symbol}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Button variant="outline">
              Recent
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
            <Button variant="outline">
              Watchlist
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conditional Rendering: Show Sectors, Sector Stocks, or Analysis */}
      {!selectedStock ? (
        // Animation Container for Sectors/Stocks
        <div className="relative min-h-[400px] pb-12">
          {/* Sectors Grid with Animation */}
          <div 
            className={`
              absolute w-full transition-all duration-300 ease-in-out
              ${visibleView === 'sectors' 
                ? 'opacity-100 translate-x-0' 
                : visibleView === 'transition' 
                  ? 'opacity-0 -translate-x-20' 
                  : 'opacity-0 -translate-x-full pointer-events-none'}
            `}
          >
            <div className="mb-4">
              <h2 className="text-2xl font-semibold">Market Sectors</h2>
              <p className="text-sm text-muted-foreground">Select a sector to explore stocks</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-4xl mx-auto pb-8">
              {marketSectors.map((sector) => (
                <div 
                  key={sector.id} 
                  className="bg-amber-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-amber-400 transition-colors text-black aspect-square transform hover:scale-105 transition-transform duration-200"
                  onClick={() => !isAnimating && handleSelectSector(sector.id)}
                >
                  <div className="mb-3">
                    {sector.icon}
                  </div>
                  <span className="font-medium text-center">{sector.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Stocks in Selected Sector with Animation */}
          <div 
            className={`
              absolute w-full transition-all duration-300 ease-in-out
              ${visibleView === 'stocks' 
                ? 'opacity-100 translate-x-0' 
                : visibleView === 'transition' 
                  ? 'opacity-0 translate-x-20' 
                  : 'opacity-0 translate-x-full pointer-events-none'}
            `}
          >
            <div className="mb-4 flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="mr-2"
                onClick={() => !isAnimating && handleBackToSectors()}
                disabled={isAnimating}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <h2 className="text-2xl font-semibold">
                {marketSectors.find(s => s.id === selectedSector)?.name} Stocks
              </h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-4xl mx-auto pb-8">
              {selectedSector && marketSectors
                .find(s => s.id === selectedSector)
                ?.stocks.map((stock, index) => (
                  <Card 
                    key={stock.symbol} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleSelectStock(stock.symbol, stock.name)}
                    style={{
                      opacity: 0,
                      transform: 'scale(0.7)',
                      animation: visibleView === 'stocks' ? `fadeGrow 0.5s forwards` : 'none',
                      animationDelay: `${index * 100}ms`,
                      animationFillMode: 'forwards'
                    }}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <span className="text-lg font-semibold">{stock.symbol.charAt(0)}</span>
                      </div>
                      <span className="font-semibold">{stock.symbol}</span>
                      <span className="text-sm text-muted-foreground truncate w-full">{stock.name}</span>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      ) : (
        // Analysis Sections (Rendered only when a stock is selected)
        <>
          {/* Stock Overview Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mr-3">
                    <span className="text-sm font-semibold">{selectedStock}</span>
                  </div>
                  <div>
                    <CardTitle className="text-xl flex items-center">
                      {isLoadingQuote ? (
                        <div className="h-6 w-32 animate-pulse bg-muted rounded"></div>
                      ) : (
                        <>
                          {stockData?.name || "Loading..."} ({selectedStock})
                        </>
                      )}
                    </CardTitle>
                    <div className="flex items-center mt-1">
                      {isLoadingQuote ? (
                        <div className="h-8 w-24 animate-pulse bg-muted rounded"></div>
                      ) : (
                        <>
                          <span className="text-2xl font-bold mr-2">
                            ${stockData?.price.toFixed(2) || "0.00"}
                          </span>
                          <span className={`flex items-center ${(stockData?.change || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(stockData?.change || 0) > 0 ? (
                              <ArrowUp className="h-4 w-4 mr-1" />
                            ) : (
                              <ArrowDown className="h-4 w-4 mr-1" />
                            )}
                            ${Math.abs(stockData?.change || 0).toFixed(2)} ({Math.abs(stockData?.changePercent || 0).toFixed(2)}%)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon">
                  <Star className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleAIExplanationOpen(
                    aiExplanations.overview.title,
                    "overview",
                    {
                      ticker: selectedStock,
                      companyName: stockData?.name,
                      price: stockData?.price,
                      change: stockData?.change,
                      changePercent: stockData?.changePercent,
                      marketCap: stockData?.marketCap,
                      peRatio: getValuationDataOrDefault().peRatio,
                      dividendYield: getValuationDataOrDefault().dividendYield,
                      weekRange: formatWeekRange(),
                      volume: stockData?.volume,
                      avgVolume: stockData?.avgVolume,
                      timeframe,
                      chartData: priceData
                    }
                  )}
                >
                  <Cpu className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Chart timeframe selector */}
                <div className="flex space-x-2">
                  {["1D", "1W", "1M", "3M", "6M", "YTD", "1Y", "5Y"].map((period) => (
                    <Button 
                      key={period}
                      variant={timeframe === period ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeframe(period)}
                    >
                      {period}
                    </Button>
                  ))}
                </div>
                
                {/* Price chart - using the real data */}
                <PriceChart 
                  data={priceData} 
                  height={250} 
                  loading={priceLoading} 
                  timeframe={timeframe}
                />
                {priceError && (
                  <div className="text-red-500 text-sm">{priceError}</div>
                )}
                
                {/* Key metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Market Cap</div>
                    <div className="font-medium">${stockData?.marketCap || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">P/E Ratio</div>
                    <div className="font-medium">{isLoadingValuation ? <SkeletonLoader className="h-5 w-16" /> : getValuationDataOrDefault().peRatio}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Dividend Yield</div>
                    <div className="font-medium">{isLoadingValuation ? <SkeletonLoader className="h-5 w-16" /> : `${getValuationDataOrDefault().dividendYield}%`}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">52-Week Range</div>
                    <div className="font-medium">{formatWeekRange()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Volume</div>
                    <div className="font-medium">{stockData?.volume || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Avg. Volume</div>
                    <div className="font-medium">{stockData?.avgVolume || "N/A"}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Analysis Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl">Performance Analysis</CardTitle>
                <CardDescription>Historical returns and performance metrics</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleAIExplanationOpen(
                  aiExplanations.performance.title,
                  "performance",
                  {
                    ticker: selectedStock,
                    returns: priceChanges?.returns || [],
                    volatility: priceChanges?.volatility,
                    sharpeRatio: priceChanges?.sharpeRatio,
                    beta: priceChanges?.beta,
                    alpha: priceChanges?.alpha
                  }
                )}
              >
                <Cpu className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Historical Returns</h4>
                  <div className="space-y-2">
                    {isLoadingPriceChanges ? (
                      // Loading skeleton for price changes
                      Array(9).fill(0).map((_, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="w-6 h-4 bg-muted animate-pulse rounded"></div>
                          <div className="flex items-center">
                            <div className="w-32 h-2 bg-muted animate-pulse rounded-full mr-3"></div>
                            <div className="w-16 h-4 bg-muted animate-pulse rounded"></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      priceChanges?.returns?.map((item) => (
                        <div key={item.period} className="flex items-center justify-between">
                          <span className="text-sm w-10">{item.period}</span>
                          <div className="flex items-center flex-1">
                            <div className="w-full h-2 bg-muted rounded-full mr-3 relative">
                              <div className="absolute top-0 left-1/2 w-px h-full bg-gray-300"></div>
                              <div 
                                className={`absolute top-0 h-full ${item.direction === 'up' ? 'bg-green-500 left-1/2' : 'bg-red-500 right-1/2'}`}
                                style={{ 
                                  width: `${Math.min(Math.abs(item.value) * 0.5, 50)}%`
                                }}
                              ></div>
                            </div>
                            <span 
                              className={`text-sm font-medium ${
                                item.direction === 'up' ? 'text-green-600' : 'text-red-600'
                              } w-20 text-right`}
                            >
                              {item.direction === 'up' ? '+' : '-'}{Math.abs(item.value).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Performance Metrics</h4>
                  <MockChart type="Performance vs Benchmark" height={150} />
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Volatility (Annual)</div>
                      <div className="font-medium">{priceChanges?.volatility ? priceChanges.volatility.toFixed(2) : "N/A"}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                      <div className="font-medium">{priceChanges?.sharpeRatio ? priceChanges.sharpeRatio.toFixed(2) : "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Beta</div>
                      <div className="font-medium">{priceChanges?.beta ? priceChanges.beta.toFixed(2) : "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Alpha</div>
                      <div className="font-medium">{priceChanges?.alpha ? priceChanges.alpha.toFixed(2) : "N/A"}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Health Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl">Financial Health</CardTitle>
                <CardDescription>Key financial metrics and ratios</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleAIExplanationOpen(
                  aiExplanations.financial.title,
                  "financial",
                  {
                    ticker: selectedStock,
                    healthScore: financialHealthData?.healthScore,
                    debtToEquity: financialHealthData?.debtToEquity,
                    currentRatio: financialHealthData?.currentRatio,
                    quickRatio: financialHealthData?.quickRatio,
                    returnOnEquity: financialHealthData?.returnOnEquity,
                    returnOnAssets: financialHealthData?.returnOnAssets,
                    netMargin: financialHealthData?.netMargin
                  }
                )}
              >
                <Cpu className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-40 h-40">
                    {isLoadingFinancialHealth ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    ) : (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-3xl font-bold">{financialHealthData?.healthScore ?? 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">Health Score</div>
                          </div>
                        </div>
                        {/* Replace MockChart if you have a real radar chart component */}
                        <MockChart type="Financial Health Radar" height={160} />
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Balance Sheet Metrics</h4>
                  <div className="space-y-3">
                    {isLoadingFinancialHealth ? (
                      <>
                        <SkeletonLoader className="h-6" count={3} />
                      </>
                    ) : (
                      <>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Debt-to-Equity</span>
                            <span className="text-sm font-medium">{financialHealthData?.debtToEquity?.toFixed(2) ?? 'N/A'}</span>
                          </div>
                          <Progress value={(financialHealthData?.debtToEquity ?? 0) * 25} className="h-2" /> 
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Current Ratio</span>
                            <span className="text-sm font-medium">{financialHealthData?.currentRatio?.toFixed(2) ?? 'N/A'}</span>
                          </div>
                          <Progress value={(financialHealthData?.currentRatio ?? 0) * 33} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Quick Ratio</span>
                            <span className="text-sm font-medium">{financialHealthData?.quickRatio?.toFixed(2) ?? 'N/A'}</span>
                          </div>
                          <Progress value={(financialHealthData?.quickRatio ?? 0) * 33} className="h-2" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Profitability Metrics</h4>
                  <div className="space-y-3">
                    {isLoadingFinancialHealth ? (
                      <>
                        <SkeletonLoader className="h-6" count={3} />
                      </>
                    ) : (
                      <>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Return on Equity</span>
                          <span className="text-sm font-medium">{financialHealthData?.returnOnEquity ? financialHealthData.returnOnEquity.toFixed(2) + '%' : 'N/A'}</span>
                        </div>
                        <Progress value={financialHealthData?.returnOnEquity ?? 0} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Return on Assets</span>
                          <span className="text-sm font-medium">{financialHealthData?.returnOnAssets ? financialHealthData.returnOnAssets.toFixed(2) + '%' : 'N/A'}</span>
                        </div>
                        <Progress value={(financialHealthData?.returnOnAssets ?? 0) * 2} className="h-2" /> 
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Net Margin</span>
                          <span className="text-sm font-medium">{financialHealthData?.netMargin ? financialHealthData.netMargin.toFixed(2) + '%' : 'N/A'}</span>
                        </div>
                        <Progress value={(financialHealthData?.netMargin ?? 0) * 2} className="h-2" />
                      </div>
                    </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valuation Analysis Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl">Valuation Analysis</CardTitle>
                <CardDescription>Valuation metrics and fair value estimate</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleAIExplanationOpen(
                  aiExplanations.valuation.title,
                  "valuation",
                  {
                    ticker: selectedStock,
                    currentPrice: stockData?.price,
                    peRatio: getValuationDataOrDefault().peRatio,
                    forwardPE: getValuationDataOrDefault().forwardPE,
                    pegRatio: getValuationDataOrDefault().pegRatio,
                    priceToBook: getValuationDataOrDefault().priceToBook,
                    priceToSales: getValuationDataOrDefault().priceToSales,
                    evToEbitda: getValuationDataOrDefault().evToEbitda,
                    dividendYield: getValuationDataOrDefault().dividendYield,
                    dividendGrowth5Y: getValuationDataOrDefault().dividendGrowth5Y,
                    fairValueLow: getValuationDataOrDefault().fairValueLow,
                    fairValueHigh: getValuationDataOrDefault().fairValueHigh,
                    eps: getValuationDataOrDefault().eps
                  }
                )}
              >
                <Cpu className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Valuation Ratios</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">P/E Ratio</div>
                        <div className="font-medium">{isLoadingValuation ? <SkeletonLoader className="h-5 w-16" /> : getValuationDataOrDefault().peRatio}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Earnings Per Share</div>
                        <div className="font-medium">{isLoadingValuation ? <SkeletonLoader className="h-5 w-16" /> : `$${getValuationDataOrDefault().eps}`}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">PEG Ratio</div>
                        <div className="font-medium">{isLoadingValuation ? <SkeletonLoader className="h-5 w-16" /> : getValuationDataOrDefault().pegRatio}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Price/Book</div>
                        <div className="font-medium">{isLoadingValuation ? <SkeletonLoader className="h-5 w-16" /> : getValuationDataOrDefault().priceToBook}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Price/Sales</div>
                        <div className="font-medium">{isLoadingValuation ? <SkeletonLoader className="h-5 w-16" /> : getValuationDataOrDefault().priceToSales}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">EV/EBITDA</div>
                        <div className="font-medium">{isLoadingValuation ? <SkeletonLoader className="h-5 w-16" /> : getValuationDataOrDefault().evToEbitda}</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium mb-2">Dividend Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Dividend Yield</div>
                           <div className="font-medium">{isLoadingValuation ? <SkeletonLoader className="h-5 w-16" /> : `${getValuationDataOrDefault().dividendYield}%`}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">5Y Dividend Growth</div>
                           <div className="font-medium">{isLoadingValuation ? <SkeletonLoader className="h-5 w-16" /> : `${getValuationDataOrDefault().dividendGrowth5Y}%`}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Valuation Comparison</h4>
                  <MockChart type="Valuation Comparison" height={150} />
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Fair Value Estimate</h4>
                    <div className="relative pt-5">
                      <div className="h-2 bg-muted rounded-full w-full"></div>
                      {stockData?.price && getValuationDataOrDefault().fairValueHigh > 0 && getValuationDataOrDefault().fairValueLow > 0 && (
                        <div 
                          className="absolute bottom-0 h-6 w-1 bg-black"
                          style={{ 
                            left: `${Math.min(Math.max(((stockData.price - getValuationDataOrDefault().fairValueLow) / 
                              (getValuationDataOrDefault().fairValueHigh - getValuationDataOrDefault().fairValueLow)) * 100, 0), 100)}%` 
                          }}
                        ></div>
                      )}
                      <div 
                        className="absolute -top-1 text-xs"
                        style={{ left: '0%' }}
                      >
                        ${getValuationDataOrDefault().fairValueLow > 0 ? getValuationDataOrDefault().fairValueLow.toFixed(2) : "N/A"}
                      </div>
                      <div 
                        className="absolute -top-1 text-xs text-right"
                        style={{ right: '0%' }}
                      >
                        ${getValuationDataOrDefault().fairValueHigh > 0 ? getValuationDataOrDefault().fairValueHigh.toFixed(2) : "N/A"}
                      </div>
                      {stockData?.price && (
                        <div 
                          className="absolute -bottom-6 text-xs font-medium"
                          style={{ 
                            left: getValuationDataOrDefault().fairValueHigh > 0 && getValuationDataOrDefault().fairValueLow > 0 ? 
                              `${Math.min(Math.max(((stockData.price - getValuationDataOrDefault().fairValueLow) / 
                                (getValuationDataOrDefault().fairValueHigh - getValuationDataOrDefault().fairValueLow)) * 100, 0), 100)}%` : 
                              '50%',
                            transform: 'translateX(-50%)' 
                          }}
                        >
                          Current: ${stockData?.price.toFixed(2) || "0.00"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Analysis Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl">Technical Indicators</CardTitle>
                <CardDescription>Technical analysis and trading signals</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleAIExplanationOpen(
                  aiExplanations.technical.title,
                  "technical",
                  {
                    ticker: selectedStock,
                    currentPrice: stockData?.price,
                    ma50: technicalData?.ma50,
                    ma200: technicalData?.ma200,
                    support: technicalData?.support,
                    resistance: technicalData?.resistance,
                    rsi: technicalData?.rsi,
                    macdSignal: technicalData?.macdSignal,
                    bollingerPosition: technicalData?.bollingerPosition,
                    signalSummary: technicalData?.signalSummary
                  }
                )}
              >
                <Cpu className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Moving Averages</h4>
                  <MockChart type="Moving Averages" height={150} />
                  
                  <div className="mt-4 space-y-2">
                    {isLoadingTechnical ? (
                      <SkeletonLoader className="h-4" count={4} />
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm">50-Day MA</span>
                          <span className={`text-sm font-medium ${(stockData?.price ?? 0) > (technicalData?.ma50 ?? 0) ? 'text-green-600' : 'text-red-600'}`}>
                            ${technicalData?.ma50?.toFixed(2) ?? 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">200-Day MA</span>
                          <span className={`text-sm font-medium ${(stockData?.price ?? 0) > (technicalData?.ma200 ?? 0) ? 'text-green-600' : 'text-red-600'}`}>
                            ${technicalData?.ma200?.toFixed(2) ?? 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Support Level</span>
                          <span className="text-sm font-medium">${technicalData?.support?.toFixed(2) ?? 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Resistance Level</span>
                          <span className="text-sm font-medium">${technicalData?.resistance?.toFixed(2) ?? 'N/A'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <h4 className="font-medium mb-3">Momentum Indicators</h4>
                  {isLoadingTechnical ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                      <GaugeChart value={technicalData?.rsi ?? 50} min={0} max={100} label="RSI" />
                      
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">MACD Signal</div>
                        <Badge 
                          variant="outline" 
                          className={
                            technicalData?.macdSignal === "Bullish" 
                              ? "bg-green-100 text-green-800 border-green-200" 
                              : technicalData?.macdSignal === "Bearish"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : "bg-yellow-100 text-yellow-800 border-yellow-200" // Neutral or null
                          }
                        >
                          {technicalData?.macdSignal ?? 'N/A'}
                        </Badge>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">Bollinger Position</div>
                        <div className="font-medium">{technicalData?.bollingerPosition ?? 'N/A'}</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col">
                  <h4 className="font-medium mb-3">Signal Summary</h4>
                  {isLoadingTechnical ? (
                     <div className="flex-1 flex items-center justify-center">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-muted mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">
                              {technicalData?.signalSummary ?? 'N/A'}
                            </div>
                            <div className="text-sm text-muted-foreground">Overall Signal</div>
                          </div>
                        </div>
                        
                        {/* Assuming signalSummary implies counts - adjust if API provides counts */}
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          <div className="text-center">
                            <div className="text-sm font-medium">Buy</div>
                            <div className="text-2xl font-bold text-green-600">?</div> {/* Placeholder */}
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium">Neutral</div>
                            <div className="text-2xl font-bold text-yellow-600">?</div> {/* Placeholder */}
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium">Sell</div>
                            <div className="text-2xl font-bold text-red-600">?</div> {/* Placeholder */}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* News and Sentiment Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl">News & Sentiment</CardTitle>
                <CardDescription>Recent news and market sentiment</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleAIExplanationOpen(
                  aiExplanations.news.title,
                  "news",
                  {
                    ticker: selectedStock,
                    sentimentScore: newsData?.sentimentScore,
                    recentNews: newsData?.recentNews,
                    analystRatings: newsData?.analystRatings,
                    averagePriceTarget: newsData?.averagePriceTarget,
                    currentPrice: stockData?.price
                  }
                )}
              >
                <Cpu className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Recent News</h4>
                  <div className="space-y-4">
                    {isLoadingNews ? (
                       <SkeletonLoader className="h-20" count={3} />
                    ) : newsData?.recentNews && newsData.recentNews.length > 0 ? (
                      newsData.recentNews.map((news, index) => (
                        <div key={index} className="border rounded-md p-3">
                          <div className="flex justify-between mb-1">
                            <Badge 
                              variant="outline" 
                              className={
                                news.sentiment === "positive" 
                                  ? "bg-green-100 text-green-800 border-green-200" 
                                  : news.sentiment === "negative"
                                    ? "bg-red-100 text-red-800 border-red-200"
                                    : "bg-yellow-100 text-yellow-800 border-yellow-200" // neutral
                              }
                            >
                              {news.sentiment}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{news.date}</span> {/* Format date if needed */}
                          </div>
                          <h5 className="font-medium">{news.title}</h5>
                          <div className="text-xs text-muted-foreground mt-1">Source: {news.source}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-4">No recent news found.</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Sentiment Analysis</h4>
                  {isLoadingNews ? (
                     <div className="flex flex-col items-center mb-6">
                       <SkeletonLoader className="h-24 w-32" />
                     </div>
                  ) : (
                    <div className="flex flex-col items-center mb-6">
                      <GaugeChart value={newsData?.sentimentScore ?? 50} min={0} max={100} label="Sentiment Score" />
                    </div>
                  )}
                  
                  <h4 className="font-medium mb-3">Analyst Ratings</h4>
                  {isLoadingNews ? (
                    <SkeletonLoader className="h-16" />
                  ) : newsData?.analystRatings ? (
                    <>
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-full bg-muted h-4 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-green-500 h-full"
                            style={{ width: `${((newsData.analystRatings?.buy ?? 0) / ((newsData.analystRatings?.buy ?? 0) + (newsData.analystRatings?.hold ?? 0) + (newsData.analystRatings?.sell ?? 0))) * 100}%` }}
                          ></div>
                          <div 
                            className="bg-yellow-500 h-full"
                            style={{ width: `${((newsData.analystRatings?.hold ?? 0) / ((newsData.analystRatings?.buy ?? 0) + (newsData.analystRatings?.hold ?? 0) + (newsData.analystRatings?.sell ?? 0))) * 100}%` }}
                          ></div>
                          <div 
                            className="bg-red-500 h-full"
                            style={{ width: `${((newsData.analystRatings?.sell ?? 0) / ((newsData.analystRatings?.buy ?? 0) + (newsData.analystRatings?.hold ?? 0) + (newsData.analystRatings?.sell ?? 0))) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 text-center">
                        <div>
                          <div className="text-sm font-medium text-green-600">Buy</div>
                          <div className="text-lg font-bold">{newsData.analystRatings?.buy ?? 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-yellow-600">Hold</div>
                          <div className="text-lg font-bold">{newsData.analystRatings?.hold ?? 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-red-600">Sell</div>
                          <div className="text-lg font-bold">{newsData.analystRatings?.sell ?? 'N/A'}</div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="text-sm text-muted-foreground">Average Price Target</div>
                        <div className="font-medium">${newsData.averagePriceTarget?.toFixed(2) ?? 'N/A'}</div>
                        {stockData?.price && newsData?.averagePriceTarget && (
                          <div className="text-xs text-muted-foreground">
                            {(((newsData.averagePriceTarget - stockData.price) / stockData.price) * 100).toFixed(2)}% from current price
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">No analyst ratings available.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Analysis Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl">Risk Analysis</CardTitle>
                <CardDescription>Risk metrics and stress test scenarios</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleAIExplanationOpen(
                  aiExplanations.risk.title,
                  "risk",
                  {
                    ticker: selectedStock,
                    beta: riskData?.beta,
                    standardDeviation: riskData?.standardDeviation,
                    valueAtRisk: riskData?.valueAtRisk,
                    maxDrawdown: riskData?.maxDrawdown,
                    correlationSP500: riskData?.correlationSP500,
                    riskScore: riskData?.riskScore
                  }
                )}
              >
                <Cpu className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Risk Metrics</h4>
                  <div className="space-y-3">
                    {isLoadingRisk ? (
                      <SkeletonLoader className="h-6" count={5} />
                    ) : (
                      <>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Beta</span>
                            <span className="text-sm font-medium">{riskData?.beta?.toFixed(2) ?? 'N/A'}</span>
                          </div>
                          <Progress value={(riskData?.beta ?? 0) * 50} className="h-2" /> 
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Standard Deviation</span>
                            <span className="text-sm font-medium">{riskData?.standardDeviation ? riskData.standardDeviation.toFixed(2) + '%' : 'N/A'}</span>
                          </div>
                          <Progress value={(riskData?.standardDeviation ?? 0) * 2} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Value at Risk (Daily)</span>
                            <span className="text-sm font-medium">{riskData?.valueAtRisk ? riskData.valueAtRisk.toFixed(2) + '%' : 'N/A'}</span>
                          </div>
                          <Progress value={(riskData?.valueAtRisk ?? 0) * 10} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Max Drawdown</span>
                            <span className="text-sm font-medium">{riskData?.maxDrawdown ? riskData.maxDrawdown.toFixed(2) + '%' : 'N/A'}</span>
                          </div>
                          <Progress value={Math.abs(riskData?.maxDrawdown ?? 0) * 2} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Correlation to S&P 500</span>
                            <span className="text-sm font-medium">{riskData?.correlationSP500?.toFixed(2) ?? 'N/A'}</span>
                          </div>
                          <Progress value={(riskData?.correlationSP500 ?? 0) * 100} className="h-2" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Stress Test Scenarios</h4>
                   {/* Replace MockChart if you have a real stress test chart component */}
                  <MockChart type="Stress Test" height={200} />
                </div>
                
                <div className="flex flex-col">
                  <h4 className="font-medium mb-3">Risk Assessment</h4>
                  {isLoadingRisk ? (
                     <div className="flex-1 flex items-center justify-center">
                       <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                     </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-muted mb-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold">{riskData?.riskScore?.toFixed(0) ?? 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">Risk Score</div>
                          </div>
                        </div>
                        
                        {riskData?.riskScore !== null && riskData?.riskScore !== undefined && (
                          <>
                            <div className="text-sm text-muted-foreground mt-2">
                              {riskData.riskScore < 40 ? "Low Risk" : 
                               riskData.riskScore < 70 ? "Moderate Risk" : "High Risk"}
                            </div>
                            
                            <div className="mt-4 text-sm">
                              This stock has {riskData.riskScore < 40 ? "lower" : 
                                              riskData.riskScore < 70 ? "average" : "higher"} risk 
                              compared to the overall market.
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* AI Explanation Popup */}
      <AIExplanationPopup
        isOpen={showAIExplanation.isOpen}
        title={showAIExplanation.title}
        cardContext={showAIExplanation.cardContext}
        section={showAIExplanation.section}
        onClose={handleAIExplanationClose}
      />
    </div>
  );
};

export default StockAnalysis; 
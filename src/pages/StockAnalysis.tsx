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
  PieChart as PieChartIcon,
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
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from "recharts";
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
  fetchRiskAnalysis,
  AnalystRatings,
  PriceTarget,
  fetchAnalystRatings
} from "@/utils/fmpFinanceUtils";
// Import our new Twelve Data utility
import { fetchTwelveDataQuote, TwelveDataStockQuote, fetchDividendYield, DividendYieldData } from "@/utils/twelveDataUtils";
import { PriceChart } from "@/components/PriceChart";
import { useStockPrices } from "@/hooks/useStockPrices";
import { useTimeSeries } from "@/hooks/useTimeSeries"; // Add new import
import { useRsi } from "@/hooks/useRsi";
import { toast } from "@/hooks/use-toast";
import { fetchCompanyLogo, CompanyLogoData } from "@/utils/twelveDataUtils";
import { fetchCompanyProfile, CompanyProfileData } from "@/utils/twelveDataUtils";
// Add this import at the top, after the other imports
import CandlestickChart from "@/components/CandlestickChart";

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

// RSI indicator component (simplified from previous GaugeChart)
const GaugeChart = ({ value, min = 0, max = 100, label }: { value: number, min?: number, max?: number, label: string }) => {
  // Ensure value is within min/max range
  const boundedValue = Math.min(Math.max(value, min), max);
  
  // For RSI-specific display
  const isRsi = label === "RSI";
  const isSentiment = label === "Sentiment Score";
  
  // Determine RSI status and styling
  const getRsiStatus = () => {
    if (!isRsi) return { text: "", color: "", bgColor: "", borderColor: "" };
    
    if (boundedValue <= 30) {
      return { 
        text: "Oversold", 
        color: "text-green-700", 
        bgColor: "bg-green-100", 
        borderColor: "border-green-300" 
      };
    }
    if (boundedValue >= 70) {
      return { 
        text: "Overbought", 
        color: "text-red-700", 
        bgColor: "bg-red-100", 
        borderColor: "border-red-300" 
      };
    }
    return { 
      text: "Neutral", 
      color: "text-amber-700", 
      bgColor: "bg-amber-100", 
      borderColor: "border-amber-300" 
    };
  };
  
  // Determine Sentiment status and styling
  const getSentimentStatus = () => {
    if (!isSentiment) return { text: "", color: "", bgColor: "", borderColor: "" };
    
    if (boundedValue < 30) {
      return { 
        text: "Negative", 
        color: "text-red-700", 
        bgColor: "bg-red-100", 
        borderColor: "border-red-300" 
      };
    }
    if (boundedValue > 70) {
      return { 
        text: "Positive", 
        color: "text-green-700", 
        bgColor: "bg-green-100", 
        borderColor: "border-green-300" 
      };
    }
    return { 
      text: "Neutral", 
      color: "text-amber-700", 
      bgColor: "bg-amber-100", 
      borderColor: "border-amber-300" 
    };
  };
  
  const rsiStatus = getRsiStatus();
  const sentimentStatus = getSentimentStatus();
  
  return (
    <div className="flex flex-col items-center justify-center py-3">
      <div className="text-4xl font-bold mb-2" style={{ 
        color: isSentiment 
          ? (boundedValue < 30 ? "#dc2626" : boundedValue > 70 ? "#16a34a" : "#d97706")
          : (boundedValue <= 30 ? "#16a34a" : boundedValue >= 70 ? "#dc2626" : "#d97706")
      }}>
        {value.toFixed(1)}
      </div>
      <div className="text-sm text-muted-foreground mb-3">{label}</div>
      
      {isRsi && (
        <div className={`px-3 py-1 rounded-full text-sm border ${rsiStatus.bgColor} ${rsiStatus.color} ${rsiStatus.borderColor}`}>
          {rsiStatus.text}
        </div>
      )}
      
      {isSentiment && (
        <div className={`px-3 py-1 rounded-full text-sm border ${sentimentStatus.bgColor} ${sentimentStatus.color} ${sentimentStatus.borderColor}`}>
          {sentimentStatus.text}
        </div>
      )}
      
      <div className="w-40 h-1 bg-gray-200 rounded-full relative mt-4">
        <div className="absolute inset-0 flex">
          {isSentiment ? (
            <>
              <div className="w-[30%] h-full bg-red-500 rounded-l-full"></div>
              <div className="w-[40%] h-full bg-amber-500"></div>
              <div className="w-[30%] h-full bg-green-500 rounded-r-full"></div>
            </>
          ) : (
            <>
              <div className="w-[30%] h-full bg-green-500 rounded-l-full"></div>
              <div className="w-[40%] h-full bg-amber-500"></div>
              <div className="w-[30%] h-full bg-red-500 rounded-r-full"></div>
            </>
          )}
        </div>
        <div 
          className="absolute top-0 w-1 h-3 bg-black rounded-full -mt-1" 
          style={{ 
            left: `${((boundedValue - min) / (max - min)) * 100}%`,
            transform: 'translateX(-50%)'
          }}
        ></div>
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

// Colors for the analyst ratings pie chart
const RATING_COLORS = [
  "#22c55e", // Strong Buy - Green
  "#4ade80", // Buy - Light Green
  "#facc15", // Hold - Yellow
  "#f87171", // Sell - Light Red
  "#ef4444", // Strong Sell - Red
  "#d1d5db"  // No data - Gray
];

// Define the structure for a watchlist item
interface WatchlistItem {
  symbol: string;
  name: string; // Keep the name for display purposes elsewhere
}

// Add a new component for price range gauges, styled consistently with GaugeChart
const PriceRangeGauge = ({ low, high, current, label }: { low: number, high: number, current: number, label?: string }): JSX.Element => {
  // Calculate the percentage position of the current price within the range
  const percentage = Math.min(Math.max(((current - low) / (high - low)) * 100, 0), 100);
  
  return (
    <div className="w-full">
      {label && <div className="text-sm text-muted-foreground">{label}</div>}
      <div className="w-full h-1 bg-gray-200 rounded-full relative my-3">
        <div className="absolute inset-0 flex">
          <div className="w-[30%] h-full bg-red-500 rounded-l-full"></div>
          <div className="w-[40%] h-full bg-amber-500"></div>
          <div className="w-[30%] h-full bg-green-500 rounded-r-full"></div>
        </div>
        <div 
          className="absolute top-0 w-1 h-3 bg-black rounded-full -mt-1" 
          style={{ 
            left: `${percentage}%`,
            transform: 'translateX(-50%)'
          }}
        ></div>
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>${low.toFixed(2)}</span>
        <span>${high.toFixed(2)}</span>
      </div>
    </div>
  );
};

// Then update the WeekRangeGauge to use this more generic component
const WeekRangeGauge = ({ low, high, current }: { low: number, high: number, current: number }): JSX.Element => {
  return <PriceRangeGauge low={low} high={high} current={current} />;
};

// Create a new component for the daily high/low range
const DailyRangeGauge = ({ low, high, current, open }: { low: number, high: number, current: number, open: number }): JSX.Element => {
  // Calculate the percentage position of the current price within the range
  const percentage = Math.min(Math.max(((current - low) / (high - low)) * 100, 0), 100);
  // Calculate the percentage position of the open price within the range
  const openPercentage = Math.min(Math.max(((open - low) / (high - low)) * 100, 0), 100);
  
  return (
    <div className="w-full">
      <div className="w-full h-1 bg-gray-200 rounded-full relative my-3">
        <div className="absolute inset-0 flex">
          <div 
            className="h-full bg-red-500 rounded-l-full" 
            style={{ width: `${openPercentage}%` }}
          ></div>
          <div 
            className="h-full bg-green-500 rounded-r-full" 
            style={{ width: `${100 - openPercentage}%` }}
          ></div>
        </div>
        <div 
          className="absolute top-0 w-1 h-3 bg-black rounded-full -mt-1" 
          style={{ 
            left: `${percentage}%`,
            transform: 'translateX(-50%)'
          }}
        ></div>
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>${low.toFixed(2)}</span>
        <span className="text-xs font-medium">Open: ${open.toFixed(2)}</span>
        <span>${high.toFixed(2)}</span>
      </div>
    </div>
  );
};

// First part of the component declaration - we'll complete it in subsequent edits
const StockAnalysis = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState("1Y");
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stockData, setStockData] = useState<StockQuote | null>(null);
  const [twelveDataStockData, setTwelveDataStockData] = useState<TwelveDataStockQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isLoadingTwelveDataQuote, setIsLoadingTwelveDataQuote] = useState(false);
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
  const [analystRatingsData, setAnalystRatingsData] = useState<AnalystRatings | null>(null);
  const [isLoadingAnalystRatings, setIsLoadingAnalystRatings] = useState(false);
  const [logoData, setLogoData] = useState<CompanyLogoData | null>(null);
  const [isLoadingLogo, setIsLoadingLogo] = useState(false);
  const [profileData, setProfileData] = useState<CompanyProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
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
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const [visibleView, setVisibleView] = useState<'sectors' | 'stocks' | 'transition'>('sectors');

  // Add a state for the expanded stock details dropdown
  const [showMoreStockDetails, setShowMoreStockDetails] = useState(false);

  // Add a new state variable to track the chart type after the other state variables
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('candlestick');

  // Get historical price data using our custom hook - OLD approach
  const { data: priceData, loading: priceLoading, error: priceError } = useStockPrices(selectedStock, timeframe);
  
  // Get historical price data using our new Twelve Data hook
  const { data: timeSeriesData, loading: timeSeriesLoading, error: timeSeriesError } = useTimeSeries(selectedStock, convertTimeframeToTimePeriod(timeframe));

  // Function to convert timeframe to Twelve Data time period format
  function convertTimeframeToTimePeriod(timeframe: string): string {
    switch (timeframe) {
      case '1D':
        return '1day';
      case '1W':
        return '1week';
      case '1M':
        return '1month';
      case '3M':
        return '3month'; // Updated to use our specific 3month period
      case '6M':
        return '6month'; // Updated to use our specific 6month period
      case 'YTD':
        return 'ytd';
      case '1Y':
        return '1year';
      case '5Y':
        return 'max';
      default:
        return '1month';
    }
  }

  // Get RSI data for the selected stock using our custom hook
  const { rsi: polygonRsi, loading: rsiLoading, error: rsiError } = useRsi(selectedStock);

  // Load watchlist from localStorage on initial render
  useEffect(() => {
    const storedWatchlist = localStorage.getItem("stockWatchlist");
    if (storedWatchlist) {
      try {
        const parsedWatchlist = JSON.parse(storedWatchlist);
        if (Array.isArray(parsedWatchlist)) {
          setWatchlist(parsedWatchlist);
        } else {
          console.error("Stored watchlist is not an array:", parsedWatchlist);
          localStorage.removeItem("stockWatchlist"); // Clear invalid data
        }
      } catch (error) {
        console.error("Error parsing watchlist from localStorage:", error);
        localStorage.removeItem("stockWatchlist"); // Clear corrupted data
      }
    }
  }, []);

  // Update isInWatchlist whenever selectedStock or watchlist changes
  useEffect(() => {
    if (selectedStock) {
      setIsInWatchlist(watchlist.some(item => item.symbol === selectedStock));
    } else {
      setIsInWatchlist(false); // Reset if no stock is selected
    }
  }, [selectedStock, watchlist]);

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

  // Fetch stock quote data from Twelve Data API when selected stock changes
  useEffect(() => {
    const getTwelveDataStockQuote = async () => {
      if (!selectedStock) return;
      
      setIsLoadingTwelveDataQuote(true);
      try {
        const quote = await fetchTwelveDataQuote(selectedStock);
        setTwelveDataStockData(quote);
        
        // Also update the stockData state to use the new data (for compatibility)
        setStockData({
          symbol: quote.symbol,
          name: quote.name,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          marketCap: quote.marketCap,
          peRatio: quote.peRatio,
          dividendYield: quote.dividendYield,
          volume: quote.volume,
          avgVolume: quote.avgVolume,
          exchange: quote.exchange,
          high52Week: quote.high52Week,
          low52Week: quote.low52Week
        });
      } catch (error) {
        console.error('Error fetching Twelve Data stock quote:', error);
        toast({
          title: "Error",
          description: `Failed to fetch quote for ${selectedStock} from Twelve Data: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
        
        // Fallback to the original FMP API if Twelve Data fails
        getStockQuote();
      } finally {
        setIsLoadingTwelveDataQuote(false);
      }
    };
    
    // Call the new function instead of the old one
    getTwelveDataStockQuote();
    
  }, [selectedStock]);

  // Keep the original getStockQuote function as a fallback
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

  // Fetch Analyst Ratings data
  useEffect(() => {
    const getAnalystRatings = async () => {
      if (!selectedStock) return;
      
      setIsLoadingAnalystRatings(true);
      try {
        console.log('Fetching analyst ratings for:', selectedStock);
        const data = await fetchAnalystRatings(selectedStock);
        console.log('Analyst ratings data received:', data);
        setAnalystRatingsData(data); // Corrected: set state directly with the returned data
      } catch (error) {
        console.error('Error fetching analyst ratings:', error);
        toast({
          title: "Error",
          description: `Failed to fetch analyst ratings for ${selectedStock}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
        setAnalystRatingsData(null);
      } finally {
        setIsLoadingAnalystRatings(false);
      }
    };
    
    getAnalystRatings();
  }, [selectedStock]);

  // Debug effect for analyst ratings data rendering
  useEffect(() => {
    if (analystRatingsData) {
      console.log('Rendering pie chart with data:', analystRatingsData);
    } else {
      console.log('No analyst ratings data available:', analystRatingsData);
    }
  }, [analystRatingsData]);

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
    // We don't need the toast here anymore as the main display updates
    // toast({
    //   title: "Stock Selected",
    //   description: `${name} (${symbol}) selected for analysis.`,
    // });
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
      content: "Technical analysis uses price and volume data to forecast future price movements. Moving averages show trend direction over different periods. RSI (Relative Strength Index) indicates overbought (>70) or oversold (<30) conditions, helping identify potential reversals. MACD (Moving Average Convergence Divergence) shows momentum changes and potential trend reversals - multiple MACD signals can occur simultaneously, such as bullish crossovers (MACD crossing above signal line), zero line crossovers, or histogram turns. Bollinger Bands show volatility and potential price targets. Support and resistance levels are price points where the stock historically reverses direction. The price target consensus shows the average, low, and high price targets from Wall Street analysts, providing context for potential future price levels."
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

  // Create section tags for the AI chat
  const availableSections = {
    overview: {
      id: "overview",
      name: "Overview",
      getContext: () => ({
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
        chartData: timeSeriesData ? timeSeriesData.data.map(item => ({ 
          date: new Date(item.date),
          close: item.close
        })) : []
      })
    },
    performance: {
      id: "performance",
      name: "Performance",
      getContext: () => ({
        ticker: selectedStock,
        returns: priceChanges?.returns || [],
        volatility: priceChanges?.volatility,
        sharpeRatio: priceChanges?.sharpeRatio,
        beta: priceChanges?.beta,
        alpha: priceChanges?.alpha
      })
    },
    financial: {
      id: "financial",
      name: "Financial",
      getContext: () => ({
        ticker: selectedStock,
        healthScore: financialHealthData?.healthScore,
        debtToEquity: financialHealthData?.debtToEquity,
        currentRatio: financialHealthData?.currentRatio,
        quickRatio: financialHealthData?.quickRatio,
        returnOnEquity: financialHealthData?.returnOnEquity,
        returnOnAssets: financialHealthData?.returnOnAssets,
        netMargin: financialHealthData?.netMargin
      })
    },
    valuation: {
      id: "valuation",
      name: "Valuation",
      getContext: () => ({
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
      })
    },
    technical: {
      id: "technical",
      name: "Technical",
      getContext: () => ({
        ticker: selectedStock,
        currentPrice: stockData?.price,
        ma50: technicalData?.ma50,
        ma200: technicalData?.ma200,
        support: technicalData?.support,
        resistance: technicalData?.resistance,
        rsi: polygonRsi ?? technicalData?.rsi,
        macdSignal: technicalData?.macdSignal,
        macdSignals: technicalData?.macdSignals,
        bollingerPosition: technicalData?.bollingerPosition,
        signalSummary: technicalData?.signalSummary,
        priceTarget: technicalData?.priceTarget
      })
    },
    news: {
      id: "news",
      name: "News",
      getContext: () => ({
        ticker: selectedStock,
        sentimentScore: newsData?.sentimentScore,
        recentNews: newsData?.recentNews,
        analystRatings: analystRatingsData,
        priceTarget: technicalData?.priceTarget,
        currentPrice: stockData?.price
      })
    },
    risk: {
      id: "risk",
      name: "Risk",
      getContext: () => ({
        ticker: selectedStock,
        beta: riskData?.beta,
        standardDeviation: riskData?.standardDeviation,
        valueAtRisk: riskData?.valueAtRisk,
        maxDrawdown: riskData?.maxDrawdown,
        correlationSP500: riskData?.correlationSP500,
        riskScore: riskData?.riskScore
      })
    }
  };

  // Replace the mock valuation data with the real one or fallback to default values
  const getValuationDataOrDefault = (): ValuationData & { eps: string } => {
    if (isLoadingValuation) {
      return {
        peRatio: "Loading...",
        forwardPE: "Loading...",
        pegRatio: "Loading...",
        priceToSales: "Loading...",
        priceToBook: "Loading...",
        evToEbitda: "Loading...",
        dividendYield: "Loading...",
        dividendGrowth5Y: "Loading...",
        fairValueLow: 0,
        fairValueHigh: 0,
        eps: "Loading..."
      };
    }
    
    if (!valuationData) {
      return {
        peRatio: "0.00",
        forwardPE: "0.00",
        pegRatio: "0.00",
        priceToSales: "0.00",
        priceToBook: "0.00",
        evToEbitda: "0.00",
        dividendYield: dividendData ? dividendData.dividendYield.toFixed(2) : "0.00",
        dividendGrowth5Y: "0.00",
        fairValueLow: 0,
        fairValueHigh: 0,
        eps: "0.00"
      };
    }
    
    return {
      ...valuationData,
      // Override with real dividend data if available
      dividendYield: dividendData ? dividendData.dividendYield.toFixed(2) : valuationData.dividendYield,
    };
  };

  // Toggle stock in watchlist
  const toggleWatchlist = () => {
    if (!selectedStock || !stockData) return; // Need stock data to get the name

    const stockName = stockData.name || selectedStock; // Fallback to symbol if name isn't loaded yet

    let updatedWatchlist;
    if (isInWatchlist) {
      // Remove from watchlist
      updatedWatchlist = watchlist.filter(item => item.symbol !== selectedStock);
      toast({
        title: "Removed from Watchlist",
        description: `${stockName} (${selectedStock}) removed.`,
      });
    } else {
      // Add to watchlist
      const newItem: WatchlistItem = { symbol: selectedStock, name: stockName };
      updatedWatchlist = [...watchlist, newItem];
      toast({
        title: "Added to Watchlist",
        description: `${stockName} (${selectedStock}) added.`,
      });
    }

    setWatchlist(updatedWatchlist);
    // Persist watchlist to localStorage
    localStorage.setItem("stockWatchlist", JSON.stringify(updatedWatchlist));
  };

  // Toggle more stock details section
  const toggleMoreStockDetails = () => {
    setShowMoreStockDetails(prev => !prev);
  };

  // Fetch company logo when selected stock changes
  useEffect(() => {
    const getCompanyLogo = async () => {
      if (!selectedStock) {
        setLogoData(null);
        return;
      }
      
      setIsLoadingLogo(true);
      try {
        const logo = await fetchCompanyLogo(selectedStock);
        setLogoData(logo);
      } catch (error) {
        console.error('Error fetching company logo:', error);
        // Don't show a toast for logo errors - just silently fail
        setLogoData(null);
      } finally {
        setIsLoadingLogo(false);
      }
    };
    
    getCompanyLogo();
  }, [selectedStock]);

  // Fetch company profile when selected stock changes
  useEffect(() => {
    const getCompanyProfile = async () => {
      if (!selectedStock) {
        setProfileData(null);
        return;
      }
      
      setIsLoadingProfile(true);
      try {
        const profile = await fetchCompanyProfile(selectedStock);
        setProfileData(profile);
      } catch (error) {
        console.error('Error fetching company profile:', error);
        // Don't show a toast for profile errors - just silently fail
        setProfileData(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    
    getCompanyProfile();
  }, [selectedStock]);

  // Add a new state for dividend data
  const [dividendData, setDividendData] = useState<DividendYieldData | null>(null);
  const [isLoadingDividend, setIsLoadingDividend] = useState<boolean>(false);
  
  // Add a new useEffect for fetching dividend data
  useEffect(() => {
    const getDividendData = async () => {
      if (!selectedStock) return;
      
      setIsLoadingDividend(true);
      try {
        const data = await fetchDividendYield(selectedStock);
        setDividendData(data);
      } catch (error) {
        console.error('Error fetching dividend data:', error);
        toast({
          title: "Error",
          description: `Failed to fetch dividend data for ${selectedStock}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
        setDividendData(null);
      } finally {
        setIsLoadingDividend(false);
      }
    };
    
    getDividendData();
  }, [selectedStock, toast]);

  // Effect to fetch time series data when timeframe changes
  useEffect(() => {
    // Force refetch time series data when timeframe changes
    if (selectedStock) {
      console.log(`Timeframe changed to ${timeframe}, refetching data for ${selectedStock}`);
    }
  }, [timeframe, selectedStock]);

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
                  {isLoadingLogo ? (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mr-3 animate-pulse"></div>
                  ) : logoData?.url ? (
                    <img 
                      src={logoData.url} 
                      alt={`${selectedStock} logo`} 
                      className="h-10 w-10 rounded-lg object-contain mr-3 bg-white p-1 border"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mr-3">
                      <span className="text-sm font-semibold">{selectedStock}</span>
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-xl flex items-center">
                      {isLoadingTwelveDataQuote || isLoadingQuote ? (
                        <div className="h-6 w-32 animate-pulse bg-muted rounded"></div>
                      ) : (
                        <>
                          {twelveDataStockData?.name || stockData?.name || "Loading..."} ({selectedStock})
                        </>
                      )}
                    </CardTitle>
                    <div className="flex items-center mt-1">
                      {isLoadingTwelveDataQuote || isLoadingQuote ? (
                        <div className="h-8 w-24 animate-pulse bg-muted rounded"></div>
                      ) : (
                        <>
                          <span className="text-2xl font-bold mr-2">
                            ${(twelveDataStockData?.price || stockData?.price || 0).toFixed(2)}
                          </span>
                          <span className={`flex items-center ${(twelveDataStockData?.change || stockData?.change || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(twelveDataStockData?.change || stockData?.change || 0) > 0 ? (
                              <ArrowUp className="h-4 w-4 mr-1" />
                            ) : (
                              <ArrowDown className="h-4 w-4 mr-1" />
                            )}
                            ${Math.abs(twelveDataStockData?.change || stockData?.change || 0).toFixed(2)} ({Math.abs(twelveDataStockData?.changePercent || stockData?.changePercent || 0).toFixed(2)}%)
                          </span>
                          {twelveDataStockData && (
                            <Badge 
                              variant={twelveDataStockData.isMarketOpen ? "default" : "secondary"} 
                              className={`ml-3 text-xs ${twelveDataStockData.isMarketOpen ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}`}
                            >
                              {twelveDataStockData.isMarketOpen ? "Market Open" : "Market Closed"}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleWatchlist()}
                  disabled={!selectedStock || (isLoadingQuote && isLoadingTwelveDataQuote)}
                >
                  <Star className={`h-4 w-4 ${isInWatchlist ? 'fill-yellow-400 text-yellow-500' : ''}`} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleAIExplanationOpen(
                    aiExplanations.overview.title,
                    "overview",
                    availableSections.overview.getContext()
                  )}
                >
                  <Cpu className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Price chart - using the real data */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Price Chart</h3>
                    <div className="flex items-center gap-4">
                      {/* Chart type selector */}
                      <div className="flex space-x-1 text-xs border rounded-md overflow-hidden">
                        <button 
                          onClick={() => setChartType('line')}
                          className={`px-3 py-1 ${chartType === 'line' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-accent'}`}
                        >
                          Line
                        </button>
                        <button 
                          onClick={() => setChartType('candlestick')}
                          className={`px-3 py-1 ${chartType === 'candlestick' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-accent'}`}
                        >
                          Candlestick
                        </button>
                      </div>
                      
                      {/* Timeframe selector */}
                      <div className="flex space-x-1 text-xs">
                        <button 
                          onClick={() => setTimeframe('1D')}
                          className={`px-2 py-1 rounded ${timeframe === '1D' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-accent'}`}
                        >
                          1D
                        </button>
                        <button 
                          onClick={() => setTimeframe('1W')}
                          className={`px-2 py-1 rounded ${timeframe === '1W' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-accent'}`}
                        >
                          1W
                        </button>
                        <button 
                          onClick={() => setTimeframe('1M')}
                          className={`px-2 py-1 rounded ${timeframe === '1M' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-accent'}`}
                        >
                          1M
                        </button>
                        <button 
                          onClick={() => setTimeframe('3M')}
                          className={`px-2 py-1 rounded ${timeframe === '3M' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-accent'}`}
                        >
                          3M
                        </button>
                        <button 
                          onClick={() => setTimeframe('6M')}
                          className={`px-2 py-1 rounded ${timeframe === '6M' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-accent'}`}
                        >
                          6M
                        </button>
                        <button 
                          onClick={() => setTimeframe('YTD')}
                          className={`px-2 py-1 rounded ${timeframe === 'YTD' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-accent'}`}
                        >
                          YTD
                        </button>
                        <button 
                          onClick={() => setTimeframe('1Y')}
                          className={`px-2 py-1 rounded ${timeframe === '1Y' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-accent'}`}
                        >
                          1Y
                        </button>
                        <button 
                          onClick={() => setTimeframe('5Y')}
                          className={`px-2 py-1 rounded ${timeframe === '5Y' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-accent'}`}
                        >
                          5Y
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Conditionally render either the line chart or candlestick chart based on user selection */}
                  {chartType === 'line' ? (
                    <PriceChart 
                      data={timeSeriesData ? timeSeriesData.data.map(item => ({ 
                        date: new Date(item.date),
                        close: item.close
                      })) : []} 
                      loading={timeSeriesLoading} 
                      error={timeSeriesError}
                      timeframe={timeframe}
                      height={400}
                    />
                  ) : (
                    <CandlestickChart 
                      data={timeSeriesData} 
                      loading={timeSeriesLoading} 
                      error={timeSeriesError}
                      timeframe={timeframe}
                      height={400}
                    />
                  )}
                </div>
                
                {/* Enhanced Key metrics with Twelve Data - First two rows */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Market Cap</div>
                    <div className="font-medium">${twelveDataStockData?.marketCap || stockData?.marketCap || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Volume</div>
                    <div className="font-medium">{twelveDataStockData?.volume || stockData?.volume || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Avg. Volume</div>
                    <div className="font-medium">{twelveDataStockData?.avgVolume || stockData?.avgVolume || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Daily Range</div>
                    {isLoadingTwelveDataQuote || isLoadingQuote ? (
                      <SkeletonLoader className="h-8 w-full" />
                    ) : twelveDataStockData?.low && twelveDataStockData?.high ? (
                      <DailyRangeGauge 
                        low={twelveDataStockData.low} 
                        high={twelveDataStockData.high} 
                        current={twelveDataStockData.price || stockData?.price || 0} 
                        open={twelveDataStockData.open || stockData?.open || 0} 
                      />
                    ) : (
                      <div className="font-medium">N/A</div>
                    )}
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
                    <div className="text-sm text-muted-foreground">Beta</div>
                    <div className="font-medium">{isLoadingPriceChanges ? <SkeletonLoader className="h-5 w-16" /> : priceChanges?.beta ? priceChanges.beta.toFixed(2) : "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">52-Week Range</div>
                    {isLoadingTwelveDataQuote || isLoadingQuote ? (
                      <SkeletonLoader className="h-8 w-full" />
                    ) : (
                      <WeekRangeGauge 
                        low={twelveDataStockData?.low52Week || stockData?.low52Week || 0} 
                        high={twelveDataStockData?.high52Week || stockData?.high52Week || 100} 
                        current={twelveDataStockData?.price || stockData?.price || 50} 
                      />
                    )}
                  </div>
                  
                  {/* Remove the third row with company information from here */}
                  
                  {/* Remove the fourth row with company description from here */}
                </div>
                
                {/* Show more button */}
                <div className="flex justify-end mt-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={toggleMoreStockDetails}
                    className="h-8 px-2 transition-all duration-200 hover:bg-muted"
                  >
                    <span className="mr-1 text-sm">{showMoreStockDetails ? "Hide details" : "Show more"}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showMoreStockDetails ? 'rotate-180' : ''}`} />
                  </Button>
                </div>
                
                {/* Additional details dropdown section */}
                {showMoreStockDetails && (
                  <div 
                    className="border-t pt-3 mt-1 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200"
                  >
                    {twelveDataStockData?.extendedHoursPrice && (
                      <div>
                        <div className="text-sm text-muted-foreground">After Hours</div>
                        <div className="font-medium flex items-center">
                          ${twelveDataStockData.extendedHoursPrice.toFixed(2)}
                          {twelveDataStockData.extendedHoursChange && twelveDataStockData.extendedHoursChangePercent && (
                            <span className={`ml-2 text-xs ${twelveDataStockData.extendedHoursChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {twelveDataStockData.extendedHoursChange > 0 ? '+' : ''}
                              {twelveDataStockData.extendedHoursChange.toFixed(2)} ({twelveDataStockData.extendedHoursChangePercent.toFixed(2)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {twelveDataStockData?.rolling1dChange && (
                      <div>
                        <div className="text-sm text-muted-foreground">1-Day Change</div>
                        <div className={`font-medium ${twelveDataStockData.rolling1dChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {twelveDataStockData.rolling1dChange > 0 ? '+' : ''}
                          {twelveDataStockData.rolling1dChange.toFixed(2)}%
                        </div>
                      </div>
                    )}
                    {twelveDataStockData?.rolling7dChange && (
                      <div>
                        <div className="text-sm text-muted-foreground">7-Day Change</div>
                        <div className={`font-medium ${twelveDataStockData.rolling7dChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {twelveDataStockData.rolling7dChange > 0 ? '+' : ''}
                          {twelveDataStockData.rolling7dChange.toFixed(2)}%
                        </div>
                      </div>
                    )}
                    
                    {/* Add full company description when available */}
                    {profileData?.description && profileData.description.length > 300 && (
                      <div className="col-span-full mt-2">
                        <div className="text-sm text-muted-foreground">Company Description</div>
                        <div className="text-sm leading-relaxed mt-1">
                          {profileData.description}
                        </div>
                      </div>
                    )}
                    
                    {/* Add additional company details */}
                    {profileData && (
                      <>
                        <div>
                          <div className="text-sm text-muted-foreground">CEO</div>
                          <div className="font-medium">{profileData.CEO || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Type</div>
                          <div className="font-medium">{profileData.type || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Location</div>
                          <div className="font-medium">
                            {profileData.city && profileData.state ? `${profileData.city}, ${profileData.state}` : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Website</div>
                          <div className="font-medium">
                            {profileData.website ? (
                              <a 
                                href={profileData.website.startsWith('http') ? profileData.website : `http://${profileData.website}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline truncate block"
                              >
                                {profileData.website}
                              </a>
                            ) : 'N/A'}
                          </div>
                        </div>
                        
                        {/* Move exchange, sector, industry, employees below */}
                        <div>
                          <div className="text-sm text-muted-foreground">Exchange</div>
                          <div className="font-medium">
                            {isLoadingProfile ? (
                              <SkeletonLoader className="h-5 w-16" />
                            ) : (
                              profileData?.exchange || "N/A"
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Sector</div>
                          <div className="font-medium">
                            {isLoadingProfile ? (
                              <SkeletonLoader className="h-5 w-16" />
                            ) : (
                              profileData?.sector || "N/A"
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Industry</div>
                          <div className="font-medium">
                            {isLoadingProfile ? (
                              <SkeletonLoader className="h-5 w-16" />
                            ) : (
                              profileData?.industry || "N/A"
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Employees</div>
                          <div className="font-medium">
                            {isLoadingProfile ? (
                              <SkeletonLoader className="h-5 w-16" />
                            ) : (
                              profileData?.employees ? profileData.employees.toLocaleString() : "N/A"
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
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
                  availableSections.performance.getContext()
                )}
              >
                <Cpu className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Top section with Historical Returns and Earnings History */}
                <div className="grid md:grid-cols-2 gap-6 relative">
                  <div>
                    <h4 className="font-medium mb-3">Historical Returns</h4>
                    <div className="space-y-3">
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
                        <div className="bg-muted/30 rounded-lg p-3 relative">
                          {priceChanges?.returns?.map((item, index) => (
                            <div key={item.period} className={`${index !== 0 ? 'mt-3 pt-3 border-t border-gray-200' : ''}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">{item.period}</span>
                                <span 
                                  className={`text-sm font-bold ${
                                    item.direction === 'up' ? 'text-green-600' : 'text-red-600'
                                  }`}
                                >
                                  {item.direction === 'up' ? '+' : '-'}{Math.abs(item.value).toFixed(2)}%
                                </span>
                              </div>
                              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden relative">
                                <div className="absolute top-0 left-1/2 h-full w-px bg-gray-400"></div>
                                <div 
                                  className={`h-full ${item.direction === 'up' ? 'bg-green-500' : 'bg-red-500'}`}
                                  style={{ 
                                    width: `${Math.min(Math.abs(item.value) * 0.8, 50)}%`,
                                    marginLeft: item.direction === 'up' ? '50%' : 'auto',
                                    marginRight: item.direction === 'up' ? 'auto' : '50%'
                                  }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>-50%</span>
                                <span>0%</span>
                                <span>+50%</span>
                              </div>
                            </div>
                          ))}
                          
                          {/* Add a summary visualization at the bottom */}
                          {priceChanges?.returns?.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="text-sm font-medium mb-2">Return Summary</div>
                              <div className="flex gap-2">
                                {priceChanges.returns.slice(0, 4).map((item) => (
                                  <div 
                                    key={`summary-${item.period}`} 
                                    className={`flex-1 h-16 rounded-md flex flex-col items-center justify-center ${
                                      item.direction === 'up' ? 'bg-green-100' : 'bg-red-100'
                                    }`}
                                  >
                                    <div className={`text-xs ${item.direction === 'up' ? 'text-green-700' : 'text-red-700'}`}>
                                      {item.period}
                                    </div>
                                    <div className={`text-sm font-bold mt-1 ${item.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                      {item.direction === 'up' ? (
                                        <div className="flex items-center">
                                          <ArrowUp className="h-3 w-3 mr-1" />
                                          {Math.abs(item.value).toFixed(1)}%
                                        </div>
                                      ) : (
                                        <div className="flex items-center">
                                          <ArrowDown className="h-3 w-3 mr-1" />
                                          {Math.abs(item.value).toFixed(1)}%
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Earnings History</h4>
                    {isLoadingPriceChanges ? (
                      <div className="space-y-2">
                        {Array(4).fill(0).map((_, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="w-20 h-4 bg-muted animate-pulse rounded"></div>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-4 bg-muted animate-pulse rounded"></div>
                              <div className="w-16 h-4 bg-muted animate-pulse rounded"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-4 text-sm text-muted-foreground mb-1">
                          <div>Quarter</div>
                          <div className="text-center">EPS</div>
                          <div className="text-center">Surprise</div>
                          <div className="text-right">Trend</div>
                        </div>
                        {/* Sample earnings data - replace with real data when available */}
                        {[
                          { quarter: 'Q4 2023', estEPS: 1.85, actEPS: 1.98, surprise: 7.03 },
                          { quarter: 'Q3 2023', estEPS: 1.75, actEPS: 1.82, surprise: 4.00 },
                          { quarter: 'Q2 2023', estEPS: 1.68, actEPS: 1.71, surprise: 1.79 },
                          { quarter: 'Q1 2023', estEPS: 1.55, actEPS: 1.52, surprise: -1.94 }
                        ].map((item, index, arr) => {
                          // Calculate if EPS is growing compared to previous quarter
                          const prevItem = index < arr.length - 1 ? arr[index + 1] : null;
                          const epsGrowth = prevItem ? item.actEPS > prevItem.actEPS : false;
                          
                          return (
                            <div key={item.quarter} className="rounded-md bg-muted/40 p-2">
                              <div className="grid grid-cols-4 items-center text-sm">
                                <div className="font-medium">{item.quarter}</div>
                                
                                {/* EPS comparison with visual bar */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs px-1">
                                    <span>Est</span>
                                    <span>Act</span>
                                  </div>
                                  <div className="relative h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="absolute top-0 left-0 h-full bg-blue-200"
                                      style={{ width: '100%' }}
                                    ></div>
                                    <div 
                                      className={`absolute top-0 h-full ${item.surprise >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                      style={{ 
                                        left: `${item.surprise >= 0 ? 
                                          Math.min((item.estEPS / Math.max(item.estEPS, item.actEPS)) * 100, 100) : 
                                          Math.min((item.actEPS / Math.max(item.estEPS, item.actEPS)) * 100, 100)}%`,
                                        width: `${Math.abs((item.actEPS - item.estEPS) / Math.max(item.estEPS, item.actEPS) * 100)}%` 
                                      }}
                                    ></div>
                                    <div className="absolute inset-0 flex justify-between items-center px-1 text-xs text-white font-medium">
                                      <span>${item.estEPS.toFixed(2)}</span>
                                      <span>${item.actEPS.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Surprise with visual indicator */}
                                <div className="flex flex-col items-center justify-center">
                                  <div className={`text-sm font-bold ${item.surprise >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                     {item.surprise >= 0 ? '+' : ''}{item.surprise.toFixed(2)}%
                                  </div>
                                  <div className="w-full h-1 mt-1 bg-gray-200 rounded-full overflow-hidden relative">
                                    <div 
                                      className={`h-full ${item.surprise >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                      style={{ width: `${Math.min(Math.abs(item.surprise) * 5, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                                
                                {/* Trend indicator */}
                                <div className="flex justify-end">
                                  {prevItem && (
                                    <div className="flex flex-col items-center">
                                      <div className={`rounded-full p-1 ${epsGrowth ? 'bg-green-100' : 'bg-red-100'}`}>
                                        {epsGrowth ? (
                                          <ArrowUp className={`h-4 w-4 text-green-600`} />
                                        ) : (
                                          <ArrowDown className={`h-4 w-4 text-red-600`} />
                                        )}
                                      </div>
                                      <span className="text-xs text-muted-foreground mt-1">
                                        {((item.actEPS - prevItem.actEPS) / prevItem.actEPS * 100).toFixed(1)}%
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Performance Metrics section below */}
                <div>
                  <h4 className="font-medium mb-3">Performance Metrics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium text-sm">Risk/Reward Profile</h5>
                        <div className="text-xs text-muted-foreground">vs S&P 500</div>
                      </div>
                      {isLoadingPriceChanges ? (
                        <div className="h-32 w-full animate-pulse bg-muted rounded"></div>
                      ) : (
                        <div className="relative h-32 w-full">
                          {/* This would be better with a real scatter plot chart */}
                          <div className="relative inset-0 flex items-center justify-center h-full">
                            <div className="relative w-full h-full">
                              {/* Axes */}
                              <div className="absolute top-1/2 left-0 w-full h-px bg-gray-300 z-10"></div>
                              <div className="absolute top-0 left-1/2 w-px h-full bg-gray-300 z-10"></div>
                              
                              {/* Quadrant labels */}
                              <div className="absolute top-1 left-1 text-xs text-muted-foreground">Lower Return<br/>Lower Risk</div>
                              <div className="absolute top-1 right-1 text-xs text-muted-foreground text-right">Higher Return<br/>Lower Risk</div>
                              <div className="absolute bottom-1 left-1 text-xs text-muted-foreground">Lower Return<br/>Higher Risk</div>
                              <div className="absolute bottom-1 right-1 text-xs text-muted-foreground text-right">Higher Return<br/>Higher Risk</div>
                              
                              {/* Stock position dot - placement would depend on actual risk/return values */}
                              <div 
                                className="absolute bg-primary h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ 
                                  bottom: `${(priceChanges?.sharpeRatio && priceChanges?.sharpeRatio > 0) ? 
                                    Math.min(priceChanges.sharpeRatio * 20, 85) : 50}%`, 
                                  right: `${(priceChanges?.volatility && priceChanges?.volatility > 0) ? 
                                    Math.min(priceChanges.volatility, 85) : 50}%` 
                                }}
                              >
                                $
                              </div>
                              
                              {/* Benchmark position */}
                              <div 
                                className="absolute bg-gray-500 h-4 w-4 rounded-full flex items-center justify-center text-white text-[10px]"
                                style={{ bottom: '50%', right: '50%' }}
                              >
                                B
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <div className="text-sm text-muted-foreground">Volatility (Annual)</div>
                          <div className="text-xl font-bold mt-2">
                            {priceChanges?.volatility ? priceChanges.volatility.toFixed(2) : "N/A"}%
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {priceChanges?.volatility && priceChanges.volatility < 15 
                              ? 'Low risk' 
                              : priceChanges?.volatility && priceChanges.volatility < 25 
                                ? 'Moderate risk' 
                                : 'High risk'}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                          <div className={`text-xl font-bold mt-2 ${
                            priceChanges?.sharpeRatio && priceChanges.sharpeRatio > 1 
                              ? 'text-green-600' 
                              : priceChanges?.sharpeRatio && priceChanges.sharpeRatio > 0 
                                ? 'text-amber-600' 
                                : 'text-red-600'
                          }`}>
                            {priceChanges?.sharpeRatio ? priceChanges.sharpeRatio.toFixed(2) : "N/A"}
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {priceChanges?.sharpeRatio && priceChanges.sharpeRatio > 1 
                              ? 'Excellent risk-adjusted return' 
                              : priceChanges?.sharpeRatio && priceChanges.sharpeRatio > 0 
                                ? 'Average risk-adjusted return' 
                                : 'Poor risk-adjusted return'}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="text-sm text-muted-foreground">Beta</div>
                          <div className="text-xl font-bold mt-2">
                            {priceChanges?.beta ? priceChanges.beta.toFixed(2) : "N/A"}
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {priceChanges?.beta && priceChanges.beta < 0.8 
                              ? 'Less volatile than market' 
                              : priceChanges?.beta && priceChanges.beta < 1.2 
                                ? 'Similar to market' 
                                : 'More volatile than market'}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="text-sm text-muted-foreground">Alpha</div>
                          <div className={`text-xl font-bold mt-2 ${
                            priceChanges?.alpha && priceChanges.alpha > 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {priceChanges?.alpha ? priceChanges.alpha.toFixed(2) : "N/A"}%
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {priceChanges?.alpha && priceChanges.alpha > 0 
                              ? 'Outperforming market' 
                              : 'Underperforming market'}
                          </div>
                        </div>
                      </div>
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
                  availableSections.financial.getContext()
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
                  availableSections.valuation.getContext()
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
                      <div>
                        <div className="text-sm text-muted-foreground">Dividend Yield</div>
                        <div className="font-medium">{isLoadingValuation || isLoadingDividend ? 
                          <SkeletonLoader className="h-5 w-16" /> : 
                          `${getValuationDataOrDefault().dividendYield}%`}
                        </div>
                      </div>
                    </div>
                    
                    {/* Add Dividend Details Section */}
                    {dividendData && (
                      <div className="mt-4 p-3 bg-muted/30 rounded-md">
                        <h4 className="text-sm font-medium mb-2">Dividend Details</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <div className="text-muted-foreground">Last Amount</div>
                          <div className="text-right">${dividendData.dividendAmount.toFixed(2)}</div>
                          
                          <div className="text-muted-foreground">Annual Dividend</div>
                          <div className="text-right">${dividendData.annualDividend.toFixed(2)}</div>
                          
                          <div className="text-muted-foreground">Last Ex-Date</div>
                          <div className="text-right">{dividendData.lastExDate}</div>
                          
                          <div className="text-muted-foreground">Annualized Yield</div>
                          <div className="text-right">{dividendData.dividendYield.toFixed(2)}%</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Removed Separator and dividend information section here */}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Price Target</h4>
                  {isLoadingTechnical ? (
                     <div className="flex-1 flex items-center justify-center">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                     </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center">
                      {/* Display current stock price or N/A */}
                      <div className="text-4xl font-bold mb-2">
                        {stockData?.price ? `$${stockData.price.toFixed(2)}` : "N/A"}
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">Current Price</div>
                      
                      {/* Display valuation tag */}
                      {technicalData?.priceTarget && stockData?.price ? (
                        <div className={`px-3 py-1 rounded-full text-sm border mb-3 ${
                          stockData.price < technicalData.priceTarget.targetConsensus * 0.9 
                            ? "bg-green-100 text-green-700 border-green-300" 
                            : stockData.price > technicalData.priceTarget.targetConsensus * 1.1
                              ? "bg-red-100 text-red-700 border-red-300"
                              : "bg-amber-100 text-amber-700 border-amber-300"
                        }`}>
                          {stockData.price < technicalData.priceTarget.targetConsensus * 0.9 
                            ? "Undervalued" 
                            : stockData.price > technicalData.priceTarget.targetConsensus * 1.1
                              ? "Overvalued"
                              : "Fair Value"}
                        </div>
                      ) : (
                        <div className="px-3 py-1 rounded-full text-sm border mb-3 bg-gray-100 text-gray-700 border-gray-300">
                          No Data
                        </div>
                      )}
                      
                      {/* Price Target Gauge */}
                      <div className="w-full mt-3">
                        {technicalData?.priceTarget && stockData?.price ? (
                          <div className="relative pt-5">
                            {/* Colored background zones */}
                            <div className="w-40 h-1 bg-gray-200 rounded-full relative mx-auto">
                              <div className="absolute inset-0 flex">
                                <div className="w-[30%] h-full bg-green-500 rounded-l-full"></div>
                                <div className="w-[40%] h-full bg-amber-500"></div>
                                <div className="w-[30%] h-full bg-red-500 rounded-r-full"></div>
                              </div>
                              
                              {/* Current price marker */}
                              <div 
                                className="absolute top-0 w-1 h-3 bg-black rounded-full -mt-1" 
                                style={{ 
                                  left: `${Math.min(Math.max(((stockData.price - technicalData.priceTarget.targetLow) / 
                                    (technicalData.priceTarget.targetHigh - technicalData.priceTarget.targetLow)) * 100, 0), 100)}%`,
                                  transform: 'translateX(-50%)'
                                }}
                              ></div>
                            </div>
                            
                            {/* Target low label */}
                            <div 
                              className="absolute -top-1 text-xs"
                              style={{ left: 'calc(50% - 70px)' }}
                            >
                              ${technicalData.priceTarget.targetLow.toFixed(2)}
                            </div>
                            
                            {/* Target high label */}
                            <div 
                              className="absolute -top-1 text-xs text-right"
                              style={{ right: 'calc(50% - 70px)' }}
                            >
                              ${technicalData.priceTarget.targetHigh.toFixed(2)}
                            </div>
                            
                            {/* Consensus marker */}
                            <div 
                              className="absolute bottom-6 text-xs font-medium"
                              style={{ 
                                left: `calc(50% + ${Math.min(Math.max(((technicalData.priceTarget.targetConsensus - technicalData.priceTarget.targetLow) / 
                                  (technicalData.priceTarget.targetHigh - technicalData.priceTarget.targetLow)) * 80 - 40, -40), 40)}px)`,
                                transform: 'translateX(-50%)' 
                              }}
                            >
                              Consensus: ${technicalData.priceTarget.targetConsensus.toFixed(2)}
                            </div>
                            
                            {/* Current price label */}
                            <div 
                              className="absolute -bottom-6 text-xs font-medium"
                              style={{ 
                                left: `calc(50% + ${Math.min(Math.max(((stockData.price - technicalData.priceTarget.targetLow) / 
                                  (technicalData.priceTarget.targetHigh - technicalData.priceTarget.targetLow)) * 80 - 40, -40), 40)}px)`,
                                transform: 'translateX(-50%)' 
                              }}
                            >
                              Current: ${stockData.price.toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <div className="relative pt-5">
                            <div className="w-40 h-1 bg-gray-200 rounded-full relative mx-auto">
                              {/* Empty default gauge */}
                              <div 
                                className="absolute top-0 w-1 h-3 bg-black rounded-full -mt-1" 
                                style={{ 
                                  left: '50%',
                                  transform: 'translateX(-50%)'
                                }}
                              ></div>
                            </div>
                            
                            <div 
                              className="absolute -top-1 text-xs text-muted-foreground"
                              style={{ left: 'calc(50% - 70px)' }}
                            >
                              $0
                            </div>
                            
                            <div 
                              className="absolute -top-1 text-xs text-right text-muted-foreground"
                              style={{ right: 'calc(50% - 70px)' }}
                            >
                              $0
                            </div>
                            
                            <div 
                              className="absolute -bottom-6 text-xs font-medium text-muted-foreground text-center w-full"
                            >
                              No price target data available
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
                  availableSections.technical.getContext()
                )}
              >
                <Cpu className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
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
                  {isLoadingTechnical || rsiLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                      {(polygonRsi ?? technicalData?.rsi) ? (
                        <>
                          <GaugeChart 
                            value={polygonRsi ?? technicalData?.rsi ?? 50} 
                            min={0} 
                            max={100} 
                            label="RSI" 
                          />
                          
                          {/* RSI interpretation */}
                          <div className="text-xs text-center text-muted-foreground -mt-2 mb-3">
                            {((polygonRsi ?? technicalData?.rsi) ?? 0) > 70 ? 
                              'Overbought (>70): Potential sell signal' : 
                              ((polygonRsi ?? technicalData?.rsi) ?? 0) < 30 ? 
                              'Oversold (<30): Potential buy signal' : 
                              ''}
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          <div className="text-sm font-medium mb-1">RSI</div>
                          <div className="text-2xl font-bold">N/A</div>
                          <div className="text-xs text-muted-foreground mt-1">Data unavailable</div>
                        </div>
                      )}
                      
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">MACD Signals</div>
                        {technicalData?.macdSignals && technicalData.macdSignals.length > 0 ? (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {technicalData.macdSignals.map((signal, index) => (
                              <Badge 
                                key={index}
                                variant="outline" 
                                className={
                                  signal.toLowerCase().includes('bullish') || 
                                  signal.toLowerCase().includes('above')
                                    ? "bg-green-100 text-green-800 border-green-200" 
                                    : signal.toLowerCase().includes('bearish') || 
                                      signal.toLowerCase().includes('below')
                                      ? "bg-red-100 text-red-800 border-red-200"
                                      : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                }
                              >
                                {signal}
                              </Badge>
                            ))}
                          </div>
                        ) : technicalData?.macdSignal ? (
                          <Badge 
                            variant="outline" 
                            className={
                              technicalData.macdSignal === "Bullish" 
                                ? "bg-green-100 text-green-800 border-green-200" 
                                : technicalData.macdSignal === "Bearish"
                                  ? "bg-red-100 text-red-800 border-red-200"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-200" // Neutral
                            }
                          >
                            {technicalData.macdSignal}
                          </Badge>
                        ) : (
                          <span className="text-sm">N/A</span>
                        )}
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">Bollinger Position</div>
                        <div className="font-medium">{technicalData?.bollingerPosition ?? 'N/A'}</div>
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
                  availableSections.news.getContext()
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
                                news.sentimentColor ? `bg-opacity-20 text-opacity-90 border-opacity-30` : (
                                  news.sentiment === "positive" 
                                    ? "bg-green-100 text-green-800 border-green-200" 
                                    : news.sentiment === "negative"
                                      ? "bg-red-100 text-red-800 border-red-200"
                                      : "bg-yellow-100 text-yellow-800 border-yellow-200" // neutral
                                )
                              }
                              style={news.sentimentColor ? {
                                backgroundColor: `${news.sentimentColor}20`, // 20% opacity
                                color: news.sentimentColor,
                                borderColor: `${news.sentimentColor}30` // 30% opacity
                              } : {}}
                            >
                              {news.sentiment}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(news.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex">
                            {news.imageUrl && (
                              <div className="mr-3 flex-shrink-0">
                                <img 
                                  src={news.imageUrl} 
                                  alt="" 
                                  className="h-16 w-16 object-cover rounded-md"
                                  onError={(e) => {
                                    // Hide the image on load error
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            <div>
                              <a 
                                href={news.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="font-medium hover:underline"
                              >
                                {news.title}
                              </a>
                              <div className="text-xs text-muted-foreground mt-1">Source: {news.source}</div>
                            </div>
                          </div>
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
                      <GaugeChart 
                        value={newsData?.sentimentScore ?? 50} 
                        min={0} 
                        max={100} 
                        label="Sentiment Score" 
                      />
                    </div>
                  )}
                  
                  <h4 className="font-medium mb-3">Analyst Ratings</h4>
                  {isLoadingAnalystRatings ? (
                    <SkeletonLoader className="h-16" />
                  ) : analystRatingsData ? (
                    <div className="flex flex-col space-y-4">
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { 
                                  name: "Strong Buy", 
                                  value: analystRatingsData.strongBuy || 0
                                },
                                { 
                                  name: "Buy", 
                                  value: analystRatingsData.buy || 0
                                },
                                { 
                                  name: "Hold", 
                                  value: analystRatingsData.hold || 0
                                },
                                { 
                                  name: "Sell", 
                                  value: analystRatingsData.sell || 0
                                },
                                { 
                                  name: "Strong Sell", 
                                  value: analystRatingsData.strongSell || 0
                                }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {[
                                { name: "Strong Buy", color: RATING_COLORS[0] },
                                { name: "Buy", color: RATING_COLORS[1] },
                                { name: "Hold", color: RATING_COLORS[2] },
                                { name: "Sell", color: RATING_COLORS[3] },
                                { name: "Strong Sell", color: RATING_COLORS[4] }
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              formatter={(value: number, name: string) => [`${value} analyst${value !== 1 ? 's' : ''}`, name]} 
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Legend */}
                      <div className="grid grid-cols-5 text-center text-xs">
                        <div>
                          <div className="font-medium text-green-600">Strong Buy</div>
                          <div className="font-bold">{analystRatingsData?.strongBuy ?? 'N/A'}</div>
                        </div>
                        <div>
                          <div className="font-medium text-green-500">Buy</div>
                          <div className="font-bold">{analystRatingsData?.buy ?? 'N/A'}</div>
                        </div>
                        <div>
                          <div className="font-medium text-yellow-600">Hold</div>
                          <div className="font-bold">{analystRatingsData?.hold ?? 'N/A'}</div>
                        </div>
                        <div>
                          <div className="font-medium text-red-500">Sell</div>
                          <div className="font-bold">{analystRatingsData?.sell ?? 'N/A'}</div>
                        </div>
                        <div>
                          <div className="font-medium text-red-600">Strong Sell</div>
                          <div className="font-bold">{analystRatingsData?.strongSell ?? 'N/A'}</div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <div>
                          <div className="text-sm text-muted-foreground">Consensus</div>
                          <div className="font-medium">{analystRatingsData?.consensus ?? 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Price Target</div>
                          <div className="font-medium">${technicalData?.priceTarget?.targetConsensus?.toFixed(2) ?? 'N/A'}</div>
                          {stockData?.price && technicalData?.priceTarget?.targetConsensus && (
                            <div className="text-xs text-muted-foreground">
                              {(((technicalData.priceTarget.targetConsensus - stockData.price) / stockData.price) * 100).toFixed(2)}% from current price
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-4">
                      {/* Grey placeholder pie chart for no data */}
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[{ name: "No Data", value: 1 }]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              <Cell fill={RATING_COLORS[5]} />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-center text-muted-foreground">
                        No analyst ratings available
                      </div>
                    </div>
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
                  availableSections.risk.getContext()
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
        availableSections={availableSections}
      />
    </div>
  );
};

export default StockAnalysis; 
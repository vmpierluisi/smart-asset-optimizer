import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
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
import { 
  fetchTwelveDataQuote, 
  TwelveDataStockQuote, 
  fetchDividendYield, 
  DividendYieldData, 
  fetchTimeSeries, 
  fetchHistoricalTimeSeries,
  TimeSeriesData,
  fetchStockStatistics,
  fetchPriceTarget,
  PriceTargetData,
  fetchSMA20,
  fetchSMA50,
  fetchSMA200,
  SMAData,
  fetchEMA20,
  fetchEMA50,
  fetchEMA200,
  EMAData,
  fetchRSI,
  RSIData,
  fetchRecommendations,
  RecommendationsData,
  fetchMACD,
  MACDData,
  getRecentMACDSignals,
  MACDSignals
} from "@/utils/twelveDataUtils";
import { PriceChart } from "@/components/PriceChart";
import { useStockPrices } from "@/hooks/useStockPrices";
import { useTimeSeries } from "@/hooks/useTimeSeries"; // Add new import
import { useRsi } from "@/hooks/useRsi";
import { toast } from "@/hooks/use-toast";
import { fetchCompanyLogo, CompanyLogoData } from "@/utils/twelveDataUtils";
import { fetchCompanyProfile, CompanyProfileData } from "@/utils/twelveDataUtils";
// Add this import at the top, after the other imports
import CandlestickChart from "@/components/CandlestickChart";
import StockStatisticsView from "@/components/StockStatisticsView";
import { useStockStatistics } from "@/hooks/useStockStatistics";
import { StockStatisticsData } from "@/utils/twelveDataUtils";
import SMAChart from "@/components/SMAChart";
import EMAChart from "@/components/EMAChart";
import RSIChart from '@/components/RSIChart';
import MACDChart from '@/components/MACDChart';

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
    <div className="w-full flex flex-col items-center">
      {label && <div className="text-sm text-muted-foreground">{label}</div>}
      <div className="w-40 h-1 bg-gray-200 rounded-full relative my-3">
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
      
      <div className="flex justify-between text-xs text-muted-foreground w-40">
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
    <div className="w-full flex flex-col items-center">
      <div className="w-40 h-1 bg-gray-200 rounded-full relative my-3">
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
      
      <div className="flex justify-between text-xs text-muted-foreground w-40">
        <span>${low.toFixed(2)}</span>
        <span className="text-xs font-medium">Open: ${open.toFixed(2)}</span>
        <span>${high.toFixed(2)}</span>
      </div>
    </div>
  );
};

// Add EarningsData interface BEFORE the component definition, not inside it
interface EarningReport {
  date: string;
  time: string;
  eps_estimate: number;
  eps_actual: number;
  difference: number;
  surprise_prc: number;
}

interface EarningsData {
  meta: {
    symbol: string;
    name: string;
    currency: string;
    exchange: string;
    mic_code: string;
    exchange_timezone: string;
  };
  earnings: EarningReport[];
  status: string;
}

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
  const [stockStatistics, setStockStatistics] = useState<StockStatisticsData | null>(null);
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
  const [recommendationsData, setRecommendationsData] = useState<RecommendationsData | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
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
  
  // Add state for recent stock visits and dropdown menus
  const [recentVisits, setRecentVisits] = useState<WatchlistItem[]>([]);
  const [showWatchlistDropdown, setShowWatchlistDropdown] = useState(false);
  const [showRecentsDropdown, setShowRecentsDropdown] = useState(false);

  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const [visibleView, setVisibleView] = useState<'sectors' | 'stocks' | 'transition'>('sectors');

  // Add a state for the expanded stock details dropdown
  const [showMoreStockDetails, setShowMoreStockDetails] = useState(false);
  
  // State to track which earnings cards are expanded
  const [expandedEarnings, setExpandedEarnings] = useState<string[]>([]);

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
    
    // Load recent visits from localStorage
    const storedRecentVisits = localStorage.getItem("stockRecentVisits");
    if (storedRecentVisits) {
      try {
        const parsedRecentVisits = JSON.parse(storedRecentVisits);
        if (Array.isArray(parsedRecentVisits)) {
          setRecentVisits(parsedRecentVisits);
        } else {
          console.error("Stored recent visits is not an array:", parsedRecentVisits);
          localStorage.removeItem("stockRecentVisits"); // Clear invalid data
        }
      } catch (error) {
        console.error("Error parsing recent visits from localStorage:", error);
        localStorage.removeItem("stockRecentVisits"); // Clear corrupted data
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

  /**
   * Calculate returns for various time periods from historical time series data
   * @param timeSeriesData The time series data returned from Twelve Data API
   * @returns StockPriceChanges object with calculated returns
   */
  const calculateHistoricalReturns = (timeSeriesData: TimeSeriesData | null): StockPriceChanges | null => {
    if (!timeSeriesData || !timeSeriesData.data || timeSeriesData.data.length === 0) {
      console.log('No time series data available or empty data array');
      return null;
    }

    console.log(`Processing ${timeSeriesData.data.length} data points for ${timeSeriesData.symbol}`);
    console.log('Data range:', timeSeriesData.data[timeSeriesData.data.length-1].date, 'to', timeSeriesData.data[0].date);

    const symbol = timeSeriesData.symbol;
    const data = timeSeriesData.data;
    const returns: { period: string; value: number; direction: 'up' | 'down' }[] = [];

    // Latest closing price (most recent data point)
    const latestPrice = data[0].close;
    
    // Function to find price at specific index or closest available
    const getPriceAtIndex = (index: number): number => {
      if (index < 0 || index >= data.length) {
        // If index is out of bounds, return the closest available price
        return index < 0 ? data[0].close : data[data.length - 1].close;
      }
      return data[index].close;
    };

    // Calculate percent change between current price and historical price
    const calculatePercentChange = (historicalPrice: number): number => {
      return ((latestPrice - historicalPrice) / historicalPrice) * 100;
    };

    // 1 Day return (1 day ago)
    if (data.length > 1) {
      const oneDayAgoPrice = getPriceAtIndex(1);
      const oneDayReturn = calculatePercentChange(oneDayAgoPrice);
      returns.push({
        period: '1D', // Ensure exact match with UI
        value: Math.abs(oneDayReturn),
        direction: oneDayReturn >= 0 ? 'up' : 'down'
      });
    }

    // 1 Week return (5-7 trading days ago)
    if (data.length > 5) {
      const oneWeekAgoPrice = getPriceAtIndex(5);
      const oneWeekReturn = calculatePercentChange(oneWeekAgoPrice);
      returns.push({
        period: '1W', // Ensure exact match with UI
        value: Math.abs(oneWeekReturn),
        direction: oneWeekReturn >= 0 ? 'up' : 'down'
      });
    }

    // 1 Month return (21-23 trading days ago)
    if (data.length > 21) {
      const oneMonthAgoPrice = getPriceAtIndex(21);
      const oneMonthReturn = calculatePercentChange(oneMonthAgoPrice);
      returns.push({
        period: '1M', // Ensure exact match with UI
        value: Math.abs(oneMonthReturn),
        direction: oneMonthReturn >= 0 ? 'up' : 'down'
      });
    }

    // 3 Month return (63-65 trading days ago)
    if (data.length > 63) {
      const threeMonthAgoPrice = getPriceAtIndex(63);
      const threeMonthReturn = calculatePercentChange(threeMonthAgoPrice);
      returns.push({
        period: '3M', // Ensure exact match with UI
        value: Math.abs(threeMonthReturn),
        direction: threeMonthReturn >= 0 ? 'up' : 'down'
      });
    }

    // 6 Month return (126-130 trading days ago)
    if (data.length > 126) {
      const sixMonthAgoPrice = getPriceAtIndex(126);
      const sixMonthReturn = calculatePercentChange(sixMonthAgoPrice);
      returns.push({
        period: '6M', // Ensure exact match with UI
        value: Math.abs(sixMonthReturn),
        direction: sixMonthReturn >= 0 ? 'up' : 'down'
      });
    }

    // YTD (Year-to-Date) return
    const currentYear = new Date().getFullYear();
    const ytdIndex = data.findIndex(item => {
      const itemDate = new Date(item.date);
      return itemDate.getFullYear() < currentYear;
    });
    
    if (ytdIndex !== -1) {
      const ytdPrice = getPriceAtIndex(ytdIndex);
      const ytdReturn = calculatePercentChange(ytdPrice);
      returns.push({
        period: 'YTD', // Ensure exact match with UI
        value: Math.abs(ytdReturn),
        direction: ytdReturn >= 0 ? 'up' : 'down'
      });
    }

    // 1 Year return (252-255 trading days ago)
    if (data.length > 252) {
      console.log('Calculating 1Y return, data points available:', data.length);
      const oneYearAgoPrice = getPriceAtIndex(252);
      const oneYearReturn = calculatePercentChange(oneYearAgoPrice);
      console.log('1Y return calculation:', { 
        latestPrice, 
        oneYearAgoPrice, 
        return: oneYearReturn, 
        date: data[252]?.date || 'unknown' 
      });
      returns.push({
        period: '1Y', // Ensure exact match with UI
        value: Math.abs(oneYearReturn),
        direction: oneYearReturn >= 0 ? 'up' : 'down'
      });
    } else if (data.length > 126) {
      // If we have at least 6 months of data, calculate an estimated 1Y return
      console.log('Estimating 1Y return with limited data:', data.length, 'points');
      const oldestAvailablePrice = data[data.length - 1].close;
      const estimatedReturn = calculatePercentChange(oldestAvailablePrice);
      returns.push({
        period: '1Y', // Ensure exact match with UI
        value: Math.abs(estimatedReturn),
        direction: estimatedReturn >= 0 ? 'up' : 'down'
      });
    }

    // 5 Year return (1260-1265 trading days ago) or max available
    if (data.length > 1260) {
      console.log('Calculating 5Y return, data points available:', data.length);
      const fiveYearAgoPrice = getPriceAtIndex(1260);
      const fiveYearReturn = calculatePercentChange(fiveYearAgoPrice);
      console.log('5Y return calculation:', { 
        latestPrice, 
        fiveYearAgoPrice, 
        return: fiveYearReturn,
        date: data[1260]?.date || 'unknown'
      });
      returns.push({
        period: '5Y', // Ensure exact match with UI
        value: Math.abs(fiveYearReturn),
        direction: fiveYearReturn >= 0 ? 'up' : 'down'
      });
    } else if (data.length > 252) {
      // If we don't have 5 years of data but have at least 1 year,
      // use the oldest available data point for an approximation
      console.log('Estimating 5Y return with limited data:', data.length, 'points');
      const oldestPrice = data[data.length - 1].close;
      const maxHistoricalReturn = calculatePercentChange(oldestPrice);
      returns.push({
        period: '5Y', // Ensure exact match with UI
        value: Math.abs(maxHistoricalReturn),
        direction: maxHistoricalReturn >= 0 ? 'up' : 'down'
      });
    }

    // Calculate volatility (standard deviation of daily returns)
    let volatility = null;
    if (data.length > 20) {
      // Calculate daily returns
      const dailyReturns: number[] = [];
      for (let i = 0; i < data.length - 1; i++) {
        const dailyReturn = (data[i].close - data[i + 1].close) / data[i + 1].close;
        dailyReturns.push(dailyReturn);
      }
      
      // Calculate mean
      const mean = dailyReturns.reduce((sum, value) => sum + value, 0) / dailyReturns.length;
      
      // Calculate sum of squared differences
      const sumSquaredDiff = dailyReturns.reduce((sum, value) => {
        return sum + Math.pow(value - mean, 2);
      }, 0);
      
      // Standard deviation
      volatility = Math.sqrt(sumSquaredDiff / dailyReturns.length) * 100; // As percentage
    }

    // Calculate beta (if we had market data, but we don't for now)
    // For now, we'll return a placeholder value or null
    const beta = null;

    return {
      symbol,
      returns,
      volatility,
      beta
    };
  };

  // Fetch stock price changes when selected stock changes
  useEffect(() => {
    const getStockPriceChanges = async () => {
      if (!selectedStock) return;
      
      setIsLoadingPriceChanges(true);
      
      try {
        // Fetch 5-year historical data specifically for calculating returns
        // This will always fetch 5 years of data regardless of timeframe
        console.log('Fetching historical data for returns calculation:', selectedStock);
        const timestamp = new Date().getTime();
        const historicalTimeSeriesData = await fetchHistoricalTimeSeries(selectedStock, timestamp);
        console.log('Received historical time series data:', historicalTimeSeriesData.data.length, 'data points');
        
        // Calculate returns from historical data
        const calculatedChanges = calculateHistoricalReturns(historicalTimeSeriesData);
        
        if (calculatedChanges) {
          console.log('Calculated returns from historical data:', calculatedChanges.returns);
          // Log specific returns we're looking for
          const oneYearReturn = calculatedChanges.returns.find(r => r.period === '1Y');
          const fiveYearReturn = calculatedChanges.returns.find(r => r.period === '5Y');
          console.log('1Y return:', oneYearReturn);
          console.log('5Y return:', fiveYearReturn);
          
          setPriceChanges(calculatedChanges);
        } else {
          // Fallback to original API if calculation fails
          console.log('Calculation failed, falling back to original API');
          const changes = await fetchStockPriceChanges(selectedStock);
          setPriceChanges(changes);
        }
      } catch (error) {
        console.error('Error calculating stock price changes:', error);
        
        try {
          // Fallback to original API if calculation fails
          const changes = await fetchStockPriceChanges(selectedStock);
          setPriceChanges(changes);
        } catch (fallbackError) {
          console.error('Error fetching stock price changes (fallback):', fallbackError);
          toast({
            title: "Error",
            description: `Failed to fetch price changes for ${selectedStock}: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`,
            variant: "destructive",
          });
        }
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

  // Fetch Recommendations data from Twelve Data
  useEffect(() => {
    const getRecommendationsData = async () => {
      if (!selectedStock) return;
      
      setIsLoadingRecommendations(true);
      try {
        console.log('Fetching recommendations for:', selectedStock);
        const data = await fetchRecommendations(selectedStock);
        console.log('Recommendations data received:', data);
        setRecommendationsData(data);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        toast({
          title: "Error",
          description: `Failed to fetch recommendations for ${selectedStock}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
        setRecommendationsData(null);
      } finally {
        setIsLoadingRecommendations(false);
      }
    };
    
    getRecommendationsData();
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
    
    // Add to recent visits
    const newVisit: WatchlistItem = { symbol, name };
    let updatedRecentVisits = recentVisits.filter(item => item.symbol !== symbol); // Remove if already exists
    updatedRecentVisits = [newVisit, ...updatedRecentVisits].slice(0, 5); // Add to beginning and limit to 5 items
    
    setRecentVisits(updatedRecentVisits);
    localStorage.setItem("stockRecentVisits", JSON.stringify(updatedRecentVisits));
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
        alpha: priceChanges?.alpha,
        earningsHistory: isLoadingEarnings 
          ? 'Loading...' 
          : earningsData?.earnings && earningsData.earnings.length > 0
            ? earningsData.earnings.slice(0, 4).map(e => ({ 
                date: e.date, 
                epsActual: e.eps_actual, 
                epsEstimate: e.eps_estimate, 
                surprisePercent: e.surprise_prc 
              })) 
            : 'No earnings data available'
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
        netMargin: financialHealthData?.netMargin,
        // Add new Twelve Data fields
        grossMargin: financialHealthData?.grossMargin,
        operatingMargin: financialHealthData?.operatingMargin,
        // Balance sheet items
        totalCash: financialHealthData?.total_cash_mrq,
        totalDebt: financialHealthData?.total_debt_mrq,
        bookValuePerShare: financialHealthData?.book_value_per_share_mrq,
        // Income statement items
        revenue: financialHealthData?.revenue_ttm,
        ebitda: financialHealthData?.ebitda,
        netIncome: financialHealthData?.net_income_to_common_ttm,
        eps: financialHealthData?.diluted_eps_ttm,
        revenueGrowth: financialHealthData?.quarterly_revenue_growth,
        earningsGrowth: financialHealthData?.quarterly_earnings_growth_yoy,
        // Cash flow items
        operatingCashFlow: financialHealthData?.operating_cash_flow_ttm,
        freeCashFlow: financialHealthData?.levered_free_cash_flow_ttm,
        // Dividend data
        forwardAnnualDividendRate: financialHealthData?.forward_annual_dividend_rate,
        forwardAnnualDividendYield: financialHealthData?.forward_annual_dividend_yield,
        trailingAnnualDividendRate: financialHealthData?.trailing_annual_dividend_rate,
        trailingAnnualDividendYield: financialHealthData?.trailing_annual_dividend_yield,
        fiveYearAverageDividendYield: financialHealthData?.five_year_average_dividend_yield,
        payoutRatio: financialHealthData?.payout_ratio,
        dividendFrequency: financialHealthData?.dividend_frequency,
        dividendDate: financialHealthData?.dividend_date,
        exDividendDate: financialHealthData?.ex_dividend_date
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
        eps: getValuationDataOrDefault().eps,
        priceTarget: priceTargetData?.price_target || null
      })
    },
    technical: {
      id: "technical",
      name: "Technical",
      getContext: () => ({
        ticker: selectedStock,
        currentPrice: stockData?.price,
        // SMA data
        ma20: smaData?.values && smaData.values.length > 0 ? parseFloat(smaData.values[0]?.ma || '0').toFixed(2) : 'N/A',
        ma50: technicalData?.ma50,
        ma200: technicalData?.ma200,
        sma_signals: {
          ma20: smaData?.values && smaData.values.length > 0 ? 
            (stockData?.price ?? 0) > (parseFloat(smaData.values[0]?.ma || '0')) ? 'Bullish' : 'Bearish' : 'N/A',
          ma50: (stockData?.price ?? 0) > (technicalData?.ma50 ?? 0) ? 'Bullish' : 'Bearish',
          ma200: (stockData?.price ?? 0) > (technicalData?.ma200 ?? 0) ? 'Bullish' : 'Bearish'
        },
        // EMA data
        ema20: emaData?.values && emaData.values.length > 0 ? parseFloat(emaData.values[0]?.ma || '0').toFixed(2) : 'N/A',
        ema50: ema50Data?.values && ema50Data.values.length > 0 ? parseFloat(ema50Data.values[0]?.ma || '0').toFixed(2) : 'N/A',
        ema200: ema200Data?.values && ema200Data.values.length > 0 ? parseFloat(ema200Data.values[0]?.ma || '0').toFixed(2) : 'N/A',
        ema_signals: {
          ema20: emaData?.values && emaData.values.length > 0 ?
            (stockData?.price ?? 0) > (parseFloat(emaData.values[0]?.ma || '0')) ? 'Bullish' : 'Bearish' : 'N/A',
          ema50: ema50Data?.values && ema50Data.values.length > 0 ?
            (stockData?.price ?? 0) > (parseFloat(ema50Data.values[0]?.ma || '0')) ? 'Bullish' : 'Bearish' : 'N/A',
          ema200: ema200Data?.values && ema200Data.values.length > 0 ?
            (stockData?.price ?? 0) > (parseFloat(ema200Data.values[0]?.ma || '0')) ? 'Bullish' : 'Bearish' : 'N/A'
        },
        // RSI data
        rsi: polygonRsi ?? technicalData?.rsi,
        rsi_signal: ((polygonRsi ?? technicalData?.rsi ?? 0) > 70) ? 'Overbought' : ((polygonRsi ?? technicalData?.rsi ?? 0) < 30) ? 'Oversold' : 'Neutral',
        // MACD data
        macd: technicalData?.macd,
        macd_signal: macdData?.values && macdData.values.length > 0 ? parseFloat(macdData.values[0]?.macd_signal || '0').toFixed(2) : 'N/A',
        macd_histogram: macdData?.values && macdData.values.length > 0 ? parseFloat(macdData.values[0]?.macd_hist || '0').toFixed(2) : 'N/A',
        macd_indicators: macdSignals ? {
          bullishCrossover: macdSignals.bullishCrossover || false,
          bearishCrossover: macdSignals.bearishCrossover || false,
          bullishZeroCrossover: macdSignals.bullishZeroCrossover || false,
          bearishZeroCrossover: macdSignals.bearishZeroCrossover || false,
          bullishDivergence: macdSignals.bullishDivergence || false,
          bearishDivergence: macdSignals.bearishDivergence || false,
          histogramIncreasing: macdSignals.histogramIncreasing || false,
          histogramDecreasing: macdSignals.histogramDecreasing || false
        } : null,
        // Other technical indicators
        support: technicalData?.support,
        resistance: technicalData?.resistance,
        bollingerPosition: technicalData?.bollingerPosition,
        signalSummary: technicalData?.signalSummary,
        priceTarget: technicalData?.priceTarget,
        timeframes: {
          sma: smaTimeframe,
          ema: emaTimeframe,
          rsi: rsiTimeframe,
          macd: macdTimeframe
        },
        // Descriptions for better AI explanations
        descriptions: {
          sma: "SMA calculates the average of prices over a specified time period, showing trend direction and support/resistance levels.",
          ema: "EMA gives more weight to recent prices, making it more responsive to new information than SMA.",
          rsi: "RSI measures the speed and magnitude of price movements. Values above 70 indicate overbought conditions, while below 30 suggest oversold conditions.",
          macd: "MACD is a trend-following momentum indicator that shows the relationship between two moving averages of a security's price. It's calculated by subtracting the 26-period EMA from the 12-period EMA."
        },
        rsi_analysis: ((polygonRsi ?? technicalData?.rsi ?? 0) > 70) 
          ? 'RSI above 70 suggests a potential sell signal' 
          : ((polygonRsi ?? technicalData?.rsi ?? 0) < 30)
          ? 'RSI below 30 suggests a potential buy signal'
          : 'RSI in neutral range (30-70)'
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
        recommendations: recommendationsData,
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
    },
    // Additional sections for individual technical indicators
    sma: {
      id: "sma",
      name: "SMA",
      getContext: () => ({
        ticker: selectedStock,
        currentPrice: stockData?.price,
        ma20: smaData?.values && smaData.values.length > 0 ? parseFloat(smaData.values[0]?.ma || '0').toFixed(2) : 'N/A',
        ma50: technicalData?.ma50,
        ma200: technicalData?.ma200,
        sma_signals: {
          ma20: smaData?.values && smaData.values.length > 0 ? 
            (stockData?.price ?? 0) > (parseFloat(smaData.values[0]?.ma || '0')) ? 'Bullish' : 'Bearish' : 'N/A',
          ma50: (stockData?.price ?? 0) > (technicalData?.ma50 ?? 0) ? 'Bullish' : 'Bearish',
          ma200: (stockData?.price ?? 0) > (technicalData?.ma200 ?? 0) ? 'Bullish' : 'Bearish'
        },
        timeframe: smaTimeframe,
        description: "SMA calculates the average of prices over a specified time period, showing trend direction and support/resistance levels."
      })
    },
    ema: {
      id: "ema",
      name: "EMA",
      getContext: () => ({
        ticker: selectedStock,
        currentPrice: stockData?.price,
        ema20: emaData?.values && emaData.values.length > 0 ? parseFloat(emaData.values[0]?.ma || '0').toFixed(2) : 'N/A',
        ema50: ema50Data?.values && ema50Data.values.length > 0 ? parseFloat(ema50Data.values[0]?.ma || '0').toFixed(2) : 'N/A',
        ema200: ema200Data?.values && ema200Data.values.length > 0 ? parseFloat(ema200Data.values[0]?.ma || '0').toFixed(2) : 'N/A',
        ema_signals: {
          ema20: emaData?.values && emaData.values.length > 0 ?
            (stockData?.price ?? 0) > (parseFloat(emaData.values[0]?.ma || '0')) ? 'Bullish' : 'Bearish' : 'N/A',
          ema50: ema50Data?.values && ema50Data.values.length > 0 ?
            (stockData?.price ?? 0) > (parseFloat(ema50Data.values[0]?.ma || '0')) ? 'Bullish' : 'Bearish' : 'N/A',
          ema200: ema200Data?.values && ema200Data.values.length > 0 ?
            (stockData?.price ?? 0) > (parseFloat(ema200Data.values[0]?.ma || '0')) ? 'Bullish' : 'Bearish' : 'N/A'
        },
        timeframe: emaTimeframe,
        description: "EMA gives more weight to recent prices, making it more responsive to new information than SMA."
      })
    },
    rsi: {
      id: "rsi",
      name: "RSI",
      getContext: () => ({
        ticker: selectedStock,
        currentPrice: stockData?.price,
        rsi: polygonRsi ?? technicalData?.rsi,
        rsi_signal: ((polygonRsi ?? technicalData?.rsi ?? 0) > 70) ? 'Overbought' : ((polygonRsi ?? technicalData?.rsi ?? 0) < 30) ? 'Oversold' : 'Neutral',
        analysis: ((polygonRsi ?? technicalData?.rsi ?? 0) > 70) 
          ? 'RSI above 70 suggests a potential sell signal' 
          : ((polygonRsi ?? technicalData?.rsi ?? 0) < 30)
          ? 'RSI below 30 suggests a potential buy signal'
          : 'RSI in neutral range (30-70)',
        timeframe: rsiTimeframe,
        description: "RSI measures the speed and magnitude of price movements. Values above 70 indicate overbought conditions, while below 30 suggest oversold conditions."
      })
    },
    macd: {
      id: "macd",
      name: "MACD",
      getContext: () => ({
        ticker: selectedStock,
        currentPrice: stockData?.price,
        macd: technicalData?.macd,
        signal: macdData?.values && macdData.values.length > 0 ? parseFloat(macdData.values[0]?.macd_signal || '0').toFixed(2) : 'N/A',
        histogram: macdData?.values && macdData.values.length > 0 ? parseFloat(macdData.values[0]?.macd_hist || '0').toFixed(2) : 'N/A',
        indicators: macdSignals ? {
          bullishCrossover: macdSignals.bullishCrossover || false,
          bearishCrossover: macdSignals.bearishCrossover || false,
          bullishZeroCrossover: macdSignals.bullishZeroCrossover || false,
          bearishZeroCrossover: macdSignals.bearishZeroCrossover || false,
          bullishDivergence: macdSignals.bullishDivergence || false,
          bearishDivergence: macdSignals.bearishDivergence || false,
          histogramIncreasing: macdSignals.histogramIncreasing || false,
          histogramDecreasing: macdSignals.histogramDecreasing || false
        } : null,
        timeframe: macdTimeframe,
        description: "MACD is a trend-following momentum indicator that shows the relationship between two moving averages of a security's price. It's calculated by subtracting the 26-period EMA from the 12-period EMA."
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
    
    // Get the latest EPS from earnings data if available
    let latestEps = "N/A";
    
    try {
      if (earningsData?.earnings && 
          Array.isArray(earningsData.earnings) && 
          earningsData.earnings.length > 0 &&
          typeof earningsData.earnings[0].eps_actual === 'number') {
        latestEps = earningsData.earnings[0].eps_actual.toFixed(2);
      }
    } catch (error) {
      console.error("Error processing earnings data for EPS", error);
    }
    
    if (!valuationData) {
      return {
        peRatio: "N/A",
        forwardPE: "N/A",
        pegRatio: "N/A",
        priceToSales: "N/A",
        priceToBook: "N/A",
        evToEbitda: "N/A",
        dividendYield: dividendData ? dividendData.dividendYield.toFixed(2) : "N/A",
        dividendGrowth5Y: "N/A",
        fairValueLow: 0,
        fairValueHigh: 0,
        eps: latestEps
      };
    }
    
    return {
      ...valuationData,
      // Override with real dividend data if available
      dividendYield: dividendData ? dividendData.dividendYield.toFixed(2) : valuationData.dividendYield,
      // Use the latest EPS from earnings data if available, otherwise use the one from valuation data
      eps: latestEps !== "N/A" ? latestEps : valuationData.eps || "N/A"
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
    setShowMoreStockDetails(!showMoreStockDetails);
  };

  // Function to toggle earnings card expansion
  const toggleEarningsExpand = (quarter: string) => {
    setExpandedEarnings(prev => 
      prev.includes(quarter) 
        ? prev.filter(q => q !== quarter) 
        : [...prev, quarter]
    );
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

  // Add fetchEarningsData function after the other fetch functions
  const fetchEarningsData = async (symbol: string): Promise<EarningsData> => {
    try {
      // Get the Supabase URL and key
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase environment variables are missing');
        throw new Error('Supabase environment variables are missing');
      }
      
      const response = await fetch(`${supabaseUrl}/functions/v1/twelve-eps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({ symbol })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Twelve Data EPS API error:', errorText);
        throw new Error(`Error fetching earnings data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check if response has an error (API might return 200 with error inside)
      if (data.status === 'error') {
        throw new Error(`API Error: ${data.message || 'Unknown error'}`);
      }

      // Ensure the data structure matches what we expect
      if (!data.earnings || !Array.isArray(data.earnings)) {
        console.warn('Earnings data structure unexpected:', data);
        // Return a safe default structure
        return {
          meta: {
            symbol: symbol,
            name: symbol,
            currency: 'USD',
            exchange: '',
            mic_code: '',
            exchange_timezone: ''
          },
          earnings: [],
          status: 'ok'
        };
      }
      
      return data;
    } catch (error: any) {
      console.error('Error in fetchEarningsData:', error);
      // Return a safe default to prevent UI errors
      return {
        meta: {
          symbol: symbol,
          name: symbol,
          currency: 'USD',
          exchange: '',
          mic_code: '',
          exchange_timezone: ''
        },
        earnings: [],
        status: 'ok'
      };
    }
  };

  // Add the earningsData state and loading state after the other state variables 
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [isLoadingEarnings, setIsLoadingEarnings] = useState<boolean>(false);

  // Add a useEffect hook to fetch earnings data when the selected stock changes
  useEffect(() => {
    const getEarningsData = async () => {
      if (!selectedStock) {
        setEarningsData(null);
        return;
      }
      
      setIsLoadingEarnings(true);
      try {
        const data = await fetchEarningsData(selectedStock);
        setEarningsData(data);
      } catch (error: any) {
        console.error('Error fetching earnings data:', error);
        // Don't show a toast for earnings errors - just silently fail
        setEarningsData({
          meta: {
            symbol: selectedStock,
            name: selectedStock,
            currency: 'USD',
            exchange: '',
            mic_code: '',
            exchange_timezone: ''
          },
          earnings: [],
          status: 'ok'
        });
      } finally {
        setIsLoadingEarnings(false);
      }
    };
    
    getEarningsData();
  }, [selectedStock]);

  // Fetch stock statistics data when stock is selected
  const { data: statisticsData, loading: isLoadingStatistics } = useStockStatistics(selectedStock);
  
  // Update local state when statistics data changes
  useEffect(() => {
    if (statisticsData) {
      setStockStatistics(statisticsData);
    }
  }, [statisticsData]);

  // Format market cap for display with appropriate suffix (B, T, etc.)
  const formatMarketCap = (marketCap: number | undefined | null): string => {
    if (!marketCap) return "N/A";
    
    if (marketCap >= 1_000_000_000_000) {
      return `$${(marketCap / 1_000_000_000_000).toFixed(2)}T`;
    } else if (marketCap >= 1_000_000_000) {
      return `$${(marketCap / 1_000_000_000).toFixed(2)}B`;
    } else if (marketCap >= 1_000_000) {
      return `$${(marketCap / 1_000_000).toFixed(2)}M`;
    } else {
      return `$${marketCap.toLocaleString()}`;
    }
  };

  // Add a state for price target data
  const [priceTargetData, setPriceTargetData] = useState<PriceTargetData | null>(null);
  const [isLoadingPriceTarget, setIsLoadingPriceTarget] = useState<boolean>(false);
  const [recommendationTimeframe, setRecommendationTimeframe] = useState<'current' | '1m' | '2m' | '3m'>('current');

  // Fetch price target data
  useEffect(() => {
    const getPriceTargetData = async () => {
      if (!selectedStock) return;
      
      setIsLoadingPriceTarget(true);
      try {
        const data = await fetchPriceTarget(selectedStock);
        setPriceTargetData(data);
      } catch (error) {
        console.error('Error fetching price target data:', error);
        toast({
          title: "Error",
          description: `Failed to fetch price target data for ${selectedStock}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
        setPriceTargetData(null);
      } finally {
        setIsLoadingPriceTarget(false);
      }
    };
    
    getPriceTargetData();
  }, [selectedStock]);

  // Add a state for SMA-20 data
  const [smaData, setSmaData] = useState<SMAData | null>(null);
  const [sma50Data, setSma50Data] = useState<SMAData | null>(null);
  const [sma200Data, setSma200Data] = useState<SMAData | null>(null);
  const [isLoadingSMA, setIsLoadingSMA] = useState<boolean>(false);
  const [smaTimeframe, setSmaTimeframe] = useState<string>('3M');
  
  // Add a new useEffect for fetching SMA-20 and SMA-50 data
  useEffect(() => {
    const getSmaData = async () => {
      if (!selectedStock) return;
      
      setIsLoadingSMA(true);
      try {
        // Fetch all SMA datasets in parallel
        const [data20, data50, data200] = await Promise.all([
          fetchSMA20(selectedStock, smaTimeframe),
          fetchSMA50(selectedStock, smaTimeframe),
          fetchSMA200(selectedStock, smaTimeframe)
        ]);
        
        console.log('SMA-20 data:', data20); // Debug log
        console.log('SMA-50 data:', data50); // Debug log
        console.log('SMA-200 data:', data200); // Debug log
        
        setSmaData(data20);
        setSma50Data(data50);
        setSma200Data(data200);
      } catch (error) {
        console.error('Error fetching SMA data:', error);
        toast({
          title: "Error",
          description: `Failed to fetch SMA data for ${selectedStock}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
        setSmaData(null);
        setSma50Data(null);
        setSma200Data(null);
      } finally {
        setIsLoadingSMA(false);
      }
    };
    
    getSmaData();
  }, [selectedStock, smaTimeframe]);

  // Handle SMA timeframe change
  const handleSmaTimeframeChange = (timeframe: string) => {
    console.log(`Changing SMA timeframe to ${timeframe}`);
    setSmaTimeframe(timeframe);
  };

  // Add a state for EMA-20 data
  const [emaData, setEmaData] = useState<EMAData | null>(null);
  const [ema50Data, setEma50Data] = useState<EMAData | null>(null);
  const [ema200Data, setEma200Data] = useState<EMAData | null>(null);
  const [isLoadingEMA, setIsLoadingEMA] = useState<boolean>(false);
  const [emaTimeframe, setEmaTimeframe] = useState<string>('3M');
  
  // Add a new useEffect for fetching EMA-20 and EMA-50 data
  useEffect(() => {
    const getEmaData = async () => {
      if (!selectedStock) return;
      
      setIsLoadingEMA(true);
      try {
        // Fetch all EMA datasets in parallel
        const [data20, data50, data200] = await Promise.all([
          fetchEMA20(selectedStock, emaTimeframe),
          fetchEMA50(selectedStock, emaTimeframe),
          fetchEMA200(selectedStock, emaTimeframe)
        ]);
        
        console.log('EMA-20 data:', data20); // Debug log
        console.log('EMA-50 data:', data50); // Debug log
        console.log('EMA-200 data:', data200); // Debug log
        
        setEmaData(data20);
        setEma50Data(data50);
        setEma200Data(data200);
      } catch (error) {
        console.error('Error fetching EMA data:', error);
        toast({
          title: "Error",
          description: `Failed to fetch EMA data for ${selectedStock}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
        setEmaData(null);
        setEma50Data(null);
        setEma200Data(null);
      } finally {
        setIsLoadingEMA(false);
      }
    };
    
    getEmaData();
  }, [selectedStock, emaTimeframe]);

  // Handle EMA timeframe change
  const handleEmaTimeframeChange = (timeframe: string) => {
    console.log(`Changing EMA timeframe to ${timeframe}`);
    setEmaTimeframe(timeframe);
  };

  // Add RSI state variables with the other chart state variables
  const [rsiData, setRsiData] = useState<RSIData | null>(null);
  const [isLoadingRSIChart, setIsLoadingRSIChart] = useState<boolean>(false);
  const [rsiTimeframe, setRsiTimeframe] = useState<string>('3M');

  // Fix the RSI data fetching useEffect
  useEffect(() => {
    const getRsiData = async () => {
      if (!selectedStock) return;
      
      setIsLoadingRSIChart(true);
      try {
        // Fetch RSI data
        const data = await fetchRSI(selectedStock, rsiTimeframe);
        
        console.log('RSI data from Twelve Data:', data); // More descriptive debug log
        
        if (data && data.values && data.values.length > 0) {
          console.log(`RSI data received with ${data.values.length} values`);
          setRsiData(data);
        } else {
          console.warn('No RSI values found in the response');
          setRsiData(null);
        }
      } catch (error) {
        console.error('Error fetching RSI data:', error);
        toast({
          title: "Error",
          description: `Failed to fetch RSI data for ${selectedStock}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
        setRsiData(null);
      } finally {
        setIsLoadingRSIChart(false);
      }
    };
    
    getRsiData();
  }, [selectedStock, rsiTimeframe, toast]);

  // Handle RSI timeframe change
  const handleRsiTimeframeChange = (timeframe: string) => {
    console.log(`Changing RSI timeframe to ${timeframe}`);
    setRsiTimeframe(timeframe);
  };
  
  // Handler for recommendation timeframe change
  const handleRecommendationTimeframeChange = (timeframe: 'current' | '1m' | '2m' | '3m') => {
    console.log(`Changing recommendation timeframe to ${timeframe}`);
    setRecommendationTimeframe(timeframe);
  };
  
  // Get recommendation data based on selected timeframe
  const getRecommendationDataForTimeframe = () => {
    if (!recommendationsData || !recommendationsData.trends) return null;
    
    switch (recommendationTimeframe) {
      case 'current':
        return recommendationsData.trends.current_month;
      case '1m':
        return recommendationsData.trends.previous_month;
      case '2m':
        return recommendationsData.trends['2_months_ago'];
      case '3m':
        return recommendationsData.trends['3_months_ago'];
      default:
        return recommendationsData.trends.current_month;
    }
  };

  // Add MACD state variables
  const [macdData, setMacdData] = useState<MACDData | null>(null);
  const [isLoadingMACD, setIsLoadingMACD] = useState<boolean>(false);
  const [macdTimeframe, setMacdTimeframe] = useState<string>('3M');
  const [macdSignals, setMacdSignals] = useState<MACDSignals | null>(null);
  const [macdTimeSeriesData, setMacdTimeSeriesData] = useState<TimeSeriesData | null>(null);
  
  // Add the useEffect for fetching MACD data
  useEffect(() => {
    const getMacdData = async () => {
      if (!selectedStock) return;
      
      setIsLoadingMACD(true);
      try {
        // Fetch MACD data for the selected chart timeframe
        const data = await fetchMACD(selectedStock, macdTimeframe);
        setMacdData(data);
        
        // For signal analysis, always use a fixed recent time period (e.g., 1month) 
        // regardless of the chart timeframe to ensure consistent signal detection
        const signalTimeSeriesData = await fetchTimeSeries(selectedStock, '1month');
        setMacdTimeSeriesData(signalTimeSeriesData);
        
        // Fetch MACD data specifically for the recent period for consistent signal analysis
        const signalMacdData = await fetchMACD(selectedStock, '3M');
        
        // Analyze MACD signals using consistent recent data
        if (signalMacdData && signalTimeSeriesData) {
          const { recentSignals } = getRecentMACDSignals(signalMacdData, signalTimeSeriesData);
          setMacdSignals(recentSignals);
        }
      } catch (error) {
        console.error('Error fetching MACD data:', error);
        toast({
          title: "Error",
          description: `Failed to fetch MACD data for ${selectedStock}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
        setMacdData(null);
        setMacdSignals(null);
      } finally {
        setIsLoadingMACD(false);
      }
    };
    
    getMacdData();
  }, [selectedStock, macdTimeframe, toast]);

  // Add handler for MACD timeframe changes
  const handleMacdTimeframeChange = (timeframe: string) => {
    console.log(`Changing MACD timeframe to ${timeframe}`);
    setMacdTimeframe(timeframe);
  };

  // Toggle dropdown visibility
  const toggleWatchlistDropdown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowWatchlistDropdown(!showWatchlistDropdown);
    if (showRecentsDropdown) setShowRecentsDropdown(false);
  };
  
  const toggleRecentsDropdown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowRecentsDropdown(!showRecentsDropdown);
    if (showWatchlistDropdown) setShowWatchlistDropdown(false);
  };
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only close if the click is outside of any dropdown container
      if (!target.closest('.dropdown-container')) {
        setShowWatchlistDropdown(false);
        setShowRecentsDropdown(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Beginning of the return statement
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Add CSS keyframes */}
      <style dangerouslySetInnerHTML={{ __html: fadeGrowKeyframes }} />
      
      {/* Stock Search Section */}
      <Card className="bg-neutral-50 border-none transition-all hover:none">
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
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg max-h-32 overflow-y-auto">
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
            <div className="relative dropdown-container" onClick={(e) => e.stopPropagation()}>
              <Button variant="outline" onClick={toggleRecentsDropdown}>
                Recent
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
              {showRecentsDropdown && (
                <div className="absolute z-10 mt-1 w-48 right-0 rounded-md border bg-background shadow-lg max-h-48 overflow-y-auto">
                  <div className="p-2">
                    {recentVisits.length > 0 ? (
                      recentVisits.map((item) => (
                        <div 
                          key={item.symbol}
                          className="flex items-center space-x-2 rounded-md p-2 hover:bg-muted cursor-pointer"
                          onClick={() => handleSelectStock(item.symbol, item.name)}
                        >
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold">{item.symbol.substring(0, 4)}</span>
                          </div>
                          <div className="overflow-hidden">
                            <div className="font-medium truncate">{item.name}</div>
                            <div className="text-sm text-muted-foreground truncate">{item.symbol}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No recent visits
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="relative dropdown-container" onClick={(e) => e.stopPropagation()}>
              <Button variant="outline" onClick={toggleWatchlistDropdown}>
                Watchlist
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
              {showWatchlistDropdown && (
                <div className="absolute z-10 mt-1 w-48 right-0 rounded-md border bg-background shadow-lg max-h-48 overflow-y-auto">
                  <div className="p-2">
                    {watchlist.length > 0 ? (
                      watchlist.map((item) => (
                        <div 
                          key={item.symbol}
                          className="flex items-center space-x-2 rounded-md p-2 hover:bg-muted cursor-pointer"
                          onClick={() => handleSelectStock(item.symbol, item.name)}
                        >
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold">{item.symbol.substring(0, 4)}</span>
                          </div>
                          <div className="overflow-hidden">
                            <div className="font-medium truncate">{item.name}</div>
                            <div className="text-sm text-muted-foreground truncate">{item.symbol}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        Add stocks to your watchlist
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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
            <div className="mb-4 px-6">
              <h2 className="text-2xl font-semibold">Market Sectors</h2>
              <p className="text-sm text-muted-foreground">Select a sector to explore stocks</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-4xl mx-auto pb-8">
              {marketSectors.map((sector) => (
                <div 
                  key={sector.id} 
                  className="bg-[#ff9999] bg-opacity-50 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-opacity-100 transition-all text-black aspect-square transform hover:scale-105 duration-200"
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
            <div className="mb-4 flex items-center px-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-12 flex items-center px-3"
                onClick={() => !isAnimating && handleBackToSectors()}
                disabled={isAnimating}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span>Back</span>
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
                    className="bg-neutral-50 border-none transition-all hover:shadow-md cursor-pointer"
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
                    <div className="font-medium">
                      {isLoadingStatistics ? (
                        <SkeletonLoader className="h-5 w-16" />
                      ) : stockStatistics?.statistics?.valuations_metrics?.market_capitalization ? (
                        formatMarketCap(stockStatistics.statistics.valuations_metrics.market_capitalization)
                      ) : (
                        twelveDataStockData?.marketCap || stockData?.marketCap || "N/A"
                      )}
                    </div>
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
                    <div className="font-medium">
                      {isLoadingStatistics ? (
                        <SkeletonLoader className="h-5 w-16" />
                      ) : stockStatistics?.statistics?.valuations_metrics?.trailing_pe ? (
                        stockStatistics.statistics.valuations_metrics.trailing_pe.toFixed(2)
                      ) : (
                        isLoadingValuation ? <SkeletonLoader className="h-5 w-16" /> : getValuationDataOrDefault().peRatio
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Dividend Yield</div>
                    <div className="font-medium">{isLoadingValuation ? <SkeletonLoader className="h-5 w-16" /> : `${getValuationDataOrDefault().dividendYield}%`}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Beta</div>
                    <div className="font-medium">
                      {isLoadingStatistics ? (
                        <SkeletonLoader className="h-5 w-16" />
                      ) : stockStatistics?.statistics?.stock_price_summary?.beta ? (
                        stockStatistics.statistics.stock_price_summary.beta.toFixed(2)
                      ) : (
                        isLoadingPriceChanges ? <SkeletonLoader className="h-5 w-16" /> : priceChanges?.beta ? priceChanges.beta.toFixed(2) : "N/A"
                      )}
                    </div>
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
                    <div className="">
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
                          {/* Remove the individual bar chart visualizations and keep only the cards */}
                          
                          {/* 2x4 grid layout for returns - always displayed */}
                          <div className="grid grid-cols-4 gap-2">
                            {/* First row: 1D, 1W, 1M, 3M */}
                            {['1D', '1W', '1M', '3M'].map((period) => {
                              // Use exact matching instead of case-insensitive
                              const returnItem = priceChanges?.returns?.find(item => 
                                item.period === period);
                              
                              return (
                                <div 
                                  key={`summary-${period}`} 
                                  className={`h-16 rounded-md flex flex-col items-center justify-center ${
                                    returnItem ? (returnItem.direction === 'up' ? 'bg-green-100' : 'bg-red-100') : 'bg-gray-100'
                                  }`}
                                >
                                  <div className={`text-xs ${
                                    returnItem ? (returnItem.direction === 'up' ? 'text-green-700' : 'text-red-700') : 'text-gray-700'
                                  }`}>
                                    {period}
                                  </div>
                                  <div className={`text-sm font-bold mt-1 ${
                                    returnItem ? (returnItem.direction === 'up' ? 'text-green-600' : 'text-red-600') : 'text-gray-600'
                                  }`}>
                                    {returnItem ? (
                                      <div className="flex items-center">
                                        {returnItem.direction === 'up' ? (
                                          <ArrowUp className="h-3 w-3 mr-1" />
                                        ) : (
                                          <ArrowDown className="h-3 w-3 mr-1" />
                                        )}
                                        {/* Show 2 decimal places */}
                                        {Math.abs(returnItem.value).toFixed(2)}%
                                      </div>
                                    ) : (
                                      <div className="flex items-center">N/A</div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            
                            {/* Second row: 6M, YTD, 1Y, 5Y */}
                            {['6M', 'YTD', '1Y', '5Y'].map((period) => {
                              // Use exact matching instead of case-insensitive
                              const returnItem = priceChanges?.returns?.find(item => 
                                item.period === period);
                              
                              return (
                                <div 
                                  key={`summary-${period}`} 
                                  className={`h-16 rounded-md flex flex-col items-center justify-center ${
                                    returnItem ? (returnItem.direction === 'up' ? 'bg-green-100' : 'bg-red-100') : 'bg-gray-100'
                                  }`}
                                >
                                  <div className={`text-xs ${
                                    returnItem ? (returnItem.direction === 'up' ? 'text-green-700' : 'text-red-700') : 'text-gray-700'
                                  }`}>
                                    {period}
                                  </div>
                                  <div className={`text-sm font-bold mt-1 ${
                                    returnItem ? (returnItem.direction === 'up' ? 'text-green-600' : 'text-red-600') : 'text-gray-600'
                                  }`}>
                                    {returnItem ? (
                                      <div className="flex items-center">
                                        {returnItem.direction === 'up' ? (
                                          <ArrowUp className="h-3 w-3 mr-1" />
                                        ) : (
                                          <ArrowDown className="h-3 w-3 mr-1" />
                                        )}
                                        {/* Show 2 decimal places */}
                                        {Math.abs(returnItem.value).toFixed(2)}%
                                      </div>
                                    ) : (
                                      <div className="flex items-center">N/A</div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
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
                      <div className="bg-muted/30 rounded-lg p-3 relative">
                        {/* Earnings cards that expand on click */}
                        <div className="flex gap-2">
                          {isLoadingEarnings ? (
                            // Show skeleton loading for each card
                            [...Array(4)].map((_, index) => (
                              <div key={index} className="flex-1 h-16 rounded-md bg-muted/50 animate-pulse"></div>
                            ))
                          ) : earningsData?.earnings && earningsData.earnings.length > 0 ? (
                            // Map through real earnings data
                            earningsData.earnings.slice(0, 4).map((item, index) => {
                              if (!item || typeof item !== 'object') {
                                return (
                                  <div key={`error-${index}`} className="flex-1 h-16 rounded-md bg-muted/30 flex flex-col items-center justify-center">
                                    <div className="text-xs text-muted-foreground">Q{4-index} {new Date().getFullYear()}</div>
                                    <div className="text-sm font-bold mt-1 text-muted-foreground">N/A</div>
                                  </div>
                                );
                              }
                              
                              try {
                                // Extract quarter info from date (e.g., "2024-01-28" -> "Q1 2024")
                                const date = new Date(item.date || '');
                                const year = date.getFullYear() || new Date().getFullYear();
                                // Determine quarter from month
                                const month = date.getMonth() || 0;
                                const quarter = Math.floor(month / 3) + 1;
                                const quarterLabel = `Q${quarter} ${year}`;
                                
                                // Ensure numeric values or use defaults
                                const eps_estimate = typeof item.eps_estimate === 'number' ? item.eps_estimate : 0;
                                const eps_actual = typeof item.eps_actual === 'number' ? item.eps_actual : 0;
                                const difference = typeof item.difference === 'number' ? item.difference : 0;
                                const surprise_prc = typeof item.surprise_prc === 'number' ? item.surprise_prc : 0;
                                
                                // Use the expandedEarnings state to determine if this card is expanded
                                const isExpanded = expandedEarnings.includes(quarterLabel);
                                
                                return (
                                  <div key={quarterLabel} className="flex flex-col w-full">
                                    {/* Summary Card - Always visible */}
                                    <div 
                                      className={`flex-1 h-16 rounded-md flex flex-col items-center justify-center cursor-pointer 
                                        ${surprise_prc >= 0 ? 'bg-green-100 hover:bg-green-200' : 'bg-red-100 hover:bg-red-200'}
                                        ${isExpanded ? (surprise_prc >= 0 ? 'bg-green-200' : 'bg-red-200') : ''}
                                        transition-colors`}
                                      onClick={() => toggleEarningsExpand(quarterLabel)}
                                    >
                                      <div className={`text-xs ${surprise_prc >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        {quarterLabel}
                                      </div>
                                      <div className={`text-sm font-bold mt-1 ${surprise_prc >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        <div className="flex items-center">
                                          {surprise_prc >= 0 ? (
                                            <ArrowUp className="h-3 w-3 mr-1" />
                                          ) : (
                                            <ArrowDown className="h-3 w-3 mr-1" />
                                          )}
                                          {Math.abs(surprise_prc).toFixed(1)}%
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Detailed Info - Only visible when expanded */}
                                    <div 
                                      className={`mt-1 overflow-hidden transition-all duration-200 ease-in-out ${
                                        isExpanded ? 'opacity-100 max-h-35' : 'opacity-0 max-h-0'
                                      }`}
                                    >
                                      <div className="bg-background rounded-md p-2 shadow-sm border">
                                        {/* Simplified metrics in a clean grid */}
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                          <div>
                                            <div className="text-xs text-muted-foreground">Estimate</div>
                                            <div className="text-sm font-medium">${eps_estimate.toFixed(2)}</div>
                                          </div>
                                          <div>
                                            <div className="text-xs text-muted-foreground">Actual</div>
                                            <div className="text-sm font-medium">${eps_actual.toFixed(2)}</div>
                                          </div>
                                          <div>
                                            <div className="text-xs text-muted-foreground">Diff.</div>
                                            <div className={`text-sm font-medium ${surprise_prc >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                              ${Math.abs(difference).toFixed(2)}
                                            </div>
                                          </div>
                                          <div>
                                            <div className="text-xs text-muted-foreground">Surprise</div>
                                            <div className={`text-sm font-medium ${surprise_prc >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                                              {surprise_prc >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                                              {Math.abs(surprise_prc).toFixed(2)}%
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              } catch (err) {
                                // Fallback for errors during rendering
                                return (
                                  <div key={`fallback-${index}`} className="flex-1 h-16 rounded-md bg-muted/30 flex flex-col items-center justify-center">
                                    <div className="text-xs text-muted-foreground">Q{4-index} {new Date().getFullYear()}</div>
                                    <div className="text-sm font-bold mt-1 text-muted-foreground">N/A</div>
                                  </div>
                                );
                              }
                            })
                          ) : (
                            // Fallback for no data
                            [...Array(4)].map((_, index) => (
                              <div key={index} className="flex-1 h-16 rounded-md bg-muted/30 flex flex-col items-center justify-center">
                                <div className="text-xs text-muted-foreground">Q{4-index} {new Date().getFullYear()}</div>
                                <div className="text-sm font-bold mt-1 text-muted-foreground">N/A</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
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
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column - Key Metrics */}
                <div>
                  <Tabs defaultValue="balance" className="w-full">
                    <TabsList className="mb-2">
                      <TabsTrigger value="balance" className="text-xs">Balance Sheet</TabsTrigger>
                      <TabsTrigger value="income" className="text-xs">Income Statement</TabsTrigger>
                    </TabsList>
                    
                    {/* Balance Sheet Tab Content */}
                    <TabsContent value="balance" className="m-0">
                      <div className="space-y-3">
                        {isLoadingFinancialHealth ? (
                          <>
                            <SkeletonLoader className="h-6" count={5} />
                          </>
                        ) : (
                          <>
                            {financialHealthData?.total_debt_to_equity_mrq && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Debt-to-Equity (MRQ)</span>
                                  <span className="text-sm font-medium">{financialHealthData.total_debt_to_equity_mrq.toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">Current Ratio</span>
                                <span className="text-sm font-medium">{financialHealthData?.currentRatio?.toFixed(2) ?? 'N/A'}</span>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">Quick Ratio</span>
                                <span className="text-sm font-medium">{financialHealthData?.quickRatio?.toFixed(2) ?? 'N/A'}</span>
                              </div>
                            </div>
                            
                            {financialHealthData?.total_cash_mrq && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Cash (MRQ)</span>
                                  <span className="text-sm font-medium">${(financialHealthData.total_cash_mrq / 1000000000).toFixed(2)}B</span>
                                </div>
                              </div>
                            )}
                            
                            {financialHealthData?.total_cash_per_share_mrq && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Cash Per Share</span>
                                  <span className="text-sm font-medium">${financialHealthData.total_cash_per_share_mrq.toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                            
                            {financialHealthData?.total_debt_mrq && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Debt (MRQ)</span>
                                  <span className="text-sm font-medium">${(financialHealthData.total_debt_mrq / 1000000000).toFixed(2)}B</span>
                                </div>
                              </div>
                            )}
                            
                            {financialHealthData?.book_value_per_share_mrq && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Book Value / Share</span>
                                  <span className="text-sm font-medium">${financialHealthData.book_value_per_share_mrq.toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </TabsContent>
                    
                    {/* Income Statement Tab Content (moved from right column) */}
                    <TabsContent value="income" className="m-0">
                      <div className="space-y-3">
                        {isLoadingFinancialHealth ? (
                          <>
                            <SkeletonLoader className="h-6" count={4} />
                          </>
                        ) : (
                          <>
                            {financialHealthData?.revenue_ttm && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Revenue (TTM)</span>
                                  <span className="text-sm font-medium">${(financialHealthData.revenue_ttm / 1000000000).toFixed(2)}B</span>
                                </div>
                              </div>
                            )}
                            
                            {financialHealthData?.revenue_per_share_ttm && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Revenue / Share</span>
                                  <span className="text-sm font-medium">${financialHealthData.revenue_per_share_ttm.toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                            
                            {financialHealthData?.gross_profit_ttm && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Gross Profit (TTM)</span>
                                  <span className="text-sm font-medium">${(financialHealthData.gross_profit_ttm / 1000000000).toFixed(2)}B</span>
                                </div>
                              </div>
                            )}
                            
                            {financialHealthData?.ebitda && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">EBITDA</span>
                                  <span className="text-sm font-medium">${(financialHealthData.ebitda / 1000000000).toFixed(2)}B</span>
                                </div>
                              </div>
                            )}
                            
                            {financialHealthData?.net_income_to_common_ttm && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Net Income (TTM)</span>
                                  <span className="text-sm font-medium">${(financialHealthData.net_income_to_common_ttm / 1000000000).toFixed(2)}B</span>
                                </div>
                              </div>
                            )}
                            
                            {financialHealthData?.diluted_eps_ttm && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Diluted EPS (TTM)</span>
                                  <span className="text-sm font-medium">${financialHealthData.diluted_eps_ttm.toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                
                {/* Right Column - Income and Cash Flow */}
                <div>
                  <Tabs defaultValue="profitability" className="w-full">
                    <TabsList className="mb-2">
                      <TabsTrigger value="profitability" className="text-xs">Profitability</TabsTrigger>
                      <TabsTrigger value="cashflow" className="text-xs">Cash Flow</TabsTrigger>
                      <TabsTrigger value="dividend" className="text-xs">Dividend</TabsTrigger>
                      <TabsTrigger value="growth" className="text-xs">Growth</TabsTrigger>
                    </TabsList>
                    
                    {/* Profitability Tab Content (moved from left column) */}
                    <TabsContent value="profitability" className="m-0">
                      <div className="space-y-3">
                        {isLoadingFinancialHealth ? (
                          <>
                            <SkeletonLoader className="h-6" count={5} />
                          </>
                        ) : (
                          <>
                            {financialHealthData?.grossMargin && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Gross Margin</span>
                                  <span className="text-sm font-medium">{(financialHealthData.grossMargin * 100).toFixed(2)}%</span>
                                </div>
                              </div>
                            )}
                            
                            {financialHealthData?.operatingMargin && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Operating Margin</span>
                                  <span className="text-sm font-medium">{(financialHealthData.operatingMargin * 100).toFixed(2)}%</span>
                                </div>
                              </div>
                            )}
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">Net Margin</span>
                                <span className="text-sm font-medium">{financialHealthData?.netMargin ? (financialHealthData.netMargin * 100).toFixed(2) + '%' : 'N/A'}</span>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">Return on Equity</span>
                                <span className="text-sm font-medium">{financialHealthData?.returnOnEquity ? (financialHealthData.returnOnEquity * 100).toFixed(2) + '%' : 'N/A'}</span>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">Return on Assets</span>
                                <span className="text-sm font-medium">{financialHealthData?.returnOnAssets ? (financialHealthData.returnOnAssets * 100).toFixed(2) + '%' : 'N/A'}</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </TabsContent>
                    
                    {/* Cash Flow Tab Content */}
                    <TabsContent value="cashflow" className="m-0">
                      <div className="space-y-3">
                        {isLoadingFinancialHealth ? (
                          <>
                            <SkeletonLoader className="h-6" count={3} />
                          </>
                        ) : (
                          <>
                            {financialHealthData?.operating_cash_flow_ttm && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Operating Cash Flow</span>
                                  <span className="text-sm font-medium">${(financialHealthData.operating_cash_flow_ttm / 1000000000).toFixed(2)}B</span>
                                </div>
                              </div>
                            )}
                            
                            {financialHealthData?.levered_free_cash_flow_ttm && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Free Cash Flow</span>
                                  <span className="text-sm font-medium">${(financialHealthData.levered_free_cash_flow_ttm / 1000000000).toFixed(2)}B</span>
                                </div>
                              </div>
                            )}
                            
                            {financialHealthData?.operating_cash_flow_ttm && financialHealthData?.revenue_ttm && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Cash Flow / Revenue</span>
                                  <span className="text-sm font-medium">
                                    {(financialHealthData.operating_cash_flow_ttm / financialHealthData.revenue_ttm * 100).toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {financialHealthData?.total_cash_mrq && financialHealthData?.total_debt_mrq && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Cash / Debt Ratio</span>
                                  <span className="text-sm font-medium">
                                    {(financialHealthData.total_cash_mrq / financialHealthData.total_debt_mrq).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </TabsContent>
                    
                    {/* Dividend Tab Content */}
                    <TabsContent value="dividend" className="m-0">
                      <div className="space-y-3">
                        {isLoadingFinancialHealth ? (
                          <>
                            <SkeletonLoader className="h-6" count={6} />
                          </>
                        ) : (
                          <>
                            {financialHealthData?.forward_annual_dividend_rate !== undefined && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Forward Annual Dividend</span>
                                  <span className="text-sm font-medium">${financialHealthData.forward_annual_dividend_rate.toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                            
                            {financialHealthData?.forward_annual_dividend_yield !== undefined && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Forward Dividend Yield</span>
                                  <span className="text-sm font-medium">{(financialHealthData.forward_annual_dividend_yield * 100).toFixed(2)}%</span>
                                </div>
                              </div>
                            )}
                            
                            {financialHealthData?.trailing_annual_dividend_rate !== undefined && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Trailing Annual Dividend</span>
                                  <span className="text-sm font-medium">${financialHealthData.trailing_annual_dividend_rate.toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                            
                            {financialHealthData?.trailing_annual_dividend_yield !== undefined && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Trailing Dividend Yield</span>
                                  <span className="text-sm font-medium">{(financialHealthData.trailing_annual_dividend_yield * 100).toFixed(2)}%</span>
                                </div>
                              </div>
                            )}
                            
                            {financialHealthData?.five_year_average_dividend_yield !== undefined && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">5-Year Avg Dividend Yield</span>
                                  <span className="text-sm font-medium">{(financialHealthData.five_year_average_dividend_yield * 100).toFixed(2)}%</span>
                                </div>
                              </div>
                            )}
                            
                            {financialHealthData?.payout_ratio !== undefined && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Payout Ratio</span>
                                  <span className="text-sm font-medium">{financialHealthData.payout_ratio.toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                            
                            {financialHealthData?.dividend_frequency && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Dividend Frequency</span>
                                  <span className="text-sm font-medium">{financialHealthData.dividend_frequency}</span>
                                </div>
                              </div>
                            )}
                            
                            {financialHealthData?.dividend_date && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Dividend Date</span>
                                  <span className="text-sm font-medium">{financialHealthData.dividend_date}</span>
                                </div>
                              </div>
                            )}
                            
                            {financialHealthData?.ex_dividend_date && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Ex-Dividend Date</span>
                                  <span className="text-sm font-medium">{financialHealthData.ex_dividend_date}</span>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </TabsContent>
                    
                    {/* Growth Metrics Tab Content */}
                    <TabsContent value="growth" className="m-0">
                      <div className="space-y-3">
                        {isLoadingFinancialHealth ? (
                          <>
                            <SkeletonLoader className="h-6" count={2} />
                          </>
                        ) : (
                          <>
                            {financialHealthData?.quarterly_revenue_growth && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Revenue Growth (QoQ)</span>
                                  <span className={`text-sm font-medium ${financialHealthData.quarterly_revenue_growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {(financialHealthData.quarterly_revenue_growth * 100).toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {financialHealthData?.quarterly_earnings_growth_yoy && (
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Earnings Growth (YoY)</span>
                                  <span className={`text-sm font-medium ${financialHealthData.quarterly_earnings_growth_yoy > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {(financialHealthData.quarterly_earnings_growth_yoy * 100).toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
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
                        <div className="text-sm text-muted-foreground">P/E Ratio (TTM)</div>
                        <div className="font-medium">
                          {isLoadingStatistics ? (
                            <SkeletonLoader className="h-5 w-16" />
                          ) : stockStatistics?.statistics?.valuations_metrics?.trailing_pe ? (
                            stockStatistics.statistics.valuations_metrics.trailing_pe.toFixed(2)
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Forward P/E</div>
                        <div className="font-medium">
                          {isLoadingStatistics ? (
                            <SkeletonLoader className="h-5 w-16" />
                          ) : stockStatistics?.statistics?.valuations_metrics?.forward_pe ? (
                            stockStatistics.statistics.valuations_metrics.forward_pe.toFixed(2)
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">PEG Ratio</div>
                        <div className="font-medium">
                          {isLoadingStatistics ? (
                            <SkeletonLoader className="h-5 w-16" />
                          ) : stockStatistics?.statistics?.valuations_metrics?.peg_ratio ? (
                            stockStatistics.statistics.valuations_metrics.peg_ratio.toFixed(2)
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Price/Sales (TTM)</div>
                        <div className="font-medium">
                          {isLoadingStatistics ? (
                            <SkeletonLoader className="h-5 w-16" />
                          ) : stockStatistics?.statistics?.valuations_metrics?.price_to_sales_ttm ? (
                            stockStatistics.statistics.valuations_metrics.price_to_sales_ttm.toFixed(2)
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Price/Book (MRQ)</div>
                        <div className="font-medium">
                          {isLoadingStatistics ? (
                            <SkeletonLoader className="h-5 w-16" />
                          ) : stockStatistics?.statistics?.valuations_metrics?.price_to_book_mrq ? (
                            stockStatistics.statistics.valuations_metrics.price_to_book_mrq.toFixed(2)
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">EV/Revenue</div>
                        <div className="font-medium">
                          {isLoadingStatistics ? (
                            <SkeletonLoader className="h-5 w-16" />
                          ) : stockStatistics?.statistics?.valuations_metrics?.enterprise_to_revenue ? (
                            stockStatistics.statistics.valuations_metrics.enterprise_to_revenue.toFixed(2)
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">EV/EBITDA</div>
                        <div className="font-medium">
                          {isLoadingStatistics ? (
                            <SkeletonLoader className="h-5 w-16" />
                          ) : stockStatistics?.statistics?.valuations_metrics?.enterprise_to_ebitda ? (
                            stockStatistics.statistics.valuations_metrics.enterprise_to_ebitda.toFixed(2)
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Earnings Per Share</div>
                        <div className="font-medium">
                          {isLoadingStatistics || isLoadingEarnings ? (
                            <SkeletonLoader className="h-5 w-16" />
                          ) : earningsData?.earnings && earningsData.earnings.length > 0 ? (
                            `$${earningsData.earnings[0].eps_actual.toFixed(2)}`
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Price Target</h4>
                  {isLoadingPriceTarget ? (
                    <div className="space-y-2">
                      <SkeletonLoader className="h-5 w-full" />
                      <SkeletonLoader className="h-10 w-full" />
                      <SkeletonLoader className="h-5 w-full" />
                    </div>
                  ) : priceTargetData && priceTargetData.price_target ? (
                    <div className="flex flex-col items-center">
                      <div className="text-3xl font-bold mb-1">
                        ${priceTargetData.price_target.average.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Current: ${priceTargetData.price_target.current.toFixed(2)}
                      </div>
                      
                      {stockData?.price && (
                        <div className={`px-3 py-1 rounded-full text-sm border text-center w-40 mb-3 ${
                          stockData.price < priceTargetData.price_target.average * 0.9 
                            ? "bg-green-100 text-green-700 border-green-300" 
                            : stockData.price > priceTargetData.price_target.average * 1.1
                              ? "bg-red-100 text-red-700 border-red-300"
                              : "bg-amber-100 text-amber-700 border-amber-300"
                        }`}>
                          {stockData.price < priceTargetData.price_target.average * 0.9 
                            ? "Undervalued" 
                            : stockData.price > priceTargetData.price_target.average * 1.1
                              ? "Overvalued"
                              : "Fair Value"}
                        </div>
                      )}
                      
                      <PriceRangeGauge 
                        low={priceTargetData.price_target.low} 
                        high={priceTargetData.price_target.high} 
                        current={stockData?.price || 0} 
                        label="Analyst Price Target Range" 
                      />
                    </div>
                  ) : (
                    <div className="text-muted-foreground">No price target data available</div>
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
              <Tabs defaultValue="sma" className="w-full">
                <TabsList className="mb-2">
                  <TabsTrigger value="sma" className="text-xs">SMA</TabsTrigger>
                  <TabsTrigger value="ema" className="text-xs">EMA</TabsTrigger>
                  <TabsTrigger value="rsi" className="text-xs">RSI</TabsTrigger>
                  <TabsTrigger value="macd" className="text-xs">MACD</TabsTrigger>
                </TabsList>
                
                {/* SMA Tab Content */}
                <TabsContent value="sma" className="m-0">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium mb-3">Simple Moving Average</h4>
                      <div className="text-xs text-muted-foreground mb-4">
                        <p>SMA calculates the average of prices over a specified time period, showing trend direction and support/resistance levels.</p>
                      </div>
                      {isLoadingTechnical ? (
                        <SkeletonLoader className="h-4" count={4} />
                      ) : (
                        <>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">20-Day SMA</span>
                              {smaData && smaData.values && smaData.values.length > 0 && (
                                <span className={`text-sm font-medium ${
                                  (stockData?.price ?? 0) > (parseFloat(smaData.values[0]?.ma || '0')) 
                                  ? 'text-green-600' : 'text-red-600'}`}>
                                  ${parseFloat(smaData.values[0]?.ma || '0').toFixed(2)}
                                </span>
                              )}
                              {(!smaData || !smaData.values || smaData.values.length === 0) && (
                                <span className="text-sm font-medium">N/A</span>
                              )}
                            </div>
                            {smaData?.values && smaData.values.length > 0 && (
                              <>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    (stockData?.price ?? 0) > (parseFloat(smaData.values[0]?.ma || '0')) 
                                      ? "bg-green-100 text-green-800 border-green-200" 
                                      : "bg-red-100 text-red-800 border-red-200"
                                  }
                                >
                                  {(stockData?.price ?? 0) > (parseFloat(smaData.values[0]?.ma || '0')) ? 'Bullish' : 'Bearish'}
                                </Badge>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Price is {(stockData?.price ?? 0) > (parseFloat(smaData.values[0]?.ma || '0')) ? 'above' : 'below'} 20-day SMA
                                </div>
                              </>
                            )}
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">50-Day SMA</span>
                              <span className={`text-sm font-medium ${(stockData?.price ?? 0) > (technicalData?.ma50 ?? 0) ? 'text-green-600' : 'text-red-600'}`}>
                                ${technicalData?.ma50?.toFixed(2) ?? 'N/A'}
                              </span>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={
                                (stockData?.price ?? 0) > (technicalData?.ma50 ?? 0) 
                                  ? "bg-green-100 text-green-800 border-green-200" 
                                  : "bg-red-100 text-red-800 border-red-200"
                              }
                            >
                              {(stockData?.price ?? 0) > (technicalData?.ma50 ?? 0) ? 'Bullish' : 'Bearish'}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              Price is {(stockData?.price ?? 0) > (technicalData?.ma50 ?? 0) ? 'above' : 'below'} 50-day SMA
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">200-Day SMA</span>
                              <span className={`text-sm font-medium ${(stockData?.price ?? 0) > (technicalData?.ma200 ?? 0) ? 'text-green-600' : 'text-red-600'}`}>
                                ${technicalData?.ma200?.toFixed(2) ?? 'N/A'}
                              </span>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={
                                (stockData?.price ?? 0) > (technicalData?.ma200 ?? 0) 
                                  ? "bg-green-100 text-green-800 border-green-200" 
                                  : "bg-red-100 text-red-800 border-red-200"
                              }
                            >
                              {(stockData?.price ?? 0) > (technicalData?.ma200 ?? 0) ? 'Bullish' : 'Bearish'}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              Price is {(stockData?.price ?? 0) > (technicalData?.ma200 ?? 0) ? 'above' : 'below'} 200-day SMA
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <div className="h-full flex flex-col">
                        {isLoadingSMA ? (
                          <div className="h-[350px] flex items-center justify-center">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                          </div>
                        ) : !smaData?.values?.length ? (
                          <div className="h-[350px] flex items-center justify-center">
                            <p className="text-muted-foreground">No SMA data available</p>
                          </div>
                        ) : (
                          <div className="h-[350px]">
                            {/* Chart component using all SMA datasets */}
                            <SMAChart 
                              data={smaData} 
                              data50={sma50Data} 
                              data200={sma200Data} 
                              onTimeframeChange={handleSmaTimeframeChange}
                              timeframe={smaTimeframe}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* EMA Tab Content */}
                <TabsContent value="ema" className="m-0">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium mb-3">Exponential Moving Average</h4>
                      <div className="text-xs text-muted-foreground mb-4">
                        <p>EMA gives more weight to recent prices, making it more responsive to new information than SMA.</p>
                      </div>
                      {isLoadingTechnical ? (
                        <SkeletonLoader className="h-4" count={4} />
                      ) : (
                        <>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">20-Day EMA</span>
                              {emaData && emaData.values && emaData.values.length > 0 && (
                                <span className={`text-sm font-medium ${
                                  (stockData?.price ?? 0) > (parseFloat(emaData.values[0]?.ma || '0')) 
                                  ? 'text-green-600' : 'text-red-600'}`}>
                                  ${parseFloat(emaData.values[0]?.ma || '0').toFixed(2)}
                                </span>
                              )}
                              {(!emaData || !emaData.values || emaData.values.length === 0) && (
                                <span className="text-sm font-medium">N/A</span>
                              )}
                            </div>
                            {emaData?.values && emaData.values.length > 0 && (
                              <>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    (stockData?.price ?? 0) > (parseFloat(emaData.values[0]?.ma || '0')) 
                                      ? "bg-green-100 text-green-800 border-green-200" 
                                      : "bg-red-100 text-red-800 border-red-200"
                                  }
                                >
                                  {(stockData?.price ?? 0) > (parseFloat(emaData.values[0]?.ma || '0')) ? 'Bullish' : 'Bearish'}
                                </Badge>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Price is {(stockData?.price ?? 0) > (parseFloat(emaData.values[0]?.ma || '0')) ? 'above' : 'below'} 20-day EMA
                                </div>
                              </>
                            )}
                          </div>
                          
                          <div className="mt-4">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">50-Day EMA</span>
                              {ema50Data && ema50Data.values && ema50Data.values.length > 0 && (
                                <span className={`text-sm font-medium ${
                                  (stockData?.price ?? 0) > (parseFloat(ema50Data.values[0]?.ma || '0')) 
                                  ? 'text-green-600' : 'text-red-600'}`}>
                                  ${parseFloat(ema50Data.values[0]?.ma || '0').toFixed(2)}
                                </span>
                              )}
                              {(!ema50Data || !ema50Data.values || ema50Data.values.length === 0) && (
                                <span className="text-sm font-medium">N/A</span>
                              )}
                            </div>
                            {ema50Data?.values && ema50Data.values.length > 0 && (
                              <>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    (stockData?.price ?? 0) > (parseFloat(ema50Data.values[0]?.ma || '0')) 
                                      ? "bg-green-100 text-green-800 border-green-200" 
                                      : "bg-red-100 text-red-800 border-red-200"
                                  }
                                >
                                  {(stockData?.price ?? 0) > (parseFloat(ema50Data.values[0]?.ma || '0')) ? 'Bullish' : 'Bearish'}
                                </Badge>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Price is {(stockData?.price ?? 0) > (parseFloat(ema50Data.values[0]?.ma || '0')) ? 'above' : 'below'} 50-day EMA
                                </div>
                              </>
                            )}
                          </div>
                          
                          <div className="mt-4">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">200-Day EMA</span>
                              {ema200Data && ema200Data.values && ema200Data.values.length > 0 && (
                                <span className={`text-sm font-medium ${
                                  (stockData?.price ?? 0) > (parseFloat(ema200Data.values[0]?.ma || '0')) 
                                  ? 'text-green-600' : 'text-red-600'}`}>
                                  ${parseFloat(ema200Data.values[0]?.ma || '0').toFixed(2)}
                                </span>
                              )}
                              {(!ema200Data || !ema200Data.values || ema200Data.values.length === 0) && (
                                <span className="text-sm font-medium">N/A</span>
                              )}
                            </div>
                            {ema200Data?.values && ema200Data.values.length > 0 && (
                              <>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    (stockData?.price ?? 0) > (parseFloat(ema200Data.values[0]?.ma || '0')) 
                                      ? "bg-green-100 text-green-800 border-green-200" 
                                      : "bg-red-100 text-red-800 border-red-200"
                                  }
                                >
                                  {(stockData?.price ?? 0) > (parseFloat(ema200Data.values[0]?.ma || '0')) ? 'Bullish' : 'Bearish'}
                                </Badge>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Price is {(stockData?.price ?? 0) > (parseFloat(ema200Data.values[0]?.ma || '0')) ? 'above' : 'below'} 200-day EMA
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <div className="h-full flex flex-col">
                        {isLoadingEMA ? (
                          <div className="h-[350px] flex items-center justify-center">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                          </div>
                        ) : !emaData?.values?.length ? (
                          <div className="h-[350px] flex items-center justify-center">
                            <p className="text-muted-foreground">No EMA data available</p>
                          </div>
                        ) : (
                          <div className="h-[350px]">
                            {/* Chart component using all EMA datasets */}
                            <EMAChart 
                              data={emaData} 
                              data50={ema50Data} 
                              data200={ema200Data}
                              onTimeframeChange={handleEmaTimeframeChange}
                              timeframe={emaTimeframe} 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* RSI Tab Content */}
                <TabsContent value="rsi" className="m-0">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium mb-3">Relative Strength Index</h4>
                      <div className="text-xs text-muted-foreground mb-4">
                        <p>RSI measures the speed and magnitude of price movements. Values above 70 indicate overbought conditions, while below 30 suggest oversold conditions.</p>
                      </div>
                      {isLoadingTechnical || rsiLoading ? (
                        <SkeletonLoader className="h-4" count={4} />
                      ) : (
                        <>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">14-Day RSI</span>
                              <span className="text-sm font-medium">
                                {(polygonRsi ?? technicalData?.rsi ?? 'N/A')}
                              </span>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={
                                ((polygonRsi ?? technicalData?.rsi ?? 0) > 70)
                                  ? "bg-red-100 text-red-800 border-red-200" 
                                  : ((polygonRsi ?? technicalData?.rsi ?? 0) < 30)
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-200"
                              }
                            >
                              {((polygonRsi ?? technicalData?.rsi ?? 0) > 70) 
                                ? 'Overbought' 
                                : ((polygonRsi ?? technicalData?.rsi ?? 0) < 30)
                                ? 'Oversold'
                                : 'Neutral'}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {((polygonRsi ?? technicalData?.rsi ?? 0) > 70) 
                                ? 'RSI above 70 suggests a potential sell signal' 
                                : ((polygonRsi ?? technicalData?.rsi ?? 0) < 30)
                                ? 'RSI below 30 suggests a potential buy signal'
                                : 'RSI in neutral range (30-70)'}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <div className="h-full flex flex-col">
                        {isLoadingRSIChart ? (
                          <div className="h-[350px] flex items-center justify-center">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                          </div>
                        ) : (!rsiData || !rsiData.values || rsiData.values.length === 0) ? (
                          <div className="h-[350px] flex items-center justify-center">
                            <p className="text-muted-foreground">No RSI data available</p>
                          </div>
                        ) : (
                          <div className="h-[350px]">
                            {/* RSI Chart component */}
                            <RSIChart 
                              data={rsiData}
                              onTimeframeChange={handleRsiTimeframeChange}
                              timeframe={rsiTimeframe}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* MACD Tab Content */}
                <TabsContent value="macd" className="m-0">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium mb-3">Moving Average Convergence-Divergence</h4>
                      <div className="text-xs text-muted-foreground mb-4">
                        <p className="mb-1">MACD is a trend-following momentum indicator that shows the relationship between two moving averages of a security's price.</p>
                        <p>The MACD is calculated by subtracting the 26-period EMA from the 12-period EMA.</p>
                      </div>
                      {isLoadingTechnical ? (
                        <SkeletonLoader className="h-4" count={4} />
                      ) : (
                        <>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">MACD</span>
                              <span className="text-sm font-medium">
                                {technicalData?.macd !== undefined ? technicalData?.macd?.toFixed(2) : 'N/A'}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">Signal</span>
                              <span className="text-sm font-medium">
                                {macdData?.values && macdData.values.length > 0 ? parseFloat(macdData.values[0]?.macd_signal || '0').toFixed(2) : 'N/A'}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">Histogram</span>
                              <span className="text-sm font-medium">
                                {macdData?.values && macdData.values.length > 0 ? parseFloat(macdData.values[0]?.macd_hist || '0').toFixed(2) : 'N/A'}
                              </span>
                            </div>
                          </div>
                          
                          {/* MACD Signals */}
                          {!isLoadingMACD && macdSignals && (
                            <div className="mt-4">
                              <div className="space-y-2">
                                {macdSignals.bullishCrossover && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200 mr-2 hover:bg-green-100">
                                    Bullish Crossover
                                  </Badge>
                                )}
                                {macdSignals.bearishCrossover && (
                                  <Badge className="bg-red-100 text-red-800 border-red-200 mr-2 hover:bg-red-100">
                                    Bearish Crossover
                                  </Badge>
                                )}
                                {macdSignals.bullishZeroCrossover && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200 mr-2 hover:bg-green-100">
                                    Zero Line Bullish Cross
                                  </Badge>
                                )}
                                {macdSignals.bearishZeroCrossover && (
                                  <Badge className="bg-red-100 text-red-800 border-red-200 mr-2 hover:bg-red-100">
                                    Zero Line Bearish Cross
                                  </Badge>
                                )}
                                {macdSignals.bullishDivergence && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200 mr-2 hover:bg-green-100">
                                    Bullish Divergence
                                  </Badge>
                                )}
                                {macdSignals.bearishDivergence && (
                                  <Badge className="bg-red-100 text-red-800 border-red-200 mr-2 hover:bg-red-100">
                                    Bearish Divergence
                                  </Badge>
                                )}
                                {macdSignals.histogramIncreasing && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200 mr-2 hover:bg-green-100">
                                    Momentum Increasing
                                  </Badge>
                                )}
                                {macdSignals.histogramDecreasing && (
                                  <Badge className="bg-red-100 text-red-800 border-red-200 mr-2 hover:bg-red-100">
                                    Momentum Decreasing
                                  </Badge>
                                )}
                                {!macdSignals.bullishCrossover && 
                                 !macdSignals.bearishCrossover && 
                                 !macdSignals.bullishZeroCrossover && 
                                 !macdSignals.bearishZeroCrossover && 
                                 !macdSignals.bullishDivergence && 
                                 !macdSignals.bearishDivergence && 
                                 !macdSignals.histogramIncreasing && 
                                 !macdSignals.histogramDecreasing && (
                                  <div className="text-xs text-muted-foreground">
                                    No recent signals detected
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <div className="h-full flex flex-col">
                        {isLoadingMACD ? (
                          <div className="h-[350px] flex items-center justify-center">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                          </div>
                        ) : (!macdData || !macdData.values || macdData.values.length === 0) ? (
                          <div className="h-[350px] flex items-center justify-center">
                            <p className="text-muted-foreground">No MACD data available</p>
                          </div>
                        ) : (
                          <div className="h-[350px]">
                            {/* MACD Chart component */}
                            <MACDChart 
                              data={macdData}
                              onTimeframeChange={handleMacdTimeframeChange}
                              timeframe={macdTimeframe}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
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
                  {isLoadingAnalystRatings || isLoadingRecommendations ? (
                    <SkeletonLoader className="h-16" />
                  ) : recommendationsData && recommendationsData.trends ? (
                    <div className="flex flex-col space-y-4">
                      {/* Chart with timeframe toggles in top right */}
                      <div className="relative h-56">
                        <div className="absolute top-0 right-0 z-10">
                          <div className="inline-flex rounded-md shadow-sm">
                            {[
                              { value: 'current', label: 'Current' },
                              { value: '1m', label: '1M' },
                              { value: '2m', label: '2M' },
                              { value: '3m', label: '3M' }
                            ].map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleRecommendationTimeframeChange(option.value as 'current' | '1m' | '2m' | '3m')}
                                className={cn(
                                  "relative px-2 py-1 text-xs font-medium",
                                  option.value === recommendationTimeframe
                                    ? "bg-slate-600 text-white" 
                                    : "bg-slate-200 text-slate-700 hover:bg-slate-300",
                                  // Left button
                                  option.value === 'current' ? "rounded-l-md" : "",
                                  // Right button
                                  option.value === '3m' ? "rounded-r-md" : "",
                                )}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={(() => {
                                const trendData = getRecommendationDataForTimeframe();
                                return [
                                  { 
                                    name: "Strong Buy", 
                                    value: trendData?.strong_buy || 0
                                  },
                                  { 
                                    name: "Buy", 
                                    value: trendData?.buy || 0
                                  },
                                  { 
                                    name: "Hold", 
                                    value: trendData?.hold || 0
                                  },
                                  { 
                                    name: "Sell", 
                                    value: trendData?.sell || 0
                                  },
                                  { 
                                    name: "Strong Sell", 
                                    value: trendData?.strong_sell || 0
                                  }
                                ];
                              })()}
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
                        {(() => {
                          const trendData = getRecommendationDataForTimeframe();
                          return (
                            <>
                              <div>
                                <div className="font-medium text-green-600">Strong Buy</div>
                                <div className="font-bold">{trendData?.strong_buy || 0}</div>
                              </div>
                              <div>
                                <div className="font-medium text-green-500">Buy</div>
                                <div className="font-bold">{trendData?.buy || 0}</div>
                              </div>
                              <div>
                                <div className="font-medium text-yellow-600">Hold</div>
                                <div className="font-bold">{trendData?.hold || 0}</div>
                              </div>
                              <div>
                                <div className="font-medium text-red-500">Sell</div>
                                <div className="font-bold">{trendData?.sell || 0}</div>
                              </div>
                              <div>
                                <div className="font-medium text-red-600">Strong Sell</div>
                                <div className="font-bold">{trendData?.strong_sell || 0}</div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      
                      {/* Add a rating score if available */}
                      {recommendationsData.rating && (
                        <div className="text-center mt-2">
                          <span className="text-sm font-medium">Overall Rating: </span>
                          <span className={`font-bold ${
                            recommendationsData.rating >= 8 ? 'text-green-600' :
                            recommendationsData.rating >= 6 ? 'text-green-500' :
                            recommendationsData.rating >= 4 ? 'text-yellow-600' :
                            recommendationsData.rating >= 2 ? 'text-red-500' : 'text-red-600'
                          }`}>
                            {recommendationsData.rating.toFixed(1)}/10
                          </span>
                        </div>
                      )}
                      
                      {/* Timeframe indicator */}
                      <div className="text-xs text-center text-muted-foreground">
                        {recommendationTimeframe === 'current' ? 'Current month recommendations' : 
                         recommendationTimeframe === '1m' ? 'Last month recommendations' :
                         recommendationTimeframe === '2m' ? '2 months ago recommendations' :
                         '3 months ago recommendations'}
                      </div>
                    </div>
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
import { useState } from "react";
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
  ChevronDown,
  Cpu, 
  DollarSign, 
  LineChart, 
  PieChart,
  Search, 
  Star,
  TrendingDown, 
  TrendingUp 
} from "lucide-react";
import { AIExplanationPopup } from "@/components/AIExplanationPopup";

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

// First part of the component declaration - we'll complete it in subsequent edits
const StockAnalysis = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<string | null>("AAPL");
  const [timeframe, setTimeframe] = useState("1Y");
  const [showAIExplanation, setShowAIExplanation] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
    section: string;
  }>({
    isOpen: false,
    title: "",
    content: "",
    section: ""
  });

  // Mock stock data
  const stockData = {
    ticker: "AAPL",
    name: "Apple Inc.",
    price: 187.68,
    change: 1.25,
    changePercent: 0.67,
    marketCap: "2.94T",
    peRatio: 29.12,
    dividendYield: 0.54,
    weekRange: "123.45 - 198.23",
    volume: "45.2M",
    avgVolume: "62.8M"
  };

  // Mock performance data
  const performanceData = {
    returns: [
      { period: "1D", value: 0.67, direction: "up" },
      { period: "1W", value: 1.23, direction: "up" },
      { period: "1M", value: -2.45, direction: "down" },
      { period: "3M", value: 5.67, direction: "up" },
      { period: "6M", value: 8.92, direction: "up" },
      { period: "YTD", value: 12.34, direction: "up" },
      { period: "1Y", value: 15.67, direction: "up" },
      { period: "3Y", value: 67.89, direction: "up" },
      { period: "5Y", value: 112.45, direction: "up" }
    ],
    volatility: 18.5,
    sharpeRatio: 1.2,
    beta: 1.15,
    alpha: 2.3
  };

  // Mock financial health data
  const financialHealthData = {
    debtToEquity: 1.2,
    currentRatio: 1.5,
    quickRatio: 1.3,
    returnOnEquity: 35.6,
    returnOnAssets: 12.8,
    grossMargin: 43.2,
    operatingMargin: 30.1,
    netMargin: 25.4,
    healthScore: 82
  };

  // Mock valuation data
  const valuationData = {
    peRatio: 29.12,
    forwardPE: 25.6,
    pegRatio: 1.8,
    priceToBook: 32.4,
    priceToSales: 7.2,
    evToEbitda: 18.5,
    dividendYield: 0.54,
    dividendGrowth5Y: 8.2,
    fairValueLow: 165.0,
    fairValueHigh: 210.0
  };

  // Mock technical indicators
  const technicalData = {
    ma50: 182.45,
    ma200: 175.67,
    rsi: 58,
    macdSignal: "Bullish",
    bollingerPosition: "Middle",
    support: 180.0,
    resistance: 195.0,
    signalSummary: "Neutral"
  };

  // Mock news and sentiment data
  const newsData = {
    recentNews: [
      { title: "Apple announces new product line", sentiment: "positive", source: "TechCrunch", date: "2 hours ago" },
      { title: "Analysts raise price target on Apple stock", sentiment: "positive", source: "CNBC", date: "5 hours ago" },
      { title: "Supply chain issues may impact production", sentiment: "negative", source: "Bloomberg", date: "1 day ago" }
    ],
    analystRatings: {
      buy: 25,
      hold: 8,
      sell: 2
    },
    averagePriceTarget: 205.0,
    sentimentScore: 72
  };

  // Mock risk data
  const riskData = {
    beta: 1.15,
    maxDrawdown: -28.5,
    valueAtRisk: 3.2,
    standardDeviation: 22.4,
    downside: 15.8,
    correlationSP500: 0.82,
    riskScore: 65
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

  const handleAIExplanationOpen = (title: string, content: string, section: string) => {
    setShowAIExplanation({
      isOpen: true,
      title,
      content,
      section
    });
  };

  const handleAIExplanationClose = () => {
    setShowAIExplanation({
      ...showAIExplanation,
      isOpen: false
    });
  };

  // Beginning of the return statement - we'll complete it in subsequent edits
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Stock Search Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Stock Analysis</CardTitle>
          <CardDescription>Search and analyze individual stocks</CardDescription>
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
              />
              {searchQuery && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg">
                  <div className="p-2">
                    <div 
                      className="flex items-center space-x-2 rounded-md p-2 hover:bg-muted cursor-pointer"
                      onClick={() => {
                        setSelectedStock("AAPL");
                        setSearchQuery("");
                      }}
                    >
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-semibold">AAPL</span>
                      </div>
                      <div>
                        <div className="font-medium">Apple Inc.</div>
                        <div className="text-sm text-muted-foreground">NASDAQ: AAPL</div>
                      </div>
                    </div>
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

      {selectedStock && (
        <>
          {/* Stock Overview Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mr-3">
                    <span className="text-sm font-semibold">{stockData.ticker}</span>
                  </div>
                  <div>
                    <CardTitle className="text-xl flex items-center">
                      {stockData.name} ({stockData.ticker})
                    </CardTitle>
                    <div className="flex items-center mt-1">
                      <span className="text-2xl font-bold mr-2">${stockData.price}</span>
                      <span className={`flex items-center ${stockData.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stockData.change > 0 ? (
                          <ArrowUp className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDown className="h-4 w-4 mr-1" />
                        )}
                        ${Math.abs(stockData.change)} ({Math.abs(stockData.changePercent)}%)
                      </span>
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
                    aiExplanations.overview.content,
                    "overview"
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
                
                {/* Price chart */}
                <MockChart type="Price" height={250} />
                
                {/* Key metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Market Cap</div>
                    <div className="font-medium">${stockData.marketCap}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">P/E Ratio</div>
                    <div className="font-medium">{stockData.peRatio}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Dividend Yield</div>
                    <div className="font-medium">{stockData.dividendYield}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">52-Week Range</div>
                    <div className="font-medium">${stockData.weekRange}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Volume</div>
                    <div className="font-medium">{stockData.volume}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Avg. Volume</div>
                    <div className="font-medium">{stockData.avgVolume}</div>
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
                  aiExplanations.performance.content,
                  "performance"
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
                    {performanceData.returns.map((item) => (
                      <div key={item.period} className="flex items-center justify-between">
                        <span className="text-sm">{item.period}</span>
                        <div className="flex items-center">
                          <div className="w-32 h-2 bg-muted rounded-full mr-3 overflow-hidden">
                            <div 
                              className={`h-full ${item.direction === 'up' ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(Math.abs(item.value) * 2, 100)}%` }}
                            ></div>
                          </div>
                          <span 
                            className={`text-sm font-medium ${
                              item.direction === 'up' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {item.direction === 'up' ? '+' : '-'}{Math.abs(item.value)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Performance Metrics</h4>
                  <MockChart type="Performance vs Benchmark" height={150} />
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Volatility (Annual)</div>
                      <div className="font-medium">{performanceData.volatility}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                      <div className="font-medium">{performanceData.sharpeRatio}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Beta</div>
                      <div className="font-medium">{performanceData.beta}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Alpha</div>
                      <div className="font-medium">{performanceData.alpha}%</div>
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
                  aiExplanations.financial.content,
                  "financial"
                )}
              >
                <Cpu className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-40 h-40">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{financialHealthData.healthScore}</div>
                        <div className="text-sm text-muted-foreground">Health Score</div>
                      </div>
                    </div>
                    <MockChart type="Financial Health Radar" height={160} />
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Balance Sheet Metrics</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Debt-to-Equity</span>
                        <span className="text-sm font-medium">{financialHealthData.debtToEquity}</span>
                      </div>
                      <Progress value={financialHealthData.debtToEquity * 25} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Current Ratio</span>
                        <span className="text-sm font-medium">{financialHealthData.currentRatio}</span>
                      </div>
                      <Progress value={financialHealthData.currentRatio * 33} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Quick Ratio</span>
                        <span className="text-sm font-medium">{financialHealthData.quickRatio}</span>
                      </div>
                      <Progress value={financialHealthData.quickRatio * 33} className="h-2" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Profitability Metrics</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Return on Equity</span>
                        <span className="text-sm font-medium">{financialHealthData.returnOnEquity}%</span>
                      </div>
                      <Progress value={financialHealthData.returnOnEquity} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Return on Assets</span>
                        <span className="text-sm font-medium">{financialHealthData.returnOnAssets}%</span>
                      </div>
                      <Progress value={financialHealthData.returnOnAssets * 2} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Net Margin</span>
                        <span className="text-sm font-medium">{financialHealthData.netMargin}%</span>
                      </div>
                      <Progress value={financialHealthData.netMargin * 2} className="h-2" />
                    </div>
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
                  aiExplanations.valuation.content,
                  "valuation"
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
                        <div className="font-medium">{valuationData.peRatio}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Forward P/E</div>
                        <div className="font-medium">{valuationData.forwardPE}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">PEG Ratio</div>
                        <div className="font-medium">{valuationData.pegRatio}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Price/Book</div>
                        <div className="font-medium">{valuationData.priceToBook}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Price/Sales</div>
                        <div className="font-medium">{valuationData.priceToSales}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">EV/EBITDA</div>
                        <div className="font-medium">{valuationData.evToEbitda}</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium mb-2">Dividend Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Dividend Yield</div>
                          <div className="font-medium">{valuationData.dividendYield}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">5Y Dividend Growth</div>
                          <div className="font-medium">{valuationData.dividendGrowth5Y}%</div>
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
                      <div 
                        className="absolute bottom-0 h-6 w-1 bg-black"
                        style={{ left: `${(stockData.price - valuationData.fairValueLow) / (valuationData.fairValueHigh - valuationData.fairValueLow) * 100}%` }}
                      ></div>
                      <div 
                        className="absolute -top-1 text-xs"
                        style={{ left: '0%' }}
                      >
                        ${valuationData.fairValueLow}
                      </div>
                      <div 
                        className="absolute -top-1 text-xs text-right"
                        style={{ right: '0%' }}
                      >
                        ${valuationData.fairValueHigh}
                      </div>
                      <div 
                        className="absolute -bottom-6 text-xs font-medium"
                        style={{ left: `${(stockData.price - valuationData.fairValueLow) / (valuationData.fairValueHigh - valuationData.fairValueLow) * 100}%`, transform: 'translateX(-50%)' }}
                      >
                        Current: ${stockData.price}
                      </div>
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
                  aiExplanations.technical.content,
                  "technical"
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
                    <div className="flex justify-between">
                      <span className="text-sm">50-Day MA</span>
                      <span className={`text-sm font-medium ${stockData.price > technicalData.ma50 ? 'text-green-600' : 'text-red-600'}`}>
                        ${technicalData.ma50}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">200-Day MA</span>
                      <span className={`text-sm font-medium ${stockData.price > technicalData.ma200 ? 'text-green-600' : 'text-red-600'}`}>
                        ${technicalData.ma200}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Support Level</span>
                      <span className="text-sm font-medium">${technicalData.support}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Resistance Level</span>
                      <span className="text-sm font-medium">${technicalData.resistance}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <h4 className="font-medium mb-3">Momentum Indicators</h4>
                  <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                    <GaugeChart value={technicalData.rsi} min={0} max={100} label="RSI" />
                    
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">MACD Signal</div>
                      <Badge 
                        variant="outline" 
                        className={
                          technicalData.macdSignal === "Bullish" 
                            ? "bg-green-100 text-green-800 border-green-200" 
                            : technicalData.macdSignal === "Bearish"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : "bg-yellow-100 text-yellow-800 border-yellow-200"
                        }
                      >
                        {technicalData.macdSignal}
                      </Badge>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">Bollinger Position</div>
                      <div className="font-medium">{technicalData.bollingerPosition}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <h4 className="font-medium mb-3">Signal Summary</h4>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-muted mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {technicalData.signalSummary}
                          </div>
                          <div className="text-sm text-muted-foreground">Overall Signal</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="text-center">
                          <div className="text-sm font-medium">Buy</div>
                          <div className="text-2xl font-bold text-green-600">5</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">Neutral</div>
                          <div className="text-2xl font-bold text-yellow-600">3</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">Sell</div>
                          <div className="text-2xl font-bold text-red-600">2</div>
                        </div>
                      </div>
                    </div>
                  </div>
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
                  aiExplanations.news.content,
                  "news"
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
                    {newsData.recentNews.map((news, index) => (
                      <div key={index} className="border rounded-md p-3">
                        <div className="flex justify-between mb-1">
                          <Badge 
                            variant="outline" 
                            className={
                              news.sentiment === "positive" 
                                ? "bg-green-100 text-green-800 border-green-200" 
                                : news.sentiment === "negative"
                                  ? "bg-red-100 text-red-800 border-red-200"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-200"
                            }
                          >
                            {news.sentiment}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{news.date}</span>
                        </div>
                        <h5 className="font-medium">{news.title}</h5>
                        <div className="text-xs text-muted-foreground mt-1">Source: {news.source}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Sentiment Analysis</h4>
                  <div className="flex flex-col items-center mb-6">
                    <GaugeChart value={newsData.sentimentScore} min={0} max={100} label="Sentiment Score" />
                  </div>
                  
                  <h4 className="font-medium mb-3">Analyst Ratings</h4>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-full bg-muted h-4 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-green-500 h-full"
                        style={{ width: `${(newsData.analystRatings.buy / (newsData.analystRatings.buy + newsData.analystRatings.hold + newsData.analystRatings.sell)) * 100}%` }}
                      ></div>
                      <div 
                        className="bg-yellow-500 h-full"
                        style={{ width: `${(newsData.analystRatings.hold / (newsData.analystRatings.buy + newsData.analystRatings.hold + newsData.analystRatings.sell)) * 100}%` }}
                      ></div>
                      <div 
                        className="bg-red-500 h-full"
                        style={{ width: `${(newsData.analystRatings.sell / (newsData.analystRatings.buy + newsData.analystRatings.hold + newsData.analystRatings.sell)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 text-center">
                    <div>
                      <div className="text-sm font-medium text-green-600">Buy</div>
                      <div className="text-lg font-bold">{newsData.analystRatings.buy}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-yellow-600">Hold</div>
                      <div className="text-lg font-bold">{newsData.analystRatings.hold}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-red-600">Sell</div>
                      <div className="text-lg font-bold">{newsData.analystRatings.sell}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-sm text-muted-foreground">Average Price Target</div>
                    <div className="font-medium">${newsData.averagePriceTarget}</div>
                    <div className="text-xs text-muted-foreground">
                      {((newsData.averagePriceTarget - stockData.price) / stockData.price * 100).toFixed(2)}% from current price
                    </div>
                  </div>
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
                  aiExplanations.risk.content,
                  "risk"
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
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Beta</span>
                        <span className="text-sm font-medium">{riskData.beta}</span>
                      </div>
                      <Progress value={riskData.beta * 50} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Standard Deviation</span>
                        <span className="text-sm font-medium">{riskData.standardDeviation}%</span>
                      </div>
                      <Progress value={riskData.standardDeviation * 2} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Value at Risk (Daily)</span>
                        <span className="text-sm font-medium">{riskData.valueAtRisk}%</span>
                      </div>
                      <Progress value={riskData.valueAtRisk * 10} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Max Drawdown</span>
                        <span className="text-sm font-medium">{riskData.maxDrawdown}%</span>
                      </div>
                      <Progress value={Math.abs(riskData.maxDrawdown) * 2} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Correlation to S&P 500</span>
                        <span className="text-sm font-medium">{riskData.correlationSP500}</span>
                      </div>
                      <Progress value={riskData.correlationSP500 * 100} className="h-2" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Stress Test Scenarios</h4>
                  <MockChart type="Stress Test" height={200} />
                </div>
                
                <div className="flex flex-col">
                  <h4 className="font-medium mb-3">Risk Assessment</h4>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-muted mb-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold">{riskData.riskScore}</div>
                          <div className="text-sm text-muted-foreground">Risk Score</div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mt-2">
                        {riskData.riskScore < 40 ? "Low Risk" : 
                         riskData.riskScore < 70 ? "Moderate Risk" : "High Risk"}
                      </div>
                      
                      <div className="mt-4 text-sm">
                        This stock has {riskData.riskScore < 40 ? "lower" : 
                                        riskData.riskScore < 70 ? "average" : "higher"} risk 
                        compared to the overall market.
                      </div>
                    </div>
                  </div>
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
        content={showAIExplanation.content}
        section={showAIExplanation.section}
        onClose={handleAIExplanationClose}
      />
    </div>
  );
};

export default StockAnalysis; 
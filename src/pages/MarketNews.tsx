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
import { 
  ArrowDown, 
  ArrowUp, 
  BarChart, 
  Clock, 
  Coffee, 
  Cpu, 
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
import { Separator } from "@/components/ui/separator";
import { AIExplanationPopup } from "@/components/AIExplanationPopup";

const MarketNews = () => {
  const [lastUpdated] = useState<string>("April 7, 2025, 6:45 AM");
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

  // Mock data for the market news
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

  const breakingNews = [
    "Fed Chair to speak on monetary policy at 2 PM EST",
    "Major tech earnings reports expected this week",
    "European markets open lower on inflation concerns",
    "Oil prices surge on Middle East tensions",
    "Treasury yields hit 3-month high ahead of CPI data"
  ];

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

  // AI explanation content for different sections
  const aiExplanations = {
    marketPulse: {
      title: "Today's Market Pulse",
      content: "The Market Pulse provides a quick overview of market sentiment today. The sentiment score ranges from 0 (extremely negative) to 100 (extremely positive). This headline summarizes the dominant market theme for the day based on news analysis and market movements."
    },
    snapshot: {
      title: "Market Snapshot",
      content: "This section gives you a quick summary of what's happening across major market segments today. It highlights the most significant price movements and key events affecting markets, distilled into an easy-to-read format."
    },
    insights: {
      title: "Smart Insights",
      content: "These insights identify important patterns or anomalies in today's market that might not be immediately obvious. Each insight is accompanied by an explanation of why it matters, helping you understand potential implications for the broader market."
    },
    sentiment: {
      title: "Market Sentiment",
      content: "The Fear & Greed Index measures market sentiment on a scale from Extreme Fear to Extreme Greed. It's calculated using various market indicators including volatility, momentum, and demand for safe-haven assets. Extreme fear can signal buying opportunities, while extreme greed may indicate the market is due for a correction."
    },
    assets: {
      title: "Asset Performance",
      content: "This dashboard shows the current performance of key assets across different categories. Green indicates positive movement, while red shows negative. The percentage change is calculated based on the previous day's closing price."
    }
  };

  return (
    <div className="w-full h-full p-4 space-y-4">
      {/* Breaking News Ticker */}
      <div className="bg-muted rounded-lg p-2 flex items-center overflow-hidden">
        <Badge variant="outline" className="mr-2 bg-red-100 text-red-800 border-red-200 shrink-0">
          BREAKING
        </Badge>
        <div className="overflow-hidden whitespace-nowrap relative flex-1">
          <div className="animate-marquee inline-block">
            {breakingNews.map((news, index) => (
              <span key={index} className="mr-8 inline-flex items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2"></span>
                {news}
              </span>
            ))}
          </div>
        </div>
        <div className="hidden sm:flex items-center text-sm text-muted-foreground ml-2 shrink-0">
          <Clock className="h-3 w-3 mr-1" />
          <span className="hidden md:inline">Last updated: {lastUpdated}</span>
          <span className="md:hidden">Updated: {lastUpdated.split(', ')[1]}</span>
          <Button variant="ghost" size="icon" className="ml-2">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Market Pulse Section */}
      <Card className="w-full overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl flex items-center">
              Today's Market Pulse
              <BarChart className="ml-2 h-5 w-5 text-primary" />
            </CardTitle>
            <CardDescription>Overall market sentiment and headline</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleAIExplanationOpen(
              aiExplanations.marketPulse.title,
              aiExplanations.marketPulse.content,
              "marketPulse"
            )}
          >
            <Cpu className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Sentiment Score: {marketPulse.sentiment}/100</span>
                <span className="text-sm font-medium">
                  {marketPulse.sentiment < 30 ? "Bearish" : 
                   marketPulse.sentiment > 70 ? "Bullish" : "Neutral"}
                </span>
              </div>
              <Progress 
                value={marketPulse.sentiment} 
                className={`h-2 ${
                  marketPulse.sentiment < 30 ? "bg-red-100" : 
                  marketPulse.sentiment > 70 ? "bg-green-100" : "bg-yellow-100"
                }`}
              />
              <div className="w-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-1 mt-1 rounded-full opacity-30"></div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="text-xl font-bold">{marketPulse.headline}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Snapshot Section */}
      <Card className="w-full overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl">Market Snapshot</CardTitle>
            <CardDescription>Quick summary of key market movements</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleAIExplanationOpen(
              aiExplanations.snapshot.title,
              aiExplanations.snapshot.content,
              "snapshot"
            )}
          >
            <Cpu className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm sm:text-base lg:text-lg">
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
          </p>
        </CardContent>
      </Card>

      {/* Smart Insights Section */}
      <Card className="w-full overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="pr-2">
            <CardTitle className="text-lg sm:text-xl flex items-center">
              Smart Insights
              <Sparkles className="ml-2 h-5 w-5 text-yellow-500" />
            </CardTitle>
            <CardDescription className="truncate">Key observations and actionable insights</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="shrink-0"
            onClick={() => handleAIExplanationOpen(
              aiExplanations.insights.title,
              aiExplanations.insights.content,
              "insights"
            )}
          >
            <Cpu className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {insights.map((insight, index) => (
              <Card key={index} className="overflow-hidden w-full">
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

      {/* Market Sentiment Section */}
      <Card className="w-full overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl">Market Sentiment</CardTitle>
            <CardDescription>Fear & Greed Index</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleAIExplanationOpen(
              aiExplanations.sentiment.title,
              aiExplanations.sentiment.content,
              "sentiment"
            )}
          >
            <Cpu className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <div className="w-full max-w-md">
              <div className="relative h-8 w-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full mb-2">
                <div 
                  className="absolute top-full mt-1 w-0 h-0 border-8 border-transparent border-b-black"
                  style={{ left: `${fearGreedIndex.value}%`, transform: 'translateX(-50%)' }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span>Extreme Fear</span>
                <span>Neutral</span>
                <span>Extreme Greed</span>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <div className="text-3xl font-bold">{fearGreedIndex.value}</div>
              <div className="text-xl">{fearGreedIndex.label}</div>
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

      {/* Asset Performance Dashboard */}
      <Card className="w-full overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="pr-2">
            <CardTitle className="text-lg sm:text-xl flex items-center">
              Asset Performance
              <DollarSign className="ml-2 h-5 w-5 text-primary" />
            </CardTitle>
            <CardDescription className="truncate">Current performance of key assets</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="shrink-0"
            onClick={() => handleAIExplanationOpen(
              aiExplanations.assets.title,
              aiExplanations.assets.content,
              "assets"
            )}
          >
            <Cpu className="h-5 w-5" />
          </Button>
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

export default MarketNews; 
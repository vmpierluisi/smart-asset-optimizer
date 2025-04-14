import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolioAnalysis } from '@/hooks/usePortfolioAnalysis';
import { usePortfolioAnalysisParsed } from '@/hooks/usePortfolioAnalysisParsed';
import { AIExplanationPopup } from '@/components/AIExplanationPopup';
import { Cpu } from 'lucide-react';

interface PortfolioAnalysisProps {
  results: {
    weights: { [key: string]: number };
    allocations: { [key: string]: number };
    metrics: {
      expectedReturn: number;
      volatility: number;
      var: number;
      es: number;
    };
    historicalData: {
      date: Date;
      value: number;
      benchmarks: { [symbol: string]: number };
    }[];
    benchmarkSymbols: string[];
  };
}

export const PortfolioAnalysis: React.FC<PortfolioAnalysisProps> = ({ results }) => {
  const { analyzePortfolio, isAnalyzing, error } = usePortfolioAnalysis();
  
  // AI Explanation Popup state
  const [showAIExplanation, setShowAIExplanation] = useState({
    isOpen: false,
    title: '',
    cardContext: null as any,
    section: ''
  });

  // Handle AI explanation popup
  const handleAIExplanationOpen = (title: string, section: string, cardData: any) => {
    setShowAIExplanation({
      isOpen: true,
      title,
      cardContext: cardData,
      section
    });
    
    // Automatically analyze the portfolio when opening the AI explanation
    analyzePortfolio(results);
  };

  const handleAIExplanationClose = () => {
    setShowAIExplanation({
      ...showAIExplanation,
      isOpen: false
    });
  };

  // Create section tags for the AI chat
  const availableSections = {
    performance: {
      id: "performance",
      name: "Performance",
      getContext: () => ({
        portfolioData: results.historicalData.map(d => ({
          date: d.date.toISOString().split('T')[0],
          value: d.value
        })),
        benchmarkSymbols: results.benchmarkSymbols,
        benchmarkData: results.benchmarkSymbols.reduce((acc, symbol) => {
          acc[symbol] = results.historicalData.map(d => d.benchmarks[symbol]);
          return acc;
        }, {} as Record<string, number[]>)
      })
    },
    metrics: {
      id: "metrics",
      name: "Metrics",
      getContext: () => ({
        expectedReturn: results.metrics.expectedReturn,
        volatility: results.metrics.volatility,
        var: results.metrics.var,
        es: results.metrics.es
      })
    },
    allocation: {
      id: "allocation",
      name: "Allocation",
      getContext: () => ({
        weights: results.weights,
        allocations: results.allocations
      })
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm my-6 w-full">
      <CardHeader className="p-[30px] pb-0 text-left">
        <CardTitle className="text-xl font-semibold">Portfolio Analysis</CardTitle>
        <CardDescription>
          Analyze your portfolio performance, risk metrics, and asset allocation
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-[30px]">
        <div className="space-y-6">
          {/* Performance Section */}
          <Card className="bg-gray-50 overflow-hidden">
            <CardHeader className="bg-white p-4 flex flex-row items-center justify-between">
              <CardTitle className="text-md">Performance Analysis</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleAIExplanationOpen(
                  "Performance Analysis", 
                  "performance", 
                  availableSections.performance.getContext()
                )}
                className="h-8 w-8 rounded-full"
              >
                <Cpu className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">
                Click the AI icon to analyze portfolio performance compared to benchmarks.
              </p>
            </CardContent>
          </Card>
          
          {/* Risk Metrics Section */}
          <Card className="bg-gray-50 overflow-hidden">
            <CardHeader className="bg-white p-4 flex flex-row items-center justify-between">
              <CardTitle className="text-md">Key Metrics</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleAIExplanationOpen(
                  "Key Metrics", 
                  "metrics", 
                  availableSections.metrics.getContext()
                )}
                className="h-8 w-8 rounded-full"
              >
                <Cpu className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">
                Click the AI icon to understand risk metrics including volatility, VaR, and expected shortfall.
              </p>
            </CardContent>
          </Card>
          
          {/* Stock Analysis Section */}
          <Card className="bg-gray-50 overflow-hidden">
            <CardHeader className="bg-white p-4 flex flex-row items-center justify-between">
              <CardTitle className="text-md">Asset Allocation</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleAIExplanationOpen(
                  "Asset Allocation", 
                  "allocation", 
                  availableSections.allocation.getContext()
                )}
                className="h-8 w-8 rounded-full"
              >
                <Cpu className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">
                Click the AI icon to analyze your portfolio allocation and get insights on your asset mix.
              </p>
            </CardContent>
          </Card>
        </div>

        {isAnalyzing && (
          <div className="text-center p-6">
            <div className="animate-pulse flex space-x-4 mb-4">
              <div className="flex-1 space-y-6 py-1">
                <div className="h-2 bg-gray-200 rounded"></div>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-2 bg-gray-200 rounded col-span-2"></div>
                    <div className="h-2 bg-gray-200 rounded col-span-1"></div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
            <p className="text-gray-600">Analyzing your portfolio performance...</p>
          </div>
        )}
        
        {error && (
          <div className="text-center p-6">
            <p className="text-red-500 mb-4">
              Error: {error.message}
            </p>
          </div>
        )}
      </CardContent>

      {/* AI Explanation Popup */}
      <AIExplanationPopup
        isOpen={showAIExplanation.isOpen}
        onClose={handleAIExplanationClose}
        title={showAIExplanation.title}
        cardContext={showAIExplanation.cardContext}
        section={showAIExplanation.section}
        availableSections={availableSections}
      />
    </Card>
  );
};

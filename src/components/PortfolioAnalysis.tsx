import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolioAnalysis } from '@/hooks/usePortfolioAnalysis';
import { usePortfolioAnalysisParsed } from '@/hooks/usePortfolioAnalysisParsed';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

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
  const { analyzePortfolio, analysis, analysisResults, isAnalyzing, error, streamedContent } = usePortfolioAnalysis();
  const { portfolioPerformance, benchmarkPerformance, riskMetrics, portfolioInsights } = usePortfolioAnalysisParsed(analysis, analysisResults);

  const handleAnalyze = () => {
    analyzePortfolio(results);
  };

  // Content to display - use streamedContent while analyzing, otherwise use the final analysis
  const displayContent = isAnalyzing ? streamedContent : analysis;

  return (
    <Card className="bg-white rounded-xl shadow-sm my-6 w-full">
      <CardHeader className="p-[30px] pb-0 text-left">
        <CardTitle className="text-xl font-semibold">AI Portfolio Insights</CardTitle>
        <CardDescription>
          Get AI-powered analysis of your portfolio performance
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-[30px]">
        {!displayContent && !isAnalyzing && !error && (
          <div className="text-left">
            <p className="text-gray-600 mb-4">
              Click the button below to analyze your portfolio with AI. 
            </p>
          </div>
        )}
        
        {isAnalyzing && !streamedContent && (
          <div className="text-left">
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
            <Button onClick={handleAnalyze} variant="outline">
              Try Again
            </Button>
          </div>
        )}
        
        {displayContent && !error && (
          <div className="space-y-6">
            {/* Performance Section */}
            {(portfolioPerformance || benchmarkPerformance) && (
              <Card className="bg-gray-50 overflow-hidden">
                <CardHeader className="bg-white p-4">
                  <CardTitle className="text-md">Performance Analysis</CardTitle>
                </CardHeader>
                <CardContent className="p-4 prose prose-sm max-w-none overflow-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {portfolioPerformance && (
                      <div>
                        <MarkdownRenderer content={portfolioPerformance} />
                      </div>
                    )}
                    {benchmarkPerformance && (
                      <div>
                        <MarkdownRenderer content={benchmarkPerformance} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Risk Metrics Section */}
            {riskMetrics && (
              <Card className="bg-gray-50 overflow-hidden">
                <CardHeader className="bg-white p-4">
                  <CardTitle className="text-md">Key Metrics</CardTitle>
                </CardHeader>
                <CardContent className="p-4 prose prose-sm max-w-none overflow-auto">
                  <MarkdownRenderer content={riskMetrics} />
                </CardContent>
              </Card>
            )}
            
            {/* Stock Analysis Section */}
            {portfolioInsights && (
              <Card className="bg-gray-50 overflow-hidden">
                <CardHeader className="bg-white p-4">
                  <CardTitle className="text-md">Stock Analysis</CardTitle>
                </CardHeader>
                <CardContent className="p-4 prose prose-sm max-w-none overflow-auto">
                  <MarkdownRenderer content={portfolioInsights} />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-[30px] pt-0 flex justify-start">
        {!isAnalyzing && (
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700"
          >
            {analysis ? "Refresh Analysis" : "Analyze My Portfolio"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

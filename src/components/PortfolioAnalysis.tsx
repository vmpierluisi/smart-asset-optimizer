
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolioAnalysis } from '@/hooks/usePortfolioAnalysis';
import ReactMarkdown from 'react-markdown';
import { EnvDebugger } from './EnvDebugger';

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
      benchmark: number;
    }[];
  };
}

export const PortfolioAnalysis: React.FC<PortfolioAnalysisProps> = ({ results }) => {
  const { analyzePortfolio, analysis, isAnalyzing, error } = usePortfolioAnalysis();

  const handleAnalyze = () => {
    analyzePortfolio(results);
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm my-6">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">AI Portfolio Insights</CardTitle>
        <CardDescription>
          Get AI-powered analysis of your portfolio performance
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <EnvDebugger />
        
        {!analysis && !isAnalyzing && !error && (
          <div className="text-center p-6">
            <p className="text-gray-600 mb-4">
              Click the button below to analyze your portfolio with AI. 
              Our AI will compare your portfolio to the benchmark, identify key performance drivers, 
              and suggest possible reasons for stock movements.
            </p>
          </div>
        )}
        
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
            <Button onClick={handleAnalyze} variant="outline">
              Try Again
            </Button>
          </div>
        )}
        
        {analysis && !isAnalyzing && (
          <div className="prose prose-sm max-w-none overflow-auto">
            <ReactMarkdown 
              components={{
                a: ({ node, ...props }) => (
                  <a 
                    {...props} 
                    className="text-blue-600 hover:underline" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2 {...props} className="text-lg font-bold mt-6 mb-2" />
                ),
                h3: ({ node, ...props }) => (
                  <h3 {...props} className="text-md font-semibold mt-4 mb-2" />
                ),
                p: ({ node, ...props }) => (
                  <p {...props} className="my-2" />
                ),
                ul: ({ node, ...props }) => (
                  <ul {...props} className="list-disc pl-5 my-2" />
                ),
                li: ({ node, ...props }) => (
                  <li {...props} className="mb-1" />
                ),
              }}
            >
              {analysis}
            </ReactMarkdown>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-center">
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


import { useState } from 'react';
import { toast } from "@/hooks/use-toast";

interface PortfolioData {
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
}

export const usePortfolioAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const analyzePortfolio = async (portfolioData: PortfolioData) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      toast({
        title: "Analyzing Portfolio",
        description: "AI is analyzing your portfolio results...",
      });

      // Extract stocks from the weights object
      const stocks = Object.keys(portfolioData.weights);
      
      // Prepare historical data for the API
      const processedData = {
        portfolioData: portfolioData.historicalData.map(d => ({
          date: d.date.toISOString().split('T')[0],
          value: d.value
        })),
        benchmarkData: portfolioData.historicalData.map(d => d.benchmark),
        stocks,
        weights: portfolioData.weights,
        metrics: portfolioData.metrics
      };

      // Call the Supabase Edge Function
      const response = await fetch('/api/analyze-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedData),
      });

      // Check if the response is valid before parsing JSON
      if (!response.ok) {
        // Try to parse error message first, but handle the case if it fails
        try {
          const errorData = await response.text();
          let errorMessage = 'Failed to analyze portfolio';
          
          try {
            // Only parse as JSON if it looks like JSON
            if (errorData.trim().startsWith('{')) {
              const errorJson = JSON.parse(errorData);
              errorMessage = errorJson.error || errorMessage;
            } else {
              errorMessage = errorData || errorMessage;
            }
          } catch (parseError) {
            // If parsing fails, use the raw text
            errorMessage = errorData || errorMessage;
          }
          
          throw new Error(errorMessage);
        } catch (textError) {
          throw new Error('Failed to analyze portfolio: Unable to retrieve error details');
        }
      }

      // Try to parse the successful response
      try {
        const responseText = await response.text();
        const data = JSON.parse(responseText);
        setAnalysis(data.analysis);
        
        toast({
          title: "Analysis Complete",
          description: "AI portfolio analysis is ready!",
        });
      } catch (parseError) {
        throw new Error('Error parsing response: Invalid JSON response from server');
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      toast({
        title: "Analysis Error",
        description: error.message,
        variant: "destructive",
      });
      
      console.error("Portfolio analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzePortfolio, analysis, isAnalyzing, error };
};

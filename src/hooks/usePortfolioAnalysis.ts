
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

      console.log("Sending data to API:", JSON.stringify(processedData));

      // Flag to control whether to use local mock or actual API
      const useMockData = true; // Set to false when your Supabase function is working

      let responseData;

      if (useMockData) {
        // Provide a mock response for testing
        console.log("Using mock data for portfolio analysis");
        responseData = {
          analysis: `# Portfolio Analysis

## Performance Summary
Your portfolio has performed well compared to the benchmark. The optimized allocation helped achieve better risk-adjusted returns.

## Key Drivers
- Technology stocks contributed most positively to performance
- Diversification across sectors provided stability during market fluctuations

## Market Impact
Recent market volatility has affected your portfolio less than the broader market, demonstrating the effectiveness of your risk management approach.

## Recommendations
Consider rebalancing quarterly to maintain your target allocation and risk profile.`
        };
      } else {
        // Make the actual API call to Supabase
        // Replace with your actual Supabase project URL
        const supabaseProjectUrl = 'https://hymucchmkpgemxcxngpe.supabase.co';
        
        // Call the Supabase Edge Function with the correct URL format
        const response = await fetch(`${supabaseProjectUrl}/functions/v1/analyze-portfolio`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // If your function requires authentication, you may need to add this:
            // 'Authorization': `Bearer ${supabaseAccessToken}`
          },
          body: JSON.stringify(processedData),
        });

        // Log the raw response for debugging
        const responseText = await response.text();
        console.log("Raw API response:", responseText);
        console.log("Response status:", response.status);
        console.log("Response headers:", Object.fromEntries([...response.headers]));

        // Check if the response is valid
        if (!response.ok) {
          let errorMessage = `Failed to analyze portfolio. Status: ${response.status}`;
          
          try {
            // Only parse as JSON if it looks like JSON
            if (responseText.trim().startsWith('{')) {
              const errorJson = JSON.parse(responseText);
              errorMessage = errorJson.error || errorMessage;
            } else {
              errorMessage = responseText || errorMessage;
            }
          } catch (parseError) {
            // If parsing fails, use the raw text
            console.error("Error parsing error response:", parseError);
            errorMessage = responseText || errorMessage;
          }
          
          throw new Error(errorMessage);
        }

        // Try to parse the successful response
        try {
          // Only attempt to parse if we have content
          if (responseText.trim()) {
            responseData = JSON.parse(responseText);
          } else {
            throw new Error('Empty response from server');
          }
          
          if (!responseData || !responseData.analysis) {
            throw new Error('Invalid response format: missing analysis data');
          }
        } catch (parseError) {
          console.error("JSON parse error:", parseError, "Response text:", responseText);
          throw new Error(`Error parsing response: ${parseError.message}. Raw response: ${responseText.substring(0, 100)}...`);
        }
      }
      
      setAnalysis(responseData.analysis);
      
      toast({
        title: "Analysis Complete",
        description: "AI portfolio analysis is ready!",
      });
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

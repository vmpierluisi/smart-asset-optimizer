
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

      // For testing/debugging, we'll generate a mock response
      // This will ensure the UI works while you're setting up Supabase
      // You can remove this section once your Supabase function is working
      const mockAnalysis = `
## Portfolio Analysis Summary

Your portfolio had a return of ${(portfolioData.metrics.expectedReturn * 100).toFixed(2)}% compared to the benchmark's performance. This analysis is based on the historical data and allocations you've provided.

### Key Performance Drivers

The primary drivers of your portfolio's performance were likely:

${stocks.map(stock => `- **${stock}**: Allocated ${(portfolioData.weights[stock] * 100).toFixed(2)}% of portfolio`).join('\n')}

### Risk Assessment

Your portfolio shows:
- **Volatility**: $${portfolioData.metrics.volatility.toFixed(2)}
- **Value at Risk (95%)**: $${Math.abs(portfolioData.metrics.var).toFixed(2)}
- **Expected Shortfall**: $${Math.abs(portfolioData.metrics.es).toFixed(2)}

### Recommendation

Based on this analysis, consider maintaining your current asset allocation while monitoring market conditions.

*Note: This is a simulated analysis while your Supabase function is being configured.*
      `;

      // Set the mock analysis directly
      setAnalysis(mockAnalysis);
      
      toast({
        title: "Analysis Complete",
        description: "Mock AI portfolio analysis is ready!",
      });

      // Comment out the Supabase function call for now
      // Uncomment once your Supabase function is working
      /*
      // Call the Supabase Edge Function
      const response = await fetch('https://your-supabase-project-id.functions.supabase.co/analyze-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization if needed
          // 'Authorization': `Bearer ${supabaseToken}`
        },
        body: JSON.stringify(processedData),
      });

      // Log the raw response for debugging
      const responseText = await response.text();
      console.log("Raw API response:", responseText);

      // Check if the response is valid
      if (!response.ok) {
        let errorMessage = 'Failed to analyze portfolio';
        
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
        let data;
        
        // Only attempt to parse if we have content
        if (responseText.trim()) {
          data = JSON.parse(responseText);
        } else {
          throw new Error('Empty response from server');
        }
        
        if (!data || !data.analysis) {
          throw new Error('Invalid response format: missing analysis data');
        }
        
        setAnalysis(data.analysis);
        
        toast({
          title: "Analysis Complete",
          description: "AI portfolio analysis is ready!",
        });
      } catch (parseError) {
        console.error("JSON parse error:", parseError, "Response text:", responseText);
        throw new Error(`Error parsing response: ${parseError.message}. Raw response: ${responseText.substring(0, 100)}...`);
      }
      */
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

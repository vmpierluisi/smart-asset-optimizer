
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

      // Call the Supabase Edge Function with the correct URL format
      const response = await fetch("https://hymucchmkpgemxcxngpe.supabase.co/functions/v1/analyze-portfolio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, // Use Vite env variable
        },
        body: JSON.stringify(processedData), // <-- Fixed: Changed 'l' to 'processedData'
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

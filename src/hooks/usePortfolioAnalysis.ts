
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

      // Get Supabase environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase environment variables are missing. Please check your .env file.");
      }

      console.log("Making request to Supabase Edge Function");
      console.log("Supabase URL:", supabaseUrl);

      // Call the Supabase Edge Function
      const response = await fetch(`${supabaseUrl}/functions/v1/analyze-portfolio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(processedData),
      });

      // Log the raw response status
      console.log("API response status:", response.status);

      // Get the response text
      const responseText = await response.text();
      console.log("Raw API response:", responseText);

      // Check if the response is valid
      if (!response.ok) {
        let errorMessage = `Failed to analyze portfolio (${response.status}): ${responseText}`;
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
      
      console.error("Portfolio analysis error:", {
        message: error.message,
        stack: error.stack,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzePortfolio, analysis, isAnalyzing, error };
};

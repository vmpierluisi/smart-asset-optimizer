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
    benchmarks: { [symbol: string]: number };
  }[];
  benchmarkSymbols: string[];
}

export const usePortfolioAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [streamedContent, setStreamedContent] = useState<string>("");

  const analyzePortfolio = async (portfolioData: PortfolioData) => {
    setIsAnalyzing(true);
    setError(null);
    setStreamedContent("");
    setAnalysis(null);

    try {
      toast({
        title: "Analyzing Portfolio",
        description: "AI is analyzing your portfolio results...",
      });

      // Extract stocks from the weights object
      const stocks = Object.keys(portfolioData.weights);
      
      // Get primary benchmark (first one in the list)
      const primaryBenchmark = portfolioData.benchmarkSymbols[0] || "SPY";
      
      // Prepare historical data for the API
      const processedData = {
        portfolioData: portfolioData.historicalData.map(d => ({
          date: d.date.toISOString().split('T')[0],
          value: d.value
        })),
        // Use the first benchmark as the primary benchmark for backward compatibility
        benchmarkData: portfolioData.historicalData.map(d => d.benchmarks[primaryBenchmark]),
        // Also send all benchmarks data
        allBenchmarksData: portfolioData.benchmarkSymbols.reduce((acc, symbol) => {
          acc[symbol] = portfolioData.historicalData.map(d => d.benchmarks[symbol]);
          return acc;
        }, {} as Record<string, number[]>),
        benchmarkSymbols: portfolioData.benchmarkSymbols,
        stocks,
        weights: portfolioData.weights,
        metrics: portfolioData.metrics
      };

      console.log("Sending data to API:", JSON.stringify(processedData));

      // Call the Supabase Edge Function with the correct URL format
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase environment variables are missing. Please check your .env file.");
      }

      console.log("Supabase URL:", supabaseUrl);
      console.log("Supabase Anon Key:", supabaseAnonKey ? "Loaded" : "Missing");

      const response = await fetch(`${supabaseUrl}/functions/v1/analyze-portfolio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(processedData),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Response not OK:", response.status, text);
        
        let errorMessage = 'Failed to analyze portfolio';
        try {
          // Try to parse as JSON first
          if (text.trim().startsWith('{')) {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = text || errorMessage;
          }
        } catch (e) {
          errorMessage = text || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get stream reader");
      }

      let accumulatedContent = "";
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log("Stream complete");
            break;
          }
          
          // Decode the chunk
          const chunk = new TextDecoder().decode(value);
          
          // If the chunk starts with "error:", handle it as an error
          if (chunk.startsWith("error:")) {
            throw new Error(chunk.substring(6).trim());
          }
          
          // Add the chunk to our accumulated content
          accumulatedContent += chunk;
          
          // Update the state with the latest content
          setStreamedContent(accumulatedContent);
        }
        
        // When streaming is complete, set the final analysis
        setAnalysis(accumulatedContent);
        
        toast({
          title: "Analysis Complete",
          description: "AI portfolio analysis is ready!",
        });
      } catch (e) {
        console.error("Error reading stream:", e);
        throw e;
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

  return { analyzePortfolio, analysis, isAnalyzing, error, streamedContent };
};

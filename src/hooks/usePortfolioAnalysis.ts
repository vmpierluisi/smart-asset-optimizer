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

interface AnalysisResults {
  performanceAnalysis: string | null;
  metricsAnalysis: string | null;
  stocksAnalysis: string | null;
}

export const usePortfolioAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults>({
    performanceAnalysis: null,
    metricsAnalysis: null,
    stocksAnalysis: null
  });
  const [error, setError] = useState<Error | null>(null);
  const [streamedContent, setStreamedContent] = useState<string>("");

  const analyzePortfolio = async (portfolioData: PortfolioData) => {
    setIsAnalyzing(true);
    setError(null);
    setStreamedContent("");
    setAnalysis(null);
    setAnalysisResults({
      performanceAnalysis: null,
      metricsAnalysis: null,
      stocksAnalysis: null
    });

    try {
      toast({
        title: "Analyzing Portfolio",
        description: "AI is analyzing your portfolio results...",
      });

      // Extract stocks from the weights object
      const stocks = Object.keys(portfolioData.weights);
      
      // Get primary benchmark (first one in the list)
      const primaryBenchmark = portfolioData.benchmarkSymbols[0] || "SPY";
      
      // Prepare common data components
      const processedData = {
        portfolioData: portfolioData.historicalData.map(d => ({
          date: d.date.toISOString().split('T')[0],
          value: d.value
        })),
        benchmarkData: portfolioData.historicalData.map(d => d.benchmarks[primaryBenchmark]),
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

      // Get the Supabase credentials
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase environment variables are missing. Please check your .env file.");
      }

      console.log("Supabase URL:", supabaseUrl);
      console.log("Supabase Anon Key:", supabaseAnonKey ? "Loaded" : "Missing");

      // Run all analyses in parallel
      const results = await Promise.all([
        // Performance Analysis
        fetchAnalysis(
          `${supabaseUrl}/functions/v1/analyze-portfolio-performance`, 
          {
            portfolioData: processedData.portfolioData,
            benchmarkData: processedData.benchmarkData,
            allBenchmarksData: processedData.allBenchmarksData,
            benchmarkSymbols: processedData.benchmarkSymbols
          },
          supabaseAnonKey
        ),
        
        // Metrics Analysis
        fetchAnalysis(
          `${supabaseUrl}/functions/v1/analyze-portfolio-metrics`, 
          {
            stocks: processedData.stocks,
            weights: processedData.weights,
            metrics: processedData.metrics
          },
          supabaseAnonKey
        ),
        
        // Stocks Analysis
        fetchAnalysis(
          `${supabaseUrl}/functions/v1/analyze-portfolio-stocks`, 
          {
            stocks: processedData.stocks,
            weights: processedData.weights
          },
          supabaseAnonKey
        )
      ]);

      // Combine all analysis results for backward compatibility
      const combinedAnalysis = [
        results[0] || '',
        results[1] || '',
        results[2] || ''
      ].filter(Boolean).join('\n\n');
      
      setAnalysis(combinedAnalysis);
      
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
      
      console.error("Portfolio analysis error:", {
        message: error.message,
        stack: error.stack,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper function to fetch analysis from a specific endpoint
  const fetchAnalysis = async (endpoint: string, data: any, apiKey: string): Promise<string> => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Response not OK:", response.status, text);
      
      let errorMessage = `Failed to analyze portfolio (${endpoint})`;
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
        
        // Update streamed content in real-time
        setStreamedContent(prev => prev + chunk);

        // Update the specific section based on which endpoint we're calling
        const endpointName = endpoint.split('/').pop();
        if (endpointName === 'analyze-portfolio-performance') {
          setAnalysisResults(prev => ({
            ...prev,
            performanceAnalysis: (prev.performanceAnalysis || '') + chunk
          }));
        } else if (endpointName === 'analyze-portfolio-metrics') {
          setAnalysisResults(prev => ({
            ...prev,
            metricsAnalysis: (prev.metricsAnalysis || '') + chunk
          }));
        } else if (endpointName === 'analyze-portfolio-stocks') {
          setAnalysisResults(prev => ({
            ...prev,
            stocksAnalysis: (prev.stocksAnalysis || '') + chunk
          }));
        }
      }
      
      return accumulatedContent;
    } catch (e) {
      console.error("Error reading stream:", e);
      throw e;
    }
  };

  return { 
    analyzePortfolio, 
    analysis, 
    analysisResults,
    isAnalyzing, 
    error, 
    streamedContent 
  };
};

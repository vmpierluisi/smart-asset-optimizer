
import { useState, useRef } from 'react';
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
  const abortControllerRef = useRef<AbortController | null>(null);

  const analyzePortfolio = async (portfolioData: PortfolioData) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysis("");  // Initialize with empty string for streaming

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();

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
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to analyze portfolio: ${errorText}`);
      }

      // Process streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      toast({
        title: "Analysis Started",
        description: "Receiving streaming analysis from AI...",
      });

      const decoder = new TextDecoder();
      let buffer = '';
      
      // Process the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process each complete SSE event
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep the last incomplete event in the buffer
        
        for (const event of events) {
          if (event.trim() === '') continue;
          
          // Extract the data part of the SSE event
          const dataMatch = event.match(/^data: (.+)$/m);
          if (!dataMatch) continue;
          
          try {
            const parsedData = JSON.parse(dataMatch[1]);
            
            if (parsedData.analysisComplete) {
              // This is the final message with the complete analysis
              setAnalysis(parsedData.fullAnalysis);
              toast({
                title: "Analysis Complete",
                description: "AI portfolio analysis is complete!",
              });
            } else if (parsedData.analysis) {
              // This is a partial update
              setAnalysis(prevAnalysis => (prevAnalysis || '') + parsedData.analysis);
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    } catch (err) {
      // Don't handle AbortError as an error
      if (err.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      
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
      abortControllerRef.current = null;
    }
  };

  // Cancel ongoing analysis
  const cancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsAnalyzing(false);
      
      toast({
        title: "Analysis Cancelled",
        description: "Portfolio analysis was cancelled.",
      });
    }
  };

  return { analyzePortfolio, analysis, isAnalyzing, error, cancelAnalysis };
};

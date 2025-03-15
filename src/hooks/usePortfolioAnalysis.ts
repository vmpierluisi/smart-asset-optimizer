
import { useState, useEffect } from 'react';
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
  const [streamingAnalysis, setStreamingAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Clean up effect for aborting any in-progress request when component unmounts
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  const analyzePortfolio = async (portfolioData: PortfolioData) => {
    setIsAnalyzing(true);
    setError(null);
    setStreamingAnalysis(null);
    
    // Create a new AbortController for this request
    const controller = new AbortController();
    setAbortController(controller);

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

      // Call the Supabase Edge Function with streaming support
      const response = await fetch(`${supabaseUrl}/functions/v1/analyze-portfolio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "Accept": "text/event-stream",
        },
        body: JSON.stringify(processedData),
        signal: controller.signal
      });

      // Log the raw response status
      console.log("API response status:", response.status);

      // Check if the response is valid
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`Failed to analyze portfolio (${response.status}): ${errorText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body available");
      }

      // Process the stream
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { value, done } = await reader.read();
        
        if (done) {
          console.log("Stream complete");
          break;
        }
        
        // Decode the chunk and add it to our buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE messages in the buffer
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';  // Keep the last incomplete chunk in the buffer
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          // Parse SSE data
          const dataMatch = line.match(/^data: (.+)$/m);
          if (dataMatch && dataMatch[1]) {
            try {
              const eventData = JSON.parse(dataMatch[1]);
              
              // Handle different types of messages
              if (eventData.error) {
                throw new Error(eventData.error);
              } else if (eventData.delta) {
                // Update with incremental content
                setStreamingAnalysis(prev => (prev || '') + eventData.delta);
              } else if (eventData.done && eventData.analysis) {
                // Final message with complete analysis
                setAnalysis(eventData.analysis);
                setStreamingAnalysis(null);
                
                toast({
                  title: "Analysis Complete",
                  description: "AI portfolio analysis is ready!",
                });
              }
            } catch (parseError) {
              console.error("Error parsing SSE data:", parseError, "Data:", dataMatch[1]);
            }
          }
        }
      }
      
      // If we've reached the end without getting a final analysis, use what we've streamed
      if (streamingAnalysis && !analysis) {
        setAnalysis(streamingAnalysis);
        setStreamingAnalysis(null);
      }
      
    } catch (err) {
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
      setAbortController(null);
    }
  };

  const cancelAnalysis = () => {
    if (abortController) {
      abortController.abort();
      setIsAnalyzing(false);
      setAbortController(null);
      
      toast({
        title: "Analysis Cancelled",
        description: "Portfolio analysis was cancelled.",
      });
    }
  };

  return { 
    analyzePortfolio, 
    analysis, 
    streamingAnalysis, 
    isAnalyzing, 
    error,
    cancelAnalysis 
  };
};

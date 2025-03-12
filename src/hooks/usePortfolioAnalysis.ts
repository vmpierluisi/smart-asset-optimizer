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
  const timeoutRef = useRef<number | null>(null);

  const analyzePortfolio = async (portfolioData: PortfolioData) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysis("");

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    abortControllerRef.current = new AbortController();

    try {
      toast({
        title: "Analyzing Portfolio",
        description: "AI is analyzing your portfolio results...",
      });

      const stocks = Object.keys(portfolioData.weights);
      
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

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase environment variables are missing. Please check your .env file.");
      }

      console.log("Supabase URL:", supabaseUrl);

      const TIMEOUT_MS = 120000;
      const timeoutPromise = new Promise<Response>((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
          reject(new Error('Request timed out after 2 minutes'));
        }, TIMEOUT_MS) as unknown as number;
      });

      let apiUrl = '/api/analyze-portfolio';
      
      if (import.meta.env.PROD) {
        apiUrl = `${supabaseUrl}/functions/v1/analyze-portfolio`;
      }

      console.log("Using API URL:", apiUrl);
      
      const fetchPromise = fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(processedData),
        signal: abortControllerRef.current.signal
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`Failed to analyze portfolio (${response.status}): ${errorText || response.statusText}`);
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

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
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        
        for (const event of events) {
          if (event.trim() === '') continue;
          
          const dataMatch = event.match(/^data: (.+)$/m);
          if (!dataMatch) continue;
          
          try {
            const parsedData = JSON.parse(dataMatch[1]);
            
            if (parsedData.analysisComplete) {
              setAnalysis(parsedData.fullAnalysis);
              toast({
                title: "Analysis Complete",
                description: "AI portfolio analysis is complete!",
              });
            } else if (parsedData.analysis) {
              setAnalysis(prevAnalysis => (prevAnalysis || '') + parsedData.analysis);
            } else if (parsedData.error) {
              throw new Error(parsedData.error);
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
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
      abortControllerRef.current = null;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  };

  const cancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsAnalyzing(false);
    
    toast({
      title: "Analysis Cancelled",
      description: "Portfolio analysis was cancelled.",
    });
  };

  return { analyzePortfolio, analysis, isAnalyzing, error, cancelAnalysis };
};

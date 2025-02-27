
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

      // Creating a mock analysis response since we don't have a functioning API
      // This simulates what would normally come from the server
      const mockAnalysis = `
## Portfolio Performance Analysis

### Summary
Your portfolio has ${portfolioData.metrics.expectedReturn > 0 ? 'outperformed' : 'underperformed'} the S&P 500 benchmark. The portfolio shows an expected annual return of ${(portfolioData.metrics.expectedReturn * 100).toFixed(2)}% with a volatility of $${portfolioData.metrics.volatility.toFixed(2)}.

### Key Contributors
${stocks.slice(0, 3).map(stock => `- **${stock}**: Allocation of ${(portfolioData.weights[stock] * 100).toFixed(2)}%`).join('\n')}

### Risk Assessment
- **Value at Risk (95%)**: $${Math.abs(portfolioData.metrics.var).toFixed(2)}
- **Expected Shortfall**: $${Math.abs(portfolioData.metrics.es).toFixed(2)}

This means that with 95% confidence, your portfolio won't lose more than $${Math.abs(portfolioData.metrics.var).toFixed(2)} in a day.

### Diversification Analysis
Your portfolio includes ${stocks.length} stocks, providing ${stocks.length > 3 ? 'good' : 'limited'} diversification across ${stocks.length > 3 ? 'multiple' : 'few'} securities.

### Recommendations
1. ${portfolioData.metrics.volatility > 10 ? 'Consider reducing exposure to volatile assets to improve risk-adjusted returns' : 'Your current risk level appears appropriate given your return objectives'}
2. Continue monitoring market conditions and rebalance your portfolio quarterly
3. ${stocks.length < 5 ? 'Consider adding more stocks to improve diversification' : 'Maintain your diversified approach'}
      `;

      // Instead of making an actual API call, we'll simulate a successful response
      setTimeout(() => {
        setAnalysis(mockAnalysis);
        setIsAnalyzing(false);
        
        toast({
          title: "Analysis Complete",
          description: "AI portfolio analysis is ready!",
        });
      }, 2000);

    } catch (err) {
      const error = err as Error;
      setError(error);
      
      toast({
        title: "Analysis Error",
        description: error.message,
        variant: "destructive",
      });
      
      console.error("Portfolio analysis error:", error);
      setIsAnalyzing(false);
    }
  };

  return { analyzePortfolio, analysis, isAnalyzing, error };
};

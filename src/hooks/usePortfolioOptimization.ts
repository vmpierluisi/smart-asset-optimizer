import { useState } from 'react';
import { create, all } from 'mathjs';
import { toast } from "@/hooks/use-toast";
import { invokeFunction } from "@/lib/apiClient";

const math = create(all);

interface OptimizationResults {
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

const calculateGJRGarch = (returns: number[]) => {
  const n = returns.length;
  const sigmas: number[] = [];
  const means: number[] = [];
  
  // Initialize with sample variance
  const variance = math.variance(returns);
  let sigma2 = typeof variance === 'number' ? variance : 0.01;
  let lastSigma2 = sigma2;

  const optimizeGARCH = () => {
    // Conservative initial parameters for stability
    let omega = 0.00001;  // Small positive constant
    let alpha = 0.05;     // ARCH effect
    let beta = 0.85;      // GARCH persistence
    let gamma = 0.05;     // Leverage effect

    const maxIter = 100;
    const learningRate = 0.01;
    
    for (let iter = 0; iter < maxIter; iter++) {
      let dOmega = 0, dAlpha = 0, dBeta = 0, dGamma = 0;
      let likelihood = 0;
      
      for (let t = 1; t < n; t++) {
        const r = returns[t];
        const prevR = returns[t-1];
        const leverage = prevR < 0 ? 1 : 0;
        
        // Update conditional variance
        sigma2 = omega + alpha * prevR * prevR + gamma * leverage * prevR * prevR + beta * lastSigma2;
        sigma2 = Math.max(sigma2, 1e-6); // Ensure positive variance
        
        // Calculate gradients for likelihood optimization
        const dsigma2 = -0.5/sigma2 + 0.5 * r * r/(sigma2 * sigma2);
        dOmega += dsigma2;
        dAlpha += dsigma2 * prevR * prevR;
        dBeta += dsigma2 * lastSigma2;
        dGamma += dsigma2 * leverage * prevR * prevR;
        
        likelihood += -0.5 * Math.log(2 * Math.PI * sigma2) - 0.5 * r * r / sigma2;
        lastSigma2 = sigma2;
      }
      
      // Update parameters with constraints
      omega = Math.max(0.000001, omega + learningRate * dOmega);
      alpha = Math.max(0, Math.min(0.3, alpha + learningRate * dAlpha));
      beta = Math.max(0.6, Math.min(0.99, beta + learningRate * dBeta));
      gamma = Math.max(0, Math.min(0.2, gamma + learningRate * dGamma));
      
      // Ensure persistence < 1 for stationarity
      const persistence = alpha + beta + 0.5 * gamma;
      if (persistence >= 1) {
        const scale = 0.99 / persistence;
        alpha *= scale;
        beta *= scale;
        gamma *= scale;
      }
    }
    
    return { omega, alpha, beta, gamma };
  };

  try {
    const params = optimizeGARCH();
    
    for (let t = 1; t < n; t++) {
      const r = returns[t-1];
      const leverage = r < 0 ? 1 : 0;
      
      // Calculate conditional variance with parameter constraints
      sigma2 = Math.max(
        1e-6,
        params.omega + 
        params.alpha * r * r + 
        params.gamma * leverage * r * r + 
        params.beta * lastSigma2
      );
      
      sigmas.push(Math.sqrt(sigma2));
      
      // Calculate rolling mean with a 20-day window
      const slicedReturns = returns.slice(Math.max(0, t-20), t);
      const meanValue = slicedReturns.reduce((sum, val) => sum + val, 0) / slicedReturns.length;
      means.push(meanValue);
      
      lastSigma2 = sigma2;
    }

    return {
      conditionalMeans: means,
      variances: sigmas.map(s => Math.min(s * s, 1)) // Cap maximum variance at 100%
    };
  } catch (error) {
    console.error('Error in GJR-GARCH calculation:', error);
    toast({
      title: "Calculation Error",
      description: "Error in volatility calculation. Please try again with different parameters.",
      variant: "destructive",
    });
    throw error;
  }
};

const calculateOptimalWeights = (
  means: number[],
  covMatrix: number[][],
  gamma: number
): number[] => {
  try {
    const n = means.length;
    
    // Initialize weights to equal weights (feasible starting point)
    let bestWeights = Array(n).fill(1/n);
    let bestObjective = Number.NEGATIVE_INFINITY;
    
    // Number of random starts to avoid local maxima
    const numStarts = 1000;
    
    for (let start = 0; start < numStarts; start++) {
      // Generate random weights that sum to 1
      let weights = Array(n).fill(0);
      let sum = 0;
      for (let i = 0; i < n; i++) {
        weights[i] = Math.random();
        sum += weights[i];
      }
      weights = weights.map(w => w / sum);
      
      // Calculate portfolio mean return
      const portfolioReturn = weights.reduce((sum, w, i) => sum + w * means[i], 0);
      
      // Calculate portfolio variance
      const portfolioVariance = weights.reduce((sum1, wi, i) => 
        sum1 + weights.reduce((sum2, wj, j) => sum2 + wi * wj * covMatrix[i][j], 0),
        0
      );
      
      // Calculate objective function: μ - (γ/2)σ²
      const objective = portfolioReturn - (gamma / 2) * portfolioVariance;
      
      if (objective > bestObjective) {
        bestObjective = objective;
        bestWeights = [...weights];
      }
    }
    
    // Ensure non-negativity constraint
    bestWeights = bestWeights.map(w => Math.max(0, w));
    
    // Ensure sum to 1 constraint
    const sum = bestWeights.reduce((a, b) => a + b, 0);
    bestWeights = bestWeights.map(w => w / sum);
    
    toast({
      title: "Optimization Complete",
      description: `Found optimal portfolio with objective value: ${bestObjective.toFixed(4)}`,
    });
    
    return bestWeights;
  } catch (error) {
    toast({
      title: "Optimization Error",
      description: "Error in portfolio optimization. Please try again with different parameters.",
      variant: "destructive",
    });
    throw error;
  }
};

export const usePortfolioOptimization = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [results, setResults] = useState<OptimizationResults | null>(null);

  const fetchStockData = async (symbol: string, startDate: Date, endDate: Date) => {
    try {
      toast({
        title: "Fetching Data",
        description: `Fetching historical data for ${symbol}...`,
      });

      // Fetch historical prices via the unified client (mock-backed in mock mode).
      let data: unknown;
      try {
        data = await invokeFunction<unknown[]>('historical-prices', {
          symbol,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
      } catch (err) {
        toast({
          title: "API Error",
          description: `Error fetching data: ${(err as Error).message}`,
          variant: "destructive",
        });
        throw err;
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        toast({
          title: "No Data",
          description: `No data received for ${symbol}. Please try again.`,
          variant: "destructive",
        });
        throw new Error(`No data received for symbol ${symbol}`);
      }

      // Process dates (the edge function returns date strings)
      const processedData = data.map((item: any) => ({
        date: new Date(item.date),
        close: parseFloat(item.close),
      }));

      if (processedData.length === 0) {
        toast({
          title: "No Data in Date Range",
          description: `No data available for ${symbol} in the selected date range.`,
          variant: "destructive",
        });
        throw new Error(`No data available for ${symbol} in the selected date range`);
      }

      toast({
        title: "Data Fetched",
        description: `Successfully fetched data for ${symbol}`,
      });
      
      return processedData;
    } catch (error) {
      toast({
        title: "Error",
        description: `Error fetching data for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const calculateReturns = (prices: number[]): number[] => {
    if (prices.length < 2) {
      throw new Error('Not enough price data to calculate returns');
    }

    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      const return_i = (prices[i] - prices[i-1]) / prices[i-1];
      if (isNaN(return_i)) {
        toast({
          title: "Calculation Error",
          description: "Invalid return calculation detected",
          variant: "destructive",
        });
        throw new Error('Invalid return calculation detected');
      }
      returns.push(return_i);
    }
    return returns;
  };

  const optimizePortfolio = async (
    stocks: string[],
    dateRange: { start: Date; end: Date },
    portfolioValue: number,
    riskAversion: number,
    benchmarkSymbols: string[] = ["SPY"]
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      toast({
        title: "Starting Optimization",
        description: "Beginning portfolio optimization process...",
      });

      const stocksData = await Promise.all(
        stocks.map(symbol => fetchStockData(symbol, dateRange.start, dateRange.end))
      );
      
      // Fetch data for all benchmarks
      const benchmarksData = await Promise.all(
        benchmarkSymbols.map(symbol => fetchStockData(symbol, dateRange.start, dateRange.end))
      );

      toast({
        title: "Processing Data",
        description: `Calculating returns and optimizing weights using ${benchmarkSymbols.map(symbol => getBenchmarkName(symbol)).join(', ')} as benchmarks...`,
      });

      const returns = stocksData.map(data => {
        const prices = data.map(d => d.close);
        return calculateReturns(prices);
      });

      if (returns.some(r => r.length === 0)) {
        throw new Error('Not enough price data to calculate returns');
      }

      const gjrGarchResults = returns.map(returnSeries => calculateGJRGarch(returnSeries));
      
      const conditionalMeans = gjrGarchResults.map(result => 
        result.conditionalMeans[result.conditionalMeans.length - 1]
      );

      const covMatrix = returns.map((returnSeries1, i) => 
        returns.map((returnSeries2, j) => {
          if (i === j) {
            return gjrGarchResults[i].variances[gjrGarchResults[i].variances.length - 1];
          }
          const correlation = returnSeries1.reduce((sum, _, k) => 
            sum + returnSeries1[k] * returnSeries2[k], 0
          ) / Math.sqrt(
            returnSeries1.reduce((sum, r) => sum + r * r, 0) *
            returnSeries2.reduce((sum, r) => sum + r * r, 0)
          );
          return correlation * Math.sqrt(
            gjrGarchResults[i].variances[gjrGarchResults[i].variances.length - 1] *
            gjrGarchResults[j].variances[gjrGarchResults[j].variances.length - 1]
          );
        })
      );

      const weights = calculateOptimalWeights(conditionalMeans, covMatrix, riskAversion);
    
      // Calculate allocations separately from weights
      const allocations = stocks.reduce((acc, symbol, i) => {
        acc[symbol] = weights[i] * portfolioValue;
        return acc;
      }, {} as { [key: string]: number });

      const portfolioReturn = weights.reduce((sum, w, i) => sum + w * conditionalMeans[i], 0);
      const portfolioVariance = weights.reduce((sum1, wi, i) => 
        sum1 + weights.reduce((sum2, wj, j) => sum2 + wi * wj * covMatrix[i][j], 0),
        0
      );
      const portfolioVolatility = Math.sqrt(portfolioVariance);

      const portfolioReturns = returns[0].map((_, t) => 
        weights.reduce((sum, w, i) => sum + w * returns[i][t], 0)
      );
      
      const sortedReturns = [...portfolioReturns].sort((a, b) => a - b);
      const var95 = sortedReturns[Math.floor(sortedReturns.length * 0.05)];
      const es95 = sortedReturns
        .filter(r => r <= var95)
        .reduce((sum, r) => sum + r, 0) / sortedReturns.filter(r => r <= var95).length;

      // Store weights separately from allocations
      const weightsBySymbol = stocks.reduce((acc, symbol, i) => {
        acc[symbol] = weights[i];
        return acc;
      }, {} as { [key: string]: number });

      toast({
        title: "Optimization Complete",
        description: "Portfolio optimization finished successfully!",
      });

      // Initialize benchmark values 
      const initialBenchmarkValues = benchmarksData.map(data => data[0].close);
      
      // Create historical data with all benchmarks
      const historicalData = stocksData[0].map((_, i) => {
        const date = stocksData[0][i].date;
        const value = stocks.reduce((sum, _, j) => 
          sum + (stocksData[j][i].close / stocksData[j][0].close) * allocations[stocks[j]],
          0
        );
        
        // Create a map of benchmark values
        const benchmarks = benchmarkSymbols.reduce((acc, symbol, idx) => {
          acc[symbol] = benchmarksData[idx][i].close / initialBenchmarkValues[idx] * portfolioValue;
          return acc;
        }, {} as { [symbol: string]: number });
        
        return {
          date,
          value,
          benchmarks
        };
      });

      setResults({
        weights: weightsBySymbol,
        allocations: allocations,
        metrics: {
          expectedReturn: portfolioReturn,
          volatility: portfolioVolatility * 100,
          var: var95 * portfolioValue,
          es: es95 * portfolioValue,
        },
        historicalData,
        benchmarkSymbols,
      });

    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        title: "Optimization Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getBenchmarkName = (symbol: string): string => {
    switch (symbol) {
      case "SPY": return "S&P 500";
      case "DIA": return "DOW Jones";
      case "QQQ": return "Nasdaq";
      case "FEZ": return "Euro Stoxx 50";
      case "STOXX": return "Euro Stoxx 600";
      case "URTH": return "MSCI World Index";
      default: return symbol;
    }
  };

  return { optimizePortfolio, isLoading, error, results };
};

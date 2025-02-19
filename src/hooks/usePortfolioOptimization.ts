import { useState } from 'react';
import { create, all } from 'mathjs';

const math = create(all);

const ALPHA_VANTAGE_API_KEY = '8NMNG3M6153UL6N7';

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
    benchmark: number;
  }[];
}

const calculateGJRGarch = (returns: number[]) => {
  // GJR-GARCH(1,1) parameters - tuned for typical financial data
  const omega = 0.000001;  // Very small positive number for variance intercept
  const alpha = 0.05;      // ARCH parameter
  const gamma = 0.05;      // Leverage parameter for negative returns
  const beta = 0.85;       // GARCH parameter

  const variances: number[] = [];
  const conditionalMeans: number[] = [];
  
  // Initialize with sample variance
  let lastVariance = returns.slice(0, 20).reduce((acc, ret) => acc + ret * ret, 0) / 20;
  
  for (let t = 1; t < returns.length; t++) {
    const prevReturn = returns[t - 1];
    const leverage = prevReturn < 0 ? 1 : 0;
    
    // Update variance using GJR-GARCH formula
    const newVariance = omega + 
                       alpha * Math.pow(prevReturn, 2) +
                       gamma * leverage * Math.pow(prevReturn, 2) +
                       beta * lastVariance;
    
    variances.push(newVariance);
    
    // Calculate conditional mean using GARCH-in-mean
    const lookback = Math.min(20, t);
    const meanValue = returns.slice(t - lookback, t).reduce((sum, val) => sum + val, 0) / lookback;
    conditionalMeans.push(meanValue);
    
    lastVariance = newVariance;
  }

  return {
    conditionalMeans: conditionalMeans,
    variances: variances
  };
};

const calculateOptimalWeights = (
  means: number[],
  covMatrix: number[][],
  gamma: number = 2
): number[] => {
  const n = means.length;
  
  // Implement gradient descent for optimization
  const maxIterations = 1000;
  const learningRate = 0.01;
  const tolerance = 1e-6;
  
  // Initialize weights to equal allocation
  let weights = Array(n).fill(1/n);
  
  for (let iter = 0; iter < maxIterations; iter++) {
    const oldWeights = [...weights];
    
    // Calculate gradient of objective function
    const gradients = means.map((mean, i) => {
      let covSum = 0;
      for (let j = 0; j < n; j++) {
        covSum += covMatrix[i][j] * weights[j];
      }
      return mean - gamma * covSum;
    });
    
    // Update weights using gradient
    weights = weights.map((w, i) => w + learningRate * gradients[i]);
    
    // Project onto simplex (ensure sum = 1 and non-negative)
    let sum = weights.reduce((a, b) => a + b, 0);
    weights = weights.map(w => Math.max(0, w));
    sum = weights.reduce((a, b) => a + b, 0);
    weights = weights.map(w => w / sum);
    
    // Check convergence
    const change = Math.sqrt(
      weights.reduce((sum, w, i) => sum + Math.pow(w - oldWeights[i], 2), 0)
    );
    if (change < tolerance) break;
  }
  
  return weights;
};

export const usePortfolioOptimization = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [results, setResults] = useState<OptimizationResults | null>(null);

  const fetchStockData = async (symbol: string, startDate: Date, endDate: Date) => {
    try {
      const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}&outputsize=full`;
      console.log(`Fetching data for ${symbol}...`);

      const response = await fetch(apiUrl);
      const data = await response.json();
      
      console.log(`Alpha Vantage response for ${symbol}:`, data);

      if (data['Error Message']) {
        throw new Error(`Alpha Vantage error: ${data['Error Message']}`);
      }

      if (data['Note']) {
        throw new Error(`API limit reached: ${data['Note']}`);
      }

      const timeSeriesData = data['Time Series (Daily)'];
      
      if (!timeSeriesData) {
        throw new Error(`No data received from Alpha Vantage for symbol ${symbol}. Please verify the symbol is correct (e.g., "AAPL" for Apple).`);
      }

      const filteredData = Object.entries(timeSeriesData)
        .filter(([date]) => {
          const currentDate = new Date(date);
          return currentDate >= startDate && currentDate <= endDate;
        })
        .map(([date, values]: [string, any]) => ({
          date: new Date(date),
          close: parseFloat(values['4. close']),
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      if (filteredData.length === 0) {
        throw new Error(`No data found for ${symbol} in the specified date range`);
      }

      console.log(`Successfully fetched ${filteredData.length} data points for ${symbol}`);
      return filteredData;
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      throw error;
    }
  };

  const calculateReturns = (prices: number[]): number[] => {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
  };

  const optimizePortfolio = async (
    stocks: string[],
    dateRange: { start: Date; end: Date },
    portfolioValue: number
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch data for all stocks and S&P500 (SPY)
      const stocksData = await Promise.all(
        stocks.map(symbol => fetchStockData(symbol, dateRange.start, dateRange.end))
      );
      
      const spyData = await fetchStockData('SPY', dateRange.start, dateRange.end);

      // Calculate returns for each stock
      const returns = stocksData.map(data => 
        calculateReturns(data.map(d => d.close))
      );

      // Apply GJR-GARCH to each stock's returns
      const gjrGarchResults = returns.map(returnSeries => calculateGJRGarch(returnSeries));
      
      // Extract conditional means
      const conditionalMeans = gjrGarchResults.map(result => 
        result.conditionalMeans.reduce((sum, val) => sum + val, 0) / result.conditionalMeans.length
      );

      // Build variance-covariance matrix using GJR-GARCH variances
      const covMatrix = returns.map((_, i) => 
        returns.map((_, j) => {
          if (i === j) {
            return gjrGarchResults[i].variances.reduce((sum, val) => sum + val, 0) / 
                   gjrGarchResults[i].variances.length;
          }
          // Calculate covariance using correlation and individual variances
          const corr = math.mean(returns[i].map((_, k) => returns[i][k] * returns[j][k])) /
                      (math.std(returns[i]) * math.std(returns[j]));
          return corr * Math.sqrt(
            gjrGarchResults[i].variances.reduce((sum, val) => sum + val, 0) / gjrGarchResults[i].variances.length *
            gjrGarchResults[j].variances.reduce((sum, val) => sum + val, 0) / gjrGarchResults[j].variances.length
          );
        })
      );

      // Calculate optimal weights using the maximization of utility function
      const weights = calculateOptimalWeights(conditionalMeans, covMatrix);

      // Calculate portfolio metrics
      const portfolioReturn = weights.reduce((sum, w, i) => sum + w * conditionalMeans[i], 0);
      const portfolioVariance = weights.reduce((sum1, wi, i) => 
        sum1 + weights.reduce((sum2, wj, j) => sum2 + wi * wj * covMatrix[i][j], 0), 
      0);
      const portfolioVolatility = Math.sqrt(portfolioVariance);

      // Calculate risk metrics
      const var95 = -1.645 * portfolioVolatility;
      const es95 = -1.962 * portfolioVolatility;

      const allocations = Object.fromEntries(
        stocks.map((symbol, i) => [
          symbol,
          weights[i] * portfolioValue
        ])
      );

      // Calculate historical portfolio values
      const initialSpyValue = spyData[0].close;
      const historicalData = stocksData[0].map((_, i) => {
        const date = stocksData[0][i].date;
        const value = stocks.reduce((sum, _, j) => 
          sum + (stocksData[j][i].close / stocksData[j][0].close) * allocations[stocks[j]],
          0
        );
        return {
          date,
          value,
          benchmark: spyData[i].close / initialSpyValue * portfolioValue,
        };
      });

      setResults({
        weights: Object.fromEntries(stocks.map((symbol, i) => [symbol, weights[i]])),
        allocations,
        metrics: {
          expectedReturn: portfolioReturn,
          volatility: portfolioVolatility,
          var: var95,
          es: es95,
        },
        historicalData,
      });
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Portfolio optimization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { optimizePortfolio, isLoading, error, results };
};

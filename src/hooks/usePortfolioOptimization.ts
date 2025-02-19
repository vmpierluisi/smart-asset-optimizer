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
  // GJR-GARCH(1,1) parameters
  const omega = 0.000001;  // Very small positive number for variance intercept
  const alpha = 0.05;      // ARCH parameter
  const gamma = 0.05;      // Leverage parameter for negative returns
  const beta = 0.85;       // GARCH parameter

  const variances: number[] = [];
  const conditionalMeans: number[] = [];
  
  // Initialize with sample variance
  let lastVariance = math.variance(returns.slice(0, 20));
  
  for (let t = 1; t < returns.length; t++) {
    const prevReturn = returns[t - 1];
    const leverage = prevReturn < 0 ? 1 : 0;
    
    // Update variance using GJR-GARCH formula
    const newVariance = omega + 
                       alpha * Math.pow(prevReturn, 2) +
                       gamma * leverage * Math.pow(prevReturn, 2) +
                       beta * lastVariance;
    
    variances.push(newVariance);
    
    // Calculate conditional mean (using simple moving average for now)
    const lookback = Math.min(20, t);
    const mean = math.mean(returns.slice(t - lookback, t));
    conditionalMeans.push(mean);
    
    lastVariance = newVariance;
  }

  return {
    conditionalMeans,
    variances
  };
};

const calculateOptimalWeights = (
  means: number[],
  covMatrix: number[][],
  gamma: number = 2
) => {
  // For now, return equal weights until we implement the optimization
  const numAssets = means.length;
  return Array(numAssets).fill(1 / numAssets);
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

  const calculateReturns = (prices: number[]) => {
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
      
      // Extract conditional means and variances
      const conditionalMeans = gjrGarchResults.map(result => 
        math.mean(result.conditionalMeans)
      );

      // Build variance-covariance matrix using GJR-GARCH variances
      const covMatrix = returns.map((_, i) => 
        returns.map((_, j) => {
          if (i === j) {
            return math.mean(gjrGarchResults[i].variances);
          }
          const cov = math.multiply(
            math.sqrt(gjrGarchResults[i].variances),
            math.sqrt(gjrGarchResults[j].variances)
          );
          return math.mean(cov);
        })
      );

      // Calculate optimal weights
      const weights = calculateOptimalWeights(conditionalMeans, covMatrix);

      // Calculate portfolio metrics
      const portfolioReturn = math.multiply(weights, conditionalMeans);
      const portfolioVariance = math.multiply(
        math.multiply(weights, covMatrix),
        weights
      );
      const portfolioVolatility = Math.sqrt(portfolioVariance);

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

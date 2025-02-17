import { useState } from 'react';
import yahooFinance from 'yahoo-finance2';
import { create, all } from 'mathjs';

const math = create(all);

// TODO: Replace this with your Alpha Vantage API key from https://www.alphavantage.co/support/#api-key
const ALPHA_VANTAGE_API_KEY = 'REPLACE_WITH_YOUR_API_KEY';

// Ensure URLSearchParams is available
if (typeof URLSearchParams === 'undefined') {
  (window as any).URLSearchParams = class URLSearchParams {
    constructor(params: any) {
      this.params = params;
    }
    toString() {
      return Object.entries(this.params)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
    }
  };
}

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

export const usePortfolioOptimization = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [results, setResults] = useState<OptimizationResults | null>(null);

  const fetchStockData = async (symbol: string, startDate: Date, endDate: Date) => {
    try {
      // Add error handling for browser environment
      if (typeof window !== 'undefined' && !window.process) {
        window.process = { env: {} } as any;
      }

      const data = await yahooFinance.historical(symbol, {
        period1: startDate,
        period2: endDate,
        interval: '1d' // Adding explicit interval
      });
      return data.map(item => ({
        date: new Date(item.date),
        close: item.close,
      }));
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
      // Fetch historical data for all stocks
      const stocksData = await Promise.all(
        stocks.map(symbol => fetchStockData(symbol, dateRange.start, dateRange.end))
      );

      // Calculate returns
      const returns = stocksData.map(data => 
        calculateReturns(data.map(d => d.close))
      );

      // Calculate mean returns and covariance matrix
      const meanReturns = returns.map(r => Number(math.mean(r)));
      
      const covMatrix = math.matrix(returns.map(r1 => 
        returns.map(r2 => {
          const diff1 = math.subtract(r1, math.mean(r1));
          const diff2 = math.subtract(r2, math.mean(r2));
          return Number(math.mean(math.dotMultiply(diff1, diff2)));
        })
      ));

      // Equal weights for simplicity
      const weights = stocks.map(() => 1 / stocks.length);

      // Calculate portfolio metrics
      const portfolioReturn = Number(math.multiply(weights, meanReturns));
      const portfolioVariance = Number(
        math.multiply(math.multiply(weights, covMatrix), weights)
      );
      const portfolioVolatility = Math.sqrt(portfolioVariance);

      // Calculate VaR and ES (simplified)
      const var95 = -1.645 * portfolioVolatility;
      const es95 = -1.962 * portfolioVolatility;

      // Calculate allocations
      const allocations = Object.fromEntries(
        stocks.map((symbol, i) => [
          symbol,
          weights[i] * portfolioValue
        ])
      );

      // Generate historical portfolio value data
      const historicalData = stocksData[0].map((_, i) => {
        const date = stocksData[0][i].date;
        const value = stocks.reduce((sum, _, j) => 
          sum + (stocksData[j][i].close / stocksData[j][0].close) * allocations[stocks[j]],
          0
        );
        return {
          date,
          value,
          benchmark: stocksData[0][i].close / stocksData[0][0].close * portfolioValue,
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
      setError(err as Error);
      console.error('Portfolio optimization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { optimizePortfolio, isLoading, error, results };
};

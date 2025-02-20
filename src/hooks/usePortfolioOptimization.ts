
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
  // Implement GARCH parameter estimation using Maximum Likelihood Estimation
  const n = returns.length;
  const sigmas: number[] = [];
  const means: number[] = [];
  
  // Initial estimates
  let sigma2 = math.variance(returns);
  let lastReturn = 0;
  let lastSigma2 = sigma2;

  // MLE optimization for GARCH parameters
  const optimizeGARCH = () => {
    let omega = 0.00001;
    let alpha = 0.05;
    let beta = 0.85;
    let gamma = 0.05;

    const maxIter = 100;
    const learningRate = 0.01;
    
    for (let iter = 0; iter < maxIter; iter++) {
      let dOmega = 0, dAlpha = 0, dBeta = 0, dGamma = 0;
      let likelihood = 0;
      
      for (let t = 1; t < n; t++) {
        const r = returns[t];
        const prevR = returns[t-1];
        const leverage = prevR < 0 ? 1 : 0;
        
        sigma2 = omega + alpha * prevR * prevR + gamma * leverage * prevR * prevR + beta * lastSigma2;
        
        // Update gradients
        const dsigma2 = -0.5/sigma2 + 0.5 * r * r/(sigma2 * sigma2);
        dOmega += dsigma2;
        dAlpha += dsigma2 * prevR * prevR;
        dBeta += dsigma2 * lastSigma2;
        dGamma += dsigma2 * leverage * prevR * prevR;
        
        likelihood += -0.5 * Math.log(2 * Math.PI * sigma2) - 0.5 * r * r / sigma2;
        lastSigma2 = sigma2;
      }
      
      // Update parameters
      omega = Math.max(0.000001, omega + learningRate * dOmega);
      alpha = Math.max(0, Math.min(1, alpha + learningRate * dAlpha));
      beta = Math.max(0, Math.min(1, beta + learningRate * dBeta));
      gamma = Math.max(0, Math.min(1, gamma + learningRate * dGamma));
    }
    
    return { omega, alpha, beta, gamma };
  };

  const params = optimizeGARCH();
  
  // Calculate conditional variances and means using estimated parameters
  for (let t = 1; t < n; t++) {
    const r = returns[t-1];
    const leverage = r < 0 ? 1 : 0;
    
    sigma2 = params.omega + 
             params.alpha * r * r + 
             params.gamma * leverage * r * r + 
             params.beta * lastSigma2;
    
    sigmas.push(Math.sqrt(sigma2));
    
    // Calculate conditional mean using GARCH-in-mean
    const mean = math.mean(returns.slice(Math.max(0, t-20), t));
    means.push(mean);
    
    lastSigma2 = sigma2;
  }

  return {
    conditionalMeans: means,
    variances: sigmas.map(s => s * s)
  };
};

const calculateOptimalWeights = (
  means: number[],
  covMatrix: number[][],
  gamma: number
): number[] => {
  const n = means.length;
  
  // Implement constrained optimization using gradient descent
  const maxIterations = 1000;
  const learningRate = 0.01;
  const tolerance = 1e-6;
  
  // Initialize weights to equal allocation
  let weights = Array(n).fill(1/n);
  
  for (let iter = 0; iter < maxIterations; iter++) {
    const oldWeights = [...weights];
    
    // Calculate utility function gradient
    const gradients = means.map((mean, i) => {
      let covSum = 0;
      for (let j = 0; j < n; j++) {
        covSum += covMatrix[i][j] * weights[j];
      }
      return mean - gamma * covSum;
    });
    
    // Update weights using projected gradient descent
    weights = weights.map((w, i) => w + learningRate * gradients[i]);
    
    // Project onto simplex (ensure sum = 1 and non-negative)
    weights = weights.map(w => Math.max(0, w));
    const sum = weights.reduce((a, b) => a + b, 0);
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
        throw new Error(`No data received from Alpha Vantage for symbol ${symbol}`);
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

      return filteredData;
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      throw error;
    }
  };

  const calculateReturns = (prices: number[]): number[] => {
    return prices.slice(1).map((price, i) => 
      (price - prices[i]) / prices[i]
    );
  };

  const optimizePortfolio = async (
    stocks: string[],
    dateRange: { start: Date; end: Date },
    portfolioValue: number,
    riskAversion: number
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const stocksData = await Promise.all(
        stocks.map(symbol => fetchStockData(symbol, dateRange.start, dateRange.end))
      );
      
      const spyData = await fetchStockData('SPY', dateRange.start, dateRange.end);

      // Calculate returns
      const returns = stocksData.map(data => 
        calculateReturns(data.map(d => d.close))
      );

      // Fit GJR-GARCH models
      const gjrGarchResults = returns.map(returnSeries => calculateGJRGarch(returnSeries));
      
      // Extract conditional means and calculate covariance matrix
      const conditionalMeans = gjrGarchResults.map(result => 
        result.conditionalMeans[result.conditionalMeans.length - 1]
      );

      // Calculate covariance matrix using returns and GARCH variances
      const covMatrix = returns.map((_, i) => 
        returns.map((_, j) => {
          if (i === j) {
            return gjrGarchResults[i].variances[gjrGarchResults[i].variances.length - 1];
          }
          const corr = math.mean(returns[i].map((_, k) => returns[i][k] * returns[j][k])) /
                      (math.std(returns[i]) * math.std(returns[j]));
          return corr * Math.sqrt(
            gjrGarchResults[i].variances[gjrGarchResults[i].variances.length - 1] *
            gjrGarchResults[j].variances[gjrGarchResults[j].variances.length - 1]
          );
        })
      );

      // Optimize portfolio weights
      const weights = calculateOptimalWeights(conditionalMeans, covMatrix, riskAversion);

      // Calculate portfolio metrics
      const portfolioReturn = weights.reduce((sum, w, i) => sum + w * conditionalMeans[i], 0);
      const portfolioVariance = weights.reduce((sum1, wi, i) => 
        sum1 + weights.reduce((sum2, wj, j) => sum2 + wi * wj * covMatrix[i][j], 0),
        0
      );
      const portfolioVolatility = Math.sqrt(portfolioVariance);

      // Calculate risk metrics using historical simulation
      const portfolioReturns = returns[0].map((_, t) => 
        weights.reduce((sum, w, i) => sum + w * returns[i][t], 0)
      );
      
      const var95 = math.quantileSeq(portfolioReturns, 0.05);
      const es95 = math.mean(portfolioReturns.filter(r => r < var95));

      const allocations = Object.fromEntries(
        stocks.map((symbol, i) => [
          symbol,
          weights[i] * portfolioValue
        ])
      );

      // Calculate historical performance
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

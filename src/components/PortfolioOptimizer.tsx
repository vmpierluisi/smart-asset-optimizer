
import React, { useState } from 'react';
import { StockInput } from './StockInput';
import { DateRangeSelector } from './DateRangeSelector';
import { PortfolioValueInput } from './PortfolioValueInput';
import { OptimizationResults } from './OptimizationResults';
import { usePortfolioOptimization } from '../hooks/usePortfolioOptimization';

export const PortfolioOptimizer: React.FC = () => {
  const [stocks, setStocks] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
    end: new Date(),
  });
  const [portfolioValue, setPortfolioValue] = useState<number>(10000);

  const { optimizePortfolio, isLoading, error, results } = usePortfolioOptimization();

  const handleOptimize = async () => {
    if (stocks.length < 2) {
      alert("Please select at least 2 stocks");
      return;
    }
    await optimizePortfolio(stocks, dateRange, portfolioValue);
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Portfolio Optimizer</h1>
          <p className="text-lg text-gray-600">Optimize your portfolio using modern portfolio theory</p>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6 glassmorphism p-6 rounded-xl">
            <StockInput stocks={stocks} onChange={setStocks} />
            <DateRangeSelector value={dateRange} onChange={setDateRange} />
            <PortfolioValueInput value={portfolioValue} onChange={setPortfolioValue} />
            <button
              onClick={handleOptimize}
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? "Optimizing..." : "Optimize Portfolio"}
            </button>
          </div>

          <div className="glassmorphism p-6 rounded-xl">
            {error && (
              <div className="text-red-500 mb-4">
                Error: {error.message}
              </div>
            )}
            {results && <OptimizationResults results={results} />}
          </div>
        </div>
      </div>
    </div>
  );
};

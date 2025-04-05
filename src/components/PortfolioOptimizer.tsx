import React, { useState } from 'react';
import { OptimizationResults } from './OptimizationResults';
import { usePortfolioOptimization } from '../hooks/usePortfolioOptimization';
import { AnalysisSidebar } from './AnalysisSidebar';

export const PortfolioOptimizer: React.FC = () => {
  const [stocks, setStocks] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
    end: new Date(),
  });
  const [portfolioValue, setPortfolioValue] = useState<number>(10000);
  const [riskAversion, setRiskAversion] = useState<number>(2);
  const [benchmarks, setBenchmarks] = useState<string[]>(["SPY"]); // Default to S&P 500

  const { optimizePortfolio, isLoading, error, results } = usePortfolioOptimization();

  const handleOptimize = async () => {
    if (stocks.length < 2) {
      alert("Please select at least 2 stocks");
      return;
    }
    
    if (benchmarks.length === 0) {
      alert("Please select at least one benchmark");
      return;
    }
    
    await optimizePortfolio(stocks, dateRange, portfolioValue, riskAversion, benchmarks);
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      <AnalysisSidebar 
        stocks={stocks}
        setStocks={setStocks}
        dateRange={dateRange}
        setDateRange={setDateRange}
        portfolioValue={portfolioValue}
        setPortfolioValue={setPortfolioValue}
        riskAversion={riskAversion}
        setRiskAversion={setRiskAversion}
        benchmarks={benchmarks}
        setBenchmarks={setBenchmarks}
        onOptimize={handleOptimize}
        isLoading={isLoading}
      />
      
      <main className="grow w-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
        <div className="w-full h-full flex flex-col p-[30px]">
          <header className="text-left mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Portfolio Optimizer</h1>
            <p className="text-sm sm:text-md md:text-lg text-gray-600">Optimize your portfolio using modern portfolio theory</p>
          </header>

          {/* Results Section */}
          {error && (
            <div className="text-red-500 p-4 bg-red-50 rounded-xl mb-6">
              Error: {error.message}
            </div>
          )}
          {results && <OptimizationResults results={results} />}
          
          {!results && !error && (
            <div className="flex w-full h-full items-center justify-center text-center text-gray-500 flex-1">
              <div className="p-8 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
                <p className="mb-2 text-lg">Configure your portfolio settings in the sidebar</p>
                <p>Then click "Optimize Portfolio" to see results</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

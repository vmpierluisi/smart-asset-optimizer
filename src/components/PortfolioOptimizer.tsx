
import React, { useState } from 'react';
import { OptimizationResults } from './OptimizationResults';
import { usePortfolioOptimization } from '../hooks/usePortfolioOptimization';
import { AnalysisSidebar } from './AnalysisSidebar';
import { SidebarProvider } from "@/components/ui/sidebar";

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
    <div className="flex h-full w-full">
      <SidebarProvider>
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
      </SidebarProvider>
      
      <div className="flex-1 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 w-full">
        <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
          <header className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Portfolio Optimizer</h1>
            <p className="text-md md:text-lg text-gray-600">Optimize your portfolio using modern portfolio theory</p>
          </header>

          {/* Results Section */}
          {error && (
            <div className="text-red-500 p-4 bg-red-50 rounded-xl">
              Error: {error.message}
            </div>
          )}
          {results && <OptimizationResults results={results} />}
          
          {!results && !error && (
            <div className="flex items-center justify-center h-[60vh] text-center text-gray-500">
              <div>
                <p className="mb-2">Configure your portfolio settings in the sidebar</p>
                <p>Then click "Optimize Portfolio" to see results</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

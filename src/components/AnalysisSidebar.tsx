import React, { useState } from 'react';
import { StockInput } from './StockInput';
import { DateRangeSelector } from './DateRangeSelector';
import { PortfolioValueInput } from './PortfolioValueInput';
import { RiskAversionInput } from './RiskAversionInput';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, SlidersHorizontal, Calendar, DollarSign, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisSidebarProps {
  stocks: string[];
  setStocks: (stocks: string[]) => void;
  dateRange: { start: Date; end: Date };
  setDateRange: (dateRange: { start: Date; end: Date }) => void;
  portfolioValue: number;
  setPortfolioValue: (value: number) => void;
  riskAversion: number;
  setRiskAversion: (value: number) => void;
  benchmarks: string[];
  setBenchmarks: (benchmarks: string[]) => void;
  onOptimize: () => void;
  isLoading: boolean;
}

export function AnalysisSidebar({
  stocks,
  setStocks,
  dateRange,
  setDateRange,
  portfolioValue,
  setPortfolioValue,
  riskAversion,
  setRiskAversion,
  benchmarks,
  setBenchmarks,
  onOptimize,
  isLoading
}: AnalysisSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const expandSidebar = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  return (
    <div 
      className={cn(
        "h-full transition-all duration-300 bg-sidebar text-sidebar-foreground border-r flex",
        isExpanded ? "w-[20rem] min-w-[20rem]" : "w-[3rem] min-w-[3rem]"
      )}
    >
      <div className="flex flex-col h-full w-full">
        <div className="flex h-12 items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              "h-7 w-7",
              !isExpanded && "ml-auto"
            )}
          >
            {isExpanded ? (
              <ArrowLeft className="h-4 w-4" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
          {isExpanded && <span className="ml-2 text-lg font-semibold">Analysis Settings</span>}
        </div>
        
        <div className="flex-1 overflow-auto">
          <div className="p-2">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 p-0"
                  onClick={expandSidebar}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
                {isExpanded && <span>Stocks Selection</span>}
              </div>
              {isExpanded && (
                <div className="p-2">
                  <StockInput stocks={stocks} onChange={setStocks} />
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 p-0"
                  onClick={expandSidebar}
                >
                  <Calendar className="h-4 w-4" />
                </Button>
                {isExpanded && <span>Date Range & Benchmarks</span>}
              </div>
              {isExpanded && (
                <div className="p-2">
                  <DateRangeSelector 
                    value={dateRange} 
                    onChange={setDateRange} 
                    benchmarks={benchmarks}
                    onBenchmarksChange={setBenchmarks}
                  />
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 p-0"
                  onClick={expandSidebar}
                >
                  <DollarSign className="h-4 w-4" />
                </Button>
                {isExpanded && <span>Investment Amount</span>}
              </div>
              {isExpanded && (
                <div className="p-2">
                  <PortfolioValueInput value={portfolioValue} onChange={setPortfolioValue} />
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 p-0"
                  onClick={expandSidebar}
                >
                  <Target className="h-4 w-4" />
                </Button>
                {isExpanded && <span>Risk Tolerance</span>}
              </div>
              {isExpanded && (
                <div className="p-2">
                  <RiskAversionInput value={riskAversion} onChange={setRiskAversion} />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {isExpanded && (
          <div className="p-4 border-t">
            <Button
              onClick={onOptimize}
              disabled={isLoading}
              className="w-full"
              variant="default"
              size="lg"
            >
              {isLoading ? "Optimizing..." : "Optimize Portfolio"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 
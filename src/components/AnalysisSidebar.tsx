import { useState } from 'react';
import { StockInput } from './StockInput';
import { DateRangeSelector } from './DateRangeSelector';
import { PortfolioValueInput } from './PortfolioValueInput';
import { RiskAversionInput } from './RiskAversionInput';
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, SlidersHorizontal, Calendar, DollarSign, Target } from "lucide-react";
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
  const [isFullscreen, setIsFullscreen] = useState(true); // default fullscreen
  const [isMinimized, setIsMinimized] = useState(false);

  // Handlers
  const handleMinimize = () => {
    setIsMinimized(true);
    setIsFullscreen(false);
    setIsExpanded(false);
  };
  const handleMaximize = () => {
    setIsMinimized(false);
    setIsFullscreen(false);
    setIsExpanded(true);
  };
  const handleFullscreen = () => {
    setIsFullscreen(true);
    setIsMinimized(false);
    setIsExpanded(true);
  };
  const handleExitFullscreen = () => {
    setIsFullscreen(false);
    setIsExpanded(true);
    setIsMinimized(false);
  };
  const expandSidebar = () => {
    setIsExpanded(true);
    setIsMinimized(false);
    setIsFullscreen(false);
  };
  // Check if at least 3 stocks are selected
  const isValidSelection = stocks.length >= 3;

  // Style helpers
  // Helper to compute fullscreen overlay style so it doesn't cover AppSidebar
  const { state: appSidebarState } = useSidebar();
  const getFullscreenOverlayStyle = () => {
    // Sidebar width: expanded = 16rem (256px), collapsed = 3rem (48px)
    const sidebarWidth = appSidebarState === "expanded" ? "16rem" : "3rem";
    return {
      position: "fixed" as const,
      top: 0,
      left: sidebarWidth,
      width: `calc(100vw - ${sidebarWidth})`,
      height: "100vh",
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      transition: "left 0.3s cubic-bezier(0.4,0,0.2,1), width 0.3s cubic-bezier(0.4,0,0.2,1), background 0.2s",
    };
  };
  const getContainerClass = () => {
    if (isFullscreen) {
      return "z-50 flex items-center justify-center";
    }
    if (isMinimized) {
      return "fixed right-6 bottom-8 z-50 transition-all duration-300";
    }
    // Sidebar mode
    return cn(
      "fixed top-0 right-0 h-full transition-all duration-300 bg-sidebar text-sidebar-foreground border-l flex z-40",
      isExpanded ? "w-[20rem] min-w-[20rem]" : "w-[3rem] min-w-[3rem]"
    );
  };

  // Main render
  return (
    <div
      className={getContainerClass()}
      style={isFullscreen ? getFullscreenOverlayStyle() : {}}
    >
      {/* Minimized Floating Button */}
      {isMinimized ? (
        <div className="bg-background rounded-full p-2 shadow-lg border cursor-pointer flex items-center gap-2 px-4" onClick={handleMaximize}>
          <SlidersHorizontal className="h-5 w-5 mr-1" />
          <span className="font-medium text-sm">Analysis</span>
          <ArrowLeft className="h-4 w-4 ml-1" />
        </div>
      ) : (
        <div className={cn(
          "flex flex-col h-full w-full shadow-xl border transition-all duration-300",
          isFullscreen
            ? "max-w-2xl mx-auto my-auto rounded-xl border bg-background/95 backdrop-blur-lg"
            : "bg-sidebar"
        )}>
          {/* Header Controls */}
          <div className="flex h-12 items-center px-4 border-b justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              <span className="ml-2 text-lg font-semibold">Analysis Settings</span>
            </div>
            <div className="flex items-center gap-1">
              {!isFullscreen && (
                <Button variant="ghost" size="icon" onClick={handleFullscreen} className="h-8 w-8" title="Fullscreen">
                  <span className="sr-only">Fullscreen</span>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2m8 0h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2m-8 0H6a2 2 0 01-2-2v-2" /></svg>
                </Button>
              )}
              {isFullscreen && (
                <Button variant="ghost" size="icon" onClick={handleExitFullscreen} className="h-8 w-8" title="Exit Fullscreen">
                  <span className="sr-only">Exit Fullscreen</span>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8V6a2 2 0 00-2-2h-2m-4 0H6a2 2 0 00-2 2v2m0 8v2a2 2 0 002 2h2m8 0h2a2 2 0 002-2v-2" /></svg>
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleMinimize} className="h-8 w-8" title="Minimize">
                <span className="sr-only">Minimize</span>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
              </Button>
            </div>
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
                disabled={isLoading || !isValidSelection}
                className="w-full"
                variant="default"
                size="lg"
              >
                {isLoading ? "Optimizing..." : "Optimize Portfolio"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
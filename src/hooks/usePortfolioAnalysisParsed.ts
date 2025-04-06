import { useMemo } from 'react';

interface ParsedAnalysis {
  portfolioPerformance: string | null;
  benchmarkPerformance: string | null;
  riskMetrics: string | null;
  portfolioInsights: string | null;
}

interface AnalysisResults {
  performanceAnalysis: string | null;
  metricsAnalysis: string | null;
  stocksAnalysis: string | null;
}

/**
 * Maps API endpoint responses directly to UI sections
 * Each analysis endpoint maps to a specific section in the UI
 */
export const usePortfolioAnalysisParsed = (
  analysis: string | null, 
  analysisResults?: AnalysisResults
): ParsedAnalysis => {
  return useMemo(() => {
    // Direct mapping from endpoint results to UI sections
    if (analysisResults) {
      return {
        // Performance analysis endpoint -> Portfolio performance section
        portfolioPerformance: analysisResults.performanceAnalysis,
        
        // Currently unused, could be extracted from performance analysis in the future if needed
        benchmarkPerformance: null,
        
        // Metrics analysis endpoint -> Risk metrics section
        riskMetrics: analysisResults.metricsAnalysis,
        
        // Stocks analysis endpoint -> Portfolio insights section
        portfolioInsights: analysisResults.stocksAnalysis
      };
    }
    
    // Legacy fallback for combined analysis (for backward compatibility)
    return {
      portfolioPerformance: analysis,
      benchmarkPerformance: null,
      riskMetrics: null,
      portfolioInsights: null
    };
  }, [analysis, analysisResults]);
}; 
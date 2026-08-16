/**
 * React-query data hooks for the Stock Analysis feature.
 *
 * These replace the god-component's ~20 hand-rolled `useState` + `useEffect`
 * fetch blocks. The react-query cache becomes the shared data layer, so:
 *  - each section fetches independently and is cached/deduped by query key;
 *  - passing `enabled` lets a section defer its fetch until it's actually shown,
 *    which keeps the app under Twelve Data's free-tier rate limit (instead of
 *    firing ~20 calls the instant a stock is selected);
 *  - the AI-explanation context can read cached results via `queryClient`
 *    without re-fetching.
 */
import { useQuery } from '@tanstack/react-query';
import {
  fetchTwelveDataQuote,
  fetchStockStatistics,
  fetchTimeSeries,
  fetchHistoricalTimeSeries,
  fetchMovingAverage,
  fetchRSI,
  fetchMACD,
  fetchRecommendations,
  fetchPriceTarget,
  fetchDividendYield,
  fetchCompanyLogo,
  fetchCompanyProfile,
  getRecentMACDSignals,
  type TwelveDataStockQuote,
  type StockStatisticsData,
  type TimeSeriesData,
  type SMAData,
  type RSIData,
  type MACDData,
  type MACDSignals,
  type RecommendationsData,
  type PriceTargetData,
  type DividendYieldData,
  type CompanyLogoData,
  type CompanyProfileData,
} from '@/utils/twelveDataUtils';
import {
  fetchFinancialHealth,
  fetchValuationRatios,
  fetchTechnicalIndicators,
  fetchNewsSentiment,
  fetchRiskAnalysis,
  type FinancialHealthData,
  type ValuationData,
  type TechnicalIndicatorData,
  type NewsSentimentData,
  type RiskAnalysisData,
} from '@/utils/fmpFinanceUtils';
import { invokeFunction } from '@/lib/apiClient';

/** Options shared by every stock-analysis query hook. */
export interface StockQueryOptions {
  /** Defer the fetch until the consuming section is actually shown. */
  enabled?: boolean;
}

const FIVE_MIN = 5 * 60 * 1000;

const on = (symbol: string | null | undefined, enabled?: boolean) =>
  !!symbol && enabled !== false;

export function useStockQuote(symbol: string | null, opts: StockQueryOptions = {}) {
  return useQuery<TwelveDataStockQuote>({
    queryKey: ['stock', 'quote', symbol],
    queryFn: () => fetchTwelveDataQuote(symbol!),
    enabled: on(symbol, opts.enabled),
    staleTime: FIVE_MIN,
  });
}

export function useStockStatistics(symbol: string | null, opts: StockQueryOptions = {}) {
  return useQuery<StockStatisticsData | null>({
    queryKey: ['stock', 'statistics', symbol],
    queryFn: () => fetchStockStatistics(symbol!),
    enabled: on(symbol, opts.enabled),
    staleTime: FIVE_MIN,
  });
}

export function useTimeSeries(symbol: string | null, period: string, opts: StockQueryOptions = {}) {
  return useQuery<TimeSeriesData>({
    queryKey: ['stock', 'timeSeries', symbol, period],
    queryFn: () => fetchTimeSeries(symbol!, period),
    enabled: on(symbol, opts.enabled),
    staleTime: FIVE_MIN,
  });
}

export function useHistoricalTimeSeries(symbol: string | null, opts: StockQueryOptions = {}) {
  return useQuery<TimeSeriesData>({
    queryKey: ['stock', 'historical', symbol],
    queryFn: () => fetchHistoricalTimeSeries(symbol!),
    enabled: on(symbol, opts.enabled),
    staleTime: FIVE_MIN,
  });
}

export function useMovingAverage(
  symbol: string | null,
  maType: 'SMA' | 'EMA',
  period: number,
  timeframe: string,
  opts: StockQueryOptions = {},
) {
  return useQuery<SMAData | null>({
    queryKey: ['stock', 'ma', symbol, maType, period, timeframe],
    queryFn: () => fetchMovingAverage(symbol!, maType, period, timeframe),
    enabled: on(symbol, opts.enabled),
    staleTime: FIVE_MIN,
  });
}

export function useRSI(symbol: string | null, timeframe: string, opts: StockQueryOptions = {}) {
  return useQuery<RSIData | null>({
    queryKey: ['stock', 'rsi', symbol, timeframe],
    queryFn: () => fetchRSI(symbol!, timeframe),
    enabled: on(symbol, opts.enabled),
    staleTime: FIVE_MIN,
  });
}

/** MACD data plus the derived recent signals (joins MACD with a 1-month series). */
export function useMACD(symbol: string | null, timeframe: string, opts: StockQueryOptions = {}) {
  return useQuery<{ macd: MACDData | null; signals: MACDSignals | null }>({
    queryKey: ['stock', 'macd', symbol, timeframe],
    queryFn: async () => {
      const macd = await fetchMACD(symbol!, timeframe);
      const [series, signalMacd] = await Promise.all([
        fetchTimeSeries(symbol!, '1month'),
        fetchMACD(symbol!, '3M'),
      ]);
      let signals: MACDSignals | null = null;
      if (signalMacd && series) {
        signals = getRecentMACDSignals(signalMacd, series).recentSignals;
      }
      return { macd, signals };
    },
    enabled: on(symbol, opts.enabled),
    staleTime: FIVE_MIN,
  });
}

export function useRecommendations(symbol: string | null, opts: StockQueryOptions = {}) {
  return useQuery<RecommendationsData | null>({
    queryKey: ['stock', 'recommendations', symbol],
    queryFn: () => fetchRecommendations(symbol!),
    enabled: on(symbol, opts.enabled),
    staleTime: FIVE_MIN,
  });
}

export function usePriceTarget(symbol: string | null, opts: StockQueryOptions = {}) {
  return useQuery<PriceTargetData | null>({
    queryKey: ['stock', 'priceTarget', symbol],
    queryFn: () => fetchPriceTarget(symbol!),
    enabled: on(symbol, opts.enabled),
    staleTime: FIVE_MIN,
  });
}

export function useDividend(symbol: string | null, opts: StockQueryOptions = {}) {
  return useQuery<DividendYieldData | null>({
    queryKey: ['stock', 'dividend', symbol],
    queryFn: () => fetchDividendYield(symbol!),
    enabled: on(symbol, opts.enabled),
    staleTime: FIVE_MIN,
  });
}

export function useCompanyLogo(symbol: string | null, opts: StockQueryOptions = {}) {
  return useQuery<CompanyLogoData | null>({
    queryKey: ['stock', 'logo', symbol],
    queryFn: () => fetchCompanyLogo(symbol!),
    enabled: on(symbol, opts.enabled),
    staleTime: FIVE_MIN,
  });
}

export function useCompanyProfile(symbol: string | null, opts: StockQueryOptions = {}) {
  return useQuery<CompanyProfileData | null>({
    queryKey: ['stock', 'profile', symbol],
    queryFn: () => fetchCompanyProfile(symbol!),
    enabled: on(symbol, opts.enabled),
    staleTime: FIVE_MIN,
  });
}

export function useFinancialHealth(symbol: string | null, opts: StockQueryOptions = {}) {
  return useQuery<FinancialHealthData | null>({
    queryKey: ['stock', 'financialHealth', symbol],
    queryFn: () => fetchFinancialHealth(symbol!),
    enabled: on(symbol, opts.enabled),
    staleTime: FIVE_MIN,
  });
}

export function useValuation(symbol: string | null, opts: StockQueryOptions = {}) {
  return useQuery<ValuationData | null>({
    queryKey: ['stock', 'valuation', symbol],
    queryFn: () => fetchValuationRatios(symbol!),
    enabled: on(symbol, opts.enabled),
    staleTime: FIVE_MIN,
  });
}

export function useTechnicalIndicators(symbol: string | null, opts: StockQueryOptions = {}) {
  return useQuery<TechnicalIndicatorData | null>({
    queryKey: ['stock', 'technical', symbol],
    queryFn: () => fetchTechnicalIndicators(symbol!),
    enabled: on(symbol, opts.enabled),
    staleTime: FIVE_MIN,
  });
}

export function useNewsSentiment(symbol: string | null, opts: StockQueryOptions = {}) {
  return useQuery<NewsSentimentData | null>({
    queryKey: ['stock', 'news', symbol],
    queryFn: () => fetchNewsSentiment(symbol!),
    enabled: on(symbol, opts.enabled),
    staleTime: FIVE_MIN,
  });
}

export function useRiskAnalysis(symbol: string | null, opts: StockQueryOptions = {}) {
  return useQuery<RiskAnalysisData | null>({
    queryKey: ['stock', 'risk', symbol],
    queryFn: () => fetchRiskAnalysis(symbol!),
    enabled: on(symbol, opts.enabled),
    staleTime: FIVE_MIN,
  });
}

export interface EarningReport {
  date: string;
  time: string;
  eps_estimate: number;
  eps_actual: number;
  difference: number;
  surprise_prc: number;
}
export interface EarningsData {
  meta: { symbol: string; name: string; currency: string; exchange: string; mic_code: string; exchange_timezone: string };
  earnings: EarningReport[];
  status: string;
}

export function useEarnings(symbol: string | null, opts: StockQueryOptions = {}) {
  return useQuery<EarningsData>({
    queryKey: ['stock', 'earnings', symbol],
    queryFn: async () => {
      const fallback: EarningsData = {
        meta: { symbol: symbol!, name: symbol!, currency: 'USD', exchange: '', mic_code: '', exchange_timezone: '' },
        earnings: [],
        status: 'ok',
      };
      try {
        const data = await invokeFunction<EarningsData>('twelve-eps', { symbol });
        return data && Array.isArray(data.earnings) ? data : fallback;
      } catch {
        return fallback;
      }
    },
    enabled: on(symbol, opts.enabled),
    staleTime: FIVE_MIN,
  });
}

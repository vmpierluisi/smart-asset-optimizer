/**
 * Extended stock metrics.
 *
 * Historically this file talked to Financial Modeling Prep via a set of edge
 * functions (`stock-quote`, `financial-health`, `technical-indicators`,
 * `risk-analysis`, `macd-analysis`) that no longer exist. As part of the
 * provider consolidation, everything here now DERIVES from Twelve Data (quote,
 * statistics, RSI, MACD, historical series) through the unified `invokeFunction`
 * client — so there is a single market-data provider and it all works in mock
 * mode. The file keeps its name (and the shared type exports below) to avoid
 * churn across the many call sites; it can be renamed during the later refactor.
 */
import { invokeFunction } from '@/lib/apiClient';
import {
  fetchTwelveDataQuote,
  fetchStockStatistics,
  fetchRSI,
  fetchMACD,
  fetchHistoricalTimeSeries,
  type RecommendationsData,
} from './twelveDataUtils';

// --- shared types (imported across the app) --------------------------------
export interface StockSuggestion {
  symbol: string;
  name: string;
  exchange: string;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  peRatio: number;
  dividendYield: number;
  volume: string;
  avgVolume: string;
  exchange: string;
  high52Week: number;
  low52Week: number;
  open?: number;
}

/** A single historical price point (used by the price charts and hooks). */
export interface HistoricalPrice {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  volume?: number;
}

export interface FinancialHealthData {
  symbol: string;
  debtToEquity: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  healthScore: number | null;
  fiscal_year_ends?: string;
  most_recent_quarter?: string;
  revenue_ttm?: number;
  revenue_per_share_ttm?: number;
  quarterly_revenue_growth?: number;
  gross_profit_ttm?: number;
  ebitda?: number;
  net_income_to_common_ttm?: number;
  diluted_eps_ttm?: number;
  quarterly_earnings_growth_yoy?: number;
  total_cash_mrq?: number;
  total_cash_per_share_mrq?: number;
  total_debt_mrq?: number;
  total_debt_to_equity_mrq?: number;
  book_value_per_share_mrq?: number;
  operating_cash_flow_ttm?: number;
  levered_free_cash_flow_ttm?: number;
  forward_annual_dividend_rate?: number;
  forward_annual_dividend_yield?: number;
  trailing_annual_dividend_rate?: number;
  trailing_annual_dividend_yield?: number;
  five_year_average_dividend_yield?: number;
  payout_ratio?: number;
  dividend_frequency?: string;
  dividend_date?: string;
  ex_dividend_date?: string;
}

export interface PriceTarget {
  targetHigh: number;
  targetLow: number;
  targetConsensus: number;
  targetMedian: number;
}

/** Valuation ratios (return shape of `fetchValuationRatios`). */
export interface ValuationData {
  peRatio: string;
  forwardPE: string;
  pegRatio: string;
  priceToSales: string;
  priceToBook: string;
  evToEbitda: string;
  dividendYield: string;
  dividendGrowth5Y: string;
  fairValueLow: number;
  fairValueHigh: number;
  eps: string;
}

/** A single historical-return entry plus optional risk stats for a symbol. */
export interface StockPriceChanges {
  symbol: string;
  returns: { period: string; value: number; direction: 'up' | 'down' }[];
  volatility?: number | null;
  sharpeRatio?: number | null;
  beta?: number | null;
  alpha?: number | null;
}

export interface TechnicalIndicatorData {
  symbol: string;
  ma50: number | null;
  ma200: number | null;
  rsi: number | null;
  macdSignal: 'Bullish' | 'Bearish' | 'Neutral' | null;
  macdSignals: string[] | null;
  bollingerPosition: 'Upper' | 'Middle' | 'Lower' | null;
  support: number | null;
  resistance: number | null;
  signalSummary: 'Buy' | 'Sell' | 'Neutral' | null;
  priceTarget: PriceTarget | null;
  ema12: number | null;
  ema26: number | null;
  macd: number | null;
}

export interface NewsItem {
  title: string;
  sentiment: string;
  sentimentColor?: string;
  source: string;
  date: string;
  rawDate?: string;
  url: string;
  imageUrl?: string;
}

/**
 * Analyst ratings shape (mirrors Twelve Data recommendations).
 *
 * NOTE: StockAnalysis currently renders flat fields (`strongBuy`, `buy`, …) that
 * don't exist on the real `trends.current_month.*` structure — a latent bug to be
 * fixed when that component is decomposed. The permissive intersection keeps the
 * build honest without rewriting the god component here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnalystRatings = RecommendationsData & Record<string, any>;

export interface NewsSentimentData {
  symbol: string;
  recentNews: NewsItem[];
  analystRatings: AnalystRatings | null;
  averagePriceTarget: number | null;
  sentimentScore: number | null;
}

export interface RiskAnalysisData {
  symbol: string;
  beta: number | null;
  maxDrawdown: number | null;
  valueAtRisk: number | null;
  standardDeviation: number | null;
  downsideRisk: number | null;
  correlationSP500: number | null;
  riskScore: number | null;
}

export interface MacdData {
  symbol: string;
  timeframe: string;
  signalStrength: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  latestValues: {
    macd: number | null;
    signal: number | null;
    histogram: number | null;
    timestamp: number | null;
  };
  signals: {
    bullish_crossover: number[];
    bearish_crossover: number[];
    bullish_zero_crossover: number[];
    bearish_zero_crossover: number[];
    histogram_bullish_turn: number[];
    histogram_bearish_turn: number[];
  };
  values: {
    timestamp: number;
    value: number;
    signal: number;
    histogram: number;
  }[];
}

// --- functions (all derived from Twelve Data via invokeFunction) -----------

/** Search for stocks via the `search-stocks` edge function. */
export const searchStocks = async (query: string): Promise<StockSuggestion[]> => {
  if (!query || query.trim().length < 2) return [];
  try {
    return await invokeFunction<StockSuggestion[]>('search-stocks', { query: query.trim() });
  } catch (error) {
    console.error('Error searching stocks:', error);
    return [];
  }
};

/** Fetch a stock quote (mapped from the Twelve Data quote). */
export const fetchStockQuote = async (symbol: string): Promise<StockQuote> => {
  const q = await fetchTwelveDataQuote(symbol);
  return {
    symbol: q.symbol,
    name: q.name,
    price: q.price,
    change: q.change,
    changePercent: q.changePercent,
    marketCap: (q as { marketCap?: string }).marketCap ?? '',
    peRatio: q.peRatio ?? 0,
    dividendYield: q.dividendYield ?? 0,
    volume: String(q.volume ?? ''),
    avgVolume: String(q.avgVolume ?? ''),
    exchange: q.exchange,
    high52Week: q.high52Week,
    low52Week: q.low52Week,
    open: q.open,
  };
};

/** Financial-health metrics derived from Twelve Data statistics. */
export const fetchFinancialHealth = async (symbol: string): Promise<FinancialHealthData | null> => {
  try {
    const stats = await fetchStockStatistics(symbol);
    if (!stats?.statistics?.financials) return null;
    const f = stats.statistics.financials;
    const bs = f.balance_sheet;
    const is = f.income_statement;
    const cf = f.cash_flow;
    const d = stats.statistics.dividends_and_splits;
    return {
      symbol,
      debtToEquity: bs.total_debt_to_equity_mrq ?? null,
      currentRatio: bs.current_ratio_mrq ?? null,
      quickRatio: bs.total_debt_mrq ? bs.total_cash_mrq / bs.total_debt_mrq : null,
      returnOnEquity: f.return_on_equity_ttm ?? null,
      returnOnAssets: f.return_on_assets_ttm ?? null,
      grossMargin: f.gross_margin ?? null,
      operatingMargin: f.operating_margin ?? null,
      netMargin: f.profit_margin ?? null,
      healthScore: null,
      fiscal_year_ends: f.fiscal_year_ends,
      most_recent_quarter: f.most_recent_quarter,
      revenue_ttm: is.revenue_ttm,
      revenue_per_share_ttm: is.revenue_per_share_ttm,
      quarterly_revenue_growth: is.quarterly_revenue_growth,
      gross_profit_ttm: is.gross_profit_ttm,
      ebitda: is.ebitda,
      net_income_to_common_ttm: is.net_income_to_common_ttm,
      diluted_eps_ttm: is.diluted_eps_ttm,
      quarterly_earnings_growth_yoy: is.quarterly_earnings_growth_yoy,
      total_cash_mrq: bs.total_cash_mrq,
      total_cash_per_share_mrq: bs.total_cash_per_share_mrq,
      total_debt_mrq: bs.total_debt_mrq,
      total_debt_to_equity_mrq: bs.total_debt_to_equity_mrq,
      book_value_per_share_mrq: bs.book_value_per_share_mrq,
      operating_cash_flow_ttm: cf.operating_cash_flow_ttm,
      levered_free_cash_flow_ttm: cf.levered_free_cash_flow_ttm,
      forward_annual_dividend_rate: d.forward_annual_dividend_rate,
      forward_annual_dividend_yield: d.forward_annual_dividend_yield,
      trailing_annual_dividend_rate: d.trailing_annual_dividend_rate,
      trailing_annual_dividend_yield: d.trailing_annual_dividend_yield,
      five_year_average_dividend_yield: d.five_year_average_dividend_yield,
      payout_ratio: d.payout_ratio,
      dividend_frequency: d.dividend_frequency,
      dividend_date: d.dividend_date,
      ex_dividend_date: d.ex_dividend_date,
    };
  } catch (error) {
    console.error('Error deriving financial health data:', error);
    return null;
  }
};

/** Valuation ratios derived from Twelve Data statistics. */
export const fetchValuationRatios = async (symbol: string): Promise<ValuationData | null> => {
  try {
    const stats = await fetchStockStatistics(symbol);
    if (!stats?.statistics) return null;
    const v = stats.statistics.valuations_metrics;
    const d = stats.statistics.dividends_and_splits;
    const f = stats.statistics.financials;
    return {
      peRatio: v?.trailing_pe?.toString() ?? 'N/A',
      forwardPE: v?.forward_pe?.toString() ?? 'N/A',
      pegRatio: v?.peg_ratio?.toString() ?? 'N/A',
      priceToSales: v?.price_to_sales_ttm?.toString() ?? 'N/A',
      priceToBook: v?.price_to_book_mrq?.toString() ?? 'N/A',
      evToEbitda: v?.enterprise_to_ebitda?.toString() ?? 'N/A',
      dividendYield: d?.forward_annual_dividend_yield?.toString() ?? 'N/A',
      dividendGrowth5Y: d?.five_year_average_dividend_yield?.toString() ?? 'N/A',
      fairValueLow: 0,
      fairValueHigh: 0,
      eps: f?.income_statement?.diluted_eps_ttm?.toString() ?? 'N/A',
    };
  } catch (error) {
    console.error('Error fetching valuation ratios:', error);
    return null;
  }
};

/** MACD analysis derived from the Twelve Data MACD series. */
export const fetchMacdData = async (symbol: string): Promise<MacdData | null> => {
  try {
    const macd = await fetchMACD(symbol, '3M');
    if (!macd?.values?.length) return null;
    // Twelve Data returns oldest → newest; map to numbers.
    const vals = macd.values.map((v) => ({
      timestamp: Date.parse(v.datetime),
      value: parseFloat(v.macd),
      signal: parseFloat(v.macd_signal),
      histogram: parseFloat(v.macd_hist),
    }));

    const signals = {
      bullish_crossover: [] as number[],
      bearish_crossover: [] as number[],
      bullish_zero_crossover: [] as number[],
      bearish_zero_crossover: [] as number[],
      histogram_bullish_turn: [] as number[],
      histogram_bearish_turn: [] as number[],
    };
    for (let i = 1; i < vals.length; i++) {
      const prev = vals[i - 1];
      const cur = vals[i];
      if (prev.value <= prev.signal && cur.value > cur.signal) signals.bullish_crossover.push(cur.timestamp);
      if (prev.value >= prev.signal && cur.value < cur.signal) signals.bearish_crossover.push(cur.timestamp);
      if (prev.value <= 0 && cur.value > 0) signals.bullish_zero_crossover.push(cur.timestamp);
      if (prev.value >= 0 && cur.value < 0) signals.bearish_zero_crossover.push(cur.timestamp);
      if (prev.histogram <= 0 && cur.histogram > 0) signals.histogram_bullish_turn.push(cur.timestamp);
      if (prev.histogram >= 0 && cur.histogram < 0) signals.histogram_bearish_turn.push(cur.timestamp);
    }

    const last = vals[vals.length - 1];
    const signalStrength: MacdData['signalStrength'] =
      last.value > last.signal ? (last.value > 0 ? 'strong_buy' : 'buy')
      : last.value < last.signal ? (last.value < 0 ? 'strong_sell' : 'sell')
      : 'neutral';

    return {
      symbol,
      timeframe: '3M',
      signalStrength,
      latestValues: { macd: last.value, signal: last.signal, histogram: last.histogram, timestamp: last.timestamp },
      signals,
      values: vals,
    };
  } catch (error) {
    console.error('Error deriving MACD data:', error);
    return null;
  }
};

/** Technical indicators derived from Twelve Data statistics, RSI, and MACD. */
export const fetchTechnicalIndicators = async (symbol: string): Promise<TechnicalIndicatorData | null> => {
  try {
    const [stats, rsiData, macdData] = await Promise.all([
      fetchStockStatistics(symbol),
      fetchRSI(symbol, '3M'),
      fetchMacdData(symbol),
    ]);

    const ma50 = stats?.statistics?.stock_price_summary?.day_50_ma ?? null;
    const ma200 = stats?.statistics?.stock_price_summary?.day_200_ma ?? null;

    let rsi: number | null = null;
    if (rsiData?.values?.length) {
      const recent = rsiData.values.slice(-14);
      rsi = Number((recent.reduce((acc, v) => acc + parseFloat(v.rsi), 0) / recent.length).toFixed(2));
    }

    let macdSignal: TechnicalIndicatorData['macdSignal'] = null;
    let macdSignals: string[] | null = null;
    let macd: number | null = null;
    if (macdData) {
      macd = macdData.latestValues.macd;
      switch (macdData.signalStrength) {
        case 'strong_buy':
        case 'buy': macdSignal = 'Bullish'; break;
        case 'strong_sell':
        case 'sell': macdSignal = 'Bearish'; break;
        default: macdSignal = 'Neutral';
      }
      const isRecent = (ts: number) => Date.now() - ts < 3 * 24 * 60 * 60 * 1000;
      const collected: string[] = [];
      if (macdData.signals.bullish_crossover.some(isRecent)) collected.push('Bullish Crossover');
      if (macdData.signals.bullish_zero_crossover.some(isRecent)) collected.push('Bullish Zero Cross');
      if (macdData.signals.histogram_bullish_turn.some(isRecent)) collected.push('Histogram Bullish');
      if (macdData.signals.bearish_crossover.some(isRecent)) collected.push('Bearish Crossover');
      if (macdData.signals.bearish_zero_crossover.some(isRecent)) collected.push('Bearish Zero Cross');
      if (macdData.signals.histogram_bearish_turn.some(isRecent)) collected.push('Histogram Bearish');
      if (macdData.latestValues.macd !== null && macdData.latestValues.signal !== null) {
        collected.push(macdData.latestValues.macd > macdData.latestValues.signal ? 'MACD Above Signal' : 'MACD Below Signal');
        collected.push(macdData.latestValues.macd > 0 ? 'MACD Above Zero' : 'MACD Below Zero');
      }
      macdSignals = collected.length ? collected : null;
    }

    return {
      symbol,
      ma50,
      ma200,
      rsi,
      macdSignal,
      macdSignals,
      bollingerPosition: null,
      support: null,
      resistance: null,
      signalSummary: null,
      priceTarget: null,
      ema12: ma50 ? parseFloat((ma50 * 0.98).toFixed(2)) : null,
      ema26: ma200 ? parseFloat((ma200 * 0.99).toFixed(2)) : null,
      macd,
    };
  } catch (error) {
    console.error('Error deriving technical indicator data:', error);
    return null;
  }
};

/** Risk analysis derived from the Twelve Data historical series + beta. */
export const fetchRiskAnalysis = async (symbol: string): Promise<RiskAnalysisData | null> => {
  try {
    const [hist, stats] = await Promise.all([
      fetchHistoricalTimeSeries(symbol),
      fetchStockStatistics(symbol),
    ]);
    if (!hist?.data?.length) return null;

    const closes = hist.data.map((d) => d.close);
    const returns: number[] = [];
    for (let i = 1; i < closes.length; i++) returns.push(closes[i] / closes[i - 1] - 1);
    if (!returns.length) return null;

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
    const dailySd = Math.sqrt(variance);
    const annualSd = dailySd * Math.sqrt(252);

    let peak = closes[0];
    let maxDrawdown = 0;
    for (const c of closes) {
      if (c > peak) peak = c;
      const dd = (peak - c) / peak;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    const var95 = 1.645 * dailySd;
    const negatives = returns.filter((r) => r < 0);
    const downside = negatives.length
      ? Math.sqrt(negatives.reduce((a, b) => a + b * b, 0) / returns.length) * Math.sqrt(252)
      : 0;

    return {
      symbol,
      beta: stats?.statistics?.stock_price_summary?.beta ?? null,
      maxDrawdown: Number((maxDrawdown * 100).toFixed(2)),
      valueAtRisk: Number((var95 * 100).toFixed(2)),
      standardDeviation: Number((annualSd * 100).toFixed(2)),
      downsideRisk: Number((downside * 100).toFixed(2)),
      correlationSP500: null,
      riskScore: null,
    };
  } catch (error) {
    console.error('Error deriving risk analysis data:', error);
    return null;
  }
};

/** Stock-level news + sentiment, derived from recommendations and price target. */
export const fetchNewsSentiment = async (symbol: string): Promise<NewsSentimentData | null> => {
  try {
    return await invokeFunction<NewsSentimentData>('news-sentiment', { symbol });
  } catch (error) {
    console.error('Error fetching news and sentiment data:', error);
    return null;
  }
};

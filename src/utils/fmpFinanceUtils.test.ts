import { describe, it, expect } from 'vitest';
import {
  searchStocks,
  fetchStockQuote,
  fetchFinancialHealth,
  fetchValuationRatios,
  fetchTechnicalIndicators,
  fetchMacdData,
  fetchRiskAnalysis,
} from './fmpFinanceUtils';

// These run in mock mode (no backend configured in the test env), so every
// function below derives from the seeded Twelve Data fixtures.

describe('searchStocks', () => {
  it('returns suggestions for a valid query', async () => {
    const res = await searchStocks('apple');
    expect(res.some((r) => r.symbol === 'AAPL')).toBe(true);
  });

  it('short-circuits queries under 2 chars', async () => {
    expect(await searchStocks('a')).toEqual([]);
  });
});

describe('fetchStockQuote', () => {
  it('maps a Twelve Data quote to the StockQuote shape', async () => {
    const q = await fetchStockQuote('AAPL');
    expect(q.symbol).toBe('AAPL');
    expect(typeof q.price).toBe('number');
    expect(typeof q.volume).toBe('string'); // StockQuote uses string volume
  });
});

describe('fetchFinancialHealth (derived from statistics)', () => {
  it('derives margins and ratios', async () => {
    const health = await fetchFinancialHealth('AAPL');
    expect(health).not.toBeNull();
    expect(health!.symbol).toBe('AAPL');
    expect(health!.returnOnEquity).not.toBeNull();
    expect(health!.grossMargin).not.toBeNull();
  });
});

describe('fetchValuationRatios (derived from statistics)', () => {
  it('returns valuation strings', async () => {
    const v = await fetchValuationRatios('AAPL');
    expect(v).not.toBeNull();
    expect(typeof v!.peRatio).toBe('string');
    expect(typeof v!.eps).toBe('string');
  });
});

describe('fetchMacdData (derived from MACD series)', () => {
  it('computes latest values and a signal strength', async () => {
    const macd = await fetchMacdData('AAPL');
    expect(macd).not.toBeNull();
    expect(macd!.values.length).toBeGreaterThan(0);
    expect(['strong_buy', 'buy', 'neutral', 'sell', 'strong_sell']).toContain(macd!.signalStrength);
    expect(macd!.latestValues.macd).not.toBeNull();
  });
});

describe('fetchTechnicalIndicators (derived)', () => {
  it('derives moving averages, RSI, and MACD signal', async () => {
    const t = await fetchTechnicalIndicators('AAPL');
    expect(t).not.toBeNull();
    expect(t!.ma50).not.toBeNull();
    expect(t!.rsi).toBeGreaterThanOrEqual(0);
    expect(t!.rsi as number).toBeLessThanOrEqual(100);
    expect(['Bullish', 'Bearish', 'Neutral', null]).toContain(t!.macdSignal);
  });
});

describe('fetchRiskAnalysis (derived from historical series)', () => {
  it('computes volatility and drawdown metrics', async () => {
    const risk = await fetchRiskAnalysis('AAPL');
    expect(risk).not.toBeNull();
    expect(risk!.standardDeviation).toBeGreaterThan(0);
    expect(risk!.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(risk!.valueAtRisk).toBeGreaterThanOrEqual(0);
  });
});

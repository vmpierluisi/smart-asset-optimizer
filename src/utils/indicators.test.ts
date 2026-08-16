import { describe, it, expect } from 'vitest';
import { analyzeMACDSignals, getRecentMACDSignals, type MACDValue } from './indicators';
import type { MACDData, TimeSeriesData } from './twelveDataUtils';

const mv = (over: Partial<MACDValue>): MACDValue => ({
  datetime: '2025-01-01', macd: 0, macd_signal: 0, macd_hist: 0, price: 100, ...over,
});

describe('analyzeMACDSignals', () => {
  it('detects a bullish crossover', () => {
    const prev = mv({ macd: -1, macd_signal: 0 });
    const cur = mv({ macd: 1, macd_signal: 0 });
    const s = analyzeMACDSignals(cur, prev);
    expect(s.bullishCrossover).toBe(true);
    expect(s.bearishCrossover).toBe(false);
  });

  it('detects a bearish crossover', () => {
    const prev = mv({ macd: 1, macd_signal: 0 });
    const cur = mv({ macd: -1, macd_signal: 0 });
    const s = analyzeMACDSignals(cur, prev);
    expect(s.bearishCrossover).toBe(true);
  });

  it('detects zero-line crossovers', () => {
    const s = analyzeMACDSignals(mv({ macd: 0.5 }), mv({ macd: -0.5 }));
    expect(s.bullishZeroCrossover).toBe(true);
  });

  it('returns all-false with no previous value', () => {
    const s = analyzeMACDSignals(mv({ macd: 1, macd_signal: 0 }));
    expect(s.bullishCrossover).toBe(false);
    expect(s.bearishCrossover).toBe(false);
  });
});

describe('getRecentMACDSignals', () => {
  it('returns empty signals for empty input', () => {
    const empty = { values: [] } as unknown as MACDData;
    const ts = { data: [] } as unknown as TimeSeriesData;
    const { macdValues } = getRecentMACDSignals(empty, ts);
    expect(macdValues).toEqual([]);
  });

  it('joins MACD values with prices by date', () => {
    const macd = {
      values: [
        { datetime: '2025-01-01', macd: '0.1', macd_signal: '0.0', macd_hist: '0.1' },
        { datetime: '2025-01-02', macd: '0.2', macd_signal: '0.1', macd_hist: '0.1' },
      ],
    } as unknown as MACDData;
    const ts = {
      data: [
        { date: '2025-01-01', close: 100 },
        { date: '2025-01-02', close: 101 },
      ],
    } as unknown as TimeSeriesData;
    const { macdValues } = getRecentMACDSignals(macd, ts);
    expect(macdValues.length).toBe(2);
    expect(macdValues[0].price).toBe(100);
    expect(macdValues[1].macd).toBeCloseTo(0.2);
  });
});

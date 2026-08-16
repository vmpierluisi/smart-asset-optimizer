import { describe, it, expect } from 'vitest';
import { getMockResponse, hasMock } from './index';

describe('mock registry', () => {
  it('reports registration correctly', () => {
    expect(hasMock('twelve-data-quote')).toBe(true);
    expect(hasMock('does-not-exist')).toBe(false);
  });

  it('throws for an unregistered function', () => {
    expect(() => getMockResponse('nope', {})).toThrow(/No mock registered/);
  });

  it('is deterministic per symbol', () => {
    const a = getMockResponse('twelve-data-quote', { symbol: 'AAPL' });
    const b = getMockResponse('twelve-data-quote', { symbol: 'AAPL' });
    expect(a).toEqual(b);
  });

  it('produces different data for different symbols', () => {
    const aapl = getMockResponse<{ price: number }>('twelve-data-quote', { symbol: 'AAPL' });
    const msft = getMockResponse<{ price: number }>('twelve-data-quote', { symbol: 'MSFT' });
    expect(aapl.price).not.toEqual(msft.price);
  });
});

describe('search-stocks mock', () => {
  it('returns matches for a query', () => {
    const results = getMockResponse<{ symbol: string }[]>('search-stocks', { query: 'app' });
    expect(Array.isArray(results)).toBe(true);
    expect(results.some((r) => r.symbol === 'AAPL')).toBe(true);
  });

  it('returns empty for a blank query', () => {
    expect(getMockResponse('search-stocks', { query: '' })).toEqual([]);
  });
});

describe('twelve-data-quote mock', () => {
  it('returns a well-formed quote', () => {
    const q = getMockResponse<Record<string, unknown>>('twelve-data-quote', { symbol: 'AAPL' });
    for (const key of ['symbol', 'name', 'price', 'change', 'changePercent', 'high52Week', 'low52Week', 'currency']) {
      expect(q[key]).toBeDefined();
    }
    expect(typeof q.price).toBe('number');
    expect(q.high52Week as number).toBeGreaterThan(q.low52Week as number);
  });
});

describe('time-series & historical mocks', () => {
  it('time-series honours the requested period length', () => {
    const month = getMockResponse<{ data: unknown[] }>('twelve-time-series', { symbol: 'AAPL', period: '1month' });
    const year = getMockResponse<{ data: unknown[] }>('twelve-time-series', { symbol: 'AAPL', period: '1year' });
    expect(month.data.length).toBeGreaterThan(10);
    expect(year.data.length).toBeGreaterThan(month.data.length);
  });

  it('produces chronological OHLC points', () => {
    const { data } = getMockResponse<{ data: { date: string; open: number; close: number }[] }>(
      'twelve-time-series', { symbol: 'AAPL', period: '3month' },
    );
    expect(new Date(data[0].date).getTime()).toBeLessThan(new Date(data[data.length - 1].date).getTime());
    expect(typeof data[0].close).toBe('number');
  });

  it('historical returns ~5 years of data', () => {
    const { data } = getMockResponse<{ data: unknown[] }>('twelve-historical', { symbol: 'AAPL' });
    expect(data.length).toBeGreaterThan(800);
  });
});

describe('moving-average mock', () => {
  it('returns SMA values with the requested period', () => {
    const res = getMockResponse<{ meta: { indicator: { ma_type: string; time_period: number } }; values: { ma: string }[] }>(
      'twelve-moving-average', { symbol: 'AAPL', ma_type: 'SMA', time_period: 50, timeframe: '3M' },
    );
    expect(res.meta.indicator.ma_type).toBe('SMA');
    expect(res.meta.indicator.time_period).toBe(50);
    expect(res.values.length).toBeGreaterThan(0);
    expect(Number.isNaN(parseFloat(res.values[0].ma))).toBe(false);
  });

  it('distinguishes EMA from SMA', () => {
    const ema = getMockResponse<{ meta: { indicator: { ma_type: string } } }>(
      'twelve-moving-average', { symbol: 'AAPL', ma_type: 'EMA', time_period: 20 },
    );
    expect(ema.meta.indicator.ma_type).toBe('EMA');
  });
});

describe('indicator mocks bounds', () => {
  it('RSI values stay within 0..100', () => {
    const res = getMockResponse<{ values: { rsi: string }[] }>('twelve-rsi', { symbol: 'AAPL', timeframe: '3M' });
    for (const v of res.values) {
      const rsi = parseFloat(v.rsi);
      expect(rsi).toBeGreaterThanOrEqual(0);
      expect(rsi).toBeLessThanOrEqual(100);
    }
  });

  it('MACD histogram equals macd minus signal', () => {
    const res = getMockResponse<{ values: { macd: string; macd_signal: string; macd_hist: string }[] }>(
      'twelve-macd', { symbol: 'AAPL', timeframe: '3M' },
    );
    const v = res.values[res.values.length - 1];
    const expected = parseFloat(v.macd) - parseFloat(v.macd_signal);
    expect(Math.abs(parseFloat(v.macd_hist) - expected)).toBeLessThan(0.02);
  });
});

describe('earnings & historical-prices mocks', () => {
  it('twelve-eps returns quarterly earning reports', () => {
    const res = getMockResponse<{ earnings: { eps_actual: number; surprise_prc: number }[] }>(
      'twelve-eps', { symbol: 'AAPL' },
    );
    expect(res.earnings.length).toBeGreaterThan(0);
    expect(typeof res.earnings[0].eps_actual).toBe('number');
    expect(typeof res.earnings[0].surprise_prc).toBe('number');
  });

  it('historical-prices returns [{date, close}] honoring the range', () => {
    const start = new Date('2024-01-01').toISOString();
    const end = new Date('2024-12-31').toISOString();
    const res = getMockResponse<{ date: string; close: number }[]>(
      'historical-prices', { symbol: 'AAPL', startDate: start, endDate: end },
    );
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(30);
    expect(typeof res[0].close).toBe('number');
    expect(typeof res[0].date).toBe('string');
  });

  it('news-sentiment returns recent news and a score', () => {
    const res = getMockResponse<{ recentNews: unknown[]; sentimentScore: number }>(
      'news-sentiment', { symbol: 'AAPL' },
    );
    expect(res.recentNews.length).toBeGreaterThan(0);
    expect(res.sentimentScore).toBeGreaterThanOrEqual(0);
  });
});

describe('news mocks (Marketaux-shaped)', () => {
  it.each(['news-breaking', 'news-general', 'news-market'])('%s returns a news response', (fn) => {
    const res = getMockResponse<{ meta: { returned: number }; data: { title: string; entities: unknown[] }[] }>(fn, {});
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    expect(typeof res.data[0].title).toBe('string');
    expect(res.meta.returned).toBe(res.data.length);
  });

  it('news-general scopes titles to a requested symbol', () => {
    const res = getMockResponse<{ data: { title: string }[] }>('news-general', { symbol: 'AAPL' });
    expect(res.data.some((a) => /Apple/.test(a.title))).toBe(true);
  });
});

describe('statistics mock', () => {
  it('returns a nested statistics object', () => {
    const res = getMockResponse<{ statistics: Record<string, unknown> }>('twelve-stats', { symbol: 'AAPL' });
    expect(res.statistics.valuations_metrics).toBeDefined();
    expect(res.statistics.financials).toBeDefined();
    expect(res.statistics.stock_price_summary).toBeDefined();
  });
});

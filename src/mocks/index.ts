import {
  CATALOG,
  generateSeries,
  lookup,
  makeRng,
  round2,
  seedFromString,
  type OhlcPoint,
} from './seed';

/**
 * Mock-mode registry.
 *
 * Each handler is keyed by the edge-function name and returns the SAME shape the
 * deployed function returns, so callers (and the util transforms above them) are
 * identical whether they hit the network or a fixture. All numbers derive from
 * one seeded price series per symbol, so quotes, charts, and indicators stay
 * internally consistent.
 */
type MockHandler = (body: any) => unknown;

const symbolOf = (body: any): string => (body?.symbol ? String(body.symbol) : 'AAPL');

const META_BASE = {
  interval: '1day',
  currency: 'USD',
  exchange_timezone: 'America/New_York',
  exchange: 'NASDAQ',
  mic_code: 'XNAS',
  type: 'Common Stock',
};

function timeframeToDays(timeframe = '3M'): number {
  if (timeframe === '6M') return 180;
  if (timeframe === '1Y') return 365;
  return 90;
}

function periodToDays(period = '1month'): number {
  switch (period) {
    case '1day': return 2;
    case '1week': return 7;
    case '1month': return 30;
    case '3month': return 90;
    case '6month': return 180;
    case '1year': return 365;
    case 'ytd': {
      const now = new Date();
      return Math.max(1, Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86_400_000));
    }
    case 'max': return 1250;
    default: return 30;
  }
}

/** Oldest → newest OHLC series (the order charts and indicators expect). */
function chrono(symbol: string, days: number): OhlcPoint[] {
  return generateSeries(symbol, days).slice().reverse();
}

// --- indicator helpers (computed off the seeded closes) --------------------
function sma(closes: number[], period: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const window = closes.slice(i - period + 1, i + 1);
    return window.reduce((s, v) => s + v, 0) / period;
  });
}

function ema(closes: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  closes.forEach((c, i) => {
    out.push(i === 0 ? c : c * k + out[i - 1] * (1 - k));
  });
  return out;
}

function rsi(closes: number[], period = 14): number[] {
  const out: number[] = [];
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) { out.push(50); continue; }
    const diff = closes[i] - closes[i - 1];
    const gain = Math.max(0, diff);
    const loss = Math.max(0, -diff);
    if (i <= period) {
      avgGain += gain / period;
      avgLoss += loss / period;
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    out.push(round2(100 - 100 / (1 + rs)));
  }
  return out;
}

/** Build a Marketaux-shaped news response for mock mode. */
function makeMarketNews(kind: 'breaking' | 'general' | 'market', symbol?: string) {
  const rng = makeRng(seedFromString('news-' + kind + (symbol ?? '')));
  const templates = [
    ['Markets rally as tech leads broad gains', 'Technology', 'Reuters'],
    ['Fed commentary shifts rate expectations', 'Financial Services', 'Bloomberg'],
    ['Energy sector rebounds on supply news', 'Energy', 'CNBC'],
    ['Consumer spending data beats forecasts', 'Consumer Cyclical', 'MarketWatch'],
    ['Healthcare names climb on approval news', 'Healthcare', 'Reuters'],
    ['Industrials gain on infrastructure outlook', 'Industrials', 'Bloomberg'],
  ];
  const catalog = symbol ? [lookup(symbol)] : CATALOG.slice(0, 6);
  const data = templates.map((t, i) => {
    const entity = catalog[i % catalog.length];
    const sentiment = round2((rng() - 0.4) * 1.6);
    return {
      uuid: `mock-${kind}-${i}`,
      title: symbol ? `${entity.name}: ${t[0]}` : t[0],
      description: `${t[0]}. Demo article served from the app's built-in mock mode.`,
      keywords: t[1],
      snippet: `${t[0]} — coverage from ${t[2]}.`,
      url: '#',
      image_url: '',
      language: 'en',
      published_at: new Date(Date.now() - i * 3_600_000).toISOString(),
      source: t[2],
      relevance_score: null,
      entities: [{
        symbol: entity.symbol, name: entity.name, exchange: entity.exchange,
        exchange_long: null, country: 'us', type: 'equity', industry: entity.sector,
        match_score: round2(0.5 + rng() * 0.5), sentiment_score: sentiment, highlights: [],
      }],
      similar: [] as unknown[],
    };
  });
  return { meta: { found: data.length, returned: data.length, limit: data.length, page: 1 }, data };
}

const handlers: Record<string, MockHandler> = {
  'search-stocks': (body) => {
    const q = String(body?.query ?? '').toLowerCase().trim();
    if (!q) return [];
    return CATALOG.filter(
      (c) => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    )
      .slice(0, 10)
      .map((c) => ({ symbol: c.symbol, name: c.name, exchange: c.exchange }));
  },

  'twelve-data-quote': (body) => {
    const symbol = symbolOf(body);
    const entry = lookup(symbol);
    const series = chrono(symbol, 40);
    const last = series[series.length - 1];
    const prev = series[series.length - 2] ?? last;
    const change = round2(last.close - prev.close);
    const highs = series.map((p) => p.high);
    const lows = series.map((p) => p.low);
    return {
      symbol: entry.symbol,
      name: entry.name,
      price: last.close,
      change,
      changePercent: round2((change / prev.close) * 100),
      volume: last.volume,
      avgVolume: Math.round(series.reduce((s, p) => s + p.volume, 0) / series.length),
      exchange: entry.exchange,
      high52Week: round2(Math.max(...highs) * 1.08),
      low52Week: round2(Math.min(...lows) * 0.9),
      open: last.open,
      high: last.high,
      low: last.low,
      previousClose: prev.close,
      datetime: last.datetime,
      isMarketOpen: false,
      currency: 'USD',
    };
  },

  'twelve-time-series': (body) => {
    const symbol = symbolOf(body);
    const series = chrono(symbol, periodToDays(body?.period));
    return {
      symbol,
      data: series.map((p) => ({
        date: p.datetime, open: p.open, high: p.high, low: p.low, close: p.close, volume: p.volume,
      })),
      meta: { symbol, ...META_BASE },
    };
  },

  'twelve-historical': (body) => {
    const symbol = symbolOf(body);
    const series = chrono(symbol, 1250);
    return {
      symbol,
      data: series.map((p) => ({
        date: p.datetime, open: p.open, high: p.high, low: p.low, close: p.close, volume: p.volume,
      })),
      meta: { symbol, ...META_BASE },
    };
  },

  'twelve-moving-average': (body) => {
    const symbol = symbolOf(body);
    const maType: 'SMA' | 'EMA' = body?.ma_type === 'EMA' ? 'EMA' : 'SMA';
    const period = Number(body?.time_period) || 20;
    const series = chrono(symbol, timeframeToDays(body?.timeframe));
    const closes = series.map((p) => p.close);
    const maSeries = maType === 'EMA' ? ema(closes, period) : sma(closes, period);
    return {
      symbol,
      meta: {
        symbol, ...META_BASE,
        indicator: {
          name: maType === 'EMA' ? 'Exponential Moving Average' : 'Simple Moving Average',
          ma_type: maType, series_type: 'close', time_period: period,
        },
      },
      values: series.map((p, i) => ({
        datetime: p.datetime,
        ma: (maSeries[i] ?? p.close).toFixed(2),
      })),
      status: 'ok',
    };
  },

  'twelve-rsi': (body) => {
    const symbol = symbolOf(body);
    const series = chrono(symbol, timeframeToDays(body?.timeframe));
    const rsiSeries = rsi(series.map((p) => p.close));
    return {
      symbol,
      meta: {
        symbol, ...META_BASE,
        indicator: { name: 'RSI - Relative Strength Index', series_type: 'close', time_period: 14 },
      },
      values: series.map((p, i) => ({
        datetime: p.datetime, rsi: rsiSeries[i].toFixed(2),
        open: p.open, high: p.high, low: p.low, close: p.close,
      })),
      status: 'ok',
    };
  },

  'twelve-macd': (body) => {
    const symbol = symbolOf(body);
    const series = chrono(symbol, timeframeToDays(body?.timeframe));
    const closes = series.map((p) => p.close);
    const macdLine = ema(closes, 12).map((v, i) => v - ema(closes, 26)[i]);
    const signal = ema(macdLine, 9);
    return {
      symbol,
      meta: {
        symbol, ...META_BASE,
        indicator: {
          name: 'MACD - Moving Average Convergence Divergence',
          fast_period: 12, series_type: 'close', signal_period: 9, slow_period: 26,
        },
      },
      values: series.map((p, i) => ({
        datetime: p.datetime,
        macd: round2(macdLine[i]).toFixed(2),
        macd_signal: round2(signal[i]).toFixed(2),
        macd_hist: round2(macdLine[i] - signal[i]).toFixed(2),
      })),
      status: 'ok',
    };
  },

  'twelve-dividend': (body) => {
    const symbol = symbolOf(body);
    const entry = lookup(symbol);
    const rng = makeRng(seedFromString(symbol + 'div'));
    const series = chrono(symbol, 5);
    const price = series[series.length - 1].close;
    const annualDividend = round2(price * (0.004 + rng() * 0.02));
    return {
      symbol, name: entry.name, price,
      dividendAmount: round2(annualDividend / 4),
      annualDividend,
      dividendYield: round2((annualDividend / price) * 100),
      currency: 'USD', exchange: entry.exchange,
      lastExDate: new Date(Date.now() - 30 * 86_400_000).toISOString().split('T')[0],
    };
  },

  'twelve-price-target': (body) => {
    const symbol = symbolOf(body);
    const entry = lookup(symbol);
    const current = chrono(symbol, 5).slice(-1)[0].close;
    return {
      meta: { symbol, name: entry.name, ...META_BASE, mic_code: 'XNGS' },
      price_target: {
        high: round2(current * 1.3),
        median: round2(current * 1.1),
        low: round2(current * 0.8),
        average: round2(current * 1.08),
        current,
      },
      status: 'ok',
    };
  },

  'twelve-recommend': (body) => {
    const symbol = symbolOf(body);
    const entry = lookup(symbol);
    const rng = makeRng(seedFromString(symbol + 'rec'));
    const month = () => ({
      strong_buy: Math.round(rng() * 15), buy: Math.round(rng() * 25),
      hold: Math.round(rng() * 10), sell: Math.round(rng() * 3), strong_sell: Math.round(rng() * 2),
    });
    return {
      meta: { symbol, name: entry.name, ...META_BASE },
      trends: {
        current_month: month(), previous_month: month(),
        '2_months_ago': month(), '3_months_ago': month(),
      },
      rating: round2(5 + rng() * 4),
      status: 'ok',
    };
  },

  'news-breaking': () => makeMarketNews('breaking'),
  'news-general': (body) => makeMarketNews('general', body?.symbol),
  'news-market': () => makeMarketNews('market'),

  'news-sentiment': (body) => {
    const symbol = symbolOf(body);
    const entry = lookup(symbol);
    const rng = makeRng(seedFromString(symbol + 'news'));
    const sentiments = ['Bullish', 'Somewhat-Bullish', 'Neutral', 'Somewhat-Bearish', 'Bearish'];
    const headlines = [
      `${entry.name} beats quarterly expectations`,
      `Analysts weigh in on ${entry.symbol} outlook`,
      `${entry.name} announces new product line`,
      `${entry.symbol} shares move on sector rotation`,
      `What ${entry.name}'s guidance means for investors`,
    ];
    const price = chrono(symbol, 5).slice(-1)[0].close;
    return {
      symbol,
      recentNews: headlines.map((title, i) => ({
        title,
        sentiment: sentiments[Math.floor(rng() * sentiments.length)],
        source: ['Reuters', 'Bloomberg', 'CNBC', 'MarketWatch'][Math.floor(rng() * 4)],
        date: new Date(Date.now() - i * 86_400_000).toISOString(),
        url: '#',
        imageUrl: '',
      })),
      analystRatings: null,
      averagePriceTarget: round2(price * (1 + (rng() - 0.4) * 0.2)),
      sentimentScore: Math.round(40 + rng() * 40),
    };
  },

  'twelve-stats': (body) => {
    const symbol = symbolOf(body);
    const entry = lookup(symbol);
    const rng = makeRng(seedFromString(symbol + 'stats'));
    const series = chrono(symbol, 260);
    const closes = series.map((p) => p.close);
    const price = closes[closes.length - 1];
    const shares = Math.round(1_000_000_000 * (1 + rng() * 15));
    return {
      meta: { symbol, name: entry.name, currency: 'USD', exchange: entry.exchange, mic_code: 'XNAS', exchange_timezone: 'America/New_York' },
      statistics: {
        valuations_metrics: {
          market_capitalization: Math.round(price * shares),
          enterprise_value: Math.round(price * shares * 1.03),
          trailing_pe: round2(15 + rng() * 25), forward_pe: round2(14 + rng() * 20),
          peg_ratio: round2(1 + rng() * 1.5), price_to_sales_ttm: round2(2 + rng() * 8),
          price_to_book_mrq: round2(5 + rng() * 30), enterprise_to_revenue: round2(3 + rng() * 6),
          enterprise_to_ebitda: round2(12 + rng() * 15),
        },
        financials: {
          fiscal_year_ends: '2024-09-28', most_recent_quarter: '2025-06-28',
          gross_margin: round2(35 + rng() * 25), profit_margin: round2(0.15 + rng() * 0.15),
          operating_margin: round2(0.2 + rng() * 0.15), return_on_assets_ttm: round2(0.1 + rng() * 0.15),
          return_on_equity_ttm: round2(0.5 + rng() * 0.9),
          income_statement: {
            revenue_ttm: Math.round(price * shares * 0.13), revenue_per_share_ttm: round2(15 + rng() * 15),
            quarterly_revenue_growth: round2(rng() * 0.4), gross_profit_ttm: Math.round(price * shares * 0.05),
            ebitda: Math.round(price * shares * 0.04), net_income_to_common_ttm: Math.round(price * shares * 0.03),
            diluted_eps_ttm: round2(2 + rng() * 6), quarterly_earnings_growth_yoy: round2(rng() * 0.8),
          },
          balance_sheet: {
            revenue_ttm: Math.round(price * shares * 0.13), total_cash_mrq: Math.round(price * shares * 0.02),
            total_cash_per_share_mrq: round2(2 + rng() * 4), total_debt_mrq: Math.round(price * shares * 0.05),
            total_debt_to_equity_mrq: round2(50 + rng() * 200), current_ratio_mrq: round2(0.9 + rng()),
            book_value_per_share_mrq: round2(3 + rng() * 8),
          },
          cash_flow: {
            operating_cash_flow_ttm: Math.round(price * shares * 0.04),
            levered_free_cash_flow_ttm: Math.round(price * shares * 0.03),
          },
        },
        stock_statistics: {
          shares_outstanding: shares, float_shares: Math.round(shares * 0.99),
          avg_10_volume: series[series.length - 1].volume, avg_90_volume: Math.round(series.reduce((s, p) => s + p.volume, 0) / series.length),
          shares_short: Math.round(shares * 0.006), short_ratio: round2(1 + rng() * 2),
          short_percent_of_shares_outstanding: round2(rng() * 0.02),
          percent_held_by_insiders: round2(rng() * 0.02), percent_held_by_institutions: round2(0.4 + rng() * 0.4),
        },
        stock_price_summary: {
          fifty_two_week_low: round2(Math.min(...closes) * 0.95),
          fifty_two_week_high: round2(Math.max(...closes) * 1.05),
          fifty_two_week_change: round2((price / closes[0] - 1)),
          beta: round2(0.8 + rng() * 0.8),
          day_50_ma: round2(closes.slice(-50).reduce((s, v) => s + v, 0) / Math.min(50, closes.length)),
          day_200_ma: round2(closes.slice(-200).reduce((s, v) => s + v, 0) / Math.min(200, closes.length)),
        },
        dividends_and_splits: {
          forward_annual_dividend_rate: round2(price * 0.01), forward_annual_dividend_yield: round2(rng() * 0.02),
          trailing_annual_dividend_rate: round2(price * 0.009), trailing_annual_dividend_yield: round2(rng() * 0.02),
          five_year_average_dividend_yield: round2(rng() * 2), payout_ratio: round2(rng() * 0.4),
          dividend_frequency: 'Quarterly', dividend_date: '2025-08-12', ex_dividend_date: '2025-08-06',
          last_split_factor: '4-for-1 split', last_split_date: '2020-08-31',
        },
      },
    };
  },

  'historical-prices': (body) => {
    const symbol = symbolOf(body);
    let days = 500;
    if (body?.startDate && body?.endDate) {
      const span = Math.round((Date.parse(body.endDate) - Date.parse(body.startDate)) / 86_400_000);
      if (Number.isFinite(span) && span > 0) days = Math.max(30, span);
    }
    return chrono(symbol, days).map((p) => ({ date: p.datetime, close: p.close }));
  },

  'twelve-eps': (body) => {
    const symbol = symbolOf(body);
    const entry = lookup(symbol);
    const rng = makeRng(seedFromString(symbol + 'eps'));
    const earnings = Array.from({ length: 8 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i * 3);
      const estimate = round2(1 + rng() * 2);
      const actual = round2(estimate * (0.9 + rng() * 0.25));
      return {
        date: d.toISOString().split('T')[0],
        time: 'After Market',
        eps_estimate: estimate,
        eps_actual: actual,
        difference: round2(actual - estimate),
        surprise_prc: round2(((actual - estimate) / estimate) * 100),
      };
    });
    return {
      meta: { symbol, name: entry.name, currency: 'USD', exchange: entry.exchange, mic_code: 'XNAS', exchange_timezone: 'America/New_York' },
      earnings,
      status: 'ok',
    };
  },

  'company-logo': (body) => {
    const symbol = symbolOf(body);
    const entry = lookup(symbol);
    return {
      meta: { symbol, name: entry.name, currency: 'USD', exchange: entry.exchange, mic_code: 'XNAS', exchange_timezone: 'America/New_York' },
      url: '',
    };
  },

  'company-description': (body) => {
    const symbol = symbolOf(body);
    const entry = lookup(symbol);
    return {
      symbol, name: entry.name, exchange: entry.exchange, mic_code: 'XNAS',
      sector: entry.sector, industry: entry.industry, employees: 50_000,
      website: `https://example.com/${symbol.toLowerCase()}`,
      description: `${entry.name} is a ${entry.sector.toLowerCase()} company operating in the ${entry.industry.toLowerCase()} space. This is demo data served from the app's built-in mock mode.`,
      type: 'Common Stock', CEO: 'Jane Doe', address: '1 Market St', address2: '', city: 'San Francisco', zip: '94105', state: 'CA', country: 'United States', phone: '+1 555-0100',
    };
  },
};

export function hasMock(fn: string): boolean {
  return fn in handlers;
}

export function getMockResponse<T>(fn: string, body?: unknown): T {
  const handler = handlers[fn];
  if (!handler) {
    throw new Error(`No mock registered for edge function "${fn}"`);
  }
  return handler(body) as T;
}

export { CATALOG, generateSeries, lookup, makeRng, round2, seedFromString };

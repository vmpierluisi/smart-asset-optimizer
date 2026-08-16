/**
 * Deterministic fixture generators for mock mode.
 *
 * Everything here is seeded off the stock symbol so the same symbol always
 * produces the same (realistic-looking) numbers across reloads — charts,
 * quotes, and indicators stay internally consistent without any network calls.
 */

/** A small catalog used for search + realistic company metadata. */
export interface CatalogEntry {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  basePrice: number;
}

export const CATALOG: CatalogEntry[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Consumer Electronics', basePrice: 195 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', sector: 'Technology', industry: 'Software—Infrastructure', basePrice: 415 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', sector: 'Communication Services', industry: 'Internet Content & Information', basePrice: 168 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', industry: 'Internet Retail', basePrice: 178 },
  { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', sector: 'Communication Services', industry: 'Internet Content & Information', basePrice: 490 },
  { symbol: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', industry: 'Auto Manufacturers', basePrice: 250 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors', basePrice: 120 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', sector: 'Financial Services', industry: 'Banks—Diversified', basePrice: 205 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE', sector: 'Healthcare', industry: 'Drug Manufacturers—General', basePrice: 152 },
  { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE', sector: 'Financial Services', industry: 'Credit Services', basePrice: 275 },
  { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE', sector: 'Consumer Defensive', industry: 'Discount Stores', basePrice: 68 },
  { symbol: 'DIS', name: 'The Walt Disney Company', exchange: 'NYSE', sector: 'Communication Services', industry: 'Entertainment', basePrice: 100 },
  { symbol: 'NFLX', name: 'Netflix, Inc.', exchange: 'NASDAQ', sector: 'Communication Services', industry: 'Entertainment', basePrice: 630 },
  { symbol: 'KO', name: 'The Coca-Cola Company', exchange: 'NYSE', sector: 'Consumer Defensive', industry: 'Beverages—Non-Alcoholic', basePrice: 62 },
  { symbol: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors', basePrice: 32 },
];

const FALLBACK: CatalogEntry = {
  symbol: 'XXXX', name: 'Demo Company Inc.', exchange: 'NASDAQ',
  sector: 'Technology', industry: 'Software—Application', basePrice: 100,
};

export function lookup(symbol: string): CatalogEntry {
  const found = CATALOG.find((c) => c.symbol.toUpperCase() === symbol.toUpperCase());
  return found ?? { ...FALLBACK, symbol: symbol.toUpperCase(), name: `${symbol.toUpperCase()} Corp.` };
}

/** Convert a string into a stable numeric seed. */
export function seedFromString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Mulberry32 — tiny deterministic PRNG. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface OhlcPoint {
  datetime: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Generate a deterministic daily OHLC series ending today, as a seeded random
 * walk with mild drift and volatility around the symbol's base price.
 * Returned newest-first (matching Twelve Data's convention).
 */
export function generateSeries(symbol: string, days: number): OhlcPoint[] {
  const entry = lookup(symbol);
  const rng = makeRng(seedFromString(symbol));
  const volatility = 0.018;
  const drift = (rng() - 0.45) * 0.0015;

  const points: OhlcPoint[] = [];
  let price = entry.basePrice * (0.85 + rng() * 0.3);
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    // Skip weekends to look like real trading days.
    const day = date.getDay();
    if (day === 0 || day === 6) continue;

    const shock = (rng() - 0.5) * 2 * volatility;
    const open = price;
    const close = Math.max(1, open * (1 + drift + shock));
    const high = Math.max(open, close) * (1 + rng() * 0.01);
    const low = Math.min(open, close) * (1 - rng() * 0.01);
    const volume = Math.round(entry.basePrice * 1_000_00 * (0.6 + rng() * 0.8));

    points.push({
      datetime: date.toISOString().split('T')[0],
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
      volume,
    });
    price = close;
  }

  return points.reverse();
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

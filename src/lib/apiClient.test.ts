import { describe, it, expect, afterEach, vi } from 'vitest';
import { invokeFunction, isMockMode, ApiError } from './apiClient';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('isMockMode', () => {
  it('is true when the flag is set', () => {
    vi.stubEnv('VITE_USE_LOCAL_STOCK_DATA', 'true');
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'key');
    expect(isMockMode()).toBe(true);
  });

  it('is true when no backend is configured', () => {
    vi.stubEnv('VITE_USE_LOCAL_STOCK_DATA', 'false');
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    expect(isMockMode()).toBe(true);
  });

  it('is false with a backend and the flag off', () => {
    vi.stubEnv('VITE_USE_LOCAL_STOCK_DATA', 'false');
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'key');
    expect(isMockMode()).toBe(false);
  });
});

describe('invokeFunction (mock mode)', () => {
  it('resolves a registered function against its mock', async () => {
    const quote = await invokeFunction<{ symbol: string }>(
      'twelve-data-quote', { symbol: 'AAPL' }, { mockDelayMs: 0 },
    );
    expect(quote.symbol).toBe('AAPL');
  });

  it('throws an ApiError for an unregistered function', async () => {
    await expect(
      invokeFunction('not-a-real-function', {}, { mockDelayMs: 0 }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

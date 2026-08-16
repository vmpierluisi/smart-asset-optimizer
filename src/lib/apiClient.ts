import { supabase } from './supabase';
import { getMockResponse, hasMock } from '@/mocks';

/**
 * Unified client for calling Supabase Edge Functions.
 *
 * Every backend call in the app should go through `invokeFunction` so that:
 *  - auth headers, error handling, and typing live in one place (instead of the
 *    44 hand-rolled `fetch('${url}/functions/v1/...')` calls this replaces);
 *  - a keyless **mock mode** can transparently serve bundled fixtures, letting
 *    the app run with no API keys and no backend (great for local dev and for
 *    portfolio reviewers who just want to click around).
 */

export class ApiError extends Error {
  status?: number;
  fn?: string;
  originalError?: unknown;

  constructor(message: string, options?: { status?: number; fn?: string; cause?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status;
    this.fn = options?.fn;
    this.originalError = options?.cause;
  }
}

/**
 * Mock mode is on when explicitly requested via `VITE_USE_LOCAL_STOCK_DATA=true`,
 * or automatically when no Supabase backend is configured, so the app never
 * hard-fails just because a reviewer hasn't set up a project.
 */
export function isMockMode(): boolean {
  const flag = import.meta.env.VITE_USE_LOCAL_STOCK_DATA;
  const hasBackend =
    !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
  return flag === 'true' || !hasBackend;
}

export interface InvokeOptions {
  /** HTTP method for the edge function. Defaults to POST. */
  method?: 'GET' | 'POST';
  /** Simulated latency (ms) applied in mock mode so the UI exercises its loading states. */
  mockDelayMs?: number;
}

/**
 * Invoke a Supabase Edge Function by name.
 *
 * In mock mode, resolves against the registered mock handler for `fn` (throwing
 * if none exists). Otherwise delegates to the supabase-js client, which attaches
 * the anon key and auth session automatically.
 */
export async function invokeFunction<T>(
  fn: string,
  body?: unknown,
  options: InvokeOptions = {},
): Promise<T> {
  const { method = 'POST', mockDelayMs = 250 } = options;

  if (isMockMode()) {
    if (!hasMock(fn)) {
      throw new ApiError(`No mock registered for edge function "${fn}"`, { fn });
    }
    if (mockDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, mockDelayMs));
    }
    return getMockResponse<T>(fn, body);
  }

  const { data, error } = await supabase.functions.invoke<T>(fn, {
    method,
    body: method === 'GET' ? undefined : (body as Record<string, unknown>),
  });

  if (error) {
    throw new ApiError(error.message || `Edge function "${fn}" failed`, {
      fn,
      cause: error,
    });
  }

  return data as T;
}

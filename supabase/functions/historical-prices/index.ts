import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const TD_KEY = Deno.env.get('TWELVE_DATA_API_KEY');
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const num = (v: unknown) => { const n = parseFloat(String(v)); return Number.isFinite(n) ? n : 0; };

// Returns [{ date, close }] for the portfolio optimizer.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const { symbol, startDate, endDate } = await req.json();
    if (!symbol || typeof symbol !== 'string') return json({ error: 'Symbol must be a valid string' }, 400);
    if (!TD_KEY) return json({ error: 'TWELVE_DATA_API_KEY not configured' }, 500);
    const params = new URLSearchParams({ symbol: symbol.trim(), interval: '1day', outputsize: '5000', dp: '2', apikey: TD_KEY });
    if (startDate) params.set('start_date', String(startDate).split('T')[0]);
    if (endDate) params.set('end_date', String(endDate).split('T')[0]);
    const res = await fetch(`https://api.twelvedata.com/time_series?${params.toString()}`);
    if (!res.ok) throw new Error(`Twelve Data error: ${res.status}`);
    const td = await res.json();
    if (td?.status === 'error') return json({ error: td.message ?? 'Twelve Data error' }, 400);
    const values: any[] = Array.isArray(td?.values) ? td.values : [];
    const out = values.slice().reverse().map((v) => ({ date: v.datetime, close: num(v.close) }));
    return json(out);
  } catch (e) {
    console.error('historical-prices error:', e);
    return json({ error: (e as Error).message ?? 'Unknown error' }, 500);
  }
});

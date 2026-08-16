import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const TD_KEY = Deno.env.get('TWELVE_DATA_API_KEY');
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

// Consolidated moving-average endpoint (replaces twelve-sma-20/50/200 + twelve-ema-20/50/200).
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const { symbol, ma_type = 'SMA', time_period = 20, start_date, end_date } = await req.json();
    if (!symbol || typeof symbol !== 'string') return json({ error: 'Symbol must be a valid string' }, 400);
    if (!TD_KEY) return json({ error: 'TWELVE_DATA_API_KEY not configured' }, 500);
    const maType = ma_type === 'EMA' ? 'EMA' : 'SMA';
    const period = Number(time_period) || 20;

    const params = new URLSearchParams({
      symbol: symbol.trim(), interval: '1day', ma_type: maType, time_period: String(period),
      series_type: 'close', dp: '2', apikey: TD_KEY,
    });
    if (start_date) params.set('start_date', start_date);
    if (end_date) params.set('end_date', end_date);

    const res = await fetch(`https://api.twelvedata.com/ma?${params.toString()}`);
    if (!res.ok) throw new Error(`Twelve Data error: ${res.status}`);
    const td = await res.json();
    if (td?.status === 'error') return json({ error: td.message ?? 'Twelve Data error' }, 400);

    const values: any[] = Array.isArray(td?.values) ? td.values : [];
    // Return oldest-first to match the client/charts.
    return json({
      symbol: td?.meta?.symbol ?? symbol,
      meta: td?.meta ?? { symbol, indicator: { name: `${maType} Moving Average`, ma_type: maType, series_type: 'close', time_period: period } },
      values: values.slice().reverse().map((v) => ({ datetime: v.datetime, ma: String(v.ma) })),
      status: 'ok',
    });
  } catch (e) {
    console.error('twelve-moving-average error:', e);
    return json({ error: (e as Error).message ?? 'Unknown error' }, 500);
  }
});

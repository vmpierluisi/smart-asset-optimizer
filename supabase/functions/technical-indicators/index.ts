import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const FMP_API_KEY = Deno.env.get('FMP_API_KEY')
const FMP_BASE_URL = 'https://financialmodelingprep.com/api'

interface TechnicalIndicatorData {
  symbol: string;
  ma50: number | null;
  ma200: number | null;
  rsi: number | null;
  macdSignal: 'Bullish' | 'Bearish' | 'Neutral' | null;
  bollingerPosition: 'Upper' | 'Middle' | 'Lower' | null;
  support: number | null;
  resistance: number | null;
  signalSummary: 'Buy' | 'Sell' | 'Neutral' | null;
}

// Helper to fetch a specific technical indicator
async function fetchIndicator(symbol: string, indicator: string, period: number, seriesType: 'line' | 'close' = 'close') {
  const url = `${FMP_BASE_URL}/v3/technical_indicator/${period}min/${symbol}?period=${period}&type=${indicator}&apikey=${FMP_API_KEY}&seriestype=${seriesType}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch ${indicator} for ${symbol}: ${response.status}`);
      return null;
    }
    const data = await response.json();
    // FMP often returns an array, get the latest value
    return data?.[0]?.[indicator] ?? null;
  } catch (error) {
    console.error(`Error fetching ${indicator} for ${symbol}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { symbol } = await req.json()
    if (!symbol) throw new Error('Missing stock symbol')
    if (!FMP_API_KEY) throw new Error('Missing FMP API key')

    // Fetch indicators in parallel
    // NOTE: FMP technical indicator endpoint might need adjustment based on exact availability
    // Using daily ('') timeframe path segment might be better than '1min' if available
    const dailyIndicatorUrl = (indicator: string, period: number) =>
      `${FMP_BASE_URL}/v3/technical_indicator/daily/${symbol}?period=${period}&type=${indicator}&apikey=${FMP_API_KEY}`;

    const fetchDailyIndicator = async (indicator: string, period: number): Promise<number | null> => {
        const url = dailyIndicatorUrl(indicator, period);
         try {
            const response = await fetch(url);
            if (!response.ok) {
              console.error(`Failed to fetch daily ${indicator} for ${symbol}: ${response.status} ${await response.text()}`);
              return null;
            }
            const data = await response.json();
            const valueKey = indicator === 'sma' ? 'sma' : indicator; // Adjust if FMP uses different keys
            return data?.[0]?.[valueKey] ?? null; // Get the most recent value
         } catch (error) {
            console.error(`Error fetching daily ${indicator} for ${symbol}:`, error);
            return null;
         }
    }


    const [ma50, ma200, rsi] = await Promise.all([
      fetchDailyIndicator('sma', 50), // Simple Moving Average for MA50
      fetchDailyIndicator('sma', 200), // Simple Moving Average for MA200
      fetchDailyIndicator('rsi', 14)   // RSI standard period is 14
    ]);

    // Placeholder values for complex/unavailable indicators
    const macdSignal = null;
    const bollingerPosition = null;
    const support = null; // Requires specific calculation or endpoint
    const resistance = null; // Requires specific calculation or endpoint
    const signalSummary = null; // Requires aggregation logic

    const techData: TechnicalIndicatorData = {
      symbol: symbol,
      ma50: ma50,
      ma200: ma200,
      rsi: rsi,
      macdSignal: macdSignal,
      bollingerPosition: bollingerPosition,
      support: support,
      resistance: resistance,
      signalSummary: signalSummary
    };

    return new Response(JSON.stringify(techData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing request:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
}); 
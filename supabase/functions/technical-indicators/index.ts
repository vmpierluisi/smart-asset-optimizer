import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const FMP_API_KEY = Deno.env.get('FMP_API_KEY')
const POLYGON_API_KEY = Deno.env.get('POLYGON_API_KEY')
const FMP_BASE_URL = 'https://financialmodelingprep.com/api'
const POLYGON_BASE_URL = 'https://api.polygon.io'

interface MacdSignals {
  bullish_crossover: number[];
  bearish_crossover: number[];
  bullish_zero_crossover: number[];
  bearish_zero_crossover: number[];
  histogram_bullish_turn: number[];
  histogram_bearish_turn: number[];
}

interface TechnicalIndicatorData {
  symbol: string;
  ma50: number | null;
  ma200: number | null;
  rsi: number | null;
  macdSignal: 'Bullish' | 'Bearish' | 'Neutral' | null;
  macdSignals: string[] | null;
  macdDetails: {
    value: number | null;
    signal: number | null;
    histogram: number | null;
    signals: MacdSignals | null;
  } | null;
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

/**
 * Fetch MACD data from Polygon API and analyze signals
 */
async function fetchAndAnalyzeMacd(symbol: string): Promise<{
  value: number | null;
  signal: number | null;
  histogram: number | null;
  signals: MacdSignals | null;
  macdSignal: 'Bullish' | 'Bearish' | 'Neutral' | null;
  macdSignals: string[] | null;
}> {
  try {
    if (!POLYGON_API_KEY) {
      console.warn('Missing Polygon API key - MACD data will be unavailable');
      return {
        value: null,
        signal: null,
        histogram: null,
        signals: null,
        macdSignal: null,
        macdSignals: null
      };
    }
    
    // Default MACD parameters
    const timespan = 'day';
    const shortWindow = 12;
    const longWindow = 26;
    const signalWindow = 9;
    const seriesType = 'close';
    const limit = 20; // Fetch enough data for signal analysis
    
    // Construct the Polygon MACD URL
    const macdUrl = `${POLYGON_BASE_URL}/v1/indicators/macd/${symbol}?timespan=${timespan}&adjusted=true&short_window=${shortWindow}&long_window=${longWindow}&signal_window=${signalWindow}&series_type=${seriesType}&order=desc&limit=${limit}&apiKey=${POLYGON_API_KEY}`;
    
    const response = await fetch(macdUrl);
    if (!response.ok) {
      console.error(`Failed to fetch MACD data for ${symbol}: ${response.status}`);
      return {
        value: null,
        signal: null,
        histogram: null,
        signals: null,
        macdSignal: null,
        macdSignals: null
      };
    }
    
    const macdData = await response.json();
    const values = macdData?.results?.values || [];
    
    if (!values.length) {
      return {
        value: null,
        signal: null,
        histogram: null,
        signals: null,
        macdSignal: null,
        macdSignals: null
      };
    }
    
    // Get latest values
    const latest = values[0];
    const value = latest.value;
    const signal = latest.signal;
    const histogram = latest.histogram;
    
    // Analyze MACD signals
    const signals: MacdSignals = {
      bullish_crossover: [],
      bearish_crossover: [],
      bullish_zero_crossover: [],
      bearish_zero_crossover: [],
      histogram_bullish_turn: [],
      histogram_bearish_turn: [],
    };
    
    if (values.length >= 2) {
      for (let i = 1; i < values.length; i++) {
        const current = values[i];
        const previous = values[i - 1];
        
        const currentMacd = current.value;
        const currentSignal = current.signal;
        const currentHistogram = current.histogram;
        const currentTimestamp = current.timestamp;
        
        const previousMacd = previous.value;
        const previousSignal = previous.signal;
        const previousHistogram = previous.histogram;
        
        // 1. MACD Line and Signal Line Crossovers
        if (previousMacd < previousSignal && currentMacd > currentSignal) {
          signals.bullish_crossover.push(currentTimestamp);
        } else if (previousMacd > previousSignal && currentMacd < currentSignal) {
          signals.bearish_crossover.push(currentTimestamp);
        }
        
        // 2. Zero Line Crossovers
        if (previousMacd < 0 && currentMacd > 0) {
          signals.bullish_zero_crossover.push(currentTimestamp);
        } else if (previousMacd > 0 && currentMacd < 0) {
          signals.bearish_zero_crossover.push(currentTimestamp);
        }
        
        // 3. Histogram Analysis (Turns)
        if (previousHistogram < 0 && currentHistogram > 0) {
          signals.histogram_bullish_turn.push(currentTimestamp);
        } else if (previousHistogram > 0 && currentHistogram < 0) {
          signals.histogram_bearish_turn.push(currentTimestamp);
        }
      }
    }
    
    // Determine overall MACD signal (keep for backward compatibility)
    let macdSignal: 'Bullish' | 'Bearish' | 'Neutral' | null = 'Neutral';
    
    // Check if we have recent bullish signals
    const hasBullishSignals = 
      signals.bullish_crossover.length > 0 || 
      signals.bullish_zero_crossover.length > 0 || 
      signals.histogram_bullish_turn.length > 0;
      
    // Check if we have recent bearish signals
    const hasBearishSignals = 
      signals.bearish_crossover.length > 0 || 
      signals.bearish_zero_crossover.length > 0 || 
      signals.histogram_bearish_turn.length > 0;
    
    // Current state of MACD and signal line
    const macdAboveSignal = value > signal;
    const macdAboveZero = value > 0;
    
    if (hasBullishSignals || (macdAboveSignal && macdAboveZero)) {
      macdSignal = 'Bullish';
    } else if (hasBearishSignals || (!macdAboveSignal && !macdAboveZero)) {
      macdSignal = 'Bearish';
    }
    
    // Create an array of specific MACD signals that are currently active
    const macdSignals: string[] = [];
    
    // Define a function to check if a timestamp is recent (within the last 3 days)
    const isRecentSignal = (timestamp: number) => {
      const now = new Date().getTime();
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
      return (now - timestamp) < threeDaysMs;
    };
    
    // Check for active signal types based on detected patterns - only when conditions are fulfilled
    // and signals are recent
    const hasBullishCrossover = signals.bullish_crossover.some(isRecentSignal);
    const hasBullishZeroCross = signals.bullish_zero_crossover.some(isRecentSignal);
    const hasHistogramBullish = signals.histogram_bullish_turn.some(isRecentSignal);
    const hasBearishCrossover = signals.bearish_crossover.some(isRecentSignal);
    const hasBearishZeroCross = signals.bearish_zero_crossover.some(isRecentSignal);
    const hasHistogramBearish = signals.histogram_bearish_turn.some(isRecentSignal);
    
    // Add signals only if they are active and recent
    if (hasBullishCrossover) {
      macdSignals.push('Bullish Crossover');
    }
    if (hasBullishZeroCross) {
      macdSignals.push('Bullish Zero Cross');
    }
    if (hasHistogramBullish) {
      macdSignals.push('Histogram Bullish');
    }
    if (hasBearishCrossover) {
      macdSignals.push('Bearish Crossover');
    }
    if (hasBearishZeroCross) {
      macdSignals.push('Bearish Zero Cross');
    }
    if (hasHistogramBearish) {
      macdSignals.push('Histogram Bearish');
    }
    
    // Add current position signals - only when conditions are fulfilled
    // Only add one of these position signals
    if (macdAboveSignal) {
      macdSignals.push('MACD Above Signal');
    } else if (value < signal) {
      macdSignals.push('MACD Below Signal');
    }
    
    // Only add one of these zero line signals
    if (macdAboveZero) {
      macdSignals.push('MACD Above Zero');
    } else if (value < 0) {
      macdSignals.push('MACD Below Zero');
    }
    
    return {
      value,
      signal,
      histogram,
      signals,
      macdSignal,
      macdSignals: macdSignals.length > 0 ? macdSignals : null
    };
  } catch (error) {
    console.error(`Error analyzing MACD for ${symbol}:`, error);
    return {
      value: null,
      signal: null,
      histogram: null,
      signals: null,
      macdSignal: null,
      macdSignals: null
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { symbol } = await req.json()
    if (!symbol) throw new Error('Missing stock symbol')
    
    // Check API keys
    if (!FMP_API_KEY) console.warn('Missing FMP API key - some indicators may be unavailable')
    if (!POLYGON_API_KEY) console.warn('Missing Polygon API key - MACD data may be unavailable')

    // Fetch indicators in parallel
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

    // Fetch basic indicators from FMP and MACD from Polygon
    const [ma50, ma200, rsi, macdData] = await Promise.all([
      fetchDailyIndicator('sma', 50), // Simple Moving Average for MA50
      fetchDailyIndicator('sma', 200), // Simple Moving Average for MA200
      fetchDailyIndicator('rsi', 14),  // RSI standard period is 14
      fetchAndAnalyzeMacd(symbol)      // MACD from Polygon API
    ]);

    // Placeholder values for complex/unavailable indicators
    const bollingerPosition = null;
    const support = null; // Requires specific calculation or endpoint
    const resistance = null; // Requires specific calculation or endpoint
    
    // Derive signal summary from available indicators
    let signalSummary: 'Buy' | 'Sell' | 'Neutral' | null = null;
    
    if (ma50 && ma200 && rsi !== null && macdData.macdSignal) {
      const signals: ('Buy' | 'Sell')[] = [];
      
      // MA crossover signal
      if (ma50 > ma200) signals.push('Buy');
      else if (ma50 < ma200) signals.push('Sell');
      
      // RSI signal
      if (rsi < 30) signals.push('Buy');
      else if (rsi > 70) signals.push('Sell');
      
      // MACD signal
      if (macdData.macdSignal === 'Bullish') signals.push('Buy');
      else if (macdData.macdSignal === 'Bearish') signals.push('Sell');
      
      // Count signals
      const buyCount = signals.filter(s => s === 'Buy').length;
      const sellCount = signals.filter(s => s === 'Sell').length;
      
      if (buyCount > sellCount) signalSummary = 'Buy';
      else if (sellCount > buyCount) signalSummary = 'Sell';
      else signalSummary = 'Neutral';
    }

    const techData: TechnicalIndicatorData = {
      symbol: symbol,
      ma50: ma50,
      ma200: ma200,
      rsi: rsi,
      macdSignal: macdData.macdSignal,
      macdSignals: macdData.macdSignals,
      macdDetails: {
        value: macdData.value,
        signal: macdData.signal,
        histogram: macdData.histogram,
        signals: macdData.signals
      },
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
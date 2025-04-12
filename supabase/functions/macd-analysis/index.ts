import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const POLYGON_API_KEY = Deno.env.get('POLYGON_API_KEY')
const POLYGON_BASE_URL = 'https://api.polygon.io'

interface MacdSignals {
  bullish_crossover: number[];
  bearish_crossover: number[];
  bullish_zero_crossover: number[];
  bearish_zero_crossover: number[];
  histogram_bullish_turn: number[];
  histogram_bearish_turn: number[];
}

interface MacdValue {
  timestamp: number;
  value: number;
  signal: number;
  histogram: number;
}

interface MacdResponse {
  symbol: string;
  timeframe: string;
  signalStrength: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  latestValues: {
    macd: number | null;
    signal: number | null;
    histogram: number | null;
    timestamp: number | null;
  };
  signals: MacdSignals;
  values: MacdValue[];
}

/**
 * Analyzes MACD data to identify various trading signals.
 * 
 * @param macdData The MACD data from Polygon API
 * @returns Object containing lists of timestamps for each identified signal
 */
function analyzeMacdSignals(macdData: any): MacdSignals {
  const signals: MacdSignals = {
    bullish_crossover: [],
    bearish_crossover: [],
    bullish_zero_crossover: [],
    bearish_zero_crossover: [],
    histogram_bullish_turn: [],
    histogram_bearish_turn: [],
  };

  const values: MacdValue[] = macdData?.results?.values || [];
  if (!values || values.length < 2) {
    return signals; // Not enough data to compare
  }

  // Define a function to check if signals are recent enough (within the past 3 days)
  const isRecentEnough = (timestamp: number) => {
    const now = new Date().getTime();
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
    return (now - timestamp) < threeDaysInMs;
  };

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

    // Only detect and include signals if they are recent enough (within a few days)
    if (!isRecentEnough(currentTimestamp)) continue;

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

  return signals;
}

/**
 * Determines the overall strength of the MACD signal based on multiple factors
 */
function determineSignalStrength(
  signals: MacdSignals, 
  latestMacd: number | null, 
  latestSignal: number | null
): 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell' {
  if (latestMacd === null || latestSignal === null) {
    return 'neutral';
  }
  
  // Count recent signal types (last 5 data points)
  const recentBullishSignals = 
    signals.bullish_crossover.length + 
    signals.bullish_zero_crossover.length + 
    signals.histogram_bullish_turn.length;
    
  const recentBearishSignals = 
    signals.bearish_crossover.length + 
    signals.bearish_zero_crossover.length + 
    signals.histogram_bearish_turn.length;
  
  // Current state
  const macdAboveSignal = latestMacd > latestSignal;
  const macdAboveZero = latestMacd > 0;
  const signalAboveZero = latestSignal > 0;
  
  // Strong buy conditions
  if (
    (recentBullishSignals > 0 && recentBearishSignals === 0) && 
    macdAboveSignal && 
    macdAboveZero && 
    signalAboveZero
  ) {
    return 'strong_buy';
  }
  
  // Strong sell conditions
  if (
    (recentBearishSignals > 0 && recentBullishSignals === 0) && 
    !macdAboveSignal && 
    !macdAboveZero && 
    !signalAboveZero
  ) {
    return 'strong_sell';
  }
  
  // Buy conditions
  if (
    (recentBullishSignals > recentBearishSignals) || 
    (macdAboveSignal && macdAboveZero)
  ) {
    return 'buy';
  }
  
  // Sell conditions
  if (
    (recentBearishSignals > recentBullishSignals) || 
    (!macdAboveSignal && !macdAboveZero)
  ) {
    return 'sell';
  }
  
  return 'neutral';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      symbol, 
      timespan = 'day', 
      shortWindow = 12, 
      longWindow = 26, 
      signalWindow = 9, 
      seriesType = 'close', 
      limit = 50 
    } = await req.json();
    
    if (!symbol) throw new Error('Missing stock symbol');
    if (!POLYGON_API_KEY) throw new Error('Missing Polygon API key');

    // Construct the Polygon MACD URL
    const macdUrl = `${POLYGON_BASE_URL}/v1/indicators/macd/${symbol}?timespan=${timespan}&adjusted=true&short_window=${shortWindow}&long_window=${longWindow}&signal_window=${signalWindow}&series_type=${seriesType}&order=desc&limit=${limit}&apiKey=${POLYGON_API_KEY}`;
    
    const response = await fetch(macdUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch MACD data: ${response.status} ${await response.text()}`);
    }
    
    const macdData = await response.json();
    const values = macdData?.results?.values || [];
    
    if (!values.length) {
      throw new Error('No MACD data available for this symbol');
    }
    
    // Analyze MACD signals - only detect signals when conditions are fulfilled
    const signals = analyzeMacdSignals(macdData);
    const latestValue = values[0] || null;
    
    const signalStrength = determineSignalStrength(
      signals,
      latestValue?.value || null,
      latestValue?.signal || null
    );
    
    const result: MacdResponse = {
      symbol,
      timeframe: timespan,
      signalStrength,
      latestValues: {
        macd: latestValue?.value || null,
        signal: latestValue?.signal || null,
        histogram: latestValue?.histogram || null,
        timestamp: latestValue?.timestamp || null
      },
      signals,
      values: values.slice(0, 10) // Return only the 10 most recent values to keep response size down
    };

    return new Response(JSON.stringify(result), {
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
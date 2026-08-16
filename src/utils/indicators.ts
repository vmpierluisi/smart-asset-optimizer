/**
 * Pure technical-indicator analysis (no I/O).
 *
 * Extracted from twelveDataUtils so the signal logic can be unit-tested in
 * isolation and reused. twelveDataUtils re-exports these for existing callers.
 */
import type { MACDData, TimeSeriesData } from './twelveDataUtils';

/**
 * Interface for MACD value with price data included for divergence analysis
 */
export interface MACDValue {
  datetime: string;
  macd: number;
  macd_signal: number;
  macd_hist: number;
  price: number; // Include price for divergence analysis
}

/**
 * Interface for MACD signals detected in analysis
 */
export interface MACDSignals {
  bullishCrossover: boolean;
  bearishCrossover: boolean;
  bullishZeroCrossover: boolean;
  bearishZeroCrossover: boolean;
  bullishDivergence?: boolean;
  bearishDivergence?: boolean;
  histogramIncreasing: boolean;
  histogramDecreasing: boolean;
}

/**
 * Analyzes MACD data to detect technical signals
 * @param current Current MACD value with price
 * @param previous Previous MACD value with price
 * @param historicalData Array of historical MACD values (for divergence analysis)
 * @returns Object containing detected MACD signals
 */
export function analyzeMACDSignals(
  current: MACDValue,
  previous?: MACDValue,
  historicalData?: MACDValue[] // For divergence
): MACDSignals {
  const signals: MACDSignals = {
    bullishCrossover: false,
    bearishCrossover: false,
    bullishZeroCrossover: false,
    bearishZeroCrossover: false,
    histogramIncreasing: false,
    histogramDecreasing: false,
  };

  if (previous) {
    // 1. MACD Line and Signal Line Crossovers
    signals.bullishCrossover = previous.macd < previous.macd_signal && current.macd > current.macd_signal;
    signals.bearishCrossover = previous.macd > previous.macd_signal && current.macd < current.macd_signal;

    // 2. Zero Line Crossovers
    signals.bullishZeroCrossover = previous.macd <= 0 && current.macd > 0;
    signals.bearishZeroCrossover = previous.macd >= 0 && current.macd < 0;

    // 5. Histogram Interpretation
    signals.histogramIncreasing = Math.abs(current.macd_hist) > Math.abs(previous.macd_hist) && Math.sign(current.macd_hist) === Math.sign(previous.macd_hist);
    signals.histogramDecreasing = Math.abs(current.macd_hist) < Math.abs(previous.macd_hist) && Math.sign(current.macd_hist) === Math.sign(previous.macd_hist);
  }

  // 3. Divergence (Checking against a history of data)
  if (historicalData && historicalData.length >= 2) {
    const n = 2; // Check the last 2 points for a simple divergence

    // Bullish Divergence: Price makes lower lows, MACD makes higher lows
    const priceLows = historicalData.slice(-n).map(item => item.price);
    const macdLows = historicalData.slice(-n).map(item => item.macd);
    if (priceLows[0] > priceLows[1] && macdLows[0] < macdLows[1]) {
      signals.bullishDivergence = true;
    }

    // Bearish Divergence: Price makes higher highs, MACD makes lower highs
    const priceHighs = historicalData.slice(-n).map(item => item.price);
    const macdHighs = historicalData.slice(-n).map(item => item.macd);
    if (priceHighs[0] < priceHighs[1] && macdHighs[0] > macdHighs[1]) {
      signals.bearishDivergence = true;
    }
  }

  return signals;
}

/**
 * Processes MACD data with price data to detect recent signals
 * @param macdData MACD data from Twelve Data API
 * @param timeSeriesData Time series data for the same period (for price information)
 * @returns Object containing recent MACD signals for display
 */
export function getRecentMACDSignals(macdData: MACDData, timeSeriesData: TimeSeriesData): { 
  recentSignals: MACDSignals, 
  macdValues: MACDValue[] 
} {
  if (!macdData?.values || !timeSeriesData?.data || macdData.values.length === 0 || timeSeriesData.data.length === 0) {
    return { 
      recentSignals: {
        bullishCrossover: false,
        bearishCrossover: false,
        bullishZeroCrossover: false,
        bearishZeroCrossover: false,
        histogramIncreasing: false,
        histogramDecreasing: false
      },
      macdValues: []
    };
  }

  // Create a map of dates to prices for quick lookup
  const priceMap = new Map<string, number>();
  timeSeriesData.data.forEach(item => {
    priceMap.set(item.date, item.close);
  });

  // Convert MACD string values to numbers and add price data
  const macdValues: MACDValue[] = macdData.values.map(item => {
    // Extract date in format that matches the time series data
    const dateStr = item.datetime.split('T')[0];
    const price = priceMap.get(dateStr) || 0;

    return {
      datetime: item.datetime,
      macd: parseFloat(item.macd),
      macd_signal: parseFloat(item.macd_signal),
      macd_hist: parseFloat(item.macd_hist),
      price
    };
  }).filter(item => item.price > 0); // Filter out items without matching price data

  // Get the most recent 2 days of data for signal analysis
  if (macdValues.length < 2) {
    return {
      recentSignals: {
        bullishCrossover: false,
        bearishCrossover: false,
        bullishZeroCrossover: false,
        bearishZeroCrossover: false,
        histogramIncreasing: false,
        histogramDecreasing: false
      },
      macdValues
    };
  }

  // Get the two most recent data points
  const current = macdValues[macdValues.length - 1];
  const previous = macdValues[macdValues.length - 2];

  // Use the last 5 data points for divergence analysis
  const historicalData = macdValues.slice(-5);

  // Analyze the signals
  const recentSignals = analyzeMACDSignals(current, previous, historicalData);

  return { recentSignals, macdValues };
}

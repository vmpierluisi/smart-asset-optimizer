import { useState, useEffect } from 'react';
import { fetchTimeSeries, TimeSeriesData } from '@/utils/twelveDataUtils';
import { toast } from '@/hooks/use-toast';

export interface TimeSeriesResult {
  data: TimeSeriesData | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch time series data from Twelve Data API
 * @param symbol The stock symbol to fetch data for
 * @param period The time period to fetch (1day, 1week, 1month, 1year, ytd, max)
 * @returns Object with time series data, loading state, and error
 */
export const useTimeSeries = (symbol: string | null, period: string): TimeSeriesResult => {
  const [data, setData] = useState<TimeSeriesData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setData(null);
      setError(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Add timestamp to avoid caching issues between different periods
        const timestamp = new Date().getTime();
        const timeSeriesData = await fetchTimeSeries(symbol, period, timestamp);
        setData(timeSeriesData);
      } catch (err) {
        console.error('Error fetching time series data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        toast({
          title: 'Error',
          description: `Failed to fetch time series data for ${symbol}: ${err instanceof Error ? err.message : 'Unknown error'}`,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, period]);

  return { data, loading, error };
}; 
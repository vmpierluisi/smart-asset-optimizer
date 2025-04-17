import { useState, useEffect } from 'react';
import { fetchStockStatistics, StockStatisticsData } from '@/utils/twelveDataUtils';
import { toast } from '@/hooks/use-toast';

export interface StockStatisticsHookData {
  data: StockStatisticsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * React hook for fetching comprehensive stock statistics
 * @param symbol Stock ticker symbol (e.g. 'AAPL')
 * @returns Stock statistics data, loading state, and error information
 */
export const useStockStatistics = (symbol: string | null): StockStatisticsHookData => {
  const [data, setData] = useState<StockStatisticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!symbol) {
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const statistics = await fetchStockStatistics(symbol);
      setData(statistics);
      
      if (!statistics) {
        throw new Error('No statistics data available');
      }
    } catch (err) {
      console.error('Error fetching stock statistics:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        title: 'Error',
        description: `Failed to fetch statistics for ${symbol}: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbol]);

  const refetch = async () => {
    await fetchData();
  };

  return { data, loading, error, refetch };
}; 
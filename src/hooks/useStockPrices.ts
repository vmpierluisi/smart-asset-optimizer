import { useState, useEffect } from 'react';
import { fetchHistoricalPrices, HistoricalPrice } from '@/utils/fmpFinanceUtils';
import { toast } from '@/hooks/use-toast';

export interface StockPriceData {
  data: HistoricalPrice[];
  loading: boolean;
  error: string | null;
}

export const useStockPrices = (symbol: string | null, timeframe: string): StockPriceData => {
  const [data, setData] = useState<HistoricalPrice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setData([]);
      setError(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const endDate = new Date();
        let startDate = new Date();

        // Calculate start date based on timeframe
        switch (timeframe) {
          case '1D':
            startDate.setDate(endDate.getDate() - 1);
            break;
          case '1W':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '1M':
            startDate.setMonth(endDate.getMonth() - 1);
            break;
          case '3M':
            startDate.setMonth(endDate.getMonth() - 3);
            break;
          case '6M':
            startDate.setMonth(endDate.getMonth() - 6);
            break;
          case 'YTD':
            startDate = new Date(endDate.getFullYear(), 0, 1); // Jan 1 of current year
            break;
          case '1Y':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
          case '5Y':
            startDate.setFullYear(endDate.getFullYear() - 5);
            break;
          default:
            startDate.setFullYear(endDate.getFullYear() - 1); // Default to 1Y
        }

        const priceData = await fetchHistoricalPrices(symbol, startDate, endDate);
        setData(priceData);
      } catch (err) {
        console.error('Error fetching stock prices:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        toast({
          title: 'Error',
          description: `Failed to fetch data for ${symbol}: ${err instanceof Error ? err.message : 'Unknown error'}`,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, timeframe]);

  return { data, loading, error };
}; 
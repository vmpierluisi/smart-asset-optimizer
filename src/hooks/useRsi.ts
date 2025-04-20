import { useState, useEffect } from 'react';
import { fetchRSI } from '@/utils/twelveDataUtils';

/**
 * Custom hook to fetch RSI data for a given stock symbol
 * @param symbol The stock symbol to fetch RSI for
 * @returns Object containing RSI data, loading state, and any error
 */
export const useRsi = (symbol: string | null) => {
  const [rsi, setRsi] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRsiData = async () => {
      if (!symbol) {
        setRsi(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const rsiData = await fetchRSI(symbol, '3M');
        
        if (rsiData && rsiData.values && rsiData.values.length > 0) {
          // Calculate average RSI from the most recent 14 values (or fewer if less are available)
          const recentValues = rsiData.values.slice(0, Math.min(14, rsiData.values.length));
          const sum = recentValues.reduce((acc, val) => acc + parseFloat(val.rsi), 0);
          const averageRsi = sum / recentValues.length;
          setRsi(Number(averageRsi.toFixed(2)));
        } else {
          setRsi(null);
        }
      } catch (err) {
        console.error('Error in RSI hook:', err);
        setError(err instanceof Error ? err.message : 'Unknown error fetching RSI data');
        setRsi(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRsiData();
  }, [symbol]);

  return { rsi, loading, error };
};

export default useRsi; 
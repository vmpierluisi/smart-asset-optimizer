import { useState, useEffect } from 'react';
import { fetchRsiFromPolygon } from '@/utils/fmpFinanceUtils';

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
    const fetchRsi = async () => {
      if (!symbol) {
        setRsi(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const rsiData = await fetchRsiFromPolygon(symbol);
        setRsi(rsiData);
      } catch (err) {
        console.error('Error in RSI hook:', err);
        setError(err instanceof Error ? err.message : 'Unknown error fetching RSI data');
      } finally {
        setLoading(false);
      }
    };

    fetchRsi();
  }, [symbol]);

  return { rsi, loading, error };
};

export default useRsi; 
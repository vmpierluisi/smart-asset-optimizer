import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { HistoricalPrice } from '@/utils/fmpFinanceUtils';

interface PriceChartProps {
  data: HistoricalPrice[] | { date: Date; close: number }[];
  height?: number;
  loading?: boolean;
  timeframe?: string;
  error?: string | null;
}

export const PriceChart: React.FC<PriceChartProps> = ({ 
  data, 
  height = 250,
  loading = false,
  timeframe = '1Y',
  error = null
}) => {
  const chartData = data.map(item => ({
    date: item.date,
    dateString: item.date instanceof Date ? item.date.toISOString().split('T')[0] : new Date(item.date).toISOString().split('T')[0], // handle string or Date
    close: item.close,
  }));

  // Determine appropriate date format based on timeframe
  const getDateFormat = () => {
    switch (timeframe) {
      case '1D':
        return { hour: '2-digit' as const, minute: '2-digit' as const };
      case '1W':
      case '1M':
        return { month: 'short' as const, day: 'numeric' as const };
      case '3M':
      case '6M':
      case 'YTD':
        return { month: 'short' as const, day: 'numeric' as const };
      case '1Y':
        return { month: 'short' as const, year: '2-digit' as const };
      case '5Y':
        return { month: 'short' as const, year: 'numeric' as const };
      default:
        return { month: 'short' as const, day: 'numeric' as const, year: 'numeric' as const };
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, getDateFormat());
  };

  if (loading) {
    return (
      <div 
        className="w-full rounded-md border border-dashed flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="w-full rounded-md border border-dashed flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        <div className="text-red-500 flex flex-col items-center">
          <span>Error loading price data: {error}</span>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div 
        className="w-full rounded-md border border-dashed flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        <div className="text-muted-foreground flex flex-col items-center">
          <span>No price data available</span>
        </div>
      </div>
    );
  }

  // Calculate number of ticks based on timeframe to avoid overcrowding
  const getTickInterval = () => {
    const dataLength = chartData.length;
    
    switch (timeframe) {
      case '1D':
        return Math.ceil(dataLength / 6);
      case '1W':
        return Math.ceil(dataLength / 5);
      case '1M':
        return Math.ceil(dataLength / 6);
      case '3M':
      case '6M':
        return Math.ceil(dataLength / 8);
      case 'YTD':
      case '1Y':
        return Math.ceil(dataLength / 12);
      case '5Y':
        return Math.ceil(dataLength / 10);
      default:
        return Math.ceil(dataLength / 8);
    }
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <XAxis 
            dataKey="dateString"
            tick={{ fontSize: 12 }}
            tickFormatter={(dateStr) => {
              const date = new Date(dateStr);
              return formatDate(date);
            }}
            minTickGap={30}
            interval={getTickInterval()}
          />
          <YAxis 
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
            width={80}
            tick={{ fontSize: 14 }}
          />
          <Tooltip 
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
            labelFormatter={(dateStr) => {
              const date = new Date(dateStr);
              return `Date: ${date.toLocaleDateString(undefined, {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}`;
            }}
            cursor={{
              stroke: '#666',
              strokeWidth: 1,
              strokeDasharray: '3 3'
            }}
          />
          {/* Legend removed */}
          <Line
            type="monotone"
            dataKey="close"
            name="Price"
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}; 
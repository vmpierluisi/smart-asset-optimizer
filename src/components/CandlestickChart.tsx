import React from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart } from 'recharts';
import { TimeSeriesData } from '@/utils/twelveDataUtils';

interface CandlestickProps {
  data: TimeSeriesData | null;
  height?: number;
  loading?: boolean;
  timeframe?: string;
  error?: string | null;
}

const CandlestickChart: React.FC<CandlestickProps> = ({ 
  data, 
  height = 250,
  loading = false,
  timeframe = '1Y',
  error = null
}) => {
  // Custom candlestick rendering
  const renderCandlestick = (data: any) => {
    if (!data || !data.data || !Array.isArray(data.data) || !data.data.length) {
      return null;
    }

    const chartData = data.data.map((item: any) => ({
      date: item.date,
      dateString: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      // Calculate if price went up or down
      trend: item.close >= item.open ? 'up' : 'down'
    }));

    // Calculate min and max values for Y-axis with more padding
    const minValue = Math.min(...chartData.map((item: any) => item.low));
    const maxValue = Math.max(...chartData.map((item: any) => item.high));

    // Add 5% padding to the top and bottom of the range
    const range = maxValue - minValue;
    const padding = range * 0.05;
    const yAxisMin = minValue - padding;
    const yAxisMax = maxValue + padding;

    console.log("Price range:", { minValue, maxValue, yAxisMin, yAxisMax }); // For debugging

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
          return { month: 'short' as const, day: 'numeric' as const, year: '2-digit' as const };
        case '5Y':
          return { month: 'short' as const, day: 'numeric' as const, year: 'numeric' as const };
        default:
          return { month: 'short' as const, day: 'numeric' as const, year: 'numeric' as const };
      }
    };

    // For intraday data, make sure the date includes time
    const isIntraday = timeframe === '1D';
    
    // Format function for axis labels
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      
      // For intraday data, just show the time
      if (isIntraday) {
        return date.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // For other timeframes, use the standard date format
      return date.toLocaleDateString(undefined, getDateFormat());
    };
    
    // Format date for tooltips in a consistent way across all timeframes
    const formatTooltipDate = (dateString: string) => {
      const date = new Date(dateString);
      
      // For intraday data (1D), include time in the tooltip
      if (isIntraday) {
        return date.toLocaleString(undefined, {
          day: 'numeric',
          month: 'short',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // For all other timeframes, use consistent "1 Jan '22" format
      return date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: '2-digit'
      });
    };

    // Calculate number of ticks based on timeframe
    const getTickInterval = () => {
      const dataLength = chartData.length;
      
      switch (timeframe) {
        case '1D':
          // For intraday data, show a tick every hour (12 ticks for a trading day)
          return Math.ceil(dataLength / 12);
        case '1W':
          return Math.ceil(dataLength / 5);
        case '1M':
          return Math.ceil(dataLength / 6);
        case '3M':
          return Math.ceil(dataLength / 6);
        case '6M':
          return Math.ceil(dataLength / 8);
        case 'YTD': {
          // Dynamically adjust based on current month (more ticks earlier in the year, fewer later)
          const currentMonth = new Date().getMonth() + 1; // 1-12
          return Math.ceil(dataLength / Math.max(4, currentMonth));
        }
        case '1Y':
          return Math.ceil(dataLength / 12);
        case '5Y':
          return Math.ceil(dataLength / 10);
        default:
          return Math.ceil(dataLength / 8);
      }
    };

    // For OHLC display in the tooltip
    const formatOHLC = (value: number) => {
      return `$${value.toFixed(2)}`;
    };

    // Determine bar thickness based on timeframe
    const getBarWidth = () => {
      switch (timeframe) {
        case '1D':
          return 7;
        case '1W':
          return 10;
        case '1M':
          return 8;
        case '3M':
          return 6; // Thicker bars for 3M timeframe
        case '6M':
        case 'YTD':
          return 4;
        case '1Y':
          return 3;
        case '5Y':
          return 2;
        default:
          return 5;
      }
    };

    return (
      <>
        {/* Price chart */}
        <ResponsiveContainer width="100%" height="70%">
          <ComposedChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: 10,
              bottom: 0
            }}
            barSize={getBarWidth()}
          >
            <XAxis 
              dataKey="dateString"
              tick={{ fontSize: 12 }}
              tickFormatter={formatDate}
              minTickGap={30}
              interval={getTickInterval()}
            />
            <YAxis 
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              width={60}
              orientation="left"
              yAxisId={0}
              allowDecimals={true}
              scale="linear"
              type="number"
              tick={{ fontSize: 14 }}
              domain={[
                (dataMin: number) => {
                  // Find the minimum of low values
                  const minPrice = Math.min(...chartData.map((item: any) => item.low));
                  
                  // Calculate a percentage-based buffer based on price range
                  const maxPrice = Math.max(...chartData.map((item: any) => item.high));
                  const priceRange = maxPrice - minPrice;
                  
                  // For very narrow price ranges, use a minimum range of 1% of price
                  const minRangeBuffer = minPrice * 0.01;
                  const buffer = Math.max(priceRange * 0.1, minRangeBuffer);
                  
                  // Calculate a nice round number below the minimum with buffer
                  return Math.floor((minPrice - buffer) * 20) / 20; // Round down to nearest 0.05
                }, 
                (dataMax: number) => {
                  // Find the maximum of high values
                  const maxPrice = Math.max(...chartData.map((item: any) => item.high));
                  
                  // Calculate a percentage-based buffer based on price range
                  const minPrice = Math.min(...chartData.map((item: any) => item.low));
                  const priceRange = maxPrice - minPrice;
                  
                  // For very narrow price ranges, use a minimum range of 1% of price
                  const minRangeBuffer = maxPrice * 0.01;
                  const buffer = Math.max(priceRange * 0.1, minRangeBuffer);
                  
                  // Calculate a nice round number above the maximum with buffer
                  return Math.ceil((maxPrice + buffer) * 20) / 20; // Round up to nearest 0.05
                }
              ]}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="custom-tooltip bg-background border border-border p-3 rounded shadow-md">
                      <p className="font-semibold">{formatTooltipDate(data.dateString)}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-sm">
                        <div>Open:</div>
                        <div className="text-right">{formatOHLC(data.open)}</div>
                        <div>High:</div>
                        <div className="text-right">{formatOHLC(data.high)}</div>
                        <div>Low:</div>
                        <div className="text-right">{formatOHLC(data.low)}</div>
                        <div>Close:</div>
                        <div className="text-right">{formatOHLC(data.close)}</div>
                        <div>Volume:</div>
                        <div className="text-right">{data.volume.toLocaleString()}</div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{
                stroke: '#666',
                strokeWidth: 1,
                strokeDasharray: '3 3'
              }}
            />
            {/* Up candles - when close >= open */}
            <Bar
              dataKey="high"
              fill="transparent"
              stroke="transparent"
              isAnimationActive={false}
              yAxisId={0}
              barSize={getBarWidth()}
            />
            <Bar
              dataKey="low"
              fill="transparent"
              stroke="transparent"
              isAnimationActive={false}
              yAxisId={0}
              barSize={getBarWidth()}
            />
            <Bar
              dataKey={(data) => (data.trend === 'up' ? [data.open, data.close] : [0, 0])}
              fill="#10b981" // Green for up
              stroke="#10b981"
              name="Up"
              yAxisId={0}
              barSize={getBarWidth()}
            />
            <Bar
              dataKey={(data) => (data.trend === 'down' ? [data.open, data.close] : [0, 0])}
              fill="#ef4444" // Red for down
              stroke="#ef4444"
              name="Down"
              yAxisId={0}
              barSize={getBarWidth()}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Volume chart */}
        <ResponsiveContainer width="100%" height="25%">
          <BarChart
            data={chartData}
            margin={{
              top: 0,
              right: 10,
              left: 10,
              bottom: 5
            }}
          >
            <XAxis 
              dataKey="dateString"
              tick={{ fontSize: 10 }}
              tickFormatter={formatDate}
              minTickGap={30}
              interval={getTickInterval()}
              height={20}
              tickLine={true}
              axisLine={{ stroke: '#000000' }}
            />
            <YAxis 
              tickFormatter={(value) => {
                if (value >= 1000000000) {
                  return `${(value / 1000000000).toFixed(1)}B`;
                } else if (value >= 1000000) {
                  return `${(value / 1000000).toFixed(1)}M`;
                } else if (value >= 1000) {
                  return `${(value / 1000).toFixed(1)}K`;
                }
                return value;
              }}
              width={60}
              domain={[
                0, 
                (dataMax: number) => {
                  // Find the maximum volume
                  const maxVolume = Math.max(...chartData.map((item: any) => item.volume));
                  // Add 20% buffer on top
                  return maxVolume * 1.2;
                }
              ]}
              orientation="left"
              tick={{ fontSize: 14 }}
            />
            <Tooltip 
              formatter={(value: number) => [`${value.toLocaleString()}`, 'Volume']}
              labelFormatter={(dateString) => formatTooltipDate(dateString)}
              // No crosshair for volume chart, just a simple cursor
              cursor={{ fill: 'rgba(136, 132, 216, 0.1)' }}
            />
            <Bar 
              dataKey="volume" 
              fill="#8884d8" 
              opacity={0.7} 
              name="Volume"
              fillOpacity={0.7}
            />
          </BarChart>
        </ResponsiveContainer>
      </>
    );
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

  if (!data || !data.data || !data.data.length) {
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

  return (
    <div style={{ width: '100%', height }}>
      {renderCandlestick(data)}
    </div>
  );
};

export default CandlestickChart; 
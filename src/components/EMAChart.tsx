import React, { useEffect, useState, useRef } from 'react';
import { SMAData } from '@/utils/twelveDataUtils';
import {
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Brush
} from 'recharts';
import { fetchTimeSeries, TimeSeriesData } from '@/utils/twelveDataUtils';
import { cn } from "@/lib/utils";

// Reusing SMAData interface since EMA data structure is the same
// Just with different indicator values
interface EMAChartProps {
  data: SMAData; // EMA-20 data
  data50?: SMAData; // Optional 50-day EMA data
  data200?: SMAData; // Optional 200-day EMA data
  onTimeframeChange?: (timeframe: string) => void;
  timeframe?: string;
}

// Explicitly export the component
export const EMAChart: React.FC<EMAChartProps> = ({ 
  data, 
  data50, 
  data200, 
  onTimeframeChange,
  timeframe = "3M" 
}) => {
  const [priceData, setPriceData] = useState<TimeSeriesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [combinedData, setCombinedData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(timeframe);
  const previousDataRef = useRef<{
    data: SMAData | null;
    data50: SMAData | null;
    data200: SMAData | null;
    timeframe: string;
  }>({
    data: null,
    data50: null,
    data200: null,
    timeframe: timeframe
  });

  // Handle timeframe change
  const handleTimeframeChange = (value: string) => {
    if (value === selectedTimeframe) return; // Avoid unnecessary updates
    
    console.log(`Changing timeframe from ${selectedTimeframe} to ${value}`);
    setSelectedTimeframe(value);
    setIsLoading(true); // Set loading state to show spinner
    
    // Notify parent component
    if (onTimeframeChange) {
      onTimeframeChange(value);
    }
  };

  // Sync with parent component's timeframe prop
  useEffect(() => {
    if (timeframe !== selectedTimeframe) {
      console.log(`Timeframe prop changed from ${selectedTimeframe} to ${timeframe}`);
      setSelectedTimeframe(timeframe);
      setIsLoading(true);
    }
  }, [timeframe]);

  // Fetch price data when symbol or timeframe changes
  useEffect(() => {
    const fetchPriceData = async () => {
      if (!data?.symbol) {
        console.error('No symbol provided for fetching price data');
        setError('No symbol provided');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching price data for ${data.symbol} with timeframe ${selectedTimeframe.toLowerCase()}`);
        
        // Convert UI timeframe format to API format (3M -> 3month, 1Y -> 1year)
        let apiTimeframe = selectedTimeframe.toLowerCase();
        if (apiTimeframe === '3m') apiTimeframe = '3month';
        if (apiTimeframe === '6m') apiTimeframe = '6month';
        if (apiTimeframe === '1y') apiTimeframe = '1year';
        
        const timeSeries = await fetchTimeSeries(data.symbol, apiTimeframe);
        console.log(`Received ${timeSeries.data.length} price data points`);
        setPriceData(timeSeries);
      } catch (error) {
        console.error('Error fetching price data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error fetching price data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPriceData();
  }, [data?.symbol, selectedTimeframe]);

  // Process and combine data when inputs change
  useEffect(() => {
    // Skip processing if data hasn't changed or is missing
    if (!data || !priceData || isLoading) return;
    
    // Check if we need to process the data
    const hasDataChanged = 
      data !== previousDataRef.current.data || 
      data50 !== previousDataRef.current.data50 || 
      data200 !== previousDataRef.current.data200 ||
      selectedTimeframe !== previousDataRef.current.timeframe;
    
    if (!hasDataChanged) {
      return;
    }
    
    // Update the ref to track the current data state
    previousDataRef.current = {
      data,
      data50: data50 || null,
      data200: data200 || null,
      timeframe: selectedTimeframe
    };
    
    console.log(`Processing data for timeframe ${selectedTimeframe}`);
    console.log('EMA-20 Data:', data); 
    if (data50) console.log('EMA-50 Data:', data50);
    if (data200) console.log('EMA-200 Data:', data200);
    console.log('Price Data:', priceData);

    // Create maps of dates to MA values
    const ema20Map = new Map();
    const ema50Map = new Map();
    const ema200Map = new Map();
    
    // Process EMA-20 data
    if (data.values && Array.isArray(data.values) && data.values.length > 0) {
      data.values.forEach(item => {
        // Extract just the date part from datetime
        const dateStr = item.datetime.split(' ')[0];
        ema20Map.set(dateStr, parseFloat(item.ma));
      });
    } else {
      console.error('No EMA-20 values in data:', data);
      setError('No EMA-20 data available');
      return;
    }
    
    // Process EMA-50 data if available
    if (data50?.values && Array.isArray(data50.values) && data50.values.length > 0) {
      data50.values.forEach(item => {
        const dateStr = item.datetime.split(' ')[0];
        ema50Map.set(dateStr, parseFloat(item.ma));
      });
    }
    
    // Process EMA-200 data if available
    if (data200?.values && Array.isArray(data200.values) && data200.values.length > 0) {
      data200.values.forEach(item => {
        const dateStr = item.datetime.split(' ')[0];
        ema200Map.set(dateStr, parseFloat(item.ma));
      });
    }

    // Combine price data with MA data
    const combined = priceData.data.map(pricePoint => {
      const date = pricePoint.date;
      const ema20Value = ema20Map.get(date);
      const ema50Value = ema50Map.get(date);
      const ema200Value = ema200Map.get(date);
      
      return {
        date,
        dateString: date, // For tooltip consistency
        open: pricePoint.open,
        high: pricePoint.high,
        low: pricePoint.low,
        close: pricePoint.close,
        volume: pricePoint.volume,
        ema20: ema20Value, // EMA-20 value
        ema50: ema50Value, // EMA-50 value
        ema200: ema200Value, // EMA-200 value
        // For candlestick rendering
        trend: pricePoint.close >= pricePoint.open ? 'up' : 'down'
      };
    }).filter(item => item.ema20 !== null && item.ema20 !== undefined);

    console.log(`Combined data points: ${combined.length}`);
    
    if (combined.length === 0) {
      setError('No matching data between price and EMA');
      return;
    }
    
    setCombinedData(combined);
  }, [data, data50, data200, priceData, isLoading, selectedTimeframe]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || combinedData.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-muted-foreground">{error || 'No data available to display'}</p>
      </div>
    );
  }
  
  // Format function for dates on axis based on timeframe
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Adjust date format based on timeframe
    switch (selectedTimeframe) {
      case '3M':
        return date.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric'
        });
      case '6M':
        return date.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric'
        });
      case '1Y':
        // For yearly view, only show month and year
        return date.toLocaleDateString(undefined, {
          month: 'short',
          year: '2-digit'
        });
      default:
        return date.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric'
        });
    }
  };
  
  // Calculate appropriate tick interval based on timeframe and data length
  const getTickInterval = () => {
    const dataLength = combinedData.length;
    
    switch (selectedTimeframe) {
      case '3M':
        return Math.ceil(dataLength / 6); // Show ~6 ticks for 3 months
      case '6M':
        return Math.ceil(dataLength / 6); // Show ~6 ticks for 6 months
      case '1Y':
        return Math.ceil(dataLength / 12); // Show one tick per month for 1 year
      default:
        return Math.ceil(dataLength / 10);
    }
  };
  
  // Format for tooltip dates based on selected timeframe
  const formatTooltipDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Enhanced date format for tooltips based on timeframe
    switch (selectedTimeframe) {
      case '3M':
      case '6M':
        return date.toLocaleDateString(undefined, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: '2-digit'
        });
      case '1Y':
        return date.toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      default:
        return date.toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'short',
          year: '2-digit'
        });
    }
  };

  // Format OHLC values
  const formatOHLC = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  // Get bar width
  const getBarWidth = () => {
    // Using a default value, could be adjusted as needed
    return 8;
  };

  // Timeframe options
  const timeframeOptions = [
    { value: '3M', label: '3M' },
    { value: '6M', label: '6M' },
    { value: '1Y', label: '1Y' }
  ];

  // Custom legend formatter to make the legend text smaller
  const renderLegendText = (value: string) => {
    return <span style={{ fontSize: '11px' }}>{value}</span>;
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md shadow-sm">
          {timeframeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleTimeframeChange(option.value)}
              className={cn(
                "relative px-3 py-1 text-xs font-medium",
                option.value === selectedTimeframe
                  ? "bg-slate-600 text-white" 
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300",
                // Left button
                option.value === '3M' ? "rounded-l-md" : "",
                // Middle button - no rounded corners
                option.value === '6M' ? "" : "",
                // Right button
                option.value === '1Y' ? "rounded-r-md" : "",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={combinedData}
            margin={{
              top: 10,
              right: 10,
              left: 10,
              bottom: 10
            }}
            barSize={getBarWidth()}
          >
            <XAxis 
              dataKey="dateString"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
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
              tick={{ fontSize: 12 }}
              domain={[
                (dataMin) => {
                  // Find the minimum of low values and EMA values
                  const minValues = [
                    ...combinedData.map(item => item.low),
                    ...combinedData.filter(item => item.ema20 !== undefined).map(item => item.ema20)
                  ];
                  
                  // Include EMA-50 values if available
                  if (data50) {
                    minValues.push(...combinedData.filter(item => item.ema50 !== undefined).map(item => item.ema50));
                  }
                  
                  // Include EMA-200 values if available
                  if (data200) {
                    minValues.push(...combinedData.filter(item => item.ema200 !== undefined).map(item => item.ema200));
                  }
                  
                  const minPrice = Math.min(...minValues);
                  
                  // Calculate a percentage-based buffer based on price range
                  const maxValues = [
                    ...combinedData.map(item => item.high),
                    ...combinedData.filter(item => item.ema20 !== undefined).map(item => item.ema20)
                  ];
                  
                  // Include EMA-50 values if available
                  if (data50) {
                    maxValues.push(...combinedData.filter(item => item.ema50 !== undefined).map(item => item.ema50));
                  }
                  
                  // Include EMA-200 values if available
                  if (data200) {
                    maxValues.push(...combinedData.filter(item => item.ema200 !== undefined).map(item => item.ema200));
                  }
                  
                  const maxPrice = Math.max(...maxValues);
                  const priceRange = maxPrice - minPrice;
                  
                  // Adjust buffer percentage based on timeframe - longer timeframes need more buffer
                  let bufferPercentage = 0.1; // Default 10%
                  if (selectedTimeframe === '6M') bufferPercentage = 0.12;
                  if (selectedTimeframe === '1Y') bufferPercentage = 0.15;
                  
                  // For very narrow price ranges, use a minimum range of 1% of price
                  const minRangeBuffer = minPrice * 0.01;
                  const buffer = Math.max(priceRange * bufferPercentage, minRangeBuffer);
                  
                  // Calculate a nice round number below the minimum with buffer
                  return Math.floor((minPrice - buffer) * 20) / 20; // Round down to nearest 0.05
                }, 
                (dataMax) => {
                  // Find the maximum of high values and EMA values
                  const maxValues = [
                    ...combinedData.map(item => item.high),
                    ...combinedData.filter(item => item.ema20 !== undefined).map(item => item.ema20)
                  ];
                  
                  // Include EMA-50 values if available
                  if (data50) {
                    maxValues.push(...combinedData.filter(item => item.ema50 !== undefined).map(item => item.ema50));
                  }
                  
                  // Include EMA-200 values if available
                  if (data200) {
                    maxValues.push(...combinedData.filter(item => item.ema200 !== undefined).map(item => item.ema200));
                  }
                  
                  const maxPrice = Math.max(...maxValues);
                  
                  // Calculate a percentage-based buffer based on price range
                  const minValues = [
                    ...combinedData.map(item => item.low),
                    ...combinedData.filter(item => item.ema20 !== undefined).map(item => item.ema20)
                  ];
                  
                  // Include EMA-50 values if available
                  if (data50) {
                    minValues.push(...combinedData.filter(item => item.ema50 !== undefined).map(item => item.ema50));
                  }
                  
                  // Include EMA-200 values if available
                  if (data200) {
                    minValues.push(...combinedData.filter(item => item.ema200 !== undefined).map(item => item.ema200));
                  }
                  
                  const minPrice = Math.min(...minValues);
                  const priceRange = maxPrice - minPrice;
                  
                  // Adjust buffer percentage based on timeframe - longer timeframes need more buffer
                  let bufferPercentage = 0.1; // Default 10%
                  if (selectedTimeframe === '6M') bufferPercentage = 0.12;
                  if (selectedTimeframe === '1Y') bufferPercentage = 0.15;
                  
                  // For very narrow price ranges, use a minimum range of 1% of price
                  const minRangeBuffer = maxPrice * 0.01;
                  const buffer = Math.max(priceRange * bufferPercentage, minRangeBuffer);
                  
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
                        <div>EMA-20:</div>
                        <div className="text-right">{data.ema20 ? formatOHLC(data.ema20) : 'N/A'}</div>
                        {data.ema50 !== undefined && (
                          <>
                            <div>EMA-50:</div>
                            <div className="text-right">{formatOHLC(data.ema50)}</div>
                          </>
                        )}
                        {data.ema200 !== undefined && (
                          <>
                            <div>EMA-200:</div>
                            <div className="text-right">{formatOHLC(data.ema200)}</div>
                          </>
                        )}
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
            <Legend 
              formatter={renderLegendText}
              iconSize={10} 
              wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }}
              height={20}
              margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
            />
            
            {/* High-low vertical line */}
            <Bar
              dataKey="high"
              fill="transparent"
              stroke="transparent"
              isAnimationActive={false}
              yAxisId={0}
              barSize={getBarWidth()}
              legendType="none"
            />
            <Bar
              dataKey="low"
              fill="transparent"
              stroke="transparent"
              isAnimationActive={false}
              yAxisId={0}
              barSize={getBarWidth()}
              legendType="none"
            />
            
            {/* Up candles - when close >= open */}
            <Bar
              dataKey={(data) => (data.trend === 'up' ? [data.open, data.close] : [0, 0])}
              fill="#10b981" // Green for up
              stroke="#10b981"
              yAxisId={0}
              barSize={getBarWidth()}
              legendType="none"
            />
            
            {/* Down candles - when close < open */}
            <Bar
              dataKey={(data) => (data.trend === 'down' ? [data.open, data.close] : [0, 0])}
              fill="#ef4444" // Red for down
              stroke="#ef4444"
              yAxisId={0}
              barSize={getBarWidth()}
              legendType="none"
            />
            
            {/* EMA-20 line */}
            <Line
              type="monotone"
              dataKey="ema20"
              stroke="#ff7300" // Orange color for EMA-20 (same as SMA-20)
              name="20-Day EMA"
              dot={false}
              strokeWidth={2}
              connectNulls={true}
              yAxisId={0}
            />
            
            {/* EMA-50 line */}
            {data50 && (
              <Line
                type="monotone"
                dataKey="ema50"
                stroke="#3b82f6" // Blue color for EMA-50
                name="50-Day EMA"
                dot={false}
                strokeWidth={2}
                connectNulls={true}
                yAxisId={0}
              />
            )}
            
            {/* EMA-200 line */}
            {data200 && (
              <Line
                type="monotone"
                dataKey="ema200"
                stroke="#8b5cf6" // Purple color for EMA-200
                name="200-Day EMA"
                dot={false}
                strokeWidth={2}
                connectNulls={true}
                yAxisId={0}
              />
            )}
            
            {/* Brush for timeframe navigation - always visible and showing full range */}
            <Brush 
              dataKey="dateString" 
              height={20} 
              stroke="#8884d8"
              tickFormatter={() => ''} 
              startIndex={0}
              endIndex={combinedData.length - 1}
              gap={1}
              travellerWidth={10}
              alwaysShowText={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Default export
export default EMAChart; 
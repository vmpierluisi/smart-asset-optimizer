import React, { useEffect, useState, useRef } from 'react';
import { RSIData } from '@/utils/twelveDataUtils';
import { XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, Bar, ReferenceLine, Brush } from 'recharts';
import { fetchTimeSeries, TimeSeriesData } from '@/utils/twelveDataUtils';
import { cn } from "@/lib/utils";

interface RSIChartProps {
  data: RSIData;
  onTimeframeChange?: (timeframe: string) => void;
  timeframe?: string;
}

// RSI Chart component
export const RSIChart: React.FC<RSIChartProps> = ({ 
  data, 
  onTimeframeChange,
  timeframe = "3M" 
}) => {
  const [priceData, setPriceData] = useState<TimeSeriesData | null>(null);
  const [combinedData, setCombinedData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(timeframe);
  const previousDataRef = useRef<{
    data: RSIData | null;
    timeframe: string;
  }>({
    data: null,
    timeframe: timeframe
  });
  const [isLoading, setIsLoading] = useState(true);

  // Handle timeframe change
  const handleTimeframeChange = (value: string) => {
    if (value === selectedTimeframe) return; // Avoid unnecessary updates
    
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
        
        // Convert UI timeframe format to API format (3M -> 3month, 1Y -> 1year)
        let apiTimeframe = selectedTimeframe.toLowerCase();
        if (apiTimeframe === '3m') apiTimeframe = '3month';
        if (apiTimeframe === '6m') apiTimeframe = '6month';
        if (apiTimeframe === '1y') apiTimeframe = '1year';
        
        const timeSeries = await fetchTimeSeries(data.symbol, apiTimeframe);
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
      selectedTimeframe !== previousDataRef.current.timeframe;
    
    if (!hasDataChanged) {
      return;
    }
    
    // Update the ref to track the current data state
    previousDataRef.current = {
      data,
      timeframe: selectedTimeframe
    };
    

    try {
      // Create map of dates to RSI values
      const rsiMap = new Map();
      
      // Process RSI data
      if (data.values && Array.isArray(data.values) && data.values.length > 0) {
        data.values.forEach(item => {
          // Extract just the date part from datetime
          const dateStr = item.datetime.split(' ')[0];
          rsiMap.set(dateStr, parseFloat(item.rsi));
        });
      } else {
        console.error('No RSI values in data:', data);
        setError('No RSI data available');
        return;
      }

      // Combine price data with RSI data
      const combined = priceData.data.map(pricePoint => {
        const date = pricePoint.date;
        const rsiValue = rsiMap.get(date);
        
        return {
          date,
          dateString: date, // For tooltip consistency
          open: pricePoint.open,
          high: pricePoint.high,
          low: pricePoint.low,
          close: pricePoint.close,
          volume: pricePoint.volume,
          rsi: rsiValue,
          // For candlestick rendering
          trend: pricePoint.close >= pricePoint.open ? 'up' : 'down'
        };
      }).filter(item => item.rsi !== null && item.rsi !== undefined);

      
      if (combined.length === 0) {
        setError('No matching data between price and RSI');
        return;
      }
      
      setCombinedData(combined);
      setError(null);
    } catch (err) {
      console.error('Error processing RSI data:', err);
      setError('Error processing RSI data');
    } finally {
      setIsLoading(false);
    }
  }, [data, priceData, isLoading, selectedTimeframe]);

  if (isLoading && !combinedData.length) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !combinedData.length) {
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
  const formatValue = (value: number) => {
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

  // Determine RSI category (overbought, neutral, oversold)
  const getRSICategory = (rsi: number) => {
    if (rsi >= 70) return 'overbought';
    if (rsi <= 30) return 'oversold';
    return 'neutral';
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
              right: 30,
                left: 10,
              bottom: 10
              }}
              barSize={getBarWidth()}
            >
              <XAxis 
                dataKey="dateString"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
                height={20}
                minTickGap={30}
                interval={getTickInterval()}
              />
            {/* Price Y-Axis (Left) */}
              <YAxis 
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                width={60}
                orientation="left"
                yAxisId="price"
                allowDecimals={true}
                scale="linear"
                type="number"
                tick={{ fontSize: 12 }}
              domain={[
                (dataMin: number) => {
                  // Find the minimum of low values
                  const minValues = combinedData.map(item => item.low);
                  const minPrice = Math.min(...minValues);
                  
                  // Calculate a percentage-based buffer based on price range
                  const maxValues = combinedData.map(item => item.high);
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
                (dataMax: number) => {
                  // Find the maximum of high values
                  const maxValues = combinedData.map(item => item.high);
                  const maxPrice = Math.max(...maxValues);
                  
                  // Calculate a percentage-based buffer based on price range
                  const minValues = combinedData.map(item => item.low);
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
            
            {/* RSI Y-Axis (Right) */}
              <YAxis 
                domain={[0, 100]}
                ticks={[0, 30, 50, 70, 100]}
                tick={{ fontSize: 12 }}
                width={30}
                yAxisId="rsi"
              orientation="right"
              />
            
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const rsiCategory = getRSICategory(data.rsi);
                    let rsiStatus = '';
                    
                    if (rsiCategory === 'overbought') {
                      rsiStatus = 'Overbought';
                    } else if (rsiCategory === 'oversold') {
                      rsiStatus = 'Oversold';
                    } else {
                      rsiStatus = 'Neutral';
                    }
                    
                    return (
                      <div className="custom-tooltip bg-background border border-border p-3 rounded shadow-md">
                        <p className="font-semibold">{formatTooltipDate(data.dateString)}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-sm">
                        {data.open !== undefined && (
                          <>
                            <div>Open:</div>
                            <div className="text-right">{formatValue(data.open)}</div>
                            <div>High:</div>
                            <div className="text-right">{formatValue(data.high)}</div>
                            <div>Low:</div>
                            <div className="text-right">{formatValue(data.low)}</div>
                            <div>Close:</div>
                            <div className="text-right">{formatValue(data.close)}</div>
                          </>
                        )}
                          <div>RSI (14):</div>
                          <div className="text-right">{data.rsi.toFixed(2)}</div>
                          <div>Status:</div>
                          <div 
                            className={cn(
                              "text-right font-medium",
                              rsiCategory === 'overbought' ? "text-red-500" : 
                              rsiCategory === 'oversold' ? "text-green-500" : 
                              "text-gray-500"
                            )}
                          >
                            {rsiStatus}
                          </div>
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
              iconSize={10}
              wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }}
              height={20}
              margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
            />
              
              {/* RSI reference lines */}
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" yAxisId="rsi" />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" yAxisId="rsi" />
              <ReferenceLine y={50} stroke="#6b7280" strokeDasharray="3 3" yAxisId="rsi" />
            
            {/* Up candles - when close >= open */}
            <Bar
              dataKey={(data) => (data.trend === 'up' ? [data.open, data.close] : [0, 0])}
              fill="#10b981" // Green for up
              stroke="#10b981"
              yAxisId="price"
              barSize={getBarWidth()}
              legendType="none"
            />
            
            {/* Down candles - when close < open */}
            <Bar
              dataKey={(data) => (data.trend === 'down' ? [data.open, data.close] : [0, 0])}
              fill="#ef4444" // Red for down
              stroke="#ef4444"
              yAxisId="price"
              barSize={getBarWidth()}
              legendType="none"
            />
            
            {/* High-low vertical line */}
            <Bar
              dataKey="high"
              fill="transparent"
              stroke="transparent"
              isAnimationActive={false}
              yAxisId="price"
              barSize={getBarWidth()}
              legendType="none"
            />
            <Bar
              dataKey="low"
              fill="transparent"
              stroke="transparent"
              isAnimationActive={false}
              yAxisId="price"
              barSize={getBarWidth()}
              legendType="none"
            />
              
              {/* RSI line */}
              <Line
                type="monotone"
                dataKey="rsi"
              stroke="#8b5cf6" // Purple for RSI line
              dot={false}
                strokeWidth={2}
                yAxisId="rsi"
                name="RSI (14)"
              />
              
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
export default RSIChart; 
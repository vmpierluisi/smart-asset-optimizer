import React, { useEffect, useState, useRef } from 'react';
import { MACDData } from '@/utils/twelveDataUtils';
import {
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Brush,
  ReferenceLine
} from 'recharts';
import { fetchTimeSeries, TimeSeriesData } from '@/utils/twelveDataUtils';
import { cn } from "@/lib/utils";

interface MACDChartProps {
  data: MACDData;
  onTimeframeChange?: (timeframe: string) => void;
  timeframe?: string;
}

// Explicitly export the component
export const MACDChart: React.FC<MACDChartProps> = ({ 
  data, 
  onTimeframeChange,
  timeframe = "3M" 
}) => {
  const [priceData, setPriceData] = useState<TimeSeriesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [combinedData, setCombinedData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(timeframe);
  const previousDataRef = useRef<{
    data: MACDData | null;
    timeframe: string;
  }>({
    data: null,
    timeframe: timeframe
  });

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
    

    // Create maps of dates to MACD values
    const macdMap = new Map();
    const macdSignalMap = new Map();
    const macdHistMap = new Map();
    
    // Process MACD data
    if (data.values && Array.isArray(data.values) && data.values.length > 0) {
      data.values.forEach(item => {
        // Extract just the date part from datetime
        const dateStr = item.datetime.split(' ')[0];
        macdMap.set(dateStr, parseFloat(item.macd));
        macdSignalMap.set(dateStr, parseFloat(item.macd_signal));
        macdHistMap.set(dateStr, parseFloat(item.macd_hist));
      });
    } else {
      console.error('No MACD values in data:', data);
      setError('No MACD data available');
      return;
    }

    // Combine price data with MACD data
    const combined = priceData.data.map(pricePoint => {
      const date = pricePoint.date;
      const macd = macdMap.get(date);
      const macdSignal = macdSignalMap.get(date);
      const macdHist = macdHistMap.get(date);
      
      return {
        date,
        dateString: date, // For tooltip consistency
        open: pricePoint.open,
        high: pricePoint.high,
        low: pricePoint.low,
        close: pricePoint.close,
        volume: pricePoint.volume,
        macd,
        macdSignal,
        macdHist,
        // For histogram coloring
        histColor: macdHist >= 0 ? "#10b981" : "#ef4444" // Green for positive, red for negative
      };
    }).filter(item => item.macd !== null && item.macd !== undefined);

    
    if (combined.length === 0) {
      setError('No matching data between price and MACD');
      return;
    }
    
    setCombinedData(combined);
  }, [data, priceData, isLoading, selectedTimeframe]);

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

  // Format MACD values
  const formatMACDValue = (value: number) => {
    return value.toFixed(2);
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

  // Calculate min/max for MACD values to set Y-axis domain
  const getMACD_YAxisDomain = () => {
    if (!combinedData || combinedData.length === 0) return [0, 0];
    
    // Collect all MACD related values
    const allValues = combinedData.flatMap(item => [
      item.macd, 
      item.macdSignal, 
      item.macdHist
    ].filter(val => val !== undefined && val !== null));
    
    if (allValues.length === 0) return [0, 0];
    
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    
    // Add some padding (10%)
    const padding = Math.max(Math.abs(max - min) * 0.1, 0.5);
    return [Math.floor(min - padding), Math.ceil(max + padding)];
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
          >
            <XAxis 
              dataKey="dateString"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
              minTickGap={30}
              interval={getTickInterval()}
            />
            <YAxis 
              tickFormatter={formatMACDValue}
              width={40}
              orientation="right"
              domain={getMACD_YAxisDomain()}
              allowDecimals={true}
              scale="linear"
              type="number"
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="custom-tooltip bg-background border border-border p-3 rounded shadow-md">
                      <p className="font-semibold">{formatTooltipDate(data.dateString)}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-sm">
                        <div>MACD:</div>
                        <div className="text-right">{formatMACDValue(data.macd)}</div>
                        <div>Signal:</div>
                        <div className="text-right">{formatMACDValue(data.macdSignal)}</div>
                        <div>Histogram:</div>
                        <div className="text-right">{formatMACDValue(data.macdHist)}</div>
                        <div>Price:</div>
                        <div className="text-right">${data.close.toFixed(2)}</div>
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
            
            {/* Zero reference line */}
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
            
            {/* MACD Histogram - Positive values */}
            <Bar
              dataKey={(data) => (data.macdHist >= 0 ? data.macdHist : 0)}
              name="Histogram (Bullish)"
              fill="#10b981" // Green for positive (bullish)
              fillOpacity={selectedTimeframe === '6M' ? 1 : undefined}
              barSize={selectedTimeframe === '6M' ? 6 : 4}
              isAnimationActive={false}
            />
            
            {/* MACD Histogram - Negative values */}
            <Bar
              dataKey={(data) => (data.macdHist < 0 ? data.macdHist : 0)}
              name="Histogram (Bearish)"
              fill="#ef4444" // Red for negative (bearish)
              fillOpacity={selectedTimeframe === '6M' ? 1 : undefined}
              barSize={selectedTimeframe === '6M' ? 6 : 4}
              isAnimationActive={false}
            />
            
            {/* MACD Line */}
            <Line
              type="monotone"
              dataKey="macd"
              stroke="#0ea5e9" // Blue color for MACD line
              name="MACD"
              dot={false}
              strokeWidth={2}
              connectNulls={true}
            />
            
            {/* MACD Signal Line */}
            <Line
              type="monotone"
              dataKey="macdSignal"
              stroke="#f97316" // Orange color for signal line
              name="Signal"
              dot={false}
              strokeWidth={2}
              connectNulls={true}
            />
            
            {/* Brush for timeframe navigation */}
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
export default MACDChart; 
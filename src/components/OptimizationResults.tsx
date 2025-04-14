import React, { useMemo, useState } from 'react';
import { LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { Group } from '@visx/group';
import { Tooltip, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { bisector } from 'd3-array';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { useResizeObserver } from '../hooks/useResizeObserver';
import { PortfolioAnalysis } from './PortfolioAnalysis';
import { usePortfolioAnalysis } from '@/hooks/usePortfolioAnalysis';
import { usePortfolioAnalysisParsed } from '@/hooks/usePortfolioAnalysisParsed';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AIExplanationPopup } from '@/components/AIExplanationPopup';
import { Cpu } from 'lucide-react';

interface HistoricalData {
  date: Date;
  value: number;
  benchmarks: { [symbol: string]: number };
}

interface OptimizationResultsProps {
  results: {
    weights: { [key: string]: number };
    allocations: { [key: string]: number };
    metrics: {
      expectedReturn: number;
      volatility: number;
      var: number;
      es: number;
    };
    historicalData: HistoricalData[];
    benchmarkSymbols: string[];
  };
}

// Benchmark colors for different indices
const BENCHMARK_COLORS: { [key: string]: string } = {
  "SPY": "#64748B", // Slate
  "DIA": "#0369A1", // Sky
  "QQQ": "#6D28D9", // Violet
  "FEZ": "#0E7490", // Cyan
  "STOXX": "#0891B2", // Teal
  "URTH": "#1D4ED8", // Blue
};

const COLORS = [
  '#059669', '#0EA5E9', '#8B5CF6', '#EC4899', '#F59E0B',
  '#10B981', '#3B82F6', '#6366F1', '#D946EF', '#F97316'
];

const getBenchmarkName = (symbol: string): string => {
  switch (symbol) {
    case "SPY": return "S&P 500";
    case "DIA": return "DOW Jones";
    case "QQQ": return "Nasdaq";
    case "FEZ": return "Euro Stoxx 50";
    case "STOXX": return "Euro Stoxx 600";
    case "URTH": return "MSCI World Index";
    default: return symbol;
  }
};

const bisectDate = bisector<HistoricalData, Date>((d) => d.date).left;

export const OptimizationResults: React.FC<OptimizationResultsProps> = ({ results }) => {
  const { analyzePortfolio, isAnalyzing, error } = usePortfolioAnalysis();
  
  // AI Explanation Popup state
  const [showAIExplanation, setShowAIExplanation] = useState({
    isOpen: false,
    title: '',
    cardContext: null as any,
    section: ''
  });
  
  // Handle AI explanation popup
  const handleAIExplanationOpen = (title: string, section: string, cardData: any) => {
    setShowAIExplanation({
      isOpen: true,
      title,
      cardContext: cardData,
      section
    });
    
    // Still analyze the portfolio when opening the AI explanation, but without showing toasters
    analyzePortfolio(results);
  };

  const handleAIExplanationClose = () => {
    setShowAIExplanation({
      ...showAIExplanation,
      isOpen: false
    });
  };

  // Create section tags for the AI chat
  const availableSections = {
    performance: {
      id: "performance",
      name: "Performance",
      getContext: () => ({
        portfolioData: results.historicalData.map(d => ({
          date: d.date.toISOString().split('T')[0],
          value: d.value
        })),
        benchmarkSymbols: results.benchmarkSymbols,
        benchmarkData: results.benchmarkSymbols.reduce((acc, symbol) => {
          acc[symbol] = results.historicalData.map(d => d.benchmarks[symbol]);
          return acc;
        }, {} as Record<string, number[]>)
      })
    },
    metrics: {
      id: "metrics",
      name: "Metrics",
      getContext: () => ({
        expectedReturn: results.metrics.expectedReturn,
        volatility: results.metrics.volatility,
        var: results.metrics.var,
        es: results.metrics.es
      })
    },
    allocation: {
      id: "allocation",
      name: "Allocation",
      getContext: () => ({
        weights: results.weights,
        allocations: results.allocations
      })
    }
  };

  const [tooltipData, setTooltipData] = React.useState<HistoricalData | null>(null);
  const [tooltipLeft, setTooltipLeft] = React.useState<number | null>(null);
  const [tooltipTop, setTooltipTop] = React.useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dimensions = useResizeObserver(containerRef);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  
  const formatPercent = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 }).format(value);

  const formatCurrencyK = (value: number) => 
    (value / 1000).toFixed(1);

  const pieData = useMemo(() => {
    return Object.entries(results.weights).map(([symbol, weight]) => ({
      name: symbol,
      value: weight,
      amount: results.allocations[symbol]
    }));
  }, [results.weights, results.allocations]);

  const margin = { top: 20, right: 20, bottom: 80, left: 60 };
  const width = dimensions?.width ?? 600;
  const height = 400;

  const xScale = useMemo(
    () => scaleTime<number>({
      domain: [
        Math.min(...results.historicalData.map(d => d.date.getTime())),
        Math.max(...results.historicalData.map(d => d.date.getTime())),
      ],
      range: [margin.left, width - margin.right],
    }),
    [results.historicalData, width, margin]
  );

  // Calculate the min and max for all benchmarks and portfolio
  const allValues = results.historicalData.flatMap(d => {
    const benchmarkValues = Object.values(d.benchmarks);
    return [d.value, ...benchmarkValues];
  });

  const yScale = useMemo(
    () => scaleLinear<number>({
      domain: [
        Math.min(...allValues),
        Math.max(...allValues),
      ],
      range: [height - margin.bottom, margin.top],
    }),
    [allValues, height, margin]
  );

  const handleTooltip = React.useCallback(
    (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
      const { x } = localPoint(event) || { x: 0 };
      const x0 = xScale.invert(x);
      const index = bisectDate(results.historicalData, x0, 1);
      const d0 = results.historicalData[index - 1];
      const d1 = results.historicalData[index];
      const d = x0.valueOf() - d0.date.valueOf() > d1.date.valueOf() - x0.valueOf() ? d1 : d0;
      setTooltipData(d);
      setTooltipLeft(xScale(d.date));
      setTooltipTop(yScale(d.value));
    },
    [xScale, yScale, results.historicalData]
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-emerald-600">{formatPercent(data.value)}</p>
          <p className="text-gray-600">{formatCurrency(data.amount)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 w-full flex-grow">
      {/* Main Chart Section */}
      <div className="bg-white rounded-xl shadow-sm p-[30px]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold">Portfolio Performance</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleAIExplanationOpen(
              "Portfolio Performance", 
              "performance", 
              availableSections.performance.getContext()
            )}
            className="h-8 w-8 rounded-full"
          >
            <Cpu className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Comparing your optimized portfolio against selected benchmarks
        </p>
        <div ref={containerRef} className="w-full h-[350px] sm:h-[400px] md:h-[500px] lg:h-[550px] relative" style={{ minHeight: '300px' }}>
          <svg width={width} height={height}>
            <Group>
              <GridRows
                scale={yScale}
                width={width - margin.left - margin.right}
                left={margin.left}
                stroke="#e0e0e0"
                strokeWidth={0.5}
                strokeOpacity={0.8}
              />
              
              <AxisLeft 
                scale={yScale} 
                left={margin.left} 
                label="Portfolio Value ($K)"
                labelOffset={40}
                tickFormat={formatCurrencyK}
                labelProps={{
                  fill: '#374151',
                  textAnchor: 'middle',
                  fontSize: 12,
                  fontFamily: 'sans-serif'
                }}
              />
              
              <AxisBottom 
                scale={xScale} 
                top={height - margin.bottom}
              />
              
              {/* Portfolio line */}
              <LinePath
                data={results.historicalData}
                x={d => xScale(d.date)}
                y={d => yScale(d.value)}
                stroke="#059669"
                strokeWidth={2}
                curve={curveMonotoneX}
              />
              
              {/* Benchmark lines */}
              {results.benchmarkSymbols.map((symbol, index) => (
                <LinePath
                  key={symbol}
                  data={results.historicalData}
                  x={d => xScale(d.date)}
                  y={d => yScale(d.benchmarks[symbol])}
                  stroke={BENCHMARK_COLORS[symbol] || '#64748B'}
                  strokeWidth={1.5}
                  curve={curveMonotoneX}
                />
              ))}

              {/* Legend */}
              <Group transform={`translate(${Math.max(10, width / 2 - (results.benchmarkSymbols.length * 50))}, ${height - 30})`}>
                <text x={15} y={0} dy="1em" fontSize={12} fill="#059669">Portfolio</text>
                <line x1={0} y1={12} x2={10} y2={12} stroke="#059669" strokeWidth={2} />
                
                {results.benchmarkSymbols.map((symbol, index) => (
                  <g key={symbol}>
                    <text 
                      x={15 + (index + 1) * Math.min(100, Math.max(60, width / (results.benchmarkSymbols.length + 1)))} 
                      y={0} 
                      dy="1em" 
                      fontSize={12} 
                      fill={BENCHMARK_COLORS[symbol] || '#64748B'}
                    >
                      {width < 500 ? symbol : getBenchmarkName(symbol)}
                    </text>
                    <line 
                      x1={(index + 1) * Math.min(100, Math.max(60, width / (results.benchmarkSymbols.length + 1)))} 
                      y1={12} 
                      x2={(index + 1) * Math.min(100, Math.max(60, width / (results.benchmarkSymbols.length + 1))) + 10} 
                      y2={12} 
                      stroke={BENCHMARK_COLORS[symbol] || '#64748B'} 
                      strokeWidth={1.5} 
                    />
                  </g>
                ))}
              </Group>

              <rect
                width={width - margin.left - margin.right}
                height={height - margin.top - margin.bottom}
                x={margin.left}
                y={margin.top}
                fill="transparent"
                onTouchStart={handleTooltip}
                onTouchMove={handleTooltip}
                onMouseMove={handleTooltip}
                onMouseLeave={() => {
                  setTooltipData(null);
                  setTooltipLeft(null);
                  setTooltipTop(null);
                }}
              />
              
              {tooltipData && (
                <g>
                  <line
                    x1={tooltipLeft}
                    x2={tooltipLeft}
                    y1={margin.top}
                    y2={height - margin.bottom}
                    stroke="#374151"
                    strokeWidth={1}
                    strokeDasharray="4,4"
                    pointerEvents="none"
                  />
                  <circle
                    cx={tooltipLeft}
                    cy={tooltipTop}
                    r={4}
                    fill="#059669"
                    stroke="white"
                    strokeWidth={2}
                    pointerEvents="none"
                  />
                  {results.benchmarkSymbols.map(symbol => (
                    <circle
                      key={symbol}
                      cx={tooltipLeft}
                      cy={yScale(tooltipData.benchmarks[symbol])}
                      r={3}
                      fill={BENCHMARK_COLORS[symbol] || '#64748B'}
                      stroke="white"
                      strokeWidth={1.5}
                      pointerEvents="none"
                    />
                  ))}
                </g>
              )}
            </Group>
          </svg>
          
          {tooltipData && tooltipLeft != null && tooltipTop != null && (
            <Tooltip
              top={tooltipTop - 12}
              left={tooltipLeft + 12}
              style={{
                ...defaultStyles,
                backgroundColor: 'white',
                color: '#374151',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                padding: '0.5rem',
                fontSize: '0.8rem',
                borderRadius: '0.25rem',
              }}
            >
              <div>
                <div className="text-xs text-gray-500">
                  {tooltipData.date.toLocaleDateString()}
                </div>
                <div className="font-semibold text-emerald-600">
                  Portfolio: {formatCurrency(tooltipData.value)}
                </div>
                {results.benchmarkSymbols.map(symbol => (
                  <div key={symbol} className="text-xs" style={{ color: BENCHMARK_COLORS[symbol] || '#64748B' }}>
                    {getBenchmarkName(symbol)}: {formatCurrency(tooltipData.benchmarks[symbol])}
                  </div>
                ))}
              </div>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Key Metrics Card */}
      <div className="bg-white rounded-xl shadow-sm p-[30px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Key Metrics</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleAIExplanationOpen(
              "Key Metrics", 
              "metrics", 
              availableSections.metrics.getContext()
            )}
            className="h-8 w-8 rounded-full"
          >
            <Cpu className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-600">Expected Daily Return</span>
            <span className={`font-mono font-medium ${results.metrics.expectedReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatPercent(results.metrics.expectedReturn)}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-600">Volatility</span>
            <span className="font-mono text-gray-800 font-medium">
              {formatCurrency(results.metrics.volatility)}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-600">Value at Risk (95%)</span>
            <span className="font-mono text-red-600 font-medium">
              {formatCurrency(Math.abs(results.metrics.var))}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-600">Expected Shortfall</span>
            <span className="font-mono text-red-600 font-medium">
              {formatCurrency(Math.abs(results.metrics.es))}
            </span>
          </div>
        </div>
      </div>

      {/* Asset Allocation Card */}
      <div className="bg-white rounded-xl shadow-sm p-[30px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Asset Allocation</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleAIExplanationOpen(
              "Asset Allocation", 
              "allocation", 
              availableSections.allocation.getContext()
            )}
            className="h-8 w-8 rounded-full"
          >
            <Cpu className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/2 h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="lg:w-1/2 space-y-2">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{entry.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-emerald-600">{formatPercent(entry.value)}</div>
                  <div className="font-mono text-gray-600 text-xs">{formatCurrency(entry.amount)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Explanation Popup */}
      <AIExplanationPopup
        isOpen={showAIExplanation.isOpen}
        onClose={handleAIExplanationClose}
        title={showAIExplanation.title}
        cardContext={showAIExplanation.cardContext}
        section={showAIExplanation.section}
        availableSections={availableSections}
      />
    </div>
  );
};

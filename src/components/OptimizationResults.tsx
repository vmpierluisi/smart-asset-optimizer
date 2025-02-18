
import React, { useMemo } from 'react';
import { LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { Group } from '@visx/group';
import { Tooltip, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { bisector } from 'd3-array';

interface HistoricalData {
  date: Date;
  value: number;
  benchmark: number;
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
  };
}

const bisectDate = bisector<HistoricalData, Date>((d) => d.date).left;

export const OptimizationResults: React.FC<OptimizationResultsProps> = ({ results }) => {
  const [tooltipData, setTooltipData] = React.useState<HistoricalData | null>(null);
  const [tooltipLeft, setTooltipLeft] = React.useState<number | null>(null);
  const [tooltipTop, setTooltipTop] = React.useState<number | null>(null);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  
  const formatPercent = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 }).format(value);

  // Chart dimensions
  const width = 600;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 50, left: 60 };

  // Create scales
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

  const yScale = useMemo(
    () => scaleLinear<number>({
      domain: [
        Math.min(...results.historicalData.map(d => Math.min(d.value, d.benchmark))),
        Math.max(...results.historicalData.map(d => Math.max(d.value, d.benchmark))),
      ],
      range: [height - margin.bottom, margin.top],
    }),
    [results.historicalData, height, margin]
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

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Portfolio Metrics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Expected Return:</span>
              <span className="font-mono">{formatPercent(results.metrics.expectedReturn)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Volatility:</span>
              <span className="font-mono">{formatPercent(results.metrics.volatility)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Value at Risk (95%):</span>
              <span className="font-mono">{formatPercent(results.metrics.var)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expected Shortfall:</span>
              <span className="font-mono">{formatPercent(results.metrics.es)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Optimal Allocations</h3>
          <div className="space-y-2">
            {Object.entries(results.allocations).map(([symbol, amount]) => (
              <div key={symbol} className="flex justify-between">
                <span className="text-gray-600">{symbol}:</span>
                <div className="flex gap-4">
                  <span className="font-mono">{formatPercent(results.weights[symbol])}</span>
                  <span className="font-mono">{formatCurrency(amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 bg-white rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Portfolio Performance</h3>
        <div style={{ position: 'relative' }}>
          <svg width={width} height={height}>
            <Group>
              <GridRows
                scale={yScale}
                width={width - margin.left - margin.right}
                left={margin.left}
                strokeDasharray="3,3"
                stroke="#e0e0e0"
              />
              <GridColumns
                scale={xScale}
                height={height - margin.top - margin.bottom}
                top={margin.top}
                strokeDasharray="3,3"
                stroke="#e0e0e0"
              />
              
              <AxisLeft 
                scale={yScale} 
                left={margin.left} 
                label="Portfolio Value ($)"
                labelOffset={40}
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
                label="Date"
                labelOffset={35}
                labelProps={{
                  fill: '#374151',
                  textAnchor: 'middle',
                  fontSize: 12,
                  fontFamily: 'sans-serif'
                }}
              />
              
              <LinePath
                data={results.historicalData}
                x={d => xScale(d.date)}
                y={d => yScale(d.value)}
                stroke="#059669"
                strokeWidth={2}
                curve={curveMonotoneX}
              />
              
              <LinePath
                data={results.historicalData}
                x={d => xScale(d.date)}
                y={d => yScale(d.benchmark)}
                stroke="#64748B"
                strokeWidth={2}
                strokeDasharray="4,4"
                curve={curveMonotoneX}
              />

              {/* Legend */}
              <Group transform={`translate(${width - 120}, ${margin.top})`}>
                <text x={15} y={0} dy="1em" fontSize={12} fill="#059669">Portfolio</text>
                <line x1={0} y1={12} x2={10} y2={12} stroke="#059669" strokeWidth={2} />
                
                <text x={15} y={20} dy="1em" fontSize={12} fill="#64748B">Benchmark</text>
                <line x1={0} y1={32} x2={10} y2={32} stroke="#64748B" strokeWidth={2} strokeDasharray="4,4" />
              </Group>

              {/* Tooltip overlay */}
              <rect
                width={width - margin.left - margin.right}
                height={height - margin.top - margin.bottom}
                x={margin.left}
                y={margin.top}
                fill="transparent"
                onTouchStart={handleTooltip}
                onTouchMove={handleTooltip}
                onMouseMove={handleTooltip}
                onMouseLeave={() => setTooltipData(null)}
              />
            </Group>
          </svg>

          {tooltipData && tooltipLeft != null && tooltipTop != null && (
            <Tooltip
              top={tooltipTop - 12}
              left={tooltipLeft + 12}
              style={{
                ...defaultStyles,
                background: 'white',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            >
              <div className="text-sm">
                <div className="font-medium">
                  {tooltipData.date.toLocaleDateString()}
                </div>
                <div className="text-emerald-600">
                  Portfolio: {formatCurrency(tooltipData.value)}
                </div>
                <div className="text-gray-600">
                  Benchmark: {formatCurrency(tooltipData.benchmark)}
                </div>
              </div>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};

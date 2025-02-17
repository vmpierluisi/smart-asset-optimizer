
import React from 'react';
import { AreaClosed, Line } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { Group } from '@visx/group';

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

export const OptimizationResults: React.FC<OptimizationResultsProps> = ({ results }) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  
  const formatPercent = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 }).format(value);

  // Chart dimensions
  const width = 600;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };

  // Create scales
  const xScale = scaleTime({
    domain: [
      Math.min(...results.historicalData.map(d => d.date.getTime())),
      Math.max(...results.historicalData.map(d => d.date.getTime())),
    ],
    range: [margin.left, width - margin.right],
  });

  const yScale = scaleLinear({
    domain: [
      Math.min(...results.historicalData.map(d => Math.min(d.value, d.benchmark))),
      Math.max(...results.historicalData.map(d => Math.max(d.value, d.benchmark))),
    ],
    range: [height - margin.bottom, margin.top],
  });

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
            <AxisLeft scale={yScale} left={margin.left} />
            <AxisBottom scale={xScale} top={height - margin.bottom} />
            
            <AreaClosed
              data={results.historicalData}
              x={(d: HistoricalData) => xScale(d.date)}
              y={(d: HistoricalData) => yScale(d.value)}
              yScale={yScale}
              curve={curveMonotoneX}
              fill="rgba(5, 150, 105, 0.1)"
            />
            
            <Line
              data={results.historicalData}
              x={(d: HistoricalData) => xScale(d.date)}
              y={(d: HistoricalData) => yScale(d.value)}
              stroke="#059669"
              strokeWidth={2}
              curve={curveMonotoneX}
            />

            <Line
              data={results.historicalData}
              x={(d: HistoricalData) => xScale(d.date)}
              y={(d: HistoricalData) => yScale(d.benchmark)}
              stroke="#64748B"
              strokeWidth={2}
              strokeDasharray="4,4"
              curve={curveMonotoneX}
            />
          </Group>
        </svg>
      </div>
    </div>
  );
};

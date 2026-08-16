import React from 'react';
import MovingAverageChart, { type MovingAverageChartProps } from './MovingAverageChart';

// Thin wrapper: Exponential Moving Average view of the shared MovingAverageChart.
export const EMAChart: React.FC<Omit<MovingAverageChartProps, 'maLabel'>> = (props) => (
  <MovingAverageChart {...props} maLabel="EMA" />
);

export default EMAChart;

import React from 'react';
import MovingAverageChart, { type MovingAverageChartProps } from './MovingAverageChart';

// Thin wrapper: Simple Moving Average view of the shared MovingAverageChart.
export const SMAChart: React.FC<Omit<MovingAverageChartProps, 'maLabel'>> = (props) => (
  <MovingAverageChart {...props} maLabel="SMA" />
);

export default SMAChart;

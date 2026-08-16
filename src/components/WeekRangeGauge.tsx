import PriceRangeGauge from './PriceRangeGauge'; // Import the base gauge

interface WeekRangeGaugeProps {
  low: number;
  high: number;
  current: number;
}

// Week range gauge component using PriceRangeGauge
const WeekRangeGauge = ({ low, high, current }: WeekRangeGaugeProps): JSX.Element => {
  return (
    <PriceRangeGauge 
      low={low} 
      high={high} 
      current={current} 
      label="52-Week Range" 
      height="h-1.5" // Slightly smaller height
    />
  );
};

export default WeekRangeGauge;

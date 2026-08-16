import { LineChart } from 'lucide-react';

// Mock chart component - useful as a placeholder
const MockChart = ({ type, height = 200 }: { type: string, height?: number }) => {
  return (
    <div 
      className="w-full rounded-md border border-dashed flex items-center justify-center"
      style={{ height: `${height}px` }}
    >
      <div className="text-muted-foreground flex flex-col items-center">
        <LineChart className="h-8 w-8 mb-2" />
        <span>{type} Chart</span>
      </div>
    </div>
  );
};

export default MockChart;

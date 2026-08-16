
interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  label: string;
}

const GaugeChart = ({ value, min = 0, max = 100, label }: GaugeChartProps) => {
  // Ensure value is within min/max range
  const boundedValue = Math.min(Math.max(value, min), max);

  // Sentiment status logic (copied from your original)
  const getSentimentStatus = () => {
    if (boundedValue < 30) {
      return {
        text: "Negative",
        color: "text-red-700",
        bgColor: "bg-red-100",
        borderColor: "border-red-300"
      };
    }
    if (boundedValue > 70) {
      return {
        text: "Positive",
        color: "text-green-700",
        bgColor: "bg-green-100",
        borderColor: "border-green-300"
      };
    }
    return {
      text: "Neutral",
      color: "text-amber-700",
      bgColor: "bg-amber-100",
      borderColor: "border-amber-300"
    };
  };

  const sentimentStatus = getSentimentStatus();

  return (
    <div className="flex flex-col items-center justify-center py-3">
      <div
        className="text-4xl font-bold mb-2"
        style={{
          color:
            boundedValue < 30
              ? "#dc2626"
              : boundedValue > 70
              ? "#16a34a"
              : "#d97706"
        }}
      >
        {value.toFixed(1)}
      </div>
      <div className="text-sm text-muted-foreground mb-3">{label}</div>
      <div
        className={`px-3 py-1 rounded-full text-sm border ${sentimentStatus.bgColor} ${sentimentStatus.color} ${sentimentStatus.borderColor}`}
      >
        {sentimentStatus.text}
      </div>
      <div className="w-40 h-1 bg-gray-200 rounded-full relative mt-4">
        <div className="absolute inset-0 flex">
          <div className="w-[30%] h-full bg-red-500 rounded-l-full"></div>
          <div className="w-[40%] h-full bg-amber-500"></div>
          <div className="w-[30%] h-full bg-green-500 rounded-r-full"></div>
        </div>
        <div
          className="absolute top-0 w-1 h-3 bg-black rounded-full -mt-1"
          style={{
            left: `${((boundedValue - min) / (max - min)) * 100}%`,
            transform: "translateX(-50%)"
          }}
        ></div>
      </div>
    </div>
  );
};

export default GaugeChart;

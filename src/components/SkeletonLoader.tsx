
// Simple skeleton loader component
const SkeletonLoader = ({ className = '', count = 1 }: { className?: string, count?: number }) => {
  return (
    <>
      {Array(count).fill(0).map((_, index) => (
        <div key={index} className={`animate-pulse bg-muted rounded ${className}`}></div>
      ))}
    </>
  );
};

export default SkeletonLoader;

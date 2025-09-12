import React, { memo, useMemo, useCallback } from 'react';

// Performance optimization hook
export const useOptimizedData = <T,>(data: T[], dependencies: any[]) => {
  return useMemo(() => data, dependencies);
};

// Optimized card component with memoization
export const OptimizedCard = memo<{
  title: string;
  value: string | number;
  trend?: number;
  icon?: React.ReactNode;
  className?: string;
}>(({ title, value, trend, icon, className }) => {
  return (
    <div className={`optimize-rendering ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon}
      </div>
      <div className="mt-2">
        <span className="text-2xl font-bold">{value}</span>
        {trend !== undefined && (
          <span className={`ml-2 text-sm ${trend >= 0 ? 'text-income' : 'text-expense'}`}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
});

OptimizedCard.displayName = 'OptimizedCard';

// Virtualized list component for large datasets
export const VirtualizedList = memo<{
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemHeight?: number;
  maxHeight?: number;
}>(({ items, renderItem, itemHeight = 60, maxHeight = 400 }) => {
  const [startIndex, setStartIndex] = React.useState(0);
  const [endIndex, setEndIndex] = React.useState(Math.ceil(maxHeight / itemHeight));

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const newStartIndex = Math.floor(scrollTop / itemHeight);
    const newEndIndex = newStartIndex + Math.ceil(maxHeight / itemHeight);
    
    setStartIndex(newStartIndex);
    setEndIndex(Math.min(newEndIndex, items.length));
  }, [itemHeight, maxHeight, items.length]);

  return (
    <div 
      className="overflow-auto gpu-accelerated" 
      style={{ maxHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${startIndex * itemHeight}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

// Debounced search hook
export const useDebouncedValue = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Intersection observer hook for lazy loading
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
};
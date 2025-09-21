import { useCallback, useRef, useMemo, useEffect, useState } from 'react';

// Cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

// Simple in-memory cache
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const globalCache = new MemoryCache(200);

// Debounce hook
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
};

// Throttle hook
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;
    
    if (timeSinceLastCall >= delay) {
      lastCallRef.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]) as T;
};

// Memoized calculation hook with cache
export const useMemoizedCalculation = <T>(
  calculationFn: () => T,
  dependencies: any[],
  cacheKey?: string,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
): T => {
  return useMemo(() => {
    if (cacheKey) {
      const cached = globalCache.get<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }
    
    const result = calculationFn();
    
    if (cacheKey) {
      globalCache.set(cacheKey, result, ttl);
    }
    
    return result;
  }, dependencies);
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  const startTime = useRef<number>(0);
  
  useEffect(() => {
    startTime.current = performance.now();
    renderCount.current += 1;
  });
  
  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    renderTimes.current.push(renderTime);
    
    // Keep only last 50 render times
    if (renderTimes.current.length > 50) {
      renderTimes.current = renderTimes.current.slice(-50);
    }
    
    // Log performance issues
    if (renderTime > 16) { // 60fps = 16.67ms per frame
      console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms`);
    }
  });
  
  const getStats = useCallback(() => {
    const times = renderTimes.current;
    if (times.length === 0) return null;
    
    const sum = times.reduce((a, b) => a + b, 0);
    const avg = sum / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);
    
    return {
      componentName,
      renderCount: renderCount.current,
      averageRenderTime: avg,
      maxRenderTime: max,
      minRenderTime: min,
      recentRenderTimes: times.slice(-10),
    };
  }, [componentName]);
  
  return { getStats };
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  threshold: number = 0.1,
  rootMargin: string = '0px'
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);
        
        if (isVisible && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      { threshold, rootMargin }
    );
    
    const currentTarget = targetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }
    
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [threshold, rootMargin, hasIntersected]);
  
  return { targetRef, isIntersecting, hasIntersected };
};

// Image lazy loading with cache
export const useImageLoader = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    // Check cache first
    const cacheKey = `image-${src}`;
    const cached = globalCache.get<string>(cacheKey);
    
    if (cached) {
      setImageSrc(cached);
      setIsLoading(false);
      return;
    }
    
    // Load image
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      setHasError(false);
      globalCache.set(cacheKey, src, 30 * 60 * 1000); // Cache for 30 minutes
    };
    
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      if (placeholder) {
        setImageSrc(placeholder);
      }
    };
    
    img.src = src;
  }, [src, placeholder]);
  
  return { imageSrc, isLoading, hasError };
};

// Performance measurement utility
export const measurePerformance = async <T>(
  name: string,
  fn: () => T | Promise<T>
): Promise<T> => {
  const start = performance.now();
  
  try {
    const result = await fn();
    const end = performance.now();
    
    console.log(`${name} took ${(end - start).toFixed(2)}ms`);
    
    // Store in performance cache for monitoring
    const cacheKey = `perf-${name}`;
    const existing = globalCache.get<number[]>(cacheKey) || [];
    existing.push(end - start);
    
    // Keep only last 20 measurements
    if (existing.length > 20) {
      existing.splice(0, existing.length - 20);
    }
    
    globalCache.set(cacheKey, existing, 10 * 60 * 1000); // 10 minutes
    
    return result;
  } catch (error) {
    const end = performance.now();
    console.error(`${name} failed after ${(end - start).toFixed(2)}ms:`, error);
    throw error;
  }
};

// Memory usage monitoring
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }
  return null;
};

export default {
  globalCache,
  useDebounce,
  useThrottle,
  useMemoizedCalculation,
  usePerformanceMonitor,
  useIntersectionObserver,
  useImageLoader,
  measurePerformance,
  getMemoryUsage,
};
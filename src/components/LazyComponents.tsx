import { lazy, Suspense, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Lazy loaded components
export const Analytics = lazy(() => import('./Analytics'));
export const Reports = lazy(() => import('./Reports'));
export const Settings = lazy(() => import('./Settings'));
export const BudgetTracker = lazy(() => import('./BudgetTracker'));
export const FinancialGoals = lazy(() => import('./FinancialGoals'));
export const NotificationCenter = lazy(() => import('./NotificationCenter'));
export const CreditCards = lazy(() => import('./CreditCards'));
export const Transactions = lazy(() => import('./Transactions'));
export const Accounts = lazy(() => import('./Accounts'));

// Loading fallback components
export const PageLoadingSkeleton = () => (
  <div className="container-responsive py-6 space-y-6">
    {/* Header skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-[250px]" />
      <Skeleton className="h-4 w-[400px]" />
    </div>
    
    {/* Main content skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-[180px]" />
            <Skeleton className="h-4 w-[120px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export const TableLoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-[200px]" />
      <Skeleton className="h-10 w-[120px]" />
    </div>
    
    <div className="border rounded-lg">
      <div className="p-4 border-b">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[120px]" />
        </div>
      </div>
      
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="p-4 border-b last:border-b-0">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-4 w-[120px]" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const ChartLoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-[180px]" />
      <Skeleton className="h-4 w-[100px]" />
    </div>
    <Skeleton className="h-[300px] w-full rounded-lg" />
    <div className="flex justify-center space-x-4">
      <Skeleton className="h-3 w-[80px]" />
      <Skeleton className="h-3 w-[80px]" />
      <Skeleton className="h-3 w-[80px]" />
    </div>
  </div>
);

export const FormLoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-6 w-[150px]" />
      <Skeleton className="h-4 w-[300px]" />
    </div>
    
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
    
    <div className="flex space-x-2">
      <Skeleton className="h-10 w-[100px]" />
      <Skeleton className="h-10 w-[80px]" />
    </div>
  </div>
);

export const LoadingSpinner = ({ size = 'default', text }: { size?: 'sm' | 'default' | 'lg'; text?: string }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className="flex items-center justify-center p-6">
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
        {text && (
          <p className="text-sm text-muted-foreground">{text}</p>
        )}
      </div>
    </div>
  );
};

// Higher-order component for lazy loading with custom fallback
export const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));
  
  return (props: P) => (
    <Suspense fallback={fallback ? <fallback /> : <PageLoadingSkeleton />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Lazy wrapper component
export const LazyWrapper = ({ 
  children, 
  fallback = <PageLoadingSkeleton /> 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
);

// Pre-loading utility
export const preloadComponent = (componentImport: () => Promise<any>) => {
  // Start loading the component immediately
  const component = componentImport();
  
  // Return a function that returns the component promise
  return () => component;
};

// Preload critical components
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be used soon
  preloadComponent(() => import('./Analytics'));
  preloadComponent(() => import('./Reports'));
  preloadComponent(() => import('./Transactions'));
};

// Route-based code splitting helper
export const createLazyRoute = (importFunc: () => Promise<{ default: ComponentType<any> }>) => {
  return lazy(importFunc);
};

export default {
  Analytics,
  Reports,
  Settings,
  BudgetTracker,
  FinancialGoals,
  NotificationCenter,
  CreditCards,
  Transactions,
  Accounts,
  PageLoadingSkeleton,
  TableLoadingSkeleton,
  ChartLoadingSkeleton,
  FormLoadingSkeleton,
  LoadingSpinner,
  withLazyLoading,
  LazyWrapper,
  preloadComponent,
  preloadCriticalComponents,
  createLazyRoute,
};
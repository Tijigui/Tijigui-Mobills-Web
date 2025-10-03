import { Suspense, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FinancialProvider } from "@/contexts/FinancialContext";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import ErrorBoundary from "@/components/ErrorBoundary";
import { 
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
  preloadCriticalComponents
} from "@/components/LazyComponents";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Create QueryClient with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => {
  // Preload critical components on app startup
  useEffect(() => {
    preloadCriticalComponents();
  }, []);

  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="tijigui-mobills-theme">
          <FinancialProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <SidebarProvider>
                  <div className="min-h-screen flex w-full bg-background">
                    <header className="fixed top-0 left-0 right-0 h-12 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40 px-4">
                      <div className="flex items-center gap-2">
                        <SidebarTrigger className="animate-fade-in" />
                        <h1 className="font-bold text-lg text-primary animate-fade-in">
                          Tijigui Mobills
                        </h1>
                      </div>
                      <ThemeSwitcher />
                    </header>
                    
                    <ErrorBoundary>
                      <AppSidebar />
                    </ErrorBoundary>
                    
                    <main className="flex-1 pt-12 overflow-auto">
                      <ErrorBoundary>
                        <Suspense fallback={<PageLoadingSkeleton />}>
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/accounts" element={<Accounts />} />
                            <Route path="/transactions" element={<Transactions />} />
                            <Route path="/credit-cards" element={<CreditCards />} />
                            <Route path="/goals" element={<FinancialGoals />} />
                            <Route path="/budgets" element={<BudgetTracker />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/notifications" element={<NotificationCenter />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Suspense>
                      </ErrorBoundary>
                    </main>
                  </div>
                </SidebarProvider>
              </BrowserRouter>
            </TooltipProvider>
          </FinancialProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SupabaseFinancialProvider, useFinancial } from "@/contexts/SupabaseFinancialContext";
import Auth from "@/components/Auth";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Accounts from "./components/Accounts";
import Transactions from "./components/Transactions";
import CreditCards from "./components/CreditCards";
import FinancialGoals from "./components/FinancialGoals";
import BudgetTracker from "./components/BudgetTracker";
import Reports from "./components/Reports";
import Analytics from "./components/Analytics";
import NotificationCenter from "./components/NotificationCenter";
import Settings from "./components/Settings";

const queryClient = new QueryClient();

// Component to handle authentication state
const AppContent = () => {
  const { user, loading } = useFinancial();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <BrowserRouter>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <header className="fixed top-0 left-0 right-0 h-12 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40 px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="animate-fade-in" />
              <h1 className="font-bold text-lg text-primary animate-fade-in">FinanceApp</h1>
            </div>
            <ThemeSwitcher />
          </header>
          
          <AppSidebar />
          
          <main className="flex-1 pt-12 overflow-auto">
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
          </main>
        </div>
      </SidebarProvider>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="financial-app-theme">
      <SupabaseFinancialProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </SupabaseFinancialProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

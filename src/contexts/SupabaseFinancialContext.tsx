import React, { createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useFinancialGoals } from '@/hooks/useFinancialGoals';
import { useBudgets } from '@/hooks/useBudgets';
import { Account, Transaction, CreditCard, Category } from '@/types/financial';
import { FinancialGoal, Budget } from '@/types/goals';

interface SupabaseFinancialContextType {
  // Auth
  user: any;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;

  // Accounts
  accounts: Account[];
  accountsLoading: boolean;
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Promise<void>;
  updateAccount: (id: string, account: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  // Transactions
  transactions: Transaction[];
  transactionsLoading: boolean;
  addTransaction: (
    transaction: Omit<Transaction, 'id'>,
    accountId: string,
    categoryId: string
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getMonthlyIncome: () => number;
  getMonthlyExpenses: () => number;

  // Categories
  categories: Category[];
  categoriesLoading: boolean;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Credit Cards
  creditCards: CreditCard[];
  creditCardsLoading: boolean;
  addCreditCard: (card: Omit<CreditCard, 'id'>) => Promise<void>;
  updateCreditCard: (id: string, card: Partial<CreditCard>) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;

  // Financial Goals
  goals: FinancialGoal[];
  goalsLoading: boolean;
  addGoal: (goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'completed'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<FinancialGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Budgets
  budgets: Budget[];
  budgetsLoading: boolean;
  addBudget: (budget: Omit<Budget, 'id' | 'spent'>, categoryId: string) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // Utils
  getTotalBalance: () => number;
}

const SupabaseFinancialContext = createContext<SupabaseFinancialContextType | undefined>(undefined);

export const useFinancial = () => {
  const context = useContext(SupabaseFinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a SupabaseFinancialProvider');
  }
  return context;
};

export const SupabaseFinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const accountsHook = useAccounts();
  const transactionsHook = useTransactions();
  const categoriesHook = useCategories();
  const creditCardsHook = useCreditCards();
  const goalsHook = useFinancialGoals();
  const budgetsHook = useBudgets();

  const getTotalBalance = () => {
    return accountsHook.accounts.reduce((total, account) => total + account.balance, 0);
  };

  const addTransaction = async (
    transactionData: Omit<Transaction, 'id'>,
    accountId: string,
    categoryId: string
  ) => {
    await transactionsHook.addTransaction(
      transactionData,
      accountId,
      categoryId,
      accountsHook.updateAccountBalance
    );
  };

  const deleteTransaction = async (id: string) => {
    await transactionsHook.deleteTransaction(id, accountsHook.updateAccountBalance);
  };

  const value: SupabaseFinancialContextType = {
    // Auth
    user: auth.user,
    loading: auth.loading,
    signUp: auth.signUp,
    signIn: auth.signIn,
    signOut: auth.signOut,

    // Accounts
    accounts: accountsHook.accounts,
    accountsLoading: accountsHook.loading,
    addAccount: accountsHook.addAccount,
    updateAccount: accountsHook.updateAccount,
    deleteAccount: accountsHook.deleteAccount,

    // Transactions
    transactions: transactionsHook.transactions,
    transactionsLoading: transactionsHook.loading,
    addTransaction,
    deleteTransaction,
    getMonthlyIncome: transactionsHook.getMonthlyIncome,
    getMonthlyExpenses: transactionsHook.getMonthlyExpenses,

    // Categories
    categories: categoriesHook.categories,
    categoriesLoading: categoriesHook.loading,
    addCategory: categoriesHook.addCategory,
    updateCategory: categoriesHook.updateCategory,
    deleteCategory: categoriesHook.deleteCategory,

    // Credit Cards
    creditCards: creditCardsHook.creditCards,
    creditCardsLoading: creditCardsHook.loading,
    addCreditCard: creditCardsHook.addCreditCard,
    updateCreditCard: creditCardsHook.updateCreditCard,
    deleteCreditCard: creditCardsHook.deleteCreditCard,

    // Financial Goals
    goals: goalsHook.goals,
    goalsLoading: goalsHook.loading,
    addGoal: goalsHook.addGoal,
    updateGoal: goalsHook.updateGoal,
    deleteGoal: goalsHook.deleteGoal,

    // Budgets
    budgets: budgetsHook.budgets,
    budgetsLoading: budgetsHook.loading,
    addBudget: budgetsHook.addBudget,
    updateBudget: budgetsHook.updateBudget,
    deleteBudget: budgetsHook.deleteBudget,

    // Utils
    getTotalBalance,
  };

  return (
    <SupabaseFinancialContext.Provider value={value}>
      {children}
    </SupabaseFinancialContext.Provider>
  );
};
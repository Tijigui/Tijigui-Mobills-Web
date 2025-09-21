import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { Account, Transaction, CreditCard, Category, DEFAULT_CATEGORIES } from '@/types/financial';
import { FinancialGoal, Budget } from '@/types/goals';
import { useLocalStorage, useLocalStorageWithDates } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';

interface FinancialContextType {
  accounts: Account[];
  transactions: Transaction[];
  creditCards: CreditCard[];
  categories: Category[];
  goals: FinancialGoal[];
  budgets: Budget[];
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  addCreditCard: (card: Omit<CreditCard, 'id'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  deleteTransaction: (id: string) => void;
  addGoal: (goal: Omit<FinancialGoal, 'id'>) => void;
  updateGoal: (id: string, goal: Partial<FinancialGoal>) => void;
  deleteGoal: (id: string) => void;
  addBudget: (budget: Omit<Budget, 'id' | 'spent'>) => void;
  updateBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  updateCreditCard: (id: string, card: Partial<CreditCard>) => void;
  deleteCreditCard: (id: string) => void;
  getTotalBalance: () => number;
  getMonthlyIncome: () => number;
  getMonthlyExpenses: () => number;
  getCategoryExpenses: (categoryId: string, period?: 'month' | 'year') => number;
  getAccountTransactions: (accountId: string) => Transaction[];
  updateTransactionAccount: (transactionId: string, oldAccount: string, newAccount: string, amount: number, type: 'income' | 'expense') => void;
  clearAllData: () => void;
  exportData: () => string;
  importData: (data: string) => boolean;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};

// Utility functions
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const safeJsonParse = <T>(data: string, fallback: T): T => {
  try {
    return JSON.parse(data) || fallback;
  } catch {
    return fallback;
  }
};

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Using improved localStorage hooks
  const [accounts, setAccounts] = useLocalStorageWithDates<Account[]>(
    'financial-accounts',
    [],
    ['createdAt']
  );
  
  const [transactions, setTransactions] = useLocalStorageWithDates<Transaction[]>(
    'financial-transactions',
    [],
    ['date']
  );
  
  const [creditCards, setCreditCards] = useLocalStorage<CreditCard[]>('financial-credit-cards', []);
  const [categories] = useLocalStorage<Category[]>('financial-categories', DEFAULT_CATEGORIES);
  
  const [goals, setGoals] = useLocalStorageWithDates<FinancialGoal[]>(
    'financial-goals',
    [],
    ['deadline', 'createdAt']
  );
  
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('financial-budgets', []);

  // Optimized account operations
  const addAccount = useCallback((accountData: Omit<Account, 'id' | 'createdAt'>) => {
    try {
      const newAccount: Account = {
        ...accountData,
        id: generateId(),
        createdAt: new Date(),
      };
      setAccounts(prev => [...prev, newAccount]);
      toast.success('Conta adicionada com sucesso!');
    } catch (error) {
      toast.error('Erro ao adicionar conta');
      console.error('Error adding account:', error);
    }
  }, [setAccounts]);

  const updateAccount = useCallback((id: string, accountData: Partial<Account>) => {
    try {
      setAccounts(prev => prev.map(account => 
        account.id === id ? { ...account, ...accountData } : account
      ));
      toast.success('Conta atualizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar conta');
      console.error('Error updating account:', error);
    }
  }, [setAccounts]);

  const deleteAccount = useCallback((id: string) => {
    try {
      // Check if account has transactions
      const accountTransactions = transactions.filter(t => t.account === id);
      if (accountTransactions.length > 0) {
        toast.error('Não é possível excluir conta com transações. Exclua as transações primeiro.');
        return;
      }
      
      setAccounts(prev => prev.filter(account => account.id !== id));
      toast.success('Conta excluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir conta');
      console.error('Error deleting account:', error);
    }
  }, [setAccounts, transactions]);

  // Optimized transaction operations with account balance update
  const updateAccountBalance = useCallback((accountName: string, amount: number, type: 'income' | 'expense', operation: 'add' | 'remove' = 'add') => {
    setAccounts(prev => prev.map(account => {
      if (account.name === accountName) {
        let balanceChange = type === 'income' ? amount : -amount;
        if (operation === 'remove') {
          balanceChange = -balanceChange;
        }
        return { ...account, balance: account.balance + balanceChange };
      }
      return account;
    }));
  }, [setAccounts]);

  const addTransaction = useCallback((transactionData: Omit<Transaction, 'id'>) => {
    try {
      const newTransaction: Transaction = {
        ...transactionData,
        id: generateId(),
      };
      
      setTransactions(prev => [...prev, newTransaction]);
      updateAccountBalance(transactionData.account, transactionData.amount, transactionData.type);
      
      toast.success('Transação adicionada com sucesso!');
    } catch (error) {
      toast.error('Erro ao adicionar transação');
      console.error('Error adding transaction:', error);
    }
  }, [setTransactions, updateAccountBalance]);

  const deleteTransaction = useCallback((id: string) => {
    try {
      const transaction = transactions.find(t => t.id === id);
      if (transaction) {
        // Revert account balance
        updateAccountBalance(transaction.account, transaction.amount, transaction.type, 'remove');
        setTransactions(prev => prev.filter(t => t.id !== id));
        toast.success('Transação excluída com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao excluir transação');
      console.error('Error deleting transaction:', error);
    }
  }, [transactions, setTransactions, updateAccountBalance]);

  const updateTransactionAccount = useCallback((
    transactionId: string,
    oldAccount: string,
    newAccount: string,
    amount: number,
    type: 'income' | 'expense'
  ) => {
    try {
      // Revert old account balance
      updateAccountBalance(oldAccount, amount, type, 'remove');
      // Update new account balance
      updateAccountBalance(newAccount, amount, type, 'add');
    } catch (error) {
      console.error('Error updating transaction account balance:', error);
    }
  }, [updateAccountBalance]);

  // Credit card operations
  const addCreditCard = useCallback((cardData: Omit<CreditCard, 'id'>) => {
    try {
      const newCard: CreditCard = {
        ...cardData,
        id: generateId(),
      };
      setCreditCards(prev => [...prev, newCard]);
      toast.success('Cartão adicionado com sucesso!');
    } catch (error) {
      toast.error('Erro ao adicionar cartão');
      console.error('Error adding credit card:', error);
    }
  }, [setCreditCards]);

  const updateCreditCard = useCallback((id: string, cardData: Partial<CreditCard>) => {
    try {
      setCreditCards(prev => prev.map(card => 
        card.id === id ? { ...card, ...cardData } : card
      ));
      toast.success('Cartão atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar cartão');
      console.error('Error updating credit card:', error);
    }
  }, [setCreditCards]);

  const deleteCreditCard = useCallback((id: string) => {
    try {
      setCreditCards(prev => prev.filter(card => card.id !== id));
      toast.success('Cartão excluído com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir cartão');
      console.error('Error deleting credit card:', error);
    }
  }, [setCreditCards]);

  // Goal operations
  const addGoal = useCallback((goalData: Omit<FinancialGoal, 'id'>) => {
    try {
      const newGoal: FinancialGoal = {
        ...goalData,
        id: generateId(),
      };
      setGoals(prev => [...prev, newGoal]);
      toast.success('Meta adicionada com sucesso!');
    } catch (error) {
      toast.error('Erro ao adicionar meta');
      console.error('Error adding goal:', error);
    }
  }, [setGoals]);

  const updateGoal = useCallback((id: string, goalData: Partial<FinancialGoal>) => {
    try {
      setGoals(prev => prev.map(goal => 
        goal.id === id ? { ...goal, ...goalData } : goal
      ));
      toast.success('Meta atualizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar meta');
      console.error('Error updating goal:', error);
    }
  }, [setGoals]);

  const deleteGoal = useCallback((id: string) => {
    try {
      setGoals(prev => prev.filter(goal => goal.id !== id));
      toast.success('Meta excluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir meta');
      console.error('Error deleting goal:', error);
    }
  }, [setGoals]);

  // Budget operations
  const addBudget = useCallback((budgetData: Omit<Budget, 'id' | 'spent'>) => {
    try {
      const newBudget: Budget = {
        ...budgetData,
        id: generateId(),
        spent: 0,
      };
      setBudgets(prev => [...prev, newBudget]);
      toast.success('Orçamento adicionado com sucesso!');
    } catch (error) {
      toast.error('Erro ao adicionar orçamento');
      console.error('Error adding budget:', error);
    }
  }, [setBudgets]);

  const updateBudget = useCallback((id: string, budgetData: Partial<Budget>) => {
    try {
      setBudgets(prev => prev.map(budget => 
        budget.id === id ? { ...budget, ...budgetData } : budget
      ));
      toast.success('Orçamento atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar orçamento');
      console.error('Error updating budget:', error);
    }
  }, [setBudgets]);

  const deleteBudget = useCallback((id: string) => {
    try {
      setBudgets(prev => prev.filter(budget => budget.id !== id));
      toast.success('Orçamento excluído com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir orçamento');
      console.error('Error deleting budget:', error);
    }
  }, [setBudgets]);

  // Memoized calculations
  const getTotalBalance = useCallback(() => {
    return accounts.reduce((total, account) => total + account.balance, 0);
  }, [accounts]);

  const getMonthlyIncome = useCallback(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(t => 
        t.type === 'income' && 
        t.date.getMonth() === currentMonth && 
        t.date.getFullYear() === currentYear
      )
      .reduce((total, t) => total + t.amount, 0);
  }, [transactions]);

  const getMonthlyExpenses = useCallback(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(t => 
        t.type === 'expense' && 
        t.date.getMonth() === currentMonth && 
        t.date.getFullYear() === currentYear
      )
      .reduce((total, t) => total + t.amount, 0);
  }, [transactions]);

  const getCategoryExpenses = useCallback((categoryId: string, period: 'month' | 'year' = 'month') => {
    const now = new Date();
    const startDate = period === 'month' 
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getFullYear(), 0, 1);
    
    return transactions
      .filter(t => 
        t.type === 'expense' && 
        t.category === categoryId &&
        t.date >= startDate &&
        t.date <= now
      )
      .reduce((total, t) => total + t.amount, 0);
  }, [transactions]);

  const getAccountTransactions = useCallback((accountId: string) => {
    return transactions
      .filter(t => t.account === accountId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions]);

  // Data management
  const clearAllData = useCallback(() => {
    try {
      setAccounts([]);
      setTransactions([]);
      setCreditCards([]);
      setGoals([]);
      setBudgets([]);
      toast.success('Todos os dados foram limpos!');
    } catch (error) {
      toast.error('Erro ao limpar dados');
      console.error('Error clearing data:', error);
    }
  }, [setAccounts, setTransactions, setCreditCards, setGoals, setBudgets]);

  const exportData = useCallback(() => {
    try {
      const data = {
        accounts,
        transactions,
        creditCards,
        goals,
        budgets,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      toast.error('Erro ao exportar dados');
      console.error('Error exporting data:', error);
      return '';
    }
  }, [accounts, transactions, creditCards, goals, budgets]);

  const importData = useCallback((jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      
      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format');
      }

      // Import data with date parsing
      if (data.accounts) {
        const accountsWithDates = data.accounts.map((acc: any) => ({
          ...acc,
          createdAt: new Date(acc.createdAt)
        }));
        setAccounts(accountsWithDates);
      }
      
      if (data.transactions) {
        const transactionsWithDates = data.transactions.map((trans: any) => ({
          ...trans,
          date: new Date(trans.date)
        }));
        setTransactions(transactionsWithDates);
      }
      
      if (data.creditCards) setCreditCards(data.creditCards);
      
      if (data.goals) {
        const goalsWithDates = data.goals.map((goal: any) => ({
          ...goal,
          deadline: new Date(goal.deadline),
          createdAt: new Date(goal.createdAt)
        }));
        setGoals(goalsWithDates);
      }
      
      if (data.budgets) setBudgets(data.budgets);
      
      toast.success('Dados importados com sucesso!');
      return true;
    } catch (error) {
      toast.error('Erro ao importar dados - formato inválido');
      console.error('Error importing data:', error);
      return false;
    }
  }, [setAccounts, setTransactions, setCreditCards, setGoals, setBudgets]);

  // Memoized context value
  const value = useMemo(() => ({
    accounts,
    transactions,
    creditCards,
    categories,
    goals,
    budgets,
    addAccount,
    addTransaction,
    addCreditCard,
    updateAccount,
    deleteAccount,
    deleteTransaction,
    addGoal,
    updateGoal,
    deleteGoal,
    addBudget,
    updateBudget,
    deleteBudget,
    updateCreditCard,
    deleteCreditCard,
    getTotalBalance,
    getMonthlyIncome,
    getMonthlyExpenses,
    getCategoryExpenses,
    getAccountTransactions,
    updateTransactionAccount,
    clearAllData,
    exportData,
    importData,
  }), [
    accounts, transactions, creditCards, categories, goals, budgets,
    addAccount, addTransaction, addCreditCard, updateAccount, deleteAccount,
    deleteTransaction, addGoal, updateGoal, deleteGoal, addBudget, updateBudget,
    deleteBudget, updateCreditCard, deleteCreditCard, getTotalBalance,
    getMonthlyIncome, getMonthlyExpenses, getCategoryExpenses, getAccountTransactions,
    updateTransactionAccount, clearAllData, exportData, importData
  ]);

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
};
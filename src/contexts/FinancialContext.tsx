import React, { createContext, useContext, useState, useEffect } from 'react';
import { Account, Transaction, CreditCard, Category, DEFAULT_CATEGORIES } from '@/types/financial';
import { FinancialGoal, Budget } from '@/types/goals';

interface FinancialContextType {
  accounts: Account[];
  transactions: Transaction[];
  creditCards: CreditCard[];
  categories: Category[];
  goals?: FinancialGoal[];
  budgets?: Budget[];
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  addCreditCard: (card: Omit<CreditCard, 'id'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  deleteTransaction: (id: string) => void;
  addGoal?: (goal: Omit<FinancialGoal, 'id'>) => void;
  updateGoal?: (id: string, goal: Partial<FinancialGoal>) => void;
  deleteGoal?: (id: string) => void;
  addBudget?: (budget: Omit<Budget, 'id' | 'spent'>) => void;
  updateBudget?: (id: string, budget: Partial<Budget>) => void;
  deleteBudget?: (id: string) => void;
  getTotalBalance: () => number;
  getMonthlyIncome: () => number;
  getMonthlyExpenses: () => number;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Load data from localStorage
  useEffect(() => {
    const savedAccounts = localStorage.getItem('financial-accounts');
    const savedTransactions = localStorage.getItem('financial-transactions');
    const savedCreditCards = localStorage.getItem('financial-credit-cards');
    const savedGoals = localStorage.getItem('financial-goals');
    const savedBudgets = localStorage.getItem('financial-budgets');

    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
    }
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions).map((t: any) => ({
        ...t,
        date: new Date(t.date)
      })));
    }
    if (savedCreditCards) {
      setCreditCards(JSON.parse(savedCreditCards));
    }
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals).map((g: any) => ({
        ...g,
        deadline: new Date(g.deadline),
        createdAt: new Date(g.createdAt)
      })));
    }
    if (savedBudgets) {
      setBudgets(JSON.parse(savedBudgets));
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('financial-accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('financial-transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('financial-credit-cards', JSON.stringify(creditCards));
  }, [creditCards]);

  useEffect(() => {
    localStorage.setItem('financial-goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('financial-budgets', JSON.stringify(budgets));
  }, [budgets]);

  const addAccount = (accountData: Omit<Account, 'id' | 'createdAt'>) => {
    const newAccount: Account = {
      ...accountData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setAccounts(prev => [...prev, newAccount]);
  };

  const addTransaction = (transactionData: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: Date.now().toString(),
    };
    setTransactions(prev => [...prev, newTransaction]);

    // Update account balance
    setAccounts(prev => prev.map(account => {
      if (account.name === transactionData.account) {
        const balanceChange = transactionData.type === 'income' 
          ? transactionData.amount 
          : -transactionData.amount;
        return { ...account, balance: account.balance + balanceChange };
      }
      return account;
    }));
  };

  const addCreditCard = (cardData: Omit<CreditCard, 'id'>) => {
    const newCard: CreditCard = {
      ...cardData,
      id: Date.now().toString(),
    };
    setCreditCards(prev => [...prev, newCard]);
  };

  const updateAccount = (id: string, accountData: Partial<Account>) => {
    setAccounts(prev => prev.map(account => 
      account.id === id ? { ...account, ...accountData } : account
    ));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(account => account.id !== id));
  };

  const deleteTransaction = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      // Revert account balance
      setAccounts(prev => prev.map(account => {
        if (account.name === transaction.account) {
          const balanceChange = transaction.type === 'income' 
            ? -transaction.amount 
            : transaction.amount;
          return { ...account, balance: account.balance + balanceChange };
        }
        return account;
      }));
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const getTotalBalance = () => {
    return accounts.reduce((total, account) => total + account.balance, 0);
  };

  const getMonthlyIncome = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(t => 
        t.type === 'income' && 
        t.date.getMonth() === currentMonth && 
        t.date.getFullYear() === currentYear
      )
      .reduce((total, t) => total + t.amount, 0);
  };

  const getMonthlyExpenses = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(t => 
        t.type === 'expense' && 
        t.date.getMonth() === currentMonth && 
        t.date.getFullYear() === currentYear
      )
      .reduce((total, t) => total + t.amount, 0);
  };

  // Goals methods
  const addGoal = (goalData: Omit<FinancialGoal, 'id'>) => {
    const newGoal: FinancialGoal = {
      ...goalData,
      id: Date.now().toString(),
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoal = (id: string, goalData: Partial<FinancialGoal>) => {
    setGoals(prev => prev.map(goal => 
      goal.id === id ? { ...goal, ...goalData } : goal
    ));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== id));
  };

  // Budget methods
  const addBudget = (budgetData: Omit<Budget, 'id' | 'spent'>) => {
    const newBudget: Budget = {
      ...budgetData,
      id: Date.now().toString(),
      spent: 0,
    };
    setBudgets(prev => [...prev, newBudget]);
  };

  const updateBudget = (id: string, budgetData: Partial<Budget>) => {
    setBudgets(prev => prev.map(budget => 
      budget.id === id ? { ...budget, ...budgetData } : budget
    ));
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(budget => budget.id !== id));
  };

  const value = {
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
    getTotalBalance,
    getMonthlyIncome,
    getMonthlyExpenses,
  };

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
};
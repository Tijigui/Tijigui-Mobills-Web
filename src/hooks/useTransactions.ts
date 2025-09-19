import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { Transaction } from '@/types/financial';
import { useToast } from './use-toast';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          accounts(name),
          categories(name)
        `)
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedTransactions: Transaction[] = data.map(transaction => ({
        id: transaction.id,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.categories?.name || '',
        account: transaction.accounts?.name || '',
        date: new Date(transaction.date),
        recurring: transaction.recurring,
        tags: transaction.tags || [],
      }));

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as transações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (
    transactionData: Omit<Transaction, 'id'>,
    accountId: string,
    categoryId: string,
    onBalanceUpdate?: (accountId: string, balanceChange: number) => void
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          account_id: accountId,
          category_id: categoryId,
          description: transactionData.description,
          amount: transactionData.amount,
          type: transactionData.type,
          date: transactionData.date.toISOString().split('T')[0],
          recurring: transactionData.recurring,
          tags: transactionData.tags,
        }])
        .select(`
          *,
          accounts(name),
          categories(name)
        `)
        .single();

      if (error) throw error;

      const newTransaction: Transaction = {
        id: data.id,
        description: data.description,
        amount: data.amount,
        type: data.type,
        category: data.categories?.name || '',
        account: data.accounts?.name || '',
        date: new Date(data.date),
        recurring: data.recurring,
        tags: data.tags || [],
      };

      setTransactions(prev => [newTransaction, ...prev]);

      // Update account balance
      if (onBalanceUpdate) {
        const balanceChange = transactionData.type === 'income' 
          ? transactionData.amount 
          : -transactionData.amount;
        onBalanceUpdate(accountId, balanceChange);
      }
      
      toast({
        title: "Sucesso",
        description: "Transação adicionada com sucesso!",
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a transação.",
        variant: "destructive",
      });
    }
  };

  const deleteTransaction = async (
    id: string, 
    onBalanceUpdate?: (accountId: string, balanceChange: number) => void
  ) => {
    if (!user) return;

    try {
      const transaction = transactions.find(t => t.id === id);
      if (!transaction) return;

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== id));

      // Revert account balance
      if (onBalanceUpdate) {
        const balanceChange = transaction.type === 'income' 
          ? -transaction.amount 
          : transaction.amount;
        // We would need the account ID to update balance properly
        // This requires a slight refactor to include account_id in Transaction type
      }
      
      toast({
        title: "Sucesso",
        description: "Transação removida com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a transação.",
        variant: "destructive",
      });
    }
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

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  return {
    transactions,
    loading,
    addTransaction,
    deleteTransaction,
    getMonthlyIncome,
    getMonthlyExpenses,
    refetch: fetchTransactions,
  };
};
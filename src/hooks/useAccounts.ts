import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { Account } from '@/types/financial';
import { useToast } from './use-toast';

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAccounts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedAccounts: Account[] = data.map(account => ({
        id: account.id,
        name: account.name,
        bank: account.bank,
        type: account.type,
        balance: account.balance,
        color: account.color,
        createdAt: new Date(account.created_at),
      }));

      setAccounts(formattedAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addAccount = async (accountData: Omit<Account, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert([{
          user_id: user.id,
          name: accountData.name,
          bank: accountData.bank,
          type: accountData.type,
          balance: accountData.balance,
          color: accountData.color,
        }])
        .select()
        .single();

      if (error) throw error;

      const newAccount: Account = {
        id: data.id,
        name: data.name,
        bank: data.bank,
        type: data.type,
        balance: data.balance,
        color: data.color,
        createdAt: new Date(data.created_at),
      };

      setAccounts(prev => [newAccount, ...prev]);
      
      toast({
        title: "Sucesso",
        description: "Conta adicionada com sucesso!",
      });
    } catch (error) {
      console.error('Error adding account:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a conta.",
        variant: "destructive",
      });
    }
  };

  const updateAccount = async (id: string, accountData: Partial<Account>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('accounts')
        .update({
          name: accountData.name,
          bank: accountData.bank,
          type: accountData.type,
          balance: accountData.balance,
          color: accountData.color,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedAccount: Account = {
        id: data.id,
        name: data.name,
        bank: data.bank,
        type: data.type,
        balance: data.balance,
        color: data.color,
        createdAt: new Date(data.created_at),
      };

      setAccounts(prev => prev.map(account => 
        account.id === id ? updatedAccount : account
      ));

      toast({
        title: "Sucesso",
        description: "Conta atualizada com sucesso!",
      });
    } catch (error) {
      console.error('Error updating account:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a conta.",
        variant: "destructive",
      });
    }
  };

  const deleteAccount = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAccounts(prev => prev.filter(account => account.id !== id));
      
      toast({
        title: "Sucesso",
        description: "Conta removida com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a conta.",
        variant: "destructive",
      });
    }
  };

  const updateAccountBalance = async (accountId: string, balanceChange: number) => {
    if (!user) return;

    try {
      const account = accounts.find(acc => acc.id === accountId);
      if (!account) return;

      const newBalance = account.balance + balanceChange;

      const { error } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', accountId);

      if (error) throw error;

      setAccounts(prev => prev.map(acc => 
        acc.id === accountId ? { ...acc, balance: newBalance } : acc
      ));
    } catch (error) {
      console.error('Error updating account balance:', error);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  return {
    accounts,
    loading,
    addAccount,
    updateAccount,
    deleteAccount,
    updateAccountBalance,
    refetch: fetchAccounts,
  };
};
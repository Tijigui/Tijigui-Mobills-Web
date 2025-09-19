import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { Budget } from '@/types/goals';
import { useToast } from './use-toast';

export const useBudgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBudgets = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          categories(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedBudgets: Budget[] = data.map(budget => ({
        id: budget.id,
        category: budget.categories?.name || '',
        limit: budget.limit_amount,
        spent: budget.spent_amount,
        period: budget.period,
        color: budget.color,
        alerts: budget.alerts,
      }));

      setBudgets(formattedBudgets);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os orçamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addBudget = async (budgetData: Omit<Budget, 'id' | 'spent'>, categoryId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert([{
          user_id: user.id,
          category_id: categoryId,
          limit_amount: budgetData.limit,
          spent_amount: 0,
          period: budgetData.period,
          color: budgetData.color,
          alerts: budgetData.alerts,
        }])
        .select(`
          *,
          categories(name)
        `)
        .single();

      if (error) throw error;

      const newBudget: Budget = {
        id: data.id,
        category: data.categories?.name || '',
        limit: data.limit_amount,
        spent: data.spent_amount,
        period: data.period,
        color: data.color,
        alerts: data.alerts,
      };

      setBudgets(prev => [newBudget, ...prev]);
      
      toast({
        title: "Sucesso",
        description: "Orçamento adicionado com sucesso!",
      });
    } catch (error) {
      console.error('Error adding budget:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o orçamento.",
        variant: "destructive",
      });
    }
  };

  const updateBudget = async (id: string, budgetData: Partial<Budget>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('budgets')
        .update({
          limit_amount: budgetData.limit,
          spent_amount: budgetData.spent,
          period: budgetData.period,
          color: budgetData.color,
          alerts: budgetData.alerts,
        })
        .eq('id', id)
        .select(`
          *,
          categories(name)
        `)
        .single();

      if (error) throw error;

      const updatedBudget: Budget = {
        id: data.id,
        category: data.categories?.name || '',
        limit: data.limit_amount,
        spent: data.spent_amount,
        period: data.period,
        color: data.color,
        alerts: data.alerts,
      };

      setBudgets(prev => prev.map(budget => 
        budget.id === id ? updatedBudget : budget
      ));

      toast({
        title: "Sucesso",
        description: "Orçamento atualizado com sucesso!",
      });
    } catch (error) {
      console.error('Error updating budget:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o orçamento.",
        variant: "destructive",
      });
    }
  };

  const deleteBudget = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBudgets(prev => prev.filter(budget => budget.id !== id));
      
      toast({
        title: "Sucesso",
        description: "Orçamento removido com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o orçamento.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [user]);

  return {
    budgets,
    loading,
    addBudget,
    updateBudget,
    deleteBudget,
    refetch: fetchBudgets,
  };
};
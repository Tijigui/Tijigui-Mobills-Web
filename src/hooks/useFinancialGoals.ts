import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { FinancialGoal } from '@/types/goals';
import { useToast } from './use-toast';

export const useFinancialGoals = () => {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchGoals = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedGoals: FinancialGoal[] = data.map(goal => ({
        id: goal.id,
        title: goal.title,
        description: goal.description,
        targetAmount: goal.target_amount,
        currentAmount: goal.current_amount,
        deadline: new Date(goal.deadline),
        category: goal.category,
        color: goal.color,
        completed: goal.completed,
        createdAt: new Date(goal.created_at),
      }));

      setGoals(formattedGoals);
    } catch (error) {
      console.error('Error fetching financial goals:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as metas financeiras.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async (goalData: Omit<FinancialGoal, 'id' | 'createdAt' | 'completed'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('financial_goals')
        .insert([{
          user_id: user.id,
          title: goalData.title,
          description: goalData.description,
          target_amount: goalData.targetAmount,
          current_amount: goalData.currentAmount,
          deadline: goalData.deadline.toISOString().split('T')[0],
          category: goalData.category,
          color: goalData.color,
          completed: false,
        }])
        .select()
        .single();

      if (error) throw error;

      const newGoal: FinancialGoal = {
        id: data.id,
        title: data.title,
        description: data.description,
        targetAmount: data.target_amount,
        currentAmount: data.current_amount,
        deadline: new Date(data.deadline),
        category: data.category,
        color: data.color,
        completed: data.completed,
        createdAt: new Date(data.created_at),
      };

      setGoals(prev => [newGoal, ...prev]);
      
      toast({
        title: "Sucesso",
        description: "Meta financeira adicionada com sucesso!",
      });
    } catch (error) {
      console.error('Error adding financial goal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a meta financeira.",
        variant: "destructive",
      });
    }
  };

  const updateGoal = async (id: string, goalData: Partial<FinancialGoal>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('financial_goals')
        .update({
          title: goalData.title,
          description: goalData.description,
          target_amount: goalData.targetAmount,
          current_amount: goalData.currentAmount,
          deadline: goalData.deadline?.toISOString().split('T')[0],
          category: goalData.category,
          color: goalData.color,
          completed: goalData.completed,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedGoal: FinancialGoal = {
        id: data.id,
        title: data.title,
        description: data.description,
        targetAmount: data.target_amount,
        currentAmount: data.current_amount,
        deadline: new Date(data.deadline),
        category: data.category,
        color: data.color,
        completed: data.completed,
        createdAt: new Date(data.created_at),
      };

      setGoals(prev => prev.map(goal => 
        goal.id === id ? updatedGoal : goal
      ));

      toast({
        title: "Sucesso",
        description: "Meta financeira atualizada com sucesso!",
      });
    } catch (error) {
      console.error('Error updating financial goal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a meta financeira.",
        variant: "destructive",
      });
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGoals(prev => prev.filter(goal => goal.id !== id));
      
      toast({
        title: "Sucesso",
        description: "Meta financeira removida com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting financial goal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a meta financeira.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  return {
    goals,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    refetch: fetchGoals,
  };
};
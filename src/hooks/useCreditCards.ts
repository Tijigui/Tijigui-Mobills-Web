import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { CreditCard } from '@/types/financial';
import { useToast } from './use-toast';

export const useCreditCards = () => {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCreditCards = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedCreditCards: CreditCard[] = data.map(card => ({
        id: card.id,
        name: card.name,
        bank: card.bank,
        limit: card.credit_limit,
        currentBalance: card.current_balance,
        dueDate: card.due_date,
        closingDate: card.closing_date,
        color: card.color,
      }));

      setCreditCards(formattedCreditCards);
    } catch (error) {
      console.error('Error fetching credit cards:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os cartões de crédito.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCreditCard = async (cardData: Omit<CreditCard, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .insert([{
          user_id: user.id,
          name: cardData.name,
          bank: cardData.bank,
          credit_limit: cardData.limit,
          current_balance: cardData.currentBalance,
          due_date: cardData.dueDate,
          closing_date: cardData.closingDate,
          color: cardData.color,
        }])
        .select()
        .single();

      if (error) throw error;

      const newCreditCard: CreditCard = {
        id: data.id,
        name: data.name,
        bank: data.bank,
        limit: data.credit_limit,
        currentBalance: data.current_balance,
        dueDate: data.due_date,
        closingDate: data.closing_date,
        color: data.color,
      };

      setCreditCards(prev => [newCreditCard, ...prev]);
      
      toast({
        title: "Sucesso",
        description: "Cartão de crédito adicionado com sucesso!",
      });
    } catch (error) {
      console.error('Error adding credit card:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o cartão de crédito.",
        variant: "destructive",
      });
    }
  };

  const updateCreditCard = async (id: string, cardData: Partial<CreditCard>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .update({
          name: cardData.name,
          bank: cardData.bank,
          credit_limit: cardData.limit,
          current_balance: cardData.currentBalance,
          due_date: cardData.dueDate,
          closing_date: cardData.closingDate,
          color: cardData.color,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedCreditCard: CreditCard = {
        id: data.id,
        name: data.name,
        bank: data.bank,
        limit: data.credit_limit,
        currentBalance: data.current_balance,
        dueDate: data.due_date,
        closingDate: data.closing_date,
        color: data.color,
      };

      setCreditCards(prev => prev.map(card => 
        card.id === id ? updatedCreditCard : card
      ));

      toast({
        title: "Sucesso",
        description: "Cartão de crédito atualizado com sucesso!",
      });
    } catch (error) {
      console.error('Error updating credit card:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cartão de crédito.",
        variant: "destructive",
      });
    }
  };

  const deleteCreditCard = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('credit_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCreditCards(prev => prev.filter(card => card.id !== id));
      
      toast({
        title: "Sucesso",
        description: "Cartão de crédito removido com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting credit card:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o cartão de crédito.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCreditCards();
  }, [user]);

  return {
    creditCards,
    loading,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    refetch: fetchCreditCards,
  };
};
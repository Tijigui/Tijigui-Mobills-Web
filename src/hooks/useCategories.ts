import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { Category } from '@/types/financial';
import { useToast } from './use-toast';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCategories = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const formattedCategories: Category[] = data.map(category => ({
        id: category.id,
        name: category.name,
        type: category.type,
        color: category.color,
        icon: category.icon,
      }));

      setCategories(formattedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (categoryData: Omit<Category, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          user_id: user.id,
          name: categoryData.name,
          type: categoryData.type,
          color: categoryData.color,
          icon: categoryData.icon,
        }])
        .select()
        .single();

      if (error) throw error;

      const newCategory: Category = {
        id: data.id,
        name: data.name,
        type: data.type,
        color: data.color,
        icon: data.icon,
      };

      setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
      
      toast({
        title: "Sucesso",
        description: "Categoria adicionada com sucesso!",
      });
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a categoria.",
        variant: "destructive",
      });
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<Category>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: categoryData.name,
          type: categoryData.type,
          color: categoryData.color,
          icon: categoryData.icon,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedCategory: Category = {
        id: data.id,
        name: data.name,
        type: data.type,
        color: data.color,
        icon: data.icon,
      };

      setCategories(prev => 
        prev.map(category => 
          category.id === id ? updatedCategory : category
        ).sort((a, b) => a.name.localeCompare(b.name))
      );

      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso!",
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a categoria.",
        variant: "destructive",
      });
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories(prev => prev.filter(category => category.id !== id));
      
      toast({
        title: "Sucesso",
        description: "Categoria removida com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a categoria.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
};
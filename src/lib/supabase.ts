import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          bank: string;
          type: 'checking' | 'savings' | 'investment';
          balance: number;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          bank: string;
          type: 'checking' | 'savings' | 'investment';
          balance?: number;
          color: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          bank?: string;
          type?: 'checking' | 'savings' | 'investment';
          balance?: number;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'income' | 'expense';
          color: string;
          icon: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          type: 'income' | 'expense';
          color: string;
          icon: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: 'income' | 'expense';
          color?: string;
          icon?: string;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          category_id: string | null;
          description: string;
          amount: number;
          type: 'income' | 'expense';
          date: string;
          recurring: boolean;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          account_id: string;
          category_id?: string | null;
          description: string;
          amount: number;
          type: 'income' | 'expense';
          date: string;
          recurring?: boolean;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          category_id?: string | null;
          description?: string;
          amount?: number;
          type?: 'income' | 'expense';
          date?: string;
          recurring?: boolean;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      credit_cards: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          bank: string;
          credit_limit: number;
          current_balance: number;
          due_date: number;
          closing_date: number;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          bank: string;
          credit_limit: number;
          current_balance?: number;
          due_date: number;
          closing_date: number;
          color: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          bank?: string;
          credit_limit?: number;
          current_balance?: number;
          due_date?: number;
          closing_date?: number;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      financial_goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          target_amount: number;
          current_amount: number;
          deadline: string;
          category: 'savings' | 'investment' | 'purchase' | 'debt' | 'emergency';
          color: string;
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          description?: string | null;
          target_amount: number;
          current_amount?: number;
          deadline: string;
          category: 'savings' | 'investment' | 'purchase' | 'debt' | 'emergency';
          color: string;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          target_amount?: number;
          current_amount?: number;
          deadline?: string;
          category?: 'savings' | 'investment' | 'purchase' | 'debt' | 'emergency';
          color?: string;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          limit_amount: number;
          spent_amount: number;
          period: 'monthly' | 'weekly' | 'yearly';
          color: string;
          alerts: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          category_id: string;
          limit_amount: number;
          spent_amount?: number;
          period: 'monthly' | 'weekly' | 'yearly';
          color: string;
          alerts?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          limit_amount?: number;
          spent_amount?: number;
          period?: 'monthly' | 'weekly' | 'yearly';
          color?: string;
          alerts?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
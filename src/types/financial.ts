export interface Account {
  id: string;
  name: string;
  bank: string;
  type: 'checking' | 'savings' | 'investment';
  balance: number;
  color: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  account: string;
  date: Date;
  recurring: boolean;
  tags?: string[];
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  limit: number;
  currentBalance: number;
  dueDate: number;
  closingDate: number;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

export const BANKS = [
  "Santander", "Nubank", "Banco do Brasil", "Caixa", "Itaú",
  "Bradesco", "Pic Pay", "Banco Inter", "C6 Bank", "XP Investimentos"
];

export const DEFAULT_CATEGORIES: Category[] = [
  // Income categories
  { id: '1', name: 'Salário', type: 'income', color: '#10B981', icon: '💼' },
  { id: '2', name: 'Freelance', type: 'income', color: '#06B6D4', icon: '💻' },
  { id: '3', name: 'Investimentos', type: 'income', color: '#8B5CF6', icon: '📈' },
  
  // Expense categories
  { id: '4', name: 'Alimentação', type: 'expense', color: '#EF4444', icon: '🍽️' },
  { id: '5', name: 'Transporte', type: 'expense', color: '#F59E0B', icon: '🚗' },
  { id: '6', name: 'Moradia', type: 'expense', color: '#84CC16', icon: '🏠' },
  { id: '7', name: 'Lazer', type: 'expense', color: '#EC4899', icon: '🎬' },
  { id: '8', name: 'Saúde', type: 'expense', color: '#14B8A6', icon: '🏥' },
];
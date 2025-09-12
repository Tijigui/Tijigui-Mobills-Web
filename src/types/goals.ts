export interface FinancialGoal {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  category: 'savings' | 'investment' | 'purchase' | 'debt' | 'emergency';
  color: string;
  createdAt: Date;
  completed: boolean;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: 'monthly' | 'weekly' | 'yearly';
  color: string;
  alerts: boolean;
}
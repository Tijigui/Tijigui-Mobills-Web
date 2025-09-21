import { Transaction, Account } from '@/types/financial';
import { FinancialGoal, Budget } from '@/types/goals';
import { format, startOfMonth, endOfMonth, subMonths, isSameMonth, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface SpendingPattern {
  category: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
}

export interface MonthlyAnalysis {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  transactionCount: number;
  topCategories: SpendingPattern[];
  savingsRate: number;
}

export interface FinancialInsight {
  type: 'warning' | 'success' | 'info' | 'critical';
  category: 'spending' | 'budget' | 'goals' | 'general';
  title: string;
  description: string;
  recommendation?: string;
  value?: number;
  trend?: 'up' | 'down' | 'stable';
  priority: 1 | 2 | 3; // 1 = high, 3 = low
}

export interface BudgetAnalysis {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  utilizationPercentage: number;
  status: 'safe' | 'warning' | 'critical' | 'exceeded';
  projectedOverrun?: number;
  daysRemaining: number;
  dailyBudget: number;
  averageDailySpending: number;
}

export interface GoalAnalysis {
  goalId: string;
  title: string;
  progress: number;
  targetAmount: number;
  currentAmount: number;
  monthsToComplete: number;
  requiredMonthlySaving: number;
  isOnTrack: boolean;
  completionDate?: Date;
  status: 'on-track' | 'behind' | 'ahead' | 'completed' | 'at-risk';
}

export class FinancialAnalytics {
  private transactions: Transaction[];
  private accounts: Account[];
  private budgets: Budget[];
  private goals: FinancialGoal[];

  constructor(
    transactions: Transaction[],
    accounts: Account[],
    budgets: Budget[] = [],
    goals: FinancialGoal[] = []
  ) {
    this.transactions = transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    this.accounts = accounts;
    this.budgets = budgets;
    this.goals = goals;
  }

  // Spending Patterns Analysis
  getSpendingPatterns(period: 'month' | 'quarter' | 'year' | 'all' = 'month'): SpendingPattern[] {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'quarter':
        startDate = startOfMonth(subMonths(now, 3));
        break;
      case 'year':
        startDate = startOfYear(now);
        break;
      default:
        startDate = new Date(0); // All time
    }

    const expenses = this.transactions.filter(
      t => t.type === 'expense' && t.date >= startDate
    );

    // Get previous period for trend analysis
    const previousPeriodStart = this.getPreviousPeriodStart(startDate, period);
    const previousExpenses = this.transactions.filter(
      t => t.type === 'expense' && t.date >= previousPeriodStart && t.date < startDate
    );

    const categoryStats = new Map<string, {
      total: number;
      count: number;
      previousTotal: number;
    }>();

    // Current period
    expenses.forEach(transaction => {
      const current = categoryStats.get(transaction.category) || { total: 0, count: 0, previousTotal: 0 };
      current.total += transaction.amount;
      current.count += 1;
      categoryStats.set(transaction.category, current);
    });

    // Previous period
    previousExpenses.forEach(transaction => {
      const current = categoryStats.get(transaction.category) || { total: 0, count: 0, previousTotal: 0 };
      current.previousTotal += transaction.amount;
      categoryStats.set(transaction.category, current);
    });

    const totalExpenses = Array.from(categoryStats.values()).reduce((sum, stat) => sum + stat.total, 0);

    const patterns: SpendingPattern[] = Array.from(categoryStats.entries()).map(([category, stats]) => {
      const trendPercentage = stats.previousTotal > 0 
        ? ((stats.total - stats.previousTotal) / stats.previousTotal) * 100
        : stats.total > 0 ? 100 : 0;
      
      let trend: 'increasing' | 'decreasing' | 'stable';
      if (Math.abs(trendPercentage) < 5) {
        trend = 'stable';
      } else {
        trend = trendPercentage > 0 ? 'increasing' : 'decreasing';
      }

      return {
        category,
        totalAmount: stats.total,
        transactionCount: stats.count,
        averageAmount: stats.count > 0 ? stats.total / stats.count : 0,
        percentage: totalExpenses > 0 ? (stats.total / totalExpenses) * 100 : 0,
        trend,
        trendPercentage: Math.abs(trendPercentage),
      };
    });

    return patterns.sort((a, b) => b.totalAmount - a.totalAmount);
  }

  // Monthly Analysis
  getMonthlyAnalysis(months: number = 12): MonthlyAnalysis[] {
    const now = new Date();
    const analyses: MonthlyAnalysis[] = [];

    for (let i = 0; i < months; i++) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthTransactions = this.transactions.filter(
        t => t.date >= monthStart && t.date <= monthEnd
      );

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const balance = income - expenses;
      const savingsRate = income > 0 ? (balance / income) * 100 : 0;

      // Top categories for this month
      const categoryExpenses = new Map<string, number>();
      monthTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
          const current = categoryExpenses.get(t.category) || 0;
          categoryExpenses.set(t.category, current + t.amount);
        });

      const topCategories: SpendingPattern[] = Array.from(categoryExpenses.entries())
        .map(([category, total]) => ({
          category,
          totalAmount: total,
          transactionCount: monthTransactions.filter(t => t.category === category && t.type === 'expense').length,
          averageAmount: total / monthTransactions.filter(t => t.category === category && t.type === 'expense').length,
          percentage: expenses > 0 ? (total / expenses) * 100 : 0,
          trend: 'stable' as const,
          trendPercentage: 0,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5);

      analyses.push({
        month: format(monthDate, 'MMM yyyy', { locale: ptBR }),
        income,
        expenses,
        balance,
        transactionCount: monthTransactions.length,
        topCategories,
        savingsRate,
      });
    }

    return analyses.reverse();
  }

  // Budget Analysis
  getBudgetAnalysis(): BudgetAnalysis[] {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const daysInMonth = monthEnd.getDate();
    const daysPassed = now.getDate();
    const daysRemaining = daysInMonth - daysPassed;

    return this.budgets.map(budget => {
      // Calculate spent amount for current month
      const categoryTransactions = this.transactions.filter(
        t => t.type === 'expense' && 
             t.category === budget.category && 
             t.date >= monthStart && 
             t.date <= now
      );

      const spent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      const remaining = budget.limit - spent;
      const utilizationPercentage = (spent / budget.limit) * 100;
      
      let status: 'safe' | 'warning' | 'critical' | 'exceeded';
      if (utilizationPercentage <= 60) status = 'safe';
      else if (utilizationPercentage <= 80) status = 'warning';
      else if (utilizationPercentage <= 100) status = 'critical';
      else status = 'exceeded';

      const dailyBudget = budget.limit / daysInMonth;
      const averageDailySpending = daysPassed > 0 ? spent / daysPassed : 0;
      
      let projectedOverrun: number | undefined;
      if (averageDailySpending > dailyBudget && daysRemaining > 0) {
        const projectedMonthlySpend = averageDailySpending * daysInMonth;
        projectedOverrun = projectedMonthlySpend - budget.limit;
      }

      return {
        category: budget.category,
        budgeted: budget.limit,
        spent,
        remaining,
        utilizationPercentage,
        status,
        projectedOverrun,
        daysRemaining,
        dailyBudget,
        averageDailySpending,
      };
    });
  }

  // Goal Analysis
  getGoalAnalysis(): GoalAnalysis[] {
    const now = new Date();
    
    return this.goals.map(goal => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      const remaining = goal.targetAmount - goal.currentAmount;
      
      // Calculate months until deadline
      const monthsUntilDeadline = Math.max(0, 
        (goal.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
      );
      
      const requiredMonthlySaving = monthsUntilDeadline > 0 ? remaining / monthsUntilDeadline : remaining;
      
      // Determine if on track (simplified calculation)
      const expectedProgress = monthsUntilDeadline > 0 ? 
        ((goal.deadline.getTime() - goal.createdAt.getTime()) - (goal.deadline.getTime() - now.getTime())) / 
        (goal.deadline.getTime() - goal.createdAt.getTime()) * 100 : 100;
      
      const isOnTrack = progress >= expectedProgress * 0.9; // 90% of expected progress
      
      let status: GoalAnalysis['status'];
      if (progress >= 100) status = 'completed';
      else if (now > goal.deadline) status = 'at-risk';
      else if (progress < expectedProgress * 0.7) status = 'behind';
      else if (progress > expectedProgress * 1.1) status = 'ahead';
      else status = 'on-track';

      // Estimate completion date
      let completionDate: Date | undefined;
      if (progress < 100 && monthsUntilDeadline > 0) {
        const monthsToComplete = remaining / Math.max(requiredMonthlySaving, 1);
        completionDate = new Date(now.getTime() + monthsToComplete * 30.44 * 24 * 60 * 60 * 1000);
      }

      return {
        goalId: goal.id,
        title: goal.title,
        progress,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        monthsToComplete: monthsUntilDeadline,
        requiredMonthlySaving,
        isOnTrack,
        completionDate,
        status,
      };
    });
  }

  // Generate Insights
  generateInsights(): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    const spendingPatterns = this.getSpendingPatterns();
    const budgetAnalysis = this.getBudgetAnalysis();
    const goalAnalysis = this.getGoalAnalysis();
    const monthlyAnalysis = this.getMonthlyAnalysis(3);

    // Spending insights
    const topSpendingCategory = spendingPatterns[0];
    if (topSpendingCategory && topSpendingCategory.trend === 'increasing') {
      insights.push({
        type: 'warning',
        category: 'spending',
        title: `Gastos em ${topSpendingCategory.category} aumentando`,
        description: `Seus gastos em ${topSpendingCategory.category} aumentaram ${topSpendingCategory.trendPercentage.toFixed(1)}% em relação ao período anterior.`,
        recommendation: `Considere revisar seus gastos nesta categoria e criar um orçamento.`,
        value: topSpendingCategory.trendPercentage,
        trend: 'up',
        priority: 2,
      });
    }

    // Budget insights
    const criticalBudgets = budgetAnalysis.filter(b => b.status === 'critical' || b.status === 'exceeded');
    criticalBudgets.forEach(budget => {
      insights.push({
        type: budget.status === 'exceeded' ? 'critical' : 'warning',
        category: 'budget',
        title: `Orçamento ${budget.status === 'exceeded' ? 'excedido' : 'próximo ao limite'}`,
        description: `Você ${budget.status === 'exceeded' ? 'excedeu' : 'está próximo de exceder'} o orçamento de ${budget.category} (${budget.utilizationPercentage.toFixed(1)}%).`,
        recommendation: budget.projectedOverrun ? 
          `Com o ritmo atual, você pode exceder em R$ ${budget.projectedOverrun.toFixed(2)}.` :
          'Monitore seus gastos nesta categoria.',
        value: budget.utilizationPercentage,
        trend: 'up',
        priority: budget.status === 'exceeded' ? 1 : 2,
      });
    });

    // Goal insights
    const behindGoals = goalAnalysis.filter(g => g.status === 'behind' || g.status === 'at-risk');
    behindGoals.forEach(goal => {
      insights.push({
        type: goal.status === 'at-risk' ? 'critical' : 'warning',
        category: 'goals',
        title: `Meta ${goal.status === 'at-risk' ? 'em risco' : 'atrasada'}`,
        description: `Sua meta "${goal.title}" está ${goal.progress.toFixed(1)}% completa.`,
        recommendation: `É necessário economizar R$ ${goal.requiredMonthlySaving.toFixed(2)} por mês para atingir a meta.`,
        value: goal.progress,
        trend: 'down',
        priority: goal.status === 'at-risk' ? 1 : 2,
      });
    });

    // Savings rate insight
    if (monthlyAnalysis.length > 0) {
      const currentMonth = monthlyAnalysis[monthlyAnalysis.length - 1];
      if (currentMonth.savingsRate < 10) {
        insights.push({
          type: 'warning',
          category: 'general',
          title: 'Taxa de poupança baixa',
          description: `Sua taxa de poupança este mês é de ${currentMonth.savingsRate.toFixed(1)}%.`,
          recommendation: 'Especialistas recomendam poupar pelo menos 20% da renda.',
          value: currentMonth.savingsRate,
          trend: currentMonth.savingsRate > 0 ? 'stable' : 'down',
          priority: 2,
        });
      } else if (currentMonth.savingsRate > 30) {
        insights.push({
          type: 'success',
          category: 'general',
          title: 'Excelente taxa de poupança!',
          description: `Parabéns! Sua taxa de poupança este mês é de ${currentMonth.savingsRate.toFixed(1)}%.`,
          value: currentMonth.savingsRate,
          trend: 'up',
          priority: 3,
        });
      }
    }

    return insights.sort((a, b) => a.priority - b.priority);
  }

  // Helper method to get previous period start date
  private getPreviousPeriodStart(currentStart: Date, period: string): Date {
    switch (period) {
      case 'month':
        return startOfMonth(subMonths(currentStart, 1));
      case 'quarter':
        return subMonths(currentStart, 3);
      case 'year':
        return subMonths(currentStart, 12);
      default:
        return new Date(0);
    }
  }

  // Get financial score (0-100)
  getFinancialScore(): {
    score: number;
    breakdown: {
      savingsRate: number;
      budgetCompliance: number;
      goalProgress: number;
      diversification: number;
    };
  } {
    const monthlyAnalysis = this.getMonthlyAnalysis(1)[0];
    const budgetAnalysis = this.getBudgetAnalysis();
    const goalAnalysis = this.getGoalAnalysis();

    // Savings rate score (0-25)
    const savingsRate = monthlyAnalysis?.savingsRate || 0;
    const savingsScore = Math.min(25, (savingsRate / 20) * 25); // 20% savings = full score

    // Budget compliance score (0-25)
    const budgetScore = budgetAnalysis.length > 0 ? 
      (budgetAnalysis.filter(b => b.status === 'safe' || b.status === 'warning').length / budgetAnalysis.length) * 25 :
      20; // Default score if no budgets

    // Goal progress score (0-25)
    const goalScore = goalAnalysis.length > 0 ? 
      (goalAnalysis.reduce((sum, g) => sum + Math.min(100, g.progress), 0) / goalAnalysis.length / 100) * 25 :
      20; // Default score if no goals

    // Account diversification score (0-25)
    const accountTypes = new Set(this.accounts.map(a => a.type));
    const diversificationScore = Math.min(25, accountTypes.size * 8); // Up to 3 types for full score

    const totalScore = savingsScore + budgetScore + goalScore + diversificationScore;

    return {
      score: Math.round(totalScore),
      breakdown: {
        savingsRate: Math.round(savingsScore),
        budgetCompliance: Math.round(budgetScore),
        goalProgress: Math.round(goalScore),
        diversification: Math.round(diversificationScore),
      },
    };
  }
}

export default FinancialAnalytics;
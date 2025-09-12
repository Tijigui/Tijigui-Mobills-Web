import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFinancial } from '@/contexts/FinancialContext';
import { formatCurrency } from '@/lib/utils';
import { PiggyBank, Plus, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { Budget } from '@/types/goals';
import { BudgetForm } from './forms/BudgetForm';

const BudgetTracker: React.FC = () => {
  const { budgets = [], transactions, addBudget, updateBudget, deleteBudget } = useFinancial();
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);

  const calculateSpent = (budget: Budget) => {
    const now = new Date();
    let startDate = new Date();
    
    switch (budget.period) {
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return transactions
      .filter(t => 
        t.type === 'expense' && 
        t.category === budget.category &&
        new Date(t.date) >= startDate
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getBudgetStatus = (budget: Budget, spent: number) => {
    const percentage = (spent / budget.limit) * 100;
    
    if (percentage >= 100) return { status: 'exceeded', color: 'text-destructive', icon: AlertTriangle };
    if (percentage >= 80) return { status: 'warning', color: 'text-yellow-500', icon: AlertTriangle };
    return { status: 'good', color: 'text-income', icon: CheckCircle };
  };

  const handleEdit = (budgetId: string) => {
    setEditingBudget(budgetId);
    setShowForm(true);
  };

  const totalBudgeted = budgets?.reduce((sum, budget) => sum + budget.limit, 0) || 0;
  const totalSpent = budgets?.reduce((sum, budget) => sum + calculateSpent(budget), 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orçamentos</h1>
          <p className="text-muted-foreground">Controle seus gastos por categoria</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Resumo Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalBudgeted)}</p>
              <p className="text-sm text-muted-foreground">Orçamento Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-expense">{formatCurrency(totalSpent)}</p>
              <p className="text-sm text-muted-foreground">Total Gasto</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${totalBudgeted - totalSpent >= 0 ? 'text-income' : 'text-destructive'}`}>
                {formatCurrency(totalBudgeted - totalSpent)}
              </p>
              <p className="text-sm text-muted-foreground">Saldo Restante</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets?.map((budget) => {
          const spent = calculateSpent(budget);
          const percentage = Math.min((spent / budget.limit) * 100, 100);
          const remaining = Math.max(budget.limit - spent, 0);
          const { status, color, icon: StatusIcon } = getBudgetStatus(budget, spent);

          return (
            <Card key={budget.id} className="animate-fade-in">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{budget.category}</CardTitle>
                  <StatusIcon className={`h-5 w-5 ${color}`} />
                </div>
                <p className="text-sm text-muted-foreground capitalize">
                  {budget.period === 'monthly' ? 'Mensal' : 
                   budget.period === 'weekly' ? 'Semanal' : 'Anual'}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progresso</span>
                    <span className="text-sm text-muted-foreground">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-3"
                  />
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-expense font-medium">
                      {formatCurrency(spent)}
                    </span>
                    <span className="text-muted-foreground">
                      {formatCurrency(budget.limit)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Restante:</span>
                    <span className={remaining > 0 ? 'text-income' : 'text-destructive'}>
                      {formatCurrency(remaining)}
                    </span>
                  </div>
                  {status === 'exceeded' && (
                    <p className="text-xs text-destructive">
                      ⚠️ Orçamento excedido em {formatCurrency(spent - budget.limit)}
                    </p>
                  )}
                  {status === 'warning' && (
                    <p className="text-xs text-yellow-600">
                      ⚠️ Cuidado! Você já gastou 80% do orçamento
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(budget.id)}
                    className="flex-1"
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir este orçamento?')) {
                        deleteBudget?.(budget.id);
                      }
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(!budgets || budgets.length === 0) && (
          <div className="col-span-full text-center py-12">
            <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum orçamento definido
            </h3>
            <p className="text-muted-foreground mb-4">
              Crie orçamentos para controlar seus gastos por categoria
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Orçamento
            </Button>
          </div>
        )}
      </div>

      {showForm && (
        <BudgetForm
          budgetId={editingBudget}
          onClose={() => {
            setShowForm(false);
            setEditingBudget(null);
          }}
        />
      )}
    </div>
  );
};

export default BudgetTracker;
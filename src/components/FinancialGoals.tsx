import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFinancial } from '@/contexts/FinancialContext';
import { formatCurrency } from '@/lib/utils';
import { Target, Plus, Calendar, Trophy, AlertCircle } from 'lucide-react';
import { FinancialGoal } from '@/types/goals';
import { GoalForm } from './forms/GoalForm';

const FinancialGoals: React.FC = () => {
  const { goals = [], addGoal, updateGoal, deleteGoal } = useFinancial();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);

  const handleEdit = (goalId: string) => {
    setEditingGoal(goalId);
    setShowForm(true);
  };

  const handleAddAmount = (goal: FinancialGoal, amount: number) => {
    const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
    const completed = newAmount >= goal.targetAmount;
    updateGoal?.(goal.id, { ...goal, currentAmount: newAmount, completed });
  };

  const getProgressPercentage = (goal: FinancialGoal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const getDaysRemaining = (deadline: Date) => {
    const now = new Date();
    const diff = new Date(deadline).getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      savings: '💰',
      investment: '📈',
      purchase: '🛍️',
      debt: '💳',
      emergency: '🚨'
    };
    return icons[category as keyof typeof icons] || '🎯';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Metas Financeiras</h1>
          <p className="text-muted-foreground">Acompanhe seus objetivos financeiros</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals?.map((goal) => {
          const progress = getProgressPercentage(goal);
          const daysRemaining = getDaysRemaining(goal.deadline);
          const isOverdue = daysRemaining < 0;
          const isCompleted = goal.completed;

          return (
            <Card key={goal.id} className="relative animate-fade-in">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getCategoryIcon(goal.category)}</span>
                    <div>
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">
                        {goal.category}
                      </p>
                    </div>
                  </div>
                  {isCompleted && (
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progresso</span>
                    <span className="text-sm text-muted-foreground">
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-income font-medium">
                      {formatCurrency(goal.currentAmount)}
                    </span>
                    <span className="text-muted-foreground">
                      {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span className={isOverdue ? 'text-destructive' : 'text-muted-foreground'}>
                    {isOverdue ? `${Math.abs(daysRemaining)} dias em atraso` : `${daysRemaining} dias restantes`}
                  </span>
                </div>

                {goal.description && (
                  <p className="text-sm text-muted-foreground">
                    {goal.description}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(goal.id)}
                    className="flex-1"
                  >
                    Editar
                  </Button>
                  {!isCompleted && (
                    <Button
                      size="sm"
                      onClick={() => {
                        const amount = parseFloat(prompt('Quanto deseja adicionar?') || '0');
                        if (amount > 0) handleAddAmount(goal, amount);
                      }}
                      className="flex-1"
                    >
                      Adicionar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(!goals || goals.length === 0) && (
          <div className="col-span-full text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma meta cadastrada
            </h3>
            <p className="text-muted-foreground mb-4">
              Defina seus objetivos financeiros e acompanhe seu progresso
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Meta
            </Button>
          </div>
        )}
      </div>

      {showForm && (
        <GoalForm
          goalId={editingGoal}
          onClose={() => {
            setShowForm(false);
            setEditingGoal(null);
          }}
        />
      )}
    </div>
  );
};

export default FinancialGoals;
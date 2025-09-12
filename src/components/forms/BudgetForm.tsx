import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinancial } from '@/contexts/FinancialContext';
import { X } from 'lucide-react';

interface BudgetFormProps {
  budgetId?: string | null;
  onClose: () => void;
}

const BUDGET_COLORS = [
  '#10B981', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444',
  '#84CC16', '#EC4899', '#14B8A6', '#F97316', '#6366F1'
];

export const BudgetForm: React.FC<BudgetFormProps> = ({ budgetId, onClose }) => {
  const { budgets = [], categories, addBudget, updateBudget } = useFinancial();
  const [formData, setFormData] = useState({
    category: '',
    limit: 0,
    period: 'monthly' as 'monthly' | 'weekly' | 'yearly',
    color: BUDGET_COLORS[0],
    alerts: true,
  });

  const isEditing = !!budgetId;
  const currentBudget = budgets.find(budget => budget.id === budgetId);

  useEffect(() => {
    if (isEditing && currentBudget) {
      setFormData({
        category: currentBudget.category,
        limit: currentBudget.limit,
        period: currentBudget.period,
        color: currentBudget.color,
        alerts: currentBudget.alerts,
      });
    }
  }, [isEditing, currentBudget]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const budgetData = {
      ...formData,
      spent: 0, // Will be calculated dynamically
    };
    
    if (isEditing && budgetId) {
      updateBudget?.(budgetId, budgetData);
    } else {
      addBudget?.(budgetData);
    }
    
    onClose();
  };

  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {isEditing ? 'Editar Orçamento' : 'Novo Orçamento'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="limit">Limite do Orçamento</Label>
              <Input
                id="limit"
                type="number"
                step="0.01"
                value={formData.limit}
                onChange={(e) => setFormData({ ...formData, limit: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
                required
              />
            </div>

            <div>
              <Label htmlFor="period">Período</Label>
              <Select value={formData.period} onValueChange={(value: any) => setFormData({ ...formData, period: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cor</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {BUDGET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 ${
                      formData.color === color ? 'border-foreground' : 'border-border'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {isEditing ? 'Salvar' : 'Criar Orçamento'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
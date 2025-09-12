import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFinancial } from '@/contexts/FinancialContext';
import { cn } from '@/lib/utils';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GoalSchema } from '@/schemas/financial';
import { useToast } from '@/hooks/use-toast';

interface GoalFormProps {
  goalId?: string | null;
  onClose: () => void;
}

const GOAL_COLORS = [
  '#10B981', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444',
  '#84CC16', '#EC4899', '#14B8A6', '#F97316', '#6366F1'
];

export const GoalForm: React.FC<GoalFormProps> = ({ goalId, onClose }) => {
  const { goals = [], addGoal, updateGoal } = useFinancial();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: 0,
    currentAmount: 0,
    deadline: new Date(),
    category: 'savings' as 'savings' | 'investment' | 'purchase' | 'debt' | 'emergency',
    color: GOAL_COLORS[0],
  });

  const isEditing = !!goalId;
  const currentGoal = goals.find(goal => goal.id === goalId);

  useEffect(() => {
    if (isEditing && currentGoal) {
      setFormData({
        title: currentGoal.title,
        description: currentGoal.description,
        targetAmount: currentGoal.targetAmount,
        currentAmount: currentGoal.currentAmount,
        deadline: new Date(currentGoal.deadline),
        category: currentGoal.category,
        color: currentGoal.color,
      });
    }
  }, [isEditing, currentGoal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = GoalSchema.parse(formData);
      
      const goalData = {
        ...validatedData,
        createdAt: isEditing ? currentGoal!.createdAt : new Date(),
        completed: formData.currentAmount >= formData.targetAmount,
      };
      
      if (isEditing && goalId) {
        updateGoal?.(goalId, goalData);
        toast({
          title: "Meta atualizada",
          description: "Meta atualizada com sucesso!",
        });
      } else {
        addGoal?.(goalData);
        toast({
          title: "Meta criada",
          description: "Meta criada com sucesso!",
        });
      }
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro na validação",
        description: error.errors?.[0]?.message || "Dados inválidos",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {isEditing ? 'Editar Meta' : 'Nova Meta'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Título da Meta</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Comprar um carro"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva sua meta..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">💰 Economia</SelectItem>
                  <SelectItem value="investment">📈 Investimento</SelectItem>
                  <SelectItem value="purchase">🛍️ Compra</SelectItem>
                  <SelectItem value="debt">💳 Quitação de Dívida</SelectItem>
                  <SelectItem value="emergency">🚨 Emergência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentAmount">Valor Atual</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  step="0.01"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({ ...formData, currentAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label htmlFor="targetAmount">Valor Meta</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Prazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deadline ? (
                      format(formData.deadline, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.deadline}
                    onSelect={(date) => date && setFormData({ ...formData, deadline: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Cor</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {GOAL_COLORS.map((color) => (
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
                {isEditing ? 'Salvar' : 'Criar Meta'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
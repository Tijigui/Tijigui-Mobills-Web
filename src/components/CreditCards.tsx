import React, { useState } from 'react';
import { useFinancial } from '@/contexts/FinancialContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, CreditCard as CreditCardIcon, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import CreditCardForm from '@/components/forms/CreditCardForm';
import { CreditCard } from '@/types/financial';

const CreditCards = () => {
  const { creditCards } = useFinancial();
  const [showForm, setShowForm] = useState(false);

  const getUsagePercentage = (card: CreditCard) => {
    return (card.currentBalance / card.limit) * 100;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 70) return 'text-warning';
    return 'text-success';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 70) return 'bg-warning';
    return 'bg-success';
  };

  const getDaysUntilDue = (dueDate: number) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let dueMonth = currentMonth;
    let dueYear = currentYear;
    
    // Se já passou do vencimento neste mês, usar o próximo mês
    if (today.getDate() > dueDate) {
      dueMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      dueYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    }
    
    const dueDateObj = new Date(dueYear, dueMonth, dueDate);
    const diffTime = dueDateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const totalLimit = creditCards.reduce((sum, card) => sum + card.limit, 0);
  const totalUsed = creditCards.reduce((sum, card) => sum + card.currentBalance, 0);
  const totalAvailable = totalLimit - totalUsed;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Cartões de Crédito</h1>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Cartão
        </Button>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Limite Total</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Usado</CardTitle>
            <DollarSign className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              R$ {totalUsed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponível</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {totalAvailable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Cartões */}
      {creditCards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCardIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Nenhum cartão cadastrado
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece adicionando seu primeiro cartão de crédito para controlar seus gastos.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cartão
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creditCards.map((card) => {
            const usagePercentage = getUsagePercentage(card);
            const daysUntilDue = getDaysUntilDue(card.dueDate);
            
            return (
              <Card key={card.id} className="relative overflow-hidden">
                <div 
                  className="absolute inset-0 opacity-5"
                  style={{ backgroundColor: card.color }}
                />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{card.name}</CardTitle>
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: card.color }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{card.bank}</p>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  {/* Limite e Uso */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Usado</span>
                      <span className={getUsageColor(usagePercentage)}>
                        {usagePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={usagePercentage} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        R$ {card.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span>
                        R$ {card.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Disponível */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Disponível:</span>
                    <span className="font-semibold text-success">
                      R$ {(card.limit - card.currentBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Vencimento */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Vence dia {card.dueDate}
                      </span>
                    </div>
                    <Badge 
                      variant={daysUntilDue <= 5 ? 'destructive' : daysUntilDue <= 10 ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {daysUntilDue <= 0 ? 'Vencido' : `${daysUntilDue} dias`}
                    </Badge>
                  </div>

                  {/* Alerta de limite alto */}
                  {usagePercentage >= 90 && (
                    <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-xs text-destructive">
                        Limite quase esgotado!
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal do Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <CreditCardForm onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditCards;
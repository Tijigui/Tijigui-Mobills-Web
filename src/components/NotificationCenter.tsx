import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useFinancial } from '@/contexts/FinancialContext';
import { formatCurrency } from '@/lib/utils';
import { Bell, AlertTriangle, CheckCircle, Target, CreditCard, Calendar, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'warning' | 'success' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionable?: boolean;
}

const NotificationCenter: React.FC = () => {
  const { transactions, accounts, creditCards, goals = [], budgets = [] } = useFinancial();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState({
    budgetAlerts: true,
    goalDeadlines: true,
    creditCardDue: true,
    lowBalance: true,
    unusualSpending: true,
  });

  // Generate notifications based on financial data
  const generatedNotifications = useMemo(() => {
    const alerts: Notification[] = [];
    const now = new Date();

    // Budget alerts
    if (settings.budgetAlerts) {
      budgets.forEach(budget => {
        const spent = transactions
          .filter(t => t.type === 'expense' && t.category === budget.category)
          .reduce((sum, t) => sum + t.amount, 0);
        
        const percentage = (spent / budget.limit) * 100;
        
        if (percentage >= 100) {
          alerts.push({
            id: `budget-exceeded-${budget.id}`,
            type: 'error',
            title: 'Orçamento Excedido',
            message: `Você excedeu o orçamento de ${budget.category} em ${formatCurrency(spent - budget.limit)}`,
            timestamp: new Date(),
            read: false,
            actionable: true
          });
        } else if (percentage >= 80) {
          alerts.push({
            id: `budget-warning-${budget.id}`,
            type: 'warning',
            title: 'Orçamento Próximo do Limite',
            message: `Você já gastou ${percentage.toFixed(1)}% do orçamento de ${budget.category}`,
            timestamp: new Date(),
            read: false
          });
        }
      });
    }

    // Goal deadline alerts
    if (settings.goalDeadlines) {
      goals.forEach(goal => {
        const daysToDeadline = Math.ceil((new Date(goal.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysToDeadline <= 7 && daysToDeadline > 0 && !goal.completed) {
          alerts.push({
            id: `goal-deadline-${goal.id}`,
            type: 'warning',
            title: 'Meta Próxima do Prazo',
            message: `Sua meta "${goal.title}" vence em ${daysToDeadline} dias`,
            timestamp: new Date(),
            read: false,
            actionable: true
          });
        } else if (daysToDeadline <= 0 && !goal.completed) {
          alerts.push({
            id: `goal-overdue-${goal.id}`,
            type: 'error',
            title: 'Meta Atrasada',
            message: `Sua meta "${goal.title}" está ${Math.abs(daysToDeadline)} dias atrasada`,
            timestamp: new Date(),
            read: false,
            actionable: true
          });
        }
      });
    }

    // Low balance alerts
    if (settings.lowBalance) {
      accounts.forEach(account => {
        if (account.balance < 100 && account.balance > 0) {
          alerts.push({
            id: `low-balance-${account.id}`,
            type: 'warning',
            title: 'Saldo Baixo',
            message: `Sua conta ${account.name} está com saldo baixo: ${formatCurrency(account.balance)}`,
            timestamp: new Date(),
            read: false
          });
        } else if (account.balance <= 0) {
          alerts.push({
            id: `negative-balance-${account.id}`,
            type: 'error',
            title: 'Saldo Negativo',
            message: `Sua conta ${account.name} está no negativo: ${formatCurrency(account.balance)}`,
            timestamp: new Date(),
            read: false,
            actionable: true
          });
        }
      });
    }

    // Credit card due alerts
    if (settings.creditCardDue) {
      creditCards.forEach(card => {
        const today = now.getDate();
        const daysUntilDue = card.dueDate - today;
        
        if (daysUntilDue <= 3 && daysUntilDue >= 0 && card.currentBalance > 0) {
          alerts.push({
            id: `card-due-${card.id}`,
            type: 'warning',
            title: 'Fatura do Cartão',
            message: `Fatura do ${card.name} vence em ${daysUntilDue} dias - ${formatCurrency(card.currentBalance)}`,
            timestamp: new Date(),
            read: false,
            actionable: true
          });
        }
      });
    }

    // Unusual spending alerts
    if (settings.unusualSpending) {
      const thisMonth = transactions.filter(t => 
        t.type === 'expense' && 
        new Date(t.date).getMonth() === now.getMonth() &&
        new Date(t.date).getFullYear() === now.getFullYear()
      );
      
      const lastMonth = transactions.filter(t => {
        const date = new Date(t.date);
        const lastMonthDate = new Date();
        lastMonthDate.setMonth(now.getMonth() - 1);
        return t.type === 'expense' && 
               date.getMonth() === lastMonthDate.getMonth() &&
               date.getFullYear() === lastMonthDate.getFullYear();
      });

      const thisMonthTotal = thisMonth.reduce((sum, t) => sum + t.amount, 0);
      const lastMonthTotal = lastMonth.reduce((sum, t) => sum + t.amount, 0);

      if (lastMonthTotal > 0 && thisMonthTotal > lastMonthTotal * 1.3) {
        const increase = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
        alerts.push({
          id: 'unusual-spending',
          type: 'warning',
          title: 'Gasto Incomum Detectado',
          message: `Seus gastos aumentaram ${increase.toFixed(1)}% em relação ao mês passado`,
          timestamp: new Date(),
          read: false
        });
      }
    }

    return alerts;
  }, [transactions, accounts, creditCards, goals, budgets, settings]);

  useEffect(() => {
    setNotifications(prev => {
      // Merge new notifications with existing ones
      const existingIds = prev.map(n => n.id);
      const newNotifications = generatedNotifications.filter(n => !existingIds.includes(n.id));
      
      return [...prev, ...newNotifications];
    });
  }, [generatedNotifications]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-income" />;
      case 'info': return <Bell className="h-4 w-4 text-primary" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-foreground">Notificações</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {unreadCount}
            </Badge>
          )}
        </div>
        {notifications.length > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            Marcar Todas como Lidas
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Notifications List */}
        <div className="lg:col-span-3 space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-income mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Tudo em dia!
                </h3>
                <p className="text-muted-foreground">
                  Não há notificações no momento
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map(notification => (
              <Card key={notification.id} className={`animate-fade-in ${!notification.read ? 'border-primary' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">{notification.title}</h4>
                          {!notification.read && (
                            <Badge variant="outline" className="text-xs">Novo</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {notification.timestamp.toLocaleString('pt-BR')}
                        </p>
                        {notification.actionable && (
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline">
                              Ver Detalhes
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => markAsRead(notification.id)}
                            >
                              Marcar como Lida
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Settings Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="budget-alerts" className="text-sm">
                  Alertas de Orçamento
                </Label>
                <Switch
                  id="budget-alerts"
                  checked={settings.budgetAlerts}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, budgetAlerts: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="goal-deadlines" className="text-sm">
                  Prazos de Metas
                </Label>
                <Switch
                  id="goal-deadlines"
                  checked={settings.goalDeadlines}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, goalDeadlines: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="credit-due" className="text-sm">
                  Vencimento de Cartão
                </Label>
                <Switch
                  id="credit-due"
                  checked={settings.creditCardDue}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, creditCardDue: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="low-balance" className="text-sm">
                  Saldo Baixo
                </Label>
                <Switch
                  id="low-balance"
                  checked={settings.lowBalance}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, lowBalance: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="unusual-spending" className="text-sm">
                  Gastos Incomuns
                </Label>
                <Switch
                  id="unusual-spending"
                  checked={settings.unusualSpending}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, unusualSpending: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
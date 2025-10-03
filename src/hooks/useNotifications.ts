import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface NotificationSettings {
  enabled: boolean;
  browserNotifications: boolean;
  soundEnabled: boolean;
  reminderFrequency: 'daily' | 'weekly' | 'monthly';
  categories: {
    transactions: boolean;
    goals: boolean;
    budgets: boolean;
    bills: boolean;
  };
}

export interface Reminder {
  id: string;
  type: 'bill' | 'goal' | 'budget' | 'transaction';
  title: string;
  message: string;
  dueDate: Date;
  recurring: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  isRead: boolean;
  createdAt: Date;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  browserNotifications: false,
  soundEnabled: true,
  reminderFrequency: 'weekly',
  categories: {
    transactions: true,
    goals: true,
    budgets: true,
    bills: true,
  },
};

export const useNotifications = () => {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('notification-settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('financial-reminders');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((r: any) => ({
        ...r,
        dueDate: new Date(r.dueDate),
        createdAt: new Date(r.createdAt),
      }));
    }
    return [];
  });

  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('notification-settings', JSON.stringify(settings));
  }, [settings]);

  // Save reminders to localStorage
  useEffect(() => {
    localStorage.setItem('financial-reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      toast.error('Notificações não são suportadas neste navegador');
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Permissão para notificações concedida!');
        return true;
      } else {
        toast.error('Permissão para notificações negada');
        return false;
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      toast.error('Erro ao solicitar permissão para notificações');
      return false;
    }
  }, [permission]);

  // Send browser notification
  const sendBrowserNotification = useCallback(
    (title: string, options: NotificationOptions = {}) => {
      if (
        !settings.enabled ||
        !settings.browserNotifications ||
        permission !== 'granted' ||
        typeof Notification === 'undefined'
      ) {
        return null;
      }

      try {
        const notification = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'finance-app',
          requireInteraction: false,
          silent: !settings.soundEnabled,
          ...options,
        });

        // Auto close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        return notification;
      } catch (error) {
        console.error('Erro ao enviar notificação:', error);
        return null;
      }
    },
    [settings, permission]
  );

  // Add reminder
  const addReminder = useCallback(
    (reminderData: Omit<Reminder, 'id' | 'isRead' | 'createdAt'>) => {
      const newReminder: Reminder = {
        ...reminderData,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isRead: false,
        createdAt: new Date(),
      };

      setReminders(prev => [...prev, newReminder]);
      
      // Send immediate notification if due soon (within 24 hours)
      const now = new Date();
      const timeDiff = newReminder.dueDate.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff <= 24 && hoursDiff > 0) {
        sendBrowserNotification(`Lembrete: ${newReminder.title}`, {
          body: newReminder.message,
          tag: `reminder-${newReminder.id}`,
        });
      }

      toast.success('Lembrete adicionado com sucesso!');
      return newReminder.id;
    },
    [sendBrowserNotification]
  );

  // Mark reminder as read
  const markReminderAsRead = useCallback((id: string) => {
    setReminders(prev =>
      prev.map(reminder =>
        reminder.id === id ? { ...reminder, isRead: true } : reminder
      )
    );
  }, []);

  // Delete reminder
  const deleteReminder = useCallback((id: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== id));
    toast.success('Lembrete removido!');
  }, []);

  // Get overdue reminders
  const getOverdueReminders = useCallback(() => {
    const now = new Date();
    return reminders.filter(
      reminder => !reminder.isRead && reminder.dueDate < now
    );
  }, [reminders]);

  // Get upcoming reminders (next 7 days)
  const getUpcomingReminders = useCallback(() => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return reminders.filter(
      reminder =>
        !reminder.isRead &&
        reminder.dueDate >= now &&
        reminder.dueDate <= nextWeek
    );
  }, [reminders]);

  // Update notification settings
  const updateSettings = useCallback(
    (newSettings: Partial<NotificationSettings>) => {
      setSettings(prev => ({ ...prev, ...newSettings }));
      
      // If browser notifications enabled, request permission
      if (newSettings.browserNotifications && permission !== 'granted') {
        requestPermission();
      }
    },
    [requestPermission, permission]
  );

  // Check for due reminders (to be called periodically)
  const checkDueReminders = useCallback(() => {
    if (!settings.enabled) return;

    const now = new Date();
    const dueReminders = reminders.filter(reminder => {
      if (reminder.isRead) return false;
      
      const timeDiff = reminder.dueDate.getTime() - now.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      // Notify if due within next hour
      return minutesDiff <= 60 && minutesDiff > 0;
    });

    dueReminders.forEach(reminder => {
      const category = reminder.type;
      if (settings.categories[category as keyof typeof settings.categories]) {
        sendBrowserNotification(`⚠️ ${reminder.title}`, {
          body: reminder.message,
          tag: `due-${reminder.id}`,
        });
        
        toast.warning(`Lembrete: ${reminder.title}`, {
          description: reminder.message,
          duration: 10000,
        });
      }
    });
  }, [settings, reminders, sendBrowserNotification]);

  // Setup periodic check for due reminders
  useEffect(() => {
    if (!settings.enabled) return;

    const interval = setInterval(checkDueReminders, 5 * 60 * 1000); // Check every 5 minutes
    
    // Initial check
    checkDueReminders();

    return () => clearInterval(interval);
  }, [checkDueReminders, settings.enabled]);

  // Notification shortcuts
  const notifyGoalProgress = useCallback(
    (goalName: string, progress: number, target: number) => {
      if (!settings.categories.goals) return;
      
      const percentage = Math.round((progress / target) * 100);
      sendBrowserNotification(`🎥 Meta: ${goalName}`, {
        body: `Você atingiu ${percentage}% da sua meta!`,
        tag: 'goal-progress',
      });
    },
    [settings.categories.goals, sendBrowserNotification]
  );

  const notifyBudgetAlert = useCallback(
    (category: string, spent: number, limit: number) => {
      if (!settings.categories.budgets) return;
      
      const percentage = Math.round((spent / limit) * 100);
      
      if (percentage >= 90) {
        sendBrowserNotification(`⚠️ Orçamento: ${category}`, {
          body: `Você gastou ${percentage}% do orçamento!`,
          tag: 'budget-alert',
        });
      }
    },
    [settings.categories.budgets, sendBrowserNotification]
  );

  const notifyTransactionAdded = useCallback(
    (description: string, amount: number, type: 'income' | 'expense') => {
      if (!settings.categories.transactions) return;
      
      const emoji = type === 'income' ? '💰' : '💸';
      const action = type === 'income' ? 'Receita' : 'Despesa';
      
      sendBrowserNotification(`${emoji} ${action} adicionada`, {
        body: `${description}: R$ ${amount.toFixed(2)}`,
        tag: 'transaction-added',
      });
    },
    [settings.categories.transactions, sendBrowserNotification]
  );

  return {
    settings,
    reminders,
    permission,
    unreadCount: reminders.filter(r => !r.isRead).length,
    overdueCount: getOverdueReminders().length,
    upcomingCount: getUpcomingReminders().length,
    requestPermission,
    sendBrowserNotification,
    addReminder,
    markReminderAsRead,
    deleteReminder,
    getOverdueReminders,
    getUpcomingReminders,
    updateSettings,
    checkDueReminders,
    // Notification shortcuts
    notifyGoalProgress,
    notifyBudgetAlert,
    notifyTransactionAdded,
  };
};

export default useNotifications;
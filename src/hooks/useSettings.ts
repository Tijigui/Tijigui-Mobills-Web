import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { secureStorage } from '@/utils/encryption';

// Main settings interface
export interface AppSettings {
  // Appearance
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  animations: boolean;
  
  // Language and Region
  language: 'pt-BR' | 'en-US' | 'es-ES';
  currency: string;
  currencySymbol: string;
  dateFormat: 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';
  numberFormat: 'pt-BR' | 'en-US' | 'es-ES';
  
  // Financial
  defaultAccount: string;
  budgetAlertThreshold: number;
  monthlyBudgetDay: number; // Day of month when budget resets
  
  // Notifications
  notifications: {
    enabled: boolean;
    browser: boolean;
    email: boolean;
    sound: boolean;
    budgetAlerts: boolean;
    goalReminders: boolean;
    billReminders: boolean;
    unusualSpending: boolean;
  };
  
  // Privacy and Security
  privacy: {
    encryptData: boolean;
    autoLogout: boolean;
    autoLogoutTime: number; // minutes
    requireAuth: boolean;
    shareAnalytics: boolean;
    dataRetentionDays: number;
  };
  
  // Data and Backup
  backup: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    maxBackups: number;
    includeCategories: boolean;
    includeSettings: boolean;
  };
  
  // Advanced Features
  advanced: {
    enableBetaFeatures: boolean;
    debugMode: boolean;
    performanceMode: boolean;
    offlineMode: boolean;
    syncEnabled: boolean;
    exportFormat: 'json' | 'csv' | 'pdf';
  };
  
  // Dashboard
  dashboard: {
    defaultView: 'overview' | 'transactions' | 'analytics';
    showBalance: boolean;
    showGoals: boolean;
    showBudgets: boolean;
    showRecentTransactions: boolean;
    transactionLimit: number;
    widgetOrder: string[];
  };
  
  // Categories
  categories: {
    autoCategorizationEnabled: boolean;
    confirmAutoCategories: boolean;
    customCategories: {
      id: string;
      name: string;
      color: string;
      icon: string;
      type: 'income' | 'expense';
    }[];
  };
}

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
  // Appearance
  theme: 'system',
  accentColor: '#3b82f6',
  fontSize: 'medium',
  compactMode: false,
  animations: true,
  
  // Language and Region
  language: 'pt-BR',
  currency: 'BRL',
  currencySymbol: 'R$',
  dateFormat: 'dd/MM/yyyy',
  numberFormat: 'pt-BR',
  
  // Financial
  defaultAccount: '',
  budgetAlertThreshold: 80,
  monthlyBudgetDay: 1,
  
  // Notifications
  notifications: {
    enabled: true,
    browser: false,
    email: false,
    sound: true,
    budgetAlerts: true,
    goalReminders: true,
    billReminders: true,
    unusualSpending: true,
  },
  
  // Privacy and Security
  privacy: {
    encryptData: true,
    autoLogout: false,
    autoLogoutTime: 30,
    requireAuth: false,
    shareAnalytics: false,
    dataRetentionDays: 730, // 2 years
  },
  
  // Data and Backup
  backup: {
    autoBackup: true,
    backupFrequency: 'weekly',
    maxBackups: 10,
    includeCategories: true,
    includeSettings: true,
  },
  
  // Advanced Features
  advanced: {
    enableBetaFeatures: false,
    debugMode: false,
    performanceMode: false,
    offlineMode: true,
    syncEnabled: false,
    exportFormat: 'json',
  },
  
  // Dashboard
  dashboard: {
    defaultView: 'overview',
    showBalance: true,
    showGoals: true,
    showBudgets: true,
    showRecentTransactions: true,
    transactionLimit: 10,
    widgetOrder: ['balance', 'recent-transactions', 'goals', 'budgets'],
  },
  
  // Categories
  categories: {
    autoCategorizationEnabled: true,
    confirmAutoCategories: true,
    customCategories: [],
  },
};

// Theme configurations
export const THEME_CONFIGS = {
  light: {
    name: 'Claro',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#06b6d4',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
    },
  },
  dark: {
    name: 'Escuro',
    colors: {
      primary: '#60a5fa',
      secondary: '#94a3b8',
      accent: '#22d3ee',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
    },
  },
};

// Accent color options
export const ACCENT_COLORS = [
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Verde', value: '#10b981' },
  { name: 'Roxo', value: '#8b5cf6' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Laranja', value: '#f59e0b' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Ciano', value: '#06b6d4' },
  { name: 'Índigo', value: '#6366f1' },
];

// Language options
export const LANGUAGE_OPTIONS = [
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
];

// Currency options
export const CURRENCY_OPTIONS = [
  { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$' },
  { code: 'USD', name: 'Dólar Americano', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'Libra Esterlina', symbol: '£' },
  { code: 'JPY', name: 'Iene Japonês', symbol: '¥' },
];

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Auto-save settings when they change
  useEffect(() => {
    if (!isLoading && hasUnsavedChanges) {
      const timer = setTimeout(() => {
        saveSettings();
      }, 1000); // Auto-save after 1 second of inactivity
      
      return () => clearTimeout(timer);
    }
  }, [settings, isLoading, hasUnsavedChanges]);

  // Load settings from storage
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      
      let savedSettings: AppSettings | null = null;
      
      if (settings.privacy.encryptData) {
        savedSettings = await secureStorage.getItem<AppSettings>('app-settings');
      } else {
        const stored = localStorage.getItem('app-settings');
        if (stored) {
          savedSettings = JSON.parse(stored);
        }
      }
      
      if (savedSettings) {
        // Merge with defaults to ensure all properties exist
        const mergedSettings = {
          ...DEFAULT_SETTINGS,
          ...savedSettings,
          notifications: {
            ...DEFAULT_SETTINGS.notifications,
            ...savedSettings.notifications,
          },
          privacy: {
            ...DEFAULT_SETTINGS.privacy,
            ...savedSettings.privacy,
          },
          backup: {
            ...DEFAULT_SETTINGS.backup,
            ...savedSettings.backup,
          },
          advanced: {
            ...DEFAULT_SETTINGS.advanced,
            ...savedSettings.advanced,
          },
          dashboard: {
            ...DEFAULT_SETTINGS.dashboard,
            ...savedSettings.dashboard,
          },
          categories: {
            ...DEFAULT_SETTINGS.categories,
            ...savedSettings.categories,
          },
        };
        
        setSettings(mergedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  }, [settings.privacy.encryptData]);

  // Save settings to storage
  const saveSettings = useCallback(async () => {
    try {
      if (settings.privacy.encryptData) {
        await secureStorage.setItem('app-settings', settings);
      } else {
        localStorage.setItem('app-settings', JSON.stringify(settings));
      }
      
      setHasUnsavedChanges(false);
      toast.success('Configurações salvas!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    }
  }, [settings]);

  // Update settings
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  // Update nested settings
  const updateNestedSettings = useCallback(<K extends keyof AppSettings>(
    key: K,
    updates: Partial<AppSettings[K]>
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], ...updates }
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Reset settings to defaults
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setHasUnsavedChanges(true);
    toast.success('Configurações restauradas para o padrão');
  }, []);

  // Export settings
  const exportSettings = useCallback(() => {
    const dataStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financeapp-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Configurações exportadas!');
  }, [settings]);

  // Import settings
  const importSettings = useCallback((file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        
        // Validate imported settings structure
        if (imported && typeof imported === 'object') {
          // Merge with current settings to ensure all properties exist
          const mergedSettings = {
            ...settings,
            ...imported,
            notifications: {
              ...settings.notifications,
              ...imported.notifications,
            },
            privacy: {
              ...settings.privacy,
              ...imported.privacy,
            },
            backup: {
              ...settings.backup,
              ...imported.backup,
            },
            advanced: {
              ...settings.advanced,
              ...imported.advanced,
            },
            dashboard: {
              ...settings.dashboard,
              ...imported.dashboard,
            },
            categories: {
              ...settings.categories,
              ...imported.categories,
            },
          };
          
          setSettings(mergedSettings);
          setHasUnsavedChanges(true);
          toast.success('Configurações importadas com sucesso!');
        } else {
          throw new Error('Formato de arquivo inválido');
        }
      } catch (error) {
        console.error('Error importing settings:', error);
        toast.error('Erro ao importar configurações. Verifique o formato do arquivo.');
      }
    };
    
    reader.readAsText(file);
  }, [settings]);

  // Get formatted currency
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat(settings.numberFormat, {
      style: 'currency',
      currency: settings.currency,
    }).format(amount);
  }, [settings.currency, settings.numberFormat]);

  // Get formatted date
  const formatDate = useCallback((date: Date): string => {
    const formatMap = {
      'dd/MM/yyyy': 'pt-BR',
      'MM/dd/yyyy': 'en-US',
      'yyyy-MM-dd': 'sv-SE',
    };
    
    return new Intl.DateTimeFormat(formatMap[settings.dateFormat]).format(date);
  }, [settings.dateFormat]);

  // Get formatted number
  const formatNumber = useCallback((number: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(settings.numberFormat, options).format(number);
  }, [settings.numberFormat]);

  // Apply theme to document
  const applyTheme = useCallback(() => {
    const root = document.documentElement;
    
    // Apply theme
    if (settings.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', settings.theme);
    }
    
    // Apply accent color
    root.style.setProperty('--accent-color', settings.accentColor);
    
    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };
    root.style.setProperty('--base-font-size', fontSizeMap[settings.fontSize]);
    
    // Apply compact mode
    if (settings.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }
    
    // Apply animations
    if (!settings.animations) {
      root.classList.add('no-animations');
    } else {
      root.classList.remove('no-animations');
    }
  }, [settings.theme, settings.accentColor, settings.fontSize, settings.compactMode, settings.animations]);

  // Apply theme when settings change
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  // Memoized values
  const currentLanguage = useMemo(() => 
    LANGUAGE_OPTIONS.find(lang => lang.code === settings.language) || LANGUAGE_OPTIONS[0],
    [settings.language]
  );

  const currentCurrency = useMemo(() => 
    CURRENCY_OPTIONS.find(curr => curr.code === settings.currency) || CURRENCY_OPTIONS[0],
    [settings.currency]
  );

  const currentTheme = useMemo(() => {
    if (settings.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? THEME_CONFIGS.dark : THEME_CONFIGS.light;
    }
    return THEME_CONFIGS[settings.theme];
  }, [settings.theme]);

  return {
    settings,
    isLoading,
    hasUnsavedChanges,
    
    // Update methods
    updateSettings,
    updateNestedSettings,
    saveSettings,
    resetSettings,
    
    // Import/Export
    exportSettings,
    importSettings,
    
    // Formatters
    formatCurrency,
    formatDate,
    formatNumber,
    
    // Theme
    applyTheme,
    currentTheme,
    currentLanguage,
    currentCurrency,
    
    // Constants
    THEME_CONFIGS,
    ACCENT_COLORS,
    LANGUAGE_OPTIONS,
    CURRENCY_OPTIONS,
  };
};

export default useSettings;
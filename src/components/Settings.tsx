import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinancial } from '@/contexts/FinancialContext';
import { useBackupRestore } from '@/hooks/useBackupRestore';
import { useTheme } from '@/components/ui/theme-provider';
import { formatCurrency } from '@/lib/utils';
import { 
  Settings as SettingsIcon, 
  Download, 
  Upload, 
  Trash2, 
  Bell, 
  Shield,
  Moon,
  Sun,
  Monitor,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Settings: React.FC = () => {
  const { getTotalBalance } = useFinancial();
  const { exportBackup, importBackup, clearAllData } = useBackupRestore();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState({
    currency: 'BRL',
    dateFormat: 'dd/MM/yyyy',
    notifications: true,
    darkMode: false,
    autoBackup: false,
    language: 'pt-BR',
  });

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await importBackup(file);
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        console.error('Import failed:', error);
      }
    }
  };

  const handleClearData = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
      clearAllData();
      setTimeout(() => window.location.reload(), 2000);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      currency: 'BRL',
      dateFormat: 'dd/MM/yyyy',
      notifications: true,
      darkMode: false,
      autoBackup: false,
      language: 'pt-BR',
    });
    toast({
      title: "Configurações restauradas",
      description: "Todas as configurações foram restauradas para o padrão.",
    });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            Configurações
          </h1>
          <p className="text-muted-foreground">Gerencie suas preferências e dados</p>
        </div>
      </div>

      {/* Preferências Gerais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Preferências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="text-sm font-medium">
                Notificações
              </Label>
              <Switch
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, notifications: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-backup" className="text-sm font-medium">
                Backup Automático
              </Label>
              <Switch
                id="auto-backup"
                checked={settings.autoBackup}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, autoBackup: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" className="text-sm font-medium">
                Moeda
              </Label>
              <Select value={settings.currency} onValueChange={(value) => 
                setSettings(prev => ({ ...prev, currency: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                  <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-format" className="text-sm font-medium">
                Formato de Data
              </Label>
              <Select value={settings.dateFormat} onValueChange={(value) => 
                setSettings(prev => ({ ...prev, dateFormat: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/MM/yyyy">DD/MM/AAAA</SelectItem>
                  <SelectItem value="MM/dd/yyyy">MM/DD/AAAA</SelectItem>
                  <SelectItem value="yyyy-MM-dd">AAAA-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="theme-mode" className="text-sm font-medium">
                Tema
              </Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Claro
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Escuro
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Sistema
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Management */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gerenciamento de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={exportBackup} variant="outline" className="flex items-center gap-2 hover-scale">
              <Download className="h-4 w-4" />
              Exportar Backup
            </Button>
            <Button onClick={handleImportClick} variant="outline" className="flex items-center gap-2 hover-scale">
              <Upload className="h-4 w-4" />
              Importar Backup
            </Button>
            <Button onClick={resetToDefaults} variant="outline" className="flex items-center gap-2 hover-scale">
              <RefreshCw className="h-4 w-4" />
              Resetar
            </Button>
            <Button onClick={handleClearData} variant="destructive" className="flex items-center gap-2 hover-scale">
              <Trash2 className="h-4 w-4" />
              Limpar Dados
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          
          <div className="p-4 bg-muted rounded-lg shadow-elegant">
            <p className="text-sm text-muted-foreground">
              <strong>Saldo Total:</strong> {formatCurrency(getTotalBalance())}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Mantenha sempre um backup dos seus dados importantes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Sobre a Aplicação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome:</span>
                <span className="font-medium">FinanceApp</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Versão:</span>
                <span className="font-medium">2.0.0</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Framework:</span>
                <span className="font-medium">React + TypeScript</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Armazenamento:</span>
                <span className="font-medium">Local Storage</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
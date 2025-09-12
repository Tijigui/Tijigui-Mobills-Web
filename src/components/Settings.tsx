import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings as SettingsIcon, User, Bell, Shield, Database, Download, Upload, Trash2, Moon, Sun } from 'lucide-react';
import { useFinancial } from '@/contexts/FinancialContext';
import { toast } from 'sonner';

const Settings = () => {
  const { accounts, transactions, creditCards } = useFinancial();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    dueDates: true,
    lowBalance: true,
    highUsage: true,
  });

  const handleExportData = () => {
    try {
      const data = {
        accounts,
        transactions,
        creditCards,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `din-sem-drama-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar dados');
      console.error('Erro na exportação:', error);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        // Aqui você implementaria a lógica de importação
        toast.success('Dados importados com sucesso!');
      } catch (error) {
        toast.error('Erro ao importar dados - arquivo inválido');
        console.error('Erro na importação:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    try {
      localStorage.removeItem('financial-data');
      toast.success('Todos os dados foram removidos');
      // Recarregar a página para refletir as mudanças
      window.location.reload();
    } catch (error) {
      toast.error('Erro ao limpar dados');
      console.error('Erro ao limpar dados:', error);
    }
  };

  const totalAccounts = accounts.length;
  const totalTransactions = transactions.length;
  const totalCreditCards = creditCards.length;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
      </div>

      {/* Estatísticas Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estatísticas do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{totalAccounts}</div>
              <div className="text-sm text-muted-foreground">Contas</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{totalTransactions}</div>
              <div className="text-sm text-muted-foreground">Transações</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{totalCreditCards}</div>
              <div className="text-sm text-muted-foreground">Cartões</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferências do Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Preferências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Tema Escuro</Label>
              <div className="text-sm text-muted-foreground">
                Alternar entre tema claro e escuro
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <Switch
                checked={isDarkMode}
                onCheckedChange={setIsDarkMode}
              />
              <Moon className="h-4 w-4" />
            </div>
          </div>
          
          <Separator />
          
          <div>
            <Label className="text-base mb-3 block">Moeda Principal</Label>
            <div className="flex items-center gap-2">
              <Input value="Real Brasileiro (BRL)" readOnly className="flex-1" />
              <Badge variant="secondary">R$</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Datas de Vencimento</Label>
              <div className="text-sm text-muted-foreground">
                Alertas para vencimentos de cartões
              </div>
            </div>
            <Switch
              checked={notifications.dueDates}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, dueDates: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Saldo Baixo</Label>
              <div className="text-sm text-muted-foreground">
                Alertas quando o saldo estiver baixo
              </div>
            </div>
            <Switch
              checked={notifications.lowBalance}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, lowBalance: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Uso Alto do Cartão</Label>
              <div className="text-sm text-muted-foreground">
                Alertas quando o uso do cartão estiver alto
              </div>
            </div>
            <Switch
              checked={notifications.highUsage}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, highUsage: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Backup e Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Backup e Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleExportData}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar Dados
            </Button>

            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" className="w-full flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Importar Dados
              </Button>
            </div>
          </div>

          <Separator />

          <div className="bg-destructive/10 p-4 rounded-lg">
            <h4 className="font-semibold text-destructive mb-2">Zona de Perigo</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Esta ação removerá permanentemente todos os seus dados. Esta ação não pode ser desfeita.
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Limpar Todos os Dados
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação removerá permanentemente todas as suas contas, transações e cartões de crédito.
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAllData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sim, remover tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Informações da Aplicação */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre a Aplicação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nome:</span>
              <span>Din Sem Drama</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Versão:</span>
              <Badge variant="secondary">1.0.0</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Desenvolvido com:</span>
              <span>React + TypeScript</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Armazenamento:</span>
              <span>Local Storage</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
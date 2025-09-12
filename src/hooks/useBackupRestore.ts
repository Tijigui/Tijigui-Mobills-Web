import { useToast } from "@/hooks/use-toast";

export interface BackupData {
  version: string;
  timestamp: string;
  accounts: any[];
  transactions: any[];
  creditCards: any[];
  goals: any[];
  budgets: any[];
}

export const useBackupRestore = () => {
  const { toast } = useToast();

  const createBackup = (): BackupData => {
    const data: BackupData = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      accounts: JSON.parse(localStorage.getItem('financial-accounts') || '[]'),
      transactions: JSON.parse(localStorage.getItem('financial-transactions') || '[]'),
      creditCards: JSON.parse(localStorage.getItem('financial-credit-cards') || '[]'),
      goals: JSON.parse(localStorage.getItem('financial-goals') || '[]'),
      budgets: JSON.parse(localStorage.getItem('financial-budgets') || '[]'),
    };

    return data;
  };

  const exportBackup = () => {
    try {
      const backup = createBackup();
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-financeiro-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Backup criado",
        description: "Seus dados foram exportados com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro no backup",
        description: "Não foi possível criar o backup dos dados.",
        variant: "destructive",
      });
    }
  };

  const importBackup = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const backup: BackupData = JSON.parse(content);
          
          // Validate backup structure
          if (!backup.version || !backup.accounts || !backup.transactions) {
            throw new Error('Formato de backup inválido');
          }

          // Restore data
          localStorage.setItem('financial-accounts', JSON.stringify(backup.accounts));
          localStorage.setItem('financial-transactions', JSON.stringify(backup.transactions));
          localStorage.setItem('financial-credit-cards', JSON.stringify(backup.creditCards || []));
          localStorage.setItem('financial-goals', JSON.stringify(backup.goals || []));
          localStorage.setItem('financial-budgets', JSON.stringify(backup.budgets || []));

          toast({
            title: "Backup restaurado",
            description: "Seus dados foram importados com sucesso! Recarregue a página.",
          });

          resolve();
        } catch (error) {
          toast({
            title: "Erro na importação",
            description: "Não foi possível importar o backup. Verifique o arquivo.",
            variant: "destructive",
          });
          reject(error);
        }
      };

      reader.onerror = () => {
        toast({
          title: "Erro na leitura",
          description: "Não foi possível ler o arquivo de backup.",
          variant: "destructive",
        });
        reject(new Error('Erro na leitura do arquivo'));
      };

      reader.readAsText(file);
    });
  };

  const clearAllData = () => {
    localStorage.removeItem('financial-accounts');
    localStorage.removeItem('financial-transactions');
    localStorage.removeItem('financial-credit-cards');
    localStorage.removeItem('financial-goals');
    localStorage.removeItem('financial-budgets');

    toast({
      title: "Dados limpos",
      description: "Todos os dados foram removidos. Recarregue a página.",
    });
  };

  return {
    exportBackup,
    importBackup,
    clearAllData,
    createBackup,
  };
};
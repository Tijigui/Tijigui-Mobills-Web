import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Account, Transaction, CreditCard } from '@/types/financial';
import { FinancialGoal, Budget } from '@/types/goals';

export interface ExportData {
  accounts: Account[];
  transactions: Transaction[];
  creditCards: CreditCard[];
  goals: FinancialGoal[];
  budgets: Budget[];
  metadata: {
    exportDate: string;
    version: string;
    totalAccounts: number;
    totalTransactions: number;
    dateRange: {
      from: string;
      to: string;
    };
  };
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf' | 'excel';
  dateRange?: {
    from: Date;
    to: Date;
  };
  includeAccounts?: boolean;
  includeTransactions?: boolean;
  includeCreditCards?: boolean;
  includeGoals?: boolean;
  includeBudgets?: boolean;
  categories?: string[];
  accounts?: string[];
}

// CSV Export Utilities
const escapeCSV = (value: any): string => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const arrayToCSV = (data: any[], headers: string[]): string => {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => escapeCSV(row[header])).join(',')
  );
  return [csvHeaders, ...csvRows].join('\n');
};

// Export Functions
export const exportToJSON = (data: ExportData): string => {
  return JSON.stringify(data, null, 2);
};

export const exportTransactionsToCSV = (transactions: Transaction[]): string => {
  const headers = [
    'Data',
    'Descrição',
    'Valor',
    'Tipo',
    'Categoria',
    'Conta',
    'Recorrente',
    'Tags'
  ];

  const csvData = transactions.map(transaction => ({
    'Data': format(transaction.date, 'dd/MM/yyyy', { locale: ptBR }),
    'Descrição': transaction.description,
    'Valor': transaction.amount.toFixed(2).replace('.', ','),
    'Tipo': transaction.type === 'income' ? 'Receita' : 'Despesa',
    'Categoria': transaction.category,
    'Conta': transaction.account,
    'Recorrente': transaction.recurring ? 'Sim' : 'Não',
    'Tags': transaction.tags?.join('; ') || ''
  }));

  return arrayToCSV(csvData, headers);
};

export const exportAccountsToCSV = (accounts: Account[]): string => {
  const headers = [
    'Nome',
    'Banco',
    'Tipo',
    'Saldo',
    'Data de Criação'
  ];

  const csvData = accounts.map(account => ({
    'Nome': account.name,
    'Banco': account.bank,
    'Tipo': account.type === 'checking' ? 'Conta Corrente' : 
             account.type === 'savings' ? 'Poupança' : 'Investimento',
    'Saldo': account.balance.toFixed(2).replace('.', ','),
    'Data de Criação': format(account.createdAt, 'dd/MM/yyyy', { locale: ptBR })
  }));

  return arrayToCSV(csvData, headers);
};

export const exportCreditCardsToCSV = (creditCards: CreditCard[]): string => {
  const headers = [
    'Nome',
    'Banco',
    'Limite',
    'Saldo Atual',
    'Vencimento',
    'Fechamento',
    'Utilização (%)'
  ];

  const csvData = creditCards.map(card => ({
    'Nome': card.name,
    'Banco': card.bank,
    'Limite': card.limit.toFixed(2).replace('.', ','),
    'Saldo Atual': card.currentBalance.toFixed(2).replace('.', ','),
    'Vencimento': `Dia ${card.dueDate}`,
    'Fechamento': `Dia ${card.closingDate}`,
    'Utilização (%)': ((card.currentBalance / card.limit) * 100).toFixed(1).replace('.', ',')
  }));

  return arrayToCSV(csvData, headers);
};

export const exportGoalsToCSV = (goals: FinancialGoal[]): string => {
  const headers = [
    'Título',
    'Descrição',
    'Meta',
    'Atual',
    'Progresso (%)',
    'Prazo',
    'Categoria',
    'Status'
  ];

  const csvData = goals.map(goal => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const isCompleted = goal.currentAmount >= goal.targetAmount;
    const isOverdue = new Date() > goal.deadline;
    
    return {
      'Título': goal.title,
      'Descrição': goal.description || '',
      'Meta': goal.targetAmount.toFixed(2).replace('.', ','),
      'Atual': goal.currentAmount.toFixed(2).replace('.', ','),
      'Progresso (%)': progress.toFixed(1).replace('.', ','),
      'Prazo': format(goal.deadline, 'dd/MM/yyyy', { locale: ptBR }),
      'Categoria': goal.category,
      'Status': isCompleted ? 'Concluída' : isOverdue ? 'Atrasada' : 'Em andamento'
    };
  });

  return arrayToCSV(csvData, headers);
};

export const exportBudgetsToCSV = (budgets: Budget[]): string => {
  const headers = [
    'Categoria',
    'Limite',
    'Gasto',
    'Restante',
    'Utilização (%)',
    'Período',
    'Status'
  ];

  const csvData = budgets.map(budget => {
    const remaining = budget.limit - budget.spent;
    const usage = (budget.spent / budget.limit) * 100;
    const isOverBudget = budget.spent > budget.limit;
    
    return {
      'Categoria': budget.category,
      'Limite': budget.limit.toFixed(2).replace('.', ','),
      'Gasto': budget.spent.toFixed(2).replace('.', ','),
      'Restante': remaining.toFixed(2).replace('.', ','),
      'Utilização (%)': usage.toFixed(1).replace('.', ','),
      'Período': budget.period === 'monthly' ? 'Mensal' : 
                   budget.period === 'weekly' ? 'Semanal' : 'Anual',
      'Status': isOverBudget ? 'Excedido' : usage > 80 ? 'Atenção' : 'Normal'
    };
  });

  return arrayToCSV(csvData, headers);
};

// Download File Utility
export const downloadFile = (content: string, filename: string, contentType: string = 'text/plain') => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Main Export Function
export const exportData = (
  data: ExportData,
  options: ExportOptions
): void => {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  const baseFilename = `financeapp_backup_${timestamp}`;

  // Filter data based on options
  let filteredData = { ...data };
  
  if (options.dateRange) {
    filteredData.transactions = data.transactions.filter(
      t => t.date >= options.dateRange!.from && t.date <= options.dateRange!.to
    );
  }

  if (options.categories && options.categories.length > 0) {
    filteredData.transactions = filteredData.transactions.filter(
      t => options.categories!.includes(t.category)
    );
  }

  if (options.accounts && options.accounts.length > 0) {
    filteredData.transactions = filteredData.transactions.filter(
      t => options.accounts!.includes(t.account)
    );
    filteredData.accounts = data.accounts.filter(
      a => options.accounts!.includes(a.name)
    );
  }

  // Export based on format
  switch (options.format) {
    case 'json':
      const jsonContent = exportToJSON(filteredData);
      downloadFile(jsonContent, `${baseFilename}.json`, 'application/json');
      break;

    case 'csv':
      // Export multiple CSV files in a zip-like structure
      if (options.includeTransactions !== false && filteredData.transactions.length > 0) {
        const transactionsCSV = exportTransactionsToCSV(filteredData.transactions);
        downloadFile(transactionsCSV, `${baseFilename}_transacoes.csv`, 'text/csv');
      }
      
      if (options.includeAccounts !== false && filteredData.accounts.length > 0) {
        const accountsCSV = exportAccountsToCSV(filteredData.accounts);
        downloadFile(accountsCSV, `${baseFilename}_contas.csv`, 'text/csv');
      }
      
      if (options.includeCreditCards !== false && filteredData.creditCards.length > 0) {
        const cardsCSV = exportCreditCardsToCSV(filteredData.creditCards);
        downloadFile(cardsCSV, `${baseFilename}_cartoes.csv`, 'text/csv');
      }
      
      if (options.includeGoals !== false && filteredData.goals.length > 0) {
        const goalsCSV = exportGoalsToCSV(filteredData.goals);
        downloadFile(goalsCSV, `${baseFilename}_metas.csv`, 'text/csv');
      }
      
      if (options.includeBudgets !== false && filteredData.budgets.length > 0) {
        const budgetsCSV = exportBudgetsToCSV(filteredData.budgets);
        downloadFile(budgetsCSV, `${baseFilename}_orcamentos.csv`, 'text/csv');
      }
      break;

    default:
      throw new Error(`Formato de exportação não suportado: ${options.format}`);
  }
};

// Generate Summary Report
export const generateSummaryReport = (data: ExportData): string => {
  const totalBalance = data.accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalIncome = data.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = data.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const completedGoals = data.goals.filter(g => g.currentAmount >= g.targetAmount).length;
  const totalGoalProgress = data.goals.reduce((sum, goal) => {
    return sum + (goal.currentAmount / goal.targetAmount) * 100;
  }, 0) / (data.goals.length || 1);

  const overdueGoals = data.goals.filter(g => 
    new Date() > g.deadline && g.currentAmount < g.targetAmount
  ).length;

  return `# Relatório Financeiro - ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}

## Resumo Geral

### Patrimônio
- **Saldo Total**: R$ ${totalBalance.toFixed(2).replace('.', ',')}
- **Total de Contas**: ${data.accounts.length}
- **Total de Cartões**: ${data.creditCards.length}

### Movimentação
- **Total de Receitas**: R$ ${totalIncome.toFixed(2).replace('.', ',')}
- **Total de Despesas**: R$ ${totalExpenses.toFixed(2).replace('.', ',')}
- **Saldo do Período**: R$ ${(totalIncome - totalExpenses).toFixed(2).replace('.', ',')}
- **Total de Transações**: ${data.transactions.length}

### Metas Financeiras
- **Total de Metas**: ${data.goals.length}
- **Metas Concluídas**: ${completedGoals}
- **Progresso Médio**: ${totalGoalProgress.toFixed(1).replace('.', ',')}%
- **Metas em Atraso**: ${overdueGoals}

### Orçamentos
- **Total de Orçamentos**: ${data.budgets.length}
- **Orçamentos Ativos**: ${data.budgets.filter(b => b.spent < b.limit).length}
- **Orçamentos Excedidos**: ${data.budgets.filter(b => b.spent > b.limit).length}

---
*Relatório gerado automaticamente pelo FinanceApp*
`;
};

// Backup Creation
export const createBackup = (data: ExportData): Promise<string> => {
  return new Promise((resolve) => {
    const backup = {
      ...data,
      metadata: {
        ...data.metadata,
        backupType: 'full',
        version: '2.0',
        checksum: generateChecksum(data)
      }
    };
    
    resolve(JSON.stringify(backup, null, 2));
  });
};

// Simple checksum generation
const generateChecksum = (data: any): string => {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
};

export default {
  exportToJSON,
  exportTransactionsToCSV,
  exportAccountsToCSV,
  exportCreditCardsToCSV,
  exportGoalsToCSV,
  exportBudgetsToCSV,
  exportData,
  downloadFile,
  generateSummaryReport,
  createBackup,
};
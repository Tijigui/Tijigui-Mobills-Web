import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Download, FileText, Table, PieChart, X, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Transaction } from '@/types/financial';
import { exportData, ExportOptions, generateSummaryReport } from '@/utils/dataExport';
import { cn } from '@/lib/utils';

interface TransactionExportProps {
  transactions: Transaction[];
  categories: string[];
  accounts: string[];
}

interface ExportFilters {
  dateRange: {
    from: Date;
    to: Date;
  } | null;
  categories: string[];
  accounts: string[];
  type: 'all' | 'income' | 'expense';
  amountRange: {
    min: number;
    max: number;
  } | null;
}

const EXPORT_FORMATS = [
  {
    value: 'csv',
    label: 'CSV (Excel)',
    description: 'Formato ideal para planilhas',
    icon: Table,
  },
  {
    value: 'json',
    label: 'JSON',
    description: 'Formato para desenvolvedores',
    icon: FileText,
  },
  {
    value: 'pdf',
    label: 'PDF (Em breve)',
    description: 'Relatório visual formatado',
    icon: PieChart,
    disabled: true,
  },
];

const PREDEFINED_PERIODS = [
  {
    label: 'Este mês',
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: 'Mês passado',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      };
    },
  },
  {
    label: 'Últimos 3 meses',
    getValue: () => ({
      from: startOfMonth(subMonths(new Date(), 2)),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: 'Últimos 6 meses',
    getValue: () => ({
      from: startOfMonth(subMonths(new Date(), 5)),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: 'Este ano',
    getValue: () => ({
      from: new Date(new Date().getFullYear(), 0, 1),
      to: new Date(new Date().getFullYear(), 11, 31),
    }),
  },
  {
    label: 'Todas as transações',
    getValue: () => null,
  },
];

export const TransactionExport: React.FC<TransactionExportProps> = ({
  transactions,
  categories,
  accounts,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [filters, setFilters] = useState<ExportFilters>({
    dateRange: {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    },
    categories: [],
    accounts: [],
    type: 'all',
    amountRange: null,
  });
  const [isExporting, setIsExporting] = useState(false);

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Date range filter
      if (filters.dateRange) {
        const transactionDate = transaction.date;
        if (transactionDate < filters.dateRange.from || transactionDate > filters.dateRange.to) {
          return false;
        }
      }

      // Type filter
      if (filters.type !== 'all' && transaction.type !== filters.type) {
        return false;
      }

      // Categories filter
      if (filters.categories.length > 0 && !filters.categories.includes(transaction.category)) {
        return false;
      }

      // Accounts filter
      if (filters.accounts.length > 0 && !filters.accounts.includes(transaction.account)) {
        return false;
      }

      // Amount range filter
      if (filters.amountRange) {
        if (transaction.amount < filters.amountRange.min || transaction.amount > filters.amountRange.max) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, filters]);

  // Statistics
  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      total: filteredTransactions.length,
      income,
      expenses,
      balance: income - expenses,
    };
  }, [filteredTransactions]);

  const handleExport = async () => {
    if (filteredTransactions.length === 0) {
      toast.error('Nenhuma transação encontrada com os filtros selecionados');
      return;
    }

    setIsExporting(true);

    try {
      const exportOptions: ExportOptions = {
        format: exportFormat,
        dateRange: filters.dateRange || undefined,
        categories: filters.categories.length > 0 ? filters.categories : undefined,
        accounts: filters.accounts.length > 0 ? filters.accounts : undefined,
        includeTransactions: true,
        includeAccounts: false,
        includeCreditCards: false,
        includeGoals: false,
        includeBudgets: false,
      };

      const exportDataPayload = {
        transactions: filteredTransactions,
        accounts: [],
        creditCards: [],
        goals: [],
        budgets: [],
        metadata: {
          exportDate: new Date().toISOString(),
          version: '2.0',
          totalAccounts: 0,
          totalTransactions: filteredTransactions.length,
          dateRange: {
            from: filters.dateRange?.from.toISOString() || '',
            to: filters.dateRange?.to.toISOString() || '',
          },
        },
      };

      exportData(exportDataPayload, exportOptions);
      
      toast.success(`${filteredTransactions.length} transações exportadas com sucesso!`);
      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar transações');
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateReport = () => {
    const reportData = {
      transactions: filteredTransactions,
      accounts: [],
      creditCards: [],
      goals: [],
      budgets: [],
      metadata: {
        exportDate: new Date().toISOString(),
        version: '2.0',
        totalAccounts: 0,
        totalTransactions: filteredTransactions.length,
        dateRange: {
          from: filters.dateRange?.from.toISOString() || '',
          to: filters.dateRange?.to.toISOString() || '',
        },
      },
    };

    const report = generateSummaryReport(reportData);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-transacoes-${format(new Date(), 'yyyy-MM-dd')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Relatório gerado com sucesso!');
  };

  const setPredefinedPeriod = (periodFunction: (() => { from: Date; to: Date } | null)) => {
    const period = periodFunction();
    setFilters(prev => ({ ...prev, dateRange: period }));
  };

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  const toggleAccount = (account: string) => {
    setFilters(prev => ({
      ...prev,
      accounts: prev.accounts.includes(account)
        ? prev.accounts.filter(a => a !== account)
        : [...prev.accounts, account],
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateRange: {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      },
      categories: [],
      accounts: [],
      type: 'all',
      amountRange: null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exportar Transações</DialogTitle>
          <DialogDescription>
            Configure os filtros e formato para exportar suas transações
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filtros */}
          <div className="lg:col-span-2 space-y-6">
            {/* Período */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Período</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_PERIODS.map((period, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setPredefinedPeriod(period.getValue)}
                      className="text-xs"
                    >
                      {period.label}
                    </Button>
                  ))}
                </div>
                
                {filters.dateRange && (
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {format(filters.dateRange.from, 'dd/MM/yyyy', { locale: ptBR })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateRange.from}
                          onSelect={(date) => {
                            if (date) {
                              setFilters(prev => ({
                                ...prev,
                                dateRange: prev.dateRange ? { ...prev.dateRange, from: date } : null,
                              }));
                            }
                          }}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <span className="text-sm text-muted-foreground">até</span>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {format(filters.dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateRange.to}
                          onSelect={(date) => {
                            if (date) {
                              setFilters(prev => ({
                                ...prev,
                                dateRange: prev.dateRange ? { ...prev.dateRange, to: date } : null,
                              }));
                            }
                          }}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tipo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tipo de Transação</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={filters.type}
                  onValueChange={(value: 'all' | 'income' | 'expense') => 
                    setFilters(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="income">Receitas</SelectItem>
                    <SelectItem value="expense">Despesas</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Categorias */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Categorias</CardTitle>
                <CardDescription>
                  Selecione as categorias que deseja incluir (vazio = todas)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={filters.categories.includes(category)}
                        onCheckedChange={() => toggleCategory(category)}
                      />
                      <Label
                        htmlFor={`category-${category}`}
                        className="text-sm cursor-pointer"
                      >
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
                {filters.categories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {filters.categories.map(category => (
                      <Badge key={category} variant="secondary" className="text-xs">
                        {category}
                        <X 
                          className="h-3 w-3 ml-1 cursor-pointer" 
                          onClick={() => toggleCategory(category)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Contas</CardTitle>
                <CardDescription>
                  Selecione as contas que deseja incluir (vazio = todas)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {accounts.map(account => (
                    <div key={account} className="flex items-center space-x-2">
                      <Checkbox
                        id={`account-${account}`}
                        checked={filters.accounts.includes(account)}
                        onCheckedChange={() => toggleAccount(account)}
                      />
                      <Label
                        htmlFor={`account-${account}`}
                        className="text-sm cursor-pointer"
                      >
                        {account}
                      </Label>
                    </div>
                  ))}
                </div>
                {filters.accounts.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {filters.accounts.map(account => (
                      <Badge key={account} variant="secondary" className="text-xs">
                        {account}
                        <X 
                          className="h-3 w-3 ml-1 cursor-pointer" 
                          onClick={() => toggleAccount(account)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resumo e Ações */}
          <div className="space-y-6">
            {/* Estatísticas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transações:</span>
                  <span className="font-medium">{stats.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Receitas:</span>
                  <span className="font-medium text-green-600">
                    R$ {stats.income.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Despesas:</span>
                  <span className="font-medium text-red-600">
                    R$ {stats.expenses.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-medium">
                  <span>Saldo:</span>
                  <span className={cn(
                    stats.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    R$ {stats.balance.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Formato */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Formato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {EXPORT_FORMATS.map(format => {
                  const Icon = format.icon;
                  return (
                    <div key={format.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={format.value}
                        checked={exportFormat === format.value}
                        onCheckedChange={() => !format.disabled && setExportFormat(format.value as any)}
                        disabled={format.disabled}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={format.value}
                          className={cn(
                            "text-sm cursor-pointer",
                            format.disabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {format.label}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {format.description}
                          </div>
                        </Label>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="space-y-3">
              <Button
                onClick={handleExport}
                disabled={isExporting || filteredTransactions.length === 0}
                className="w-full"
              >
                {isExporting ? (
                  'Exportando...'
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar ({stats.total} itens)
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleGenerateReport}
                disabled={filteredTransactions.length === 0}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
              
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionExport;
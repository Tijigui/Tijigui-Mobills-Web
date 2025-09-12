import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinancial } from '@/contexts/FinancialContext';
import { formatCurrency } from '@/lib/utils';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';

const Analytics: React.FC = () => {
  const { transactions, categories, accounts } = useFinancial();
  const [timeframe, setTimeframe] = useState('6months');
  const [metric, setMetric] = useState('cashflow');

  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '1month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case '2years':
        startDate.setFullYear(now.getFullYear() - 2);
        break;
    }

    return transactions.filter(t => new Date(t.date) >= startDate);
  }, [transactions, timeframe]);

  const cashFlowData = useMemo(() => {
    const monthlyData: { [key: string]: { income: number; expense: number; balance: number } } = {};
    
    filteredData.forEach(transaction => {
      const monthKey = new Date(transaction.date).toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0, balance: 0 };
      }
      
      if (transaction.type === 'income') {
        monthlyData[monthKey].income += transaction.amount;
      } else {
        monthlyData[monthKey].expense += transaction.amount;
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        receitas: data.income,
        despesas: data.expense,
        saldo: data.income - data.expense
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [filteredData]);

  const categoryTrends = useMemo(() => {
    const categoryData: { [category: string]: { [month: string]: number } } = {};
    
    filteredData.forEach(transaction => {
      const monthKey = new Date(transaction.date).toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!categoryData[transaction.category]) {
        categoryData[transaction.category] = {};
      }
      
      categoryData[transaction.category][monthKey] = 
        (categoryData[transaction.category][monthKey] || 0) + transaction.amount;
    });

    const months = Array.from(new Set(filteredData.map(t => 
      new Date(t.date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' })
    ))).sort();

    return months.map(month => {
      const monthData: any = { month };
      Object.keys(categoryData).forEach(category => {
        monthData[category] = categoryData[category][month] || 0;
      });
      return monthData;
    });
  }, [filteredData]);

  const savingsRateData = useMemo(() => {
    return cashFlowData.map(item => ({
      ...item,
      taxaPoupanca: item.receitas > 0 ? ((item.saldo / item.receitas) * 100) : 0
    }));
  }, [cashFlowData]);

  const accountGrowth = useMemo(() => {
    return accounts.map(account => {
      const accountTransactions = transactions.filter(t => t.account === account.name);
      const growth = accountTransactions.reduce((sum, t) => {
        return sum + (t.type === 'income' ? t.amount : -t.amount);
      }, 0);
      
      return {
        name: account.name,
        crescimento: growth,
        saldoAtual: account.balance,
        cor: account.color
      };
    });
  }, [accounts, transactions]);

  const renderChart = () => {
    switch (metric) {
      case 'cashflow':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={cashFlowData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="receitas" 
                stackId="1"
                stroke="hsl(var(--income))" 
                fill="hsl(var(--income))" 
                fillOpacity={0.6}
                name="Receitas"
              />
              <Area 
                type="monotone" 
                dataKey="despesas" 
                stackId="2"
                stroke="hsl(var(--expense))" 
                fill="hsl(var(--expense))" 
                fillOpacity={0.6}
                name="Despesas"
              />
              <Line 
                type="monotone" 
                dataKey="saldo" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                name="Saldo"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'categories':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={categoryTrends}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              {categories.slice(0, 6).map((category, index) => (
                <Line
                  key={category.name}
                  type="monotone"
                  dataKey={category.name}
                  stroke={category.color}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'savings':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={savingsRateData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'taxaPoupanca' ? `${value.toFixed(1)}%` : formatCurrency(value),
                  name === 'taxaPoupanca' ? 'Taxa de Poupança' : name
                ]}
              />
              <Legend />
              <Bar dataKey="saldo" fill="hsl(var(--primary))" name="Saldo Mensal" />
              <Line 
                type="monotone" 
                dataKey="taxaPoupanca" 
                stroke="hsl(var(--savings))" 
                strokeWidth={3}
                name="Taxa de Poupança (%)"
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'accounts':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={accountGrowth} layout="horizontal">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="saldoAtual" name="Saldo Atual">
                {accountGrowth.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const getMetricIcon = () => {
    switch (metric) {
      case 'cashflow': return <Activity className="h-5 w-5" />;
      case 'categories': return <PieChartIcon className="h-5 w-5" />;
      case 'savings': return <TrendingUp className="h-5 w-5" />;
      case 'accounts': return <BarChart3 className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Análise avançada dos seus dados financeiros</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1 Mês</SelectItem>
              <SelectItem value="3months">3 Meses</SelectItem>
              <SelectItem value="6months">6 Meses</SelectItem>
              <SelectItem value="1year">1 Ano</SelectItem>
              <SelectItem value="2years">2 Anos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cashflow">Fluxo de Caixa</SelectItem>
              <SelectItem value="categories">Por Categoria</SelectItem>
              <SelectItem value="savings">Taxa de Poupança</SelectItem>
              <SelectItem value="accounts">Por Conta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getMetricIcon()}
            {metric === 'cashflow' && 'Análise de Fluxo de Caixa'}
            {metric === 'categories' && 'Tendências por Categoria'}
            {metric === 'savings' && 'Taxa de Poupança'}
            {metric === 'accounts' && 'Crescimento por Conta'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maior Receita Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-income" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-income">
              {formatCurrency(Math.max(...cashFlowData.map(d => d.receitas), 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maior Gasto Mensal</CardTitle>
            <TrendingDown className="h-4 w-4 text-expense" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-expense">
              {formatCurrency(Math.max(...cashFlowData.map(d => d.despesas), 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Economia</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(
                cashFlowData.length > 0 
                  ? cashFlowData.reduce((sum, d) => sum + d.saldo, 0) / cashFlowData.length 
                  : 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
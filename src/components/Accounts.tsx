import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFinancial } from '@/contexts/FinancialContext';
import { formatCurrency } from '@/lib/utils';
import { Plus, Wallet, Edit, Trash2 } from 'lucide-react';
import { AccountForm } from './forms/AccountForm';

const Accounts: React.FC = () => {
  const { accounts, deleteAccount } = useFinancial();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);

  const handleEdit = (accountId: string) => {
    setEditingAccount(accountId);
    setShowForm(true);
  };

  const handleDelete = (accountId: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      deleteAccount(accountId);
    }
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contas</h1>
          <p className="text-muted-foreground">Gerencie suas contas bancárias</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Resumo das Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{accounts.length}</p>
              <p className="text-sm text-muted-foreground">Total de Contas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-income">{formatCurrency(totalBalance)}</p>
              <p className="text-sm text-muted-foreground">Saldo Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {accounts.filter(acc => acc.balance > 0).length}
              </p>
              <p className="text-sm text-muted-foreground">Contas Positivas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <Card key={account.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{account.name}</CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(account.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(account.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{account.bank}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Saldo</p>
                  <p className={`text-2xl font-bold ${
                    account.balance >= 0 ? 'text-income' : 'text-expense'
                  }`}>
                    {formatCurrency(account.balance)}
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium capitalize">
                    {account.type === 'checking' ? 'Conta Corrente' :
                     account.type === 'savings' ? 'Poupança' : 'Investimento'}
                  </span>
                </div>
                <div 
                  className="w-full h-2 rounded-full" 
                  style={{ backgroundColor: account.color }}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        {accounts.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma conta cadastrada
            </h3>
            <p className="text-muted-foreground mb-4">
              Adicione sua primeira conta para começar a organizar suas finanças
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Conta
            </Button>
          </div>
        )}
      </div>

      {/* Account Form Modal */}
      {showForm && (
        <AccountForm
          accountId={editingAccount}
          onClose={() => {
            setShowForm(false);
            setEditingAccount(null);
          }}
        />
      )}
    </div>
  );
};

export default Accounts;
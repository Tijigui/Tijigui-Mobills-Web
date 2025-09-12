import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinancial } from '@/contexts/FinancialContext';
import { BANKS } from '@/types/financial';
import { X } from 'lucide-react';

interface AccountFormProps {
  accountId?: string | null;
  onClose: () => void;
}

const ACCOUNT_COLORS = [
  '#10B981', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444',
  '#84CC16', '#EC4899', '#14B8A6', '#F97316', '#6366F1'
];

export const AccountForm: React.FC<AccountFormProps> = ({ accountId, onClose }) => {
  const { accounts, addAccount, updateAccount } = useFinancial();
  const [formData, setFormData] = useState({
    name: '',
    bank: '',
    type: 'checking' as 'checking' | 'savings' | 'investment',
    balance: 0,
    color: ACCOUNT_COLORS[0],
  });

  const isEditing = !!accountId;
  const currentAccount = accounts.find(acc => acc.id === accountId);

  useEffect(() => {
    if (isEditing && currentAccount) {
      setFormData({
        name: currentAccount.name,
        bank: currentAccount.bank,
        type: currentAccount.type,
        balance: currentAccount.balance,
        color: currentAccount.color,
      });
    }
  }, [isEditing, currentAccount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && accountId) {
      updateAccount(accountId, formData);
    } else {
      addAccount(formData);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {isEditing ? 'Editar Conta' : 'Nova Conta'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Conta</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Conta Corrente Santander"
                required
              />
            </div>

            <div>
              <Label htmlFor="bank">Banco</Label>
              <Select value={formData.bank} onValueChange={(value) => setFormData({ ...formData, bank: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  {BANKS.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Tipo de Conta</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Conta Corrente</SelectItem>
                  <SelectItem value="savings">Poupança</SelectItem>
                  <SelectItem value="investment">Investimento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="balance">Saldo Inicial</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
              />
            </div>

            <div>
              <Label>Cor da Conta</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {ACCOUNT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 ${
                      formData.color === color ? 'border-foreground' : 'border-border'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {isEditing ? 'Salvar' : 'Criar Conta'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
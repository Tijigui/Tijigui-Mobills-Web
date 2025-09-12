import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFinancial } from '@/contexts/FinancialContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { BANKS } from '@/types/financial';
import { toast } from 'sonner';

const creditCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  bank: z.string().min(1, 'Banco é obrigatório'),
  limit: z.number().min(1, 'Limite deve ser maior que zero'),
  currentBalance: z.number().min(0, 'Saldo atual não pode ser negativo'),
  dueDate: z.number().min(1).max(31, 'Dia de vencimento deve estar entre 1 e 31'),
  closingDate: z.number().min(1).max(31, 'Dia de fechamento deve estar entre 1 e 31'),
  color: z.string().min(1, 'Cor é obrigatória'),
});

type CreditCardFormData = z.infer<typeof creditCardSchema>;

interface CreditCardFormProps {
  onClose: () => void;
}

const CreditCardForm: React.FC<CreditCardFormProps> = ({ onClose }) => {
  const { addCreditCard } = useFinancial();

  const cardColors = [
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Verde', value: '#10B981' },
    { name: 'Vermelho', value: '#EF4444' },
    { name: 'Roxo', value: '#8B5CF6' },
    { name: 'Rosa', value: '#EC4899' },
    { name: 'Laranja', value: '#F59E0B' },
    { name: 'Dourado', value: '#D97706' },
    { name: 'Prateado', value: '#6B7280' },
  ];

  const form = useForm<CreditCardFormData>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      name: '',
      bank: '',
      limit: 0,
      currentBalance: 0,
      dueDate: 5,
      closingDate: 25,
      color: '#3B82F6',
    },
  });

  const onSubmit = (data: CreditCardFormData) => {
    try {
      const creditCardData = {
        name: data.name,
        bank: data.bank,
        limit: data.limit,
        currentBalance: data.currentBalance,
        dueDate: data.dueDate,
        closingDate: data.closingDate,
        color: data.color,
      };
      addCreditCard(creditCardData);
      toast.success('Cartão de crédito adicionado com sucesso!');
      onClose();
    } catch (error) {
      toast.error('Erro ao adicionar cartão de crédito');
      console.error('Erro ao adicionar cartão:', error);
    }
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Novo Cartão de Crédito</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cartão</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Cartão Principal, Nubank Roxinho..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bank"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banco</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o banco" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BANKS.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="5000,00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fatura Atual</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia Vencimento</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="5"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="closingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia Fechamento</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="25"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor do Cartão</FormLabel>
                  <div className="grid grid-cols-4 gap-2">
                    {cardColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`p-3 rounded-lg border-2 transition-all ${
                          field.value === color.value
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => field.onChange(color.value)}
                      >
                        <div
                          className="w-full h-6 rounded"
                          style={{ backgroundColor: color.value }}
                        />
                        <p className="text-xs mt-1">{color.name}</p>
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                Adicionar Cartão
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreditCardForm;
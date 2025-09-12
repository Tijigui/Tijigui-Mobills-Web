import { z } from 'zod';

export const AccountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  bank: z.string().min(1, 'Banco é obrigatório'),
  type: z.enum(['checking', 'savings', 'investment']),
  balance: z.number().min(0, 'Saldo não pode ser negativo'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal'),
});

export const TransactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Categoria é obrigatória'),
  account: z.string().min(1, 'Conta é obrigatória'),
  date: z.date(),
  recurring: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
});

export const CreditCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  bank: z.string().min(1, 'Banco é obrigatório'),
  limit: z.number().positive('Limite deve ser positivo'),
  currentBalance: z.number().min(0, 'Saldo atual não pode ser negativo'),
  dueDate: z.number().min(1).max(31, 'Data de vencimento deve estar entre 1 e 31'),
  closingDate: z.number().min(1).max(31, 'Data de fechamento deve estar entre 1 e 31'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal'),
});

export const GoalSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional(),
  targetAmount: z.number().positive('Valor meta deve ser positivo'),
  currentAmount: z.number().min(0, 'Valor atual não pode ser negativo'),
  deadline: z.date().refine(date => date > new Date(), 'Prazo deve ser no futuro'),
  category: z.enum(['savings', 'investment', 'purchase', 'debt', 'emergency']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal'),
});

export const BudgetSchema = z.object({
  category: z.string().min(1, 'Categoria é obrigatória'),
  limit: z.number().positive('Limite deve ser positivo'),
  period: z.enum(['monthly', 'weekly', 'yearly']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal'),
  alerts: z.boolean().default(true),
});

export type AccountFormData = z.infer<typeof AccountSchema>;
export type TransactionFormData = z.infer<typeof TransactionSchema>;
export type CreditCardFormData = z.infer<typeof CreditCardSchema>;
export type GoalFormData = z.infer<typeof GoalSchema>;
export type BudgetFormData = z.infer<typeof BudgetSchema>;
import { z } from 'zod';
import { BANKS } from '@/types/financial';

// Custom validators
const hexColorSchema = z.string()
  .regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal (#RRGGBB)');

const positiveNumberSchema = (fieldName: string) => 
  z.number({
    required_error: `${fieldName} é obrigatório`,
    invalid_type_error: `${fieldName} deve ser um número`
  }).positive(`${fieldName} deve ser positivo`);

const nonNegativeNumberSchema = (fieldName: string) => 
  z.number({
    required_error: `${fieldName} é obrigatório`,
    invalid_type_error: `${fieldName} deve ser um número`
  }).min(0, `${fieldName} não pode ser negativo`);

// Account Schema
export const AccountSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .trim(),
  bank: z.enum(BANKS as [string, ...string[]], {
    errorMap: () => ({ message: 'Selecione um banco válido' })
  }),
  type: z.enum(['checking', 'savings', 'investment'], {
    errorMap: () => ({ message: 'Selecione um tipo de conta válido' })
  }),
  balance: z.number({
    required_error: 'Saldo é obrigatório',
    invalid_type_error: 'Saldo deve ser um número'
  }).finite('Saldo deve ser um número válido'),
  color: hexColorSchema,
});

// Transaction Schema
export const TransactionSchema = z.object({
  description: z.string()
    .min(3, 'Descrição deve ter pelo menos 3 caracteres')
    .max(200, 'Descrição deve ter no máximo 200 caracteres')
    .trim(),
  amount: positiveNumberSchema('Valor'),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Selecione um tipo de transação válido' })
  }),
  category: z.string().min(1, 'Categoria é obrigatória'),
  account: z.string().min(1, 'Conta é obrigatória'),
  date: z.date({
    required_error: 'Data é obrigatória',
    invalid_type_error: 'Data deve ser válida'
  }).max(new Date(), 'Data não pode ser no futuro'),
  recurring: z.boolean().default(false),
  tags: z.array(z.string().trim().min(1)).optional(),
});

// Credit Card Schema
export const CreditCardSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .trim(),
  bank: z.enum(BANKS as [string, ...string[]], {
    errorMap: () => ({ message: 'Selecione um banco válido' })
  }),
  limit: positiveNumberSchema('Limite'),
  currentBalance: nonNegativeNumberSchema('Saldo atual'),
  dueDate: z.number()
    .int('Dia de vencimento deve ser um número inteiro')
    .min(1, 'Dia de vencimento deve ser entre 1 e 31')
    .max(31, 'Dia de vencimento deve ser entre 1 e 31'),
  closingDate: z.number()
    .int('Dia de fechamento deve ser um número inteiro')
    .min(1, 'Dia de fechamento deve ser entre 1 e 31')
    .max(31, 'Dia de fechamento deve ser entre 1 e 31'),
  color: hexColorSchema,
}).refine(
  (data) => data.currentBalance <= data.limit,
  {
    message: 'Saldo atual não pode ser maior que o limite',
    path: ['currentBalance'],
  }
).refine(
  (data) => data.dueDate !== data.closingDate,
  {
    message: 'Data de vencimento deve ser diferente da data de fechamento',
    path: ['dueDate'],
  }
);

// Goal Schema
export const GoalSchema = z.object({
  title: z.string()
    .min(3, 'Título deve ter pelo menos 3 caracteres')
    .max(100, 'Título deve ter no máximo 100 caracteres')
    .trim(),
  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim()
    .optional(),
  targetAmount: positiveNumberSchema('Valor meta'),
  currentAmount: nonNegativeNumberSchema('Valor atual'),
  deadline: z.date({
    required_error: 'Prazo é obrigatório',
    invalid_type_error: 'Prazo deve ser uma data válida'
  }).refine(
    date => date > new Date(),
    'Prazo deve ser uma data futura'
  ),
  category: z.enum(['savings', 'investment', 'purchase', 'debt', 'emergency'], {
    errorMap: () => ({ message: 'Selecione uma categoria válida' })
  }),
  color: hexColorSchema,
}).refine(
  (data) => data.currentAmount <= data.targetAmount,
  {
    message: 'Valor atual não pode ser maior que a meta',
    path: ['currentAmount'],
  }
);

// Budget Schema
export const BudgetSchema = z.object({
  category: z.string().min(1, 'Categoria é obrigatória'),
  limit: positiveNumberSchema('Limite'),
  period: z.enum(['monthly', 'weekly', 'yearly'], {
    errorMap: () => ({ message: 'Selecione um período válido' })
  }),
  color: hexColorSchema,
  alerts: z.boolean().default(true),
  alertThreshold: z.number()
    .min(0, 'Limite de alerta não pode ser negativo')
    .max(100, 'Limite de alerta não pode ser maior que 100%')
    .default(80),
}).refine(
  (data) => data.alertThreshold <= 100,
  {
    message: 'Limite de alerta deve ser uma porcentagem válida',
    path: ['alertThreshold'],
  }
);

// Settings Schema
export const SettingsSchema = z.object({
  currency: z.string().min(1, 'Moeda é obrigatória').default('BRL'),
  language: z.string().min(1, 'Idioma é obrigatório').default('pt-BR'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  notifications: z.object({
    enabled: z.boolean().default(true),
    email: z.boolean().default(false),
    push: z.boolean().default(true),
    sound: z.boolean().default(true),
  }).default({}),
  privacy: z.object({
    shareAnalytics: z.boolean().default(false),
    encryptData: z.boolean().default(true),
  }).default({}),
});

// Export inferred types
export type AccountFormData = z.infer<typeof AccountSchema>;
export type TransactionFormData = z.infer<typeof TransactionSchema>;
export type CreditCardFormData = z.infer<typeof CreditCardSchema>;
export type GoalFormData = z.infer<typeof GoalSchema>;
export type BudgetFormData = z.infer<typeof BudgetSchema>;
export type SettingsFormData = z.infer<typeof SettingsSchema>;

// Helper function for schema validation
export const validateSchema = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
};

// Helper function to get error messages from ZodError
export const getErrorMessages = (error: z.ZodError): Record<string, string> => {
  const messages: Record<string, string> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    messages[path] = err.message;
  });
  return messages;
};
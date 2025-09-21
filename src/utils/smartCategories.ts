import { Transaction, Category } from '@/types/financial';

// Machine Learning-inspired category rules
interface CategoryRule {
  id: string;
  keywords: string[];
  negativeKeywords?: string[];
  patterns?: RegExp[];
  category: string;
  confidence: number;
  type: 'income' | 'expense' | 'both';
  priority: number;
}

// Category suggestions based on spending patterns
export interface CategorySuggestion {
  originalCategory: string;
  suggestedCategory: string;
  reason: string;
  confidence: number;
  transactions: Transaction[];
}

// Category analytics
export interface CategoryAnalytics {
  category: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  monthlyTrend: number;
  seasonality: {
    month: number;
    amount: number;
  }[];
  topMerchants: {
    name: string;
    amount: number;
    count: number;
  }[];
  unusualTransactions: Transaction[];
}

// Pre-defined smart categorization rules
const CATEGORY_RULES: CategoryRule[] = [
  // Income Rules
  {
    id: 'salary',
    keywords: ['salario', 'salário', 'ordenado', 'vencimento', 'pagamento', 'folha'],
    category: 'Salário',
    confidence: 0.95,
    type: 'income',
    priority: 1
  },
  {
    id: 'freelance',
    keywords: ['freelance', 'autônomo', 'autonomo', 'consulta', 'projeto', 'serviço prestado'],
    category: 'Freelance',
    confidence: 0.9,
    type: 'income',
    priority: 2
  },
  {
    id: 'investment',
    keywords: ['dividendo', 'rendimento', 'juros', 'tesouro', 'cdb', 'fundo', 'ações'],
    category: 'Investimentos',
    confidence: 0.95,
    type: 'income',
    priority: 1
  },
  
  // Food & Dining
  {
    id: 'food-supermarket',
    keywords: ['mercado', 'supermercado', 'extra', 'carrefour', 'pão de açucar', 'walmart'],
    category: 'Alimentação',
    confidence: 0.95,
    type: 'expense',
    priority: 1
  },
  {
    id: 'food-restaurant',
    keywords: ['restaurante', 'ifood', 'uber eats', 'rappi', 'delivery', 'lanche'],
    category: 'Alimentação',
    confidence: 0.9,
    type: 'expense',
    priority: 2
  },
  
  // Transportation
  {
    id: 'transport-fuel',
    keywords: ['posto', 'gasolina', 'alcool', 'etanol', 'diesel', 'combustivel', 'shell', 'petrobras'],
    category: 'Transporte',
    confidence: 0.95,
    type: 'expense',
    priority: 1
  },
  {
    id: 'transport-public',
    keywords: ['metro', 'trem', 'ônibus', 'onibus', 'bilhete unico', 'transporte publico'],
    category: 'Transporte',
    confidence: 0.95,
    type: 'expense',
    priority: 1
  },
  {
    id: 'transport-rideshare',
    keywords: ['uber', '99', 'taxi', 'cabify', 'corrida'],
    category: 'Transporte',
    confidence: 0.9,
    type: 'expense',
    priority: 2
  },
  
  // Housing
  {
    id: 'housing-rent',
    keywords: ['aluguel', 'condomínio', 'condominio', 'imovel'],
    category: 'Moradia',
    confidence: 0.95,
    type: 'expense',
    priority: 1
  },
  {
    id: 'housing-utilities',
    keywords: ['luz', 'energia', 'eletrica', 'agua', 'saneamento', 'gas', 'internet', 'telefone', 'celular'],
    category: 'Moradia',
    confidence: 0.9,
    type: 'expense',
    priority: 2
  },
  
  // Healthcare
  {
    id: 'health-medical',
    keywords: ['hospital', 'clinica', 'médico', 'medico', 'consulta', 'exame', 'laboratorio'],
    category: 'Saúde',
    confidence: 0.95,
    type: 'expense',
    priority: 1
  },
  {
    id: 'health-pharmacy',
    keywords: ['farmacia', 'drogaria', 'droga raia', 'pacheco', 'remedios', 'medicamento'],
    category: 'Saúde',
    confidence: 0.9,
    type: 'expense',
    priority: 2
  },
  
  // Entertainment
  {
    id: 'entertainment-streaming',
    keywords: ['netflix', 'spotify', 'amazon prime', 'disney', 'youtube premium', 'assinatura'],
    category: 'Lazer',
    confidence: 0.95,
    type: 'expense',
    priority: 1
  },
  {
    id: 'entertainment-venues',
    keywords: ['cinema', 'teatro', 'show', 'ingresso', 'evento', 'bar', 'balada'],
    category: 'Lazer',
    confidence: 0.9,
    type: 'expense',
    priority: 2
  },
  
  // Shopping
  {
    id: 'shopping-clothing',
    keywords: ['roupa', 'sapato', 'calçado', 'moda', 'zara', 'renner', 'c&a', 'riachuelo'],
    category: 'Vestuário',
    confidence: 0.9,
    type: 'expense',
    priority: 2
  },
  {
    id: 'shopping-electronics',
    keywords: ['magazine luiza', 'americanas', 'submarino', 'amazon', 'mercado livre', 'eletronic'],
    category: 'Eletrônicos',
    confidence: 0.8,
    type: 'expense',
    priority: 3
  },
  
  // Education
  {
    id: 'education',
    keywords: ['escola', 'faculdade', 'universidade', 'curso', 'mensalidade', 'livro', 'material escolar'],
    category: 'Educação',
    confidence: 0.9,
    type: 'expense',
    priority: 2
  },
  
  // Financial
  {
    id: 'financial-fees',
    keywords: ['tarifa', 'anuidade', 'taxa', 'juros', 'multa', 'banco'],
    category: 'Taxas Bancárias',
    confidence: 0.9,
    type: 'expense',
    priority: 2
  },
];

export class SmartCategoryManager {
  private rules: CategoryRule[];
  private transactions: Transaction[];
  private categories: Category[];

  constructor(
    transactions: Transaction[],
    categories: Category[],
    customRules: CategoryRule[] = []
  ) {
    this.transactions = transactions;
    this.categories = categories;
    this.rules = [...CATEGORY_RULES, ...customRules].sort((a, b) => a.priority - b.priority);
  }

  // Auto-categorize a single transaction
  categorizeTransaction(transaction: Transaction): {
    category: string;
    confidence: number;
    reason: string;
  } {
    const description = this.normalizeText(transaction.description);
    
    // Try to match against rules
    for (const rule of this.rules) {
      if (rule.type !== 'both' && rule.type !== transaction.type) {
        continue;
      }
      
      let match = false;
      let matchReason = '';
      
      // Check keywords
      if (rule.keywords.some(keyword => description.includes(this.normalizeText(keyword)))) {
        match = true;
        matchReason = 'palavra-chave correspondente';
      }
      
      // Check negative keywords
      if (match && rule.negativeKeywords) {
        if (rule.negativeKeywords.some(keyword => description.includes(this.normalizeText(keyword)))) {
          match = false;
        }
      }
      
      // Check patterns
      if (!match && rule.patterns) {
        if (rule.patterns.some(pattern => pattern.test(description))) {
          match = true;
          matchReason = 'padrão correspondente';
        }
      }
      
      if (match) {
        return {
          category: rule.category,
          confidence: rule.confidence,
          reason: matchReason
        };
      }
    }
    
    // No rule matched, try machine learning approach
    return this.mlCategorizeTransaction(transaction);
  }

  // Machine learning-inspired categorization
  private mlCategorizeTransaction(transaction: Transaction): {
    category: string;
    confidence: number;
    reason: string;
  } {
    const description = this.normalizeText(transaction.description);
    
    // Find similar transactions
    const similarTransactions = this.transactions.filter(t => 
      t.id !== transaction.id &&
      t.type === transaction.type &&
      this.calculateSimilarity(description, this.normalizeText(t.description)) > 0.6
    );
    
    if (similarTransactions.length > 0) {
      // Get most common category from similar transactions
      const categoryCount = new Map<string, number>();
      similarTransactions.forEach(t => {
        const count = categoryCount.get(t.category) || 0;
        categoryCount.set(t.category, count + 1);
      });
      
      const mostCommonCategory = Array.from(categoryCount.entries())
        .sort((a, b) => b[1] - a[1])[0];
      
      if (mostCommonCategory) {
        const confidence = mostCommonCategory[1] / similarTransactions.length;
        return {
          category: mostCommonCategory[0],
          confidence,
          reason: 'transações similares'
        };
      }
    }
    
    // Fallback to amount-based categorization
    return this.categorizeByAmount(transaction);
  }

  // Categorize based on transaction amount patterns
  private categorizeByAmount(transaction: Transaction): {
    category: string;
    confidence: number;
    reason: string;
  } {
    if (transaction.type === 'income') {
      if (transaction.amount > 3000) {
        return { category: 'Salário', confidence: 0.6, reason: 'valor alto de receita' };
      } else if (transaction.amount > 500) {
        return { category: 'Freelance', confidence: 0.5, reason: 'valor médio de receita' };
      } else {
        return { category: 'Outros', confidence: 0.3, reason: 'valor baixo de receita' };
      }
    } else {
      if (transaction.amount > 1000) {
        return { category: 'Moradia', confidence: 0.4, reason: 'valor alto de despesa' };
      } else if (transaction.amount > 200) {
        return { category: 'Alimentação', confidence: 0.4, reason: 'valor médio de despesa' };
      } else {
        return { category: 'Outros', confidence: 0.3, reason: 'valor baixo de despesa' };
      }
    }
  }

  // Batch categorize transactions
  batchCategorize(transactions: Transaction[]): {
    transaction: Transaction;
    oldCategory: string;
    newCategory: string;
    confidence: number;
    reason: string;
  }[] {
    const results: {
      transaction: Transaction;
      oldCategory: string;
      newCategory: string;
      confidence: number;
      reason: string;
    }[] = [];
    
    transactions.forEach(transaction => {
      const result = this.categorizeTransaction(transaction);
      
      if (result.category !== transaction.category && result.confidence > 0.7) {
        results.push({
          transaction,
          oldCategory: transaction.category,
          newCategory: result.category,
          confidence: result.confidence,
          reason: result.reason
        });
      }
    });
    
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  // Get category suggestions based on spending patterns
  getCategorySuggestions(): CategorySuggestion[] {
    const suggestions: CategorySuggestion[] = [];
    
    // Group transactions by similar descriptions
    const transactionGroups = this.groupSimilarTransactions();
    
    transactionGroups.forEach(group => {
      if (group.length >= 3) { // Minimum 3 transactions for suggestion
        const categories = group.map(t => t.category);
        const uniqueCategories = [...new Set(categories)];
        
        if (uniqueCategories.length > 1) {
          // Find most frequent category
          const categoryCount = new Map<string, number>();
          categories.forEach(cat => {
            categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
          });
          
          const sortedCategories = Array.from(categoryCount.entries())
            .sort((a, b) => b[1] - a[1]);
          
          if (sortedCategories.length > 1 && sortedCategories[0][1] > sortedCategories[1][1]) {
            const suggestedCategory = sortedCategories[0][0];
            const confidence = sortedCategories[0][1] / group.length;
            
            // Find transactions that should be recategorized
            const transactionsToChange = group.filter(t => t.category !== suggestedCategory);
            
            if (transactionsToChange.length > 0) {
              suggestions.push({
                originalCategory: transactionsToChange[0].category,
                suggestedCategory,
                reason: `${sortedCategories[0][1]} de ${group.length} transações similares usam esta categoria`,
                confidence,
                transactions: transactionsToChange
              });
            }
          }
        }
      }
    });
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  // Get category analytics
  getCategoryAnalytics(category: string, months: number = 12): CategoryAnalytics {
    const categoryTransactions = this.transactions.filter(t => 
      t.category === category &&
      t.date >= new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000)
    );
    
    const totalAmount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
    const averageAmount = categoryTransactions.length > 0 ? totalAmount / categoryTransactions.length : 0;
    
    // Calculate monthly trend
    const monthlyAmounts = new Map<string, number>();
    categoryTransactions.forEach(t => {
      const monthKey = `${t.date.getFullYear()}-${t.date.getMonth().toString().padStart(2, '0')}`;
      monthlyAmounts.set(monthKey, (monthlyAmounts.get(monthKey) || 0) + t.amount);
    });
    
    const monthlyValues = Array.from(monthlyAmounts.values());
    const monthlyTrend = monthlyValues.length > 1 ? 
      ((monthlyValues[monthlyValues.length - 1] - monthlyValues[0]) / monthlyValues[0]) * 100 : 0;
    
    // Calculate seasonality
    const seasonality = Array.from({ length: 12 }, (_, month) => {
      const monthTransactions = categoryTransactions.filter(t => t.date.getMonth() === month);
      return {
        month: month + 1,
        amount: monthTransactions.reduce((sum, t) => sum + t.amount, 0)
      };
    });
    
    // Top merchants
    const merchantAmounts = new Map<string, { amount: number; count: number }>();
    categoryTransactions.forEach(t => {
      const merchant = this.extractMerchantName(t.description);
      const current = merchantAmounts.get(merchant) || { amount: 0, count: 0 };
      merchantAmounts.set(merchant, {
        amount: current.amount + t.amount,
        count: current.count + 1
      });
    });
    
    const topMerchants = Array.from(merchantAmounts.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
    
    // Unusual transactions (outliers)
    const amounts = categoryTransactions.map(t => t.amount);
    const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const variance = amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    
    const unusualTransactions = categoryTransactions.filter(t => 
      Math.abs(t.amount - mean) > 2 * stdDev
    ).slice(0, 5);
    
    return {
      category,
      totalAmount,
      transactionCount: categoryTransactions.length,
      averageAmount,
      monthlyTrend,
      seasonality,
      topMerchants,
      unusualTransactions
    };
  }

  // Group similar transactions
  private groupSimilarTransactions(): Transaction[][] {
    const groups: Transaction[][] = [];
    const processed = new Set<string>();
    
    this.transactions.forEach(transaction => {
      if (processed.has(transaction.id)) return;
      
      const similarTransactions = this.transactions.filter(t => 
        !processed.has(t.id) &&
        t.type === transaction.type &&
        this.calculateSimilarity(
          this.normalizeText(transaction.description),
          this.normalizeText(t.description)
        ) > 0.7
      );
      
      if (similarTransactions.length > 1) {
        groups.push(similarTransactions);
        similarTransactions.forEach(t => processed.add(t.id));
      }
    });
    
    return groups;
  }

  // Calculate text similarity
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  // Normalize text for comparison
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  // Extract merchant name from description
  private extractMerchantName(description: string): string {
    // Simple merchant name extraction
    const normalized = this.normalizeText(description);
    const words = normalized.split(' ');
    
    // Return first 2-3 meaningful words
    const meaningfulWords = words.filter(word => 
      word.length > 2 && 
      !['pag', 'compra', 'pagamento', 'em', 'de', 'no', 'na', 'do', 'da'].includes(word)
    );
    
    return meaningfulWords.slice(0, 3).join(' ') || description;
  }

  // Create new category rule
  addCustomRule(rule: Omit<CategoryRule, 'id'>): void {
    const newRule: CategoryRule = {
      ...rule,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.rules.push(newRule);
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  // Export rules for backup
  exportRules(): CategoryRule[] {
    return this.rules.filter(rule => rule.id.startsWith('custom-'));
  }

  // Import custom rules
  importRules(rules: CategoryRule[]): void {
    // Remove existing custom rules
    this.rules = this.rules.filter(rule => !rule.id.startsWith('custom-'));
    
    // Add imported rules
    this.rules.push(...rules);
    this.rules.sort((a, b) => a.priority - b.priority);
  }
}

export default SmartCategoryManager;
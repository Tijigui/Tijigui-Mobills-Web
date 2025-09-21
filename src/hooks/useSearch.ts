import { useState, useMemo, useCallback } from 'react';
import { Transaction, Account, CreditCard } from '@/types/financial';
import { FinancialGoal, Budget } from '@/types/goals';

export interface SearchFilters {
  query: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  categories?: string[];
  accounts?: string[];
  type?: 'income' | 'expense' | 'all';
  recurring?: boolean;
  tags?: string[];
}

export interface SearchResult<T> {
  item: T;
  score: number;
  matches: {
    field: string;
    value: string;
    highlight: string;
  }[];
}

export interface SearchResults {
  transactions: SearchResult<Transaction>[];
  accounts: SearchResult<Account>[];
  creditCards: SearchResult<CreditCard>[];
  goals: SearchResult<FinancialGoal>[];
  budgets: SearchResult<Budget>[];
  totalCount: number;
}

class SearchEngine {
  // Normalize text for search
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .trim();
  }

  // Calculate similarity score between two strings
  private calculateSimilarity(query: string, text: string): number {
    const normalizedQuery = this.normalizeText(query);
    const normalizedText = this.normalizeText(text);
    
    if (normalizedText.includes(normalizedQuery)) {
      // Exact match gets higher score
      return normalizedText === normalizedQuery ? 1 : 0.9;
    }
    
    // Fuzzy matching for partial matches
    const words = normalizedQuery.split(' ');
    const textWords = normalizedText.split(' ');
    
    let matchCount = 0;
    words.forEach(word => {
      if (word.length > 2) {
        textWords.forEach(textWord => {
          if (textWord.includes(word) || word.includes(textWord)) {
            matchCount++;
          }
        });
      }
    });
    
    return matchCount / words.length;
  }

  // Highlight matches in text
  private highlightMatches(text: string, query: string): string {
    const normalizedQuery = this.normalizeText(query);
    const words = normalizedQuery.split(' ').filter(w => w.length > 1);
    
    let highlighted = text;
    words.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });
    
    return highlighted;
  }

  // Search transactions
  searchTransactions(
    transactions: Transaction[],
    filters: SearchFilters
  ): SearchResult<Transaction>[] {
    return transactions
      .map(transaction => {
        let score = 0;
        const matches: { field: string; value: string; highlight: string }[] = [];
        
        // Apply filters first
        if (filters.type && filters.type !== 'all' && transaction.type !== filters.type) {
          return null;
        }
        
        if (filters.dateRange) {
          if (transaction.date < filters.dateRange.from || transaction.date > filters.dateRange.to) {
            return null;
          }
        }
        
        if (filters.amountRange) {
          if (transaction.amount < filters.amountRange.min || transaction.amount > filters.amountRange.max) {
            return null;
          }
        }
        
        if (filters.categories && filters.categories.length > 0) {
          if (!filters.categories.includes(transaction.category)) {
            return null;
          }
        }
        
        if (filters.accounts && filters.accounts.length > 0) {
          if (!filters.accounts.includes(transaction.account)) {
            return null;
          }
        }
        
        if (filters.recurring !== undefined && transaction.recurring !== filters.recurring) {
          return null;
        }
        
        if (filters.tags && filters.tags.length > 0) {
          const transactionTags = transaction.tags || [];
          const hasMatchingTag = filters.tags.some(tag => transactionTags.includes(tag));
          if (!hasMatchingTag) {
            return null;
          }
        }
        
        // Text search
        if (filters.query) {
          // Search in description
          const descScore = this.calculateSimilarity(filters.query, transaction.description);
          if (descScore > 0) {
            score += descScore * 2; // Description matches are more important
            matches.push({
              field: 'description',
              value: transaction.description,
              highlight: this.highlightMatches(transaction.description, filters.query)
            });
          }
          
          // Search in category
          const catScore = this.calculateSimilarity(filters.query, transaction.category);
          if (catScore > 0) {
            score += catScore;
            matches.push({
              field: 'category',
              value: transaction.category,
              highlight: this.highlightMatches(transaction.category, filters.query)
            });
          }
          
          // Search in account
          const accScore = this.calculateSimilarity(filters.query, transaction.account);
          if (accScore > 0) {
            score += accScore;
            matches.push({
              field: 'account',
              value: transaction.account,
              highlight: this.highlightMatches(transaction.account, filters.query)
            });
          }
          
          // Search in tags
          if (transaction.tags) {
            transaction.tags.forEach(tag => {
              const tagScore = this.calculateSimilarity(filters.query, tag);
              if (tagScore > 0) {
                score += tagScore * 0.5;
                matches.push({
                  field: 'tags',
                  value: tag,
                  highlight: this.highlightMatches(tag, filters.query)
                });
              }
            });
          }
          
          // If no text matches found and query exists, filter out
          if (score === 0) {
            return null;
          }
        } else {
          score = 1; // No search query, include all filtered items
        }
        
        return { item: transaction, score, matches };
      })
      .filter((result): result is SearchResult<Transaction> => result !== null)
      .sort((a, b) => b.score - a.score);
  }

  // Search accounts
  searchAccounts(
    accounts: Account[],
    query: string
  ): SearchResult<Account>[] {
    if (!query) {
      return accounts.map(account => ({ item: account, score: 1, matches: [] }));
    }
    
    return accounts
      .map(account => {
        let score = 0;
        const matches: { field: string; value: string; highlight: string }[] = [];
        
        // Search in name
        const nameScore = this.calculateSimilarity(query, account.name);
        if (nameScore > 0) {
          score += nameScore * 2;
          matches.push({
            field: 'name',
            value: account.name,
            highlight: this.highlightMatches(account.name, query)
          });
        }
        
        // Search in bank
        const bankScore = this.calculateSimilarity(query, account.bank);
        if (bankScore > 0) {
          score += bankScore;
          matches.push({
            field: 'bank',
            value: account.bank,
            highlight: this.highlightMatches(account.bank, query)
          });
        }
        
        return score > 0 ? { item: account, score, matches } : null;
      })
      .filter((result): result is SearchResult<Account> => result !== null)
      .sort((a, b) => b.score - a.score);
  }

  // Search credit cards
  searchCreditCards(
    creditCards: CreditCard[],
    query: string
  ): SearchResult<CreditCard>[] {
    if (!query) {
      return creditCards.map(card => ({ item: card, score: 1, matches: [] }));
    }
    
    return creditCards
      .map(card => {
        let score = 0;
        const matches: { field: string; value: string; highlight: string }[] = [];
        
        // Search in name
        const nameScore = this.calculateSimilarity(query, card.name);
        if (nameScore > 0) {
          score += nameScore * 2;
          matches.push({
            field: 'name',
            value: card.name,
            highlight: this.highlightMatches(card.name, query)
          });
        }
        
        // Search in bank
        const bankScore = this.calculateSimilarity(query, card.bank);
        if (bankScore > 0) {
          score += bankScore;
          matches.push({
            field: 'bank',
            value: card.bank,
            highlight: this.highlightMatches(card.bank, query)
          });
        }
        
        return score > 0 ? { item: card, score, matches } : null;
      })
      .filter((result): result is SearchResult<CreditCard> => result !== null)
      .sort((a, b) => b.score - a.score);
  }

  // Search goals
  searchGoals(
    goals: FinancialGoal[],
    query: string
  ): SearchResult<FinancialGoal>[] {
    if (!query) {
      return goals.map(goal => ({ item: goal, score: 1, matches: [] }));
    }
    
    return goals
      .map(goal => {
        let score = 0;
        const matches: { field: string; value: string; highlight: string }[] = [];
        
        // Search in title
        const titleScore = this.calculateSimilarity(query, goal.title);
        if (titleScore > 0) {
          score += titleScore * 2;
          matches.push({
            field: 'title',
            value: goal.title,
            highlight: this.highlightMatches(goal.title, query)
          });
        }
        
        // Search in description
        if (goal.description) {
          const descScore = this.calculateSimilarity(query, goal.description);
          if (descScore > 0) {
            score += descScore;
            matches.push({
              field: 'description',
              value: goal.description,
              highlight: this.highlightMatches(goal.description, query)
            });
          }
        }
        
        return score > 0 ? { item: goal, score, matches } : null;
      })
      .filter((result): result is SearchResult<FinancialGoal> => result !== null)
      .sort((a, b) => b.score - a.score);
  }

  // Search budgets
  searchBudgets(
    budgets: Budget[],
    query: string
  ): SearchResult<Budget>[] {
    if (!query) {
      return budgets.map(budget => ({ item: budget, score: 1, matches: [] }));
    }
    
    return budgets
      .map(budget => {
        let score = 0;
        const matches: { field: string; value: string; highlight: string }[] = [];
        
        // Search in category
        const categoryScore = this.calculateSimilarity(query, budget.category);
        if (categoryScore > 0) {
          score += categoryScore * 2;
          matches.push({
            field: 'category',
            value: budget.category,
            highlight: this.highlightMatches(budget.category, query)
          });
        }
        
        return score > 0 ? { item: budget, score, matches } : null;
      })
      .filter((result): result is SearchResult<Budget> => result !== null)
      .sort((a, b) => b.score - a.score);
  }
}

export const useSearch = (
  transactions: Transaction[],
  accounts: Account[],
  creditCards: CreditCard[],
  goals: FinancialGoal[],
  budgets: Budget[]
) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: 'all'
  });
  
  const searchEngine = useMemo(() => new SearchEngine(), []);
  
  const results = useMemo(() => {
    const transactionResults = searchEngine.searchTransactions(transactions, filters);
    const accountResults = searchEngine.searchAccounts(accounts, filters.query);
    const creditCardResults = searchEngine.searchCreditCards(creditCards, filters.query);
    const goalResults = searchEngine.searchGoals(goals, filters.query);
    const budgetResults = searchEngine.searchBudgets(budgets, filters.query);
    
    return {
      transactions: transactionResults,
      accounts: accountResults,
      creditCards: creditCardResults,
      goals: goalResults,
      budgets: budgetResults,
      totalCount: transactionResults.length + accountResults.length + 
                  creditCardResults.length + goalResults.length + budgetResults.length
    };
  }, [searchEngine, transactions, accounts, creditCards, goals, budgets, filters]);
  
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters({ query: '', type: 'all' });
  }, []);
  
  const setQuery = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, query }));
  }, []);
  
  const hasActiveFilters = useMemo(() => {
    return filters.query !== '' || 
           filters.dateRange !== undefined ||
           filters.amountRange !== undefined ||
           (filters.categories && filters.categories.length > 0) ||
           (filters.accounts && filters.accounts.length > 0) ||
           filters.type !== 'all' ||
           filters.recurring !== undefined ||
           (filters.tags && filters.tags.length > 0);
  }, [filters]);
  
  return {
    filters,
    results,
    updateFilters,
    clearFilters,
    setQuery,
    hasActiveFilters
  };
};

export default useSearch;
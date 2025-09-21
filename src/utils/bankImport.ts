import { Transaction } from '@/types/financial';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ImportResult {
  success: boolean;
  transactions: Transaction[];
  errors: string[];
  warnings: string[];
  duplicates: number;
  imported: number;
}

export interface BankMapping {
  dateColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  typeColumn?: string;
  categoryColumn?: string;
  accountColumn?: string;
  balanceColumn?: string;
  dateFormat: string;
  encoding?: string;
  delimiter?: string;
  hasHeaders?: boolean;
}

// Pre-defined bank mappings
export const BANK_MAPPINGS: Record<string, BankMapping> = {
  'nubank': {
    dateColumn: 'date',
    descriptionColumn: 'description',
    amountColumn: 'amount',
    typeColumn: 'category',
    dateFormat: 'yyyy-MM-dd',
    delimiter: ',',
    hasHeaders: true,
  },
  'santander': {
    dateColumn: 'Data',
    descriptionColumn: 'Descrição',
    amountColumn: 'Valor',
    dateFormat: 'dd/MM/yyyy',
    delimiter: ';',
    hasHeaders: true,
  },
  'bradesco': {
    dateColumn: 'Data',
    descriptionColumn: 'Histórico',
    amountColumn: 'Valor',
    dateFormat: 'dd/MM/yyyy',
    delimiter: ',',
    hasHeaders: true,
  },
  'itau': {
    dateColumn: 'data',
    descriptionColumn: 'descricao',
    amountColumn: 'valor',
    dateFormat: 'dd/MM/yyyy',
    delimiter: ',',
    hasHeaders: true,
  },
  'bb': {
    dateColumn: 'Data',
    descriptionColumn: 'Histórico',
    amountColumn: 'Valor',
    dateFormat: 'dd/MM/yyyy',
    delimiter: ';',
    hasHeaders: true,
  },
  'caixa': {
    dateColumn: 'Data',
    descriptionColumn: 'Descrição',
    amountColumn: 'Valor',
    dateFormat: 'dd/MM/yyyy',
    delimiter: ';',
    hasHeaders: true,
  },
};

// CSV Parser
class CSVParser {
  private delimiter: string;
  private hasHeaders: boolean;

  constructor(delimiter: string = ',', hasHeaders: boolean = true) {
    this.delimiter = delimiter;
    this.hasHeaders = hasHeaders;
  }

  parse(csvContent: string): any[] {
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      return [];
    }

    const headers = this.hasHeaders ? this.parseLine(lines[0]) : null;
    const dataLines = this.hasHeaders ? lines.slice(1) : lines;

    return dataLines.map((line, index) => {
      const values = this.parseLine(line);
      
      if (headers) {
        const row: any = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        return row;
      } else {
        return values;
      }
    });
  }

  private parseLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === this.delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }
}

// OFX Parser (simplified)
class OFXParser {
  parse(ofxContent: string): any[] {
    const transactions: any[] = [];
    
    // Simple regex-based parsing for basic OFX structure
    const stmtTrnPattern = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
    let match;
    
    while ((match = stmtTrnPattern.exec(ofxContent)) !== null) {
      const trnContent = match[1];
      
      const transaction: any = {};
      
      // Extract transaction fields
      const patterns = {
        TRNTYPE: /<TRNTYPE>([^<]+)/,
        DTPOSTED: /<DTPOSTED>([^<]+)/,
        TRNAMT: /<TRNAMT>([^<]+)/,
        FITID: /<FITID>([^<]+)/,
        MEMO: /<MEMO>([^<]+)/,
        NAME: /<NAME>([^<]+)/,
      };
      
      Object.entries(patterns).forEach(([key, pattern]) => {
        const fieldMatch = trnContent.match(pattern);
        if (fieldMatch) {
          transaction[key] = fieldMatch[1].trim();
        }
      });
      
      if (transaction.DTPOSTED && transaction.TRNAMT) {
        transactions.push(transaction);
      }
    }
    
    return transactions;
  }
}

// Main import class
export class BankDataImporter {
  private existingTransactions: Transaction[];

  constructor(existingTransactions: Transaction[] = []) {
    this.existingTransactions = existingTransactions;
  }

  // Import from CSV
  async importFromCSV(
    file: File,
    mapping: BankMapping,
    accountName: string = 'Importação'
  ): Promise<ImportResult> {
    try {
      const content = await this.readFile(file);
      const parser = new CSVParser(mapping.delimiter, mapping.hasHeaders);
      const rows = parser.parse(content);
      
      return this.processRows(rows, mapping, accountName, 'csv');
    } catch (error) {
      return {
        success: false,
        transactions: [],
        errors: [`Erro ao processar arquivo CSV: ${error}`],
        warnings: [],
        duplicates: 0,
        imported: 0,
      };
    }
  }

  // Import from OFX
  async importFromOFX(
    file: File,
    accountName: string = 'Importação'
  ): Promise<ImportResult> {
    try {
      const content = await this.readFile(file);
      const parser = new OFXParser();
      const transactions = parser.parse(content);
      
      const ofxMapping: BankMapping = {
        dateColumn: 'DTPOSTED',
        descriptionColumn: 'MEMO',
        amountColumn: 'TRNAMT',
        typeColumn: 'TRNTYPE',
        dateFormat: 'yyyyMMdd',
      };
      
      return this.processRows(transactions, ofxMapping, accountName, 'ofx');
    } catch (error) {
      return {
        success: false,
        transactions: [],
        errors: [`Erro ao processar arquivo OFX: ${error}`],
        warnings: [],
        duplicates: 0,
        imported: 0,
      };
    }
  }

  // Auto-detect bank format
  detectBankFormat(filename: string, content: string): string | null {
    const lowerFilename = filename.toLowerCase();
    
    // Check filename patterns
    for (const [bank, mapping] of Object.entries(BANK_MAPPINGS)) {
      if (lowerFilename.includes(bank)) {
        return bank;
      }
    }
    
    // Check content patterns
    const lines = content.split('\n').slice(0, 5); // Check first 5 lines
    const headerLine = lines[0]?.toLowerCase() || '';
    
    // Nubank pattern
    if (headerLine.includes('date') && headerLine.includes('description') && headerLine.includes('amount')) {
      return 'nubank';
    }
    
    // Santander pattern
    if (headerLine.includes('data') && headerLine.includes('descrição')) {
      return 'santander';
    }
    
    // Bradesco pattern
    if (headerLine.includes('histórico')) {
      return 'bradesco';
    }
    
    return null;
  }

  // Process rows into transactions
  private processRows(
    rows: any[],
    mapping: BankMapping,
    accountName: string,
    fileType: string
  ): ImportResult {
    const result: ImportResult = {
      success: true,
      transactions: [],
      errors: [],
      warnings: [],
      duplicates: 0,
      imported: 0,
    };

    rows.forEach((row, index) => {
      try {
        const transaction = this.convertRowToTransaction(row, mapping, accountName, fileType);
        
        if (transaction) {
          // Check for duplicates
          const isDuplicate = this.isDuplicateTransaction(transaction);
          
          if (isDuplicate) {
            result.duplicates++;
            result.warnings.push(`Linha ${index + 1}: Transação duplicada ignorada`);
          } else {
            result.transactions.push(transaction);
            result.imported++;
          }
        }
      } catch (error) {
        result.errors.push(`Linha ${index + 1}: ${error}`);
      }
    });

    if (result.errors.length > 0) {
      result.success = false;
    }

    return result;
  }

  // Convert row to transaction
  private convertRowToTransaction(
    row: any,
    mapping: BankMapping,
    accountName: string,
    fileType: string
  ): Transaction | null {
    // Extract date
    const dateStr = row[mapping.dateColumn];
    if (!dateStr) {
      throw new Error('Data não encontrada');
    }

    let transactionDate: Date;
    
    if (fileType === 'ofx' && mapping.dateFormat === 'yyyyMMdd') {
      // OFX date format: YYYYMMDDHHMMSS or YYYYMMDD
      const dateOnly = dateStr.substring(0, 8);
      transactionDate = parse(dateOnly, 'yyyyMMdd', new Date());
    } else {
      transactionDate = parse(dateStr, mapping.dateFormat, new Date());
    }

    if (isNaN(transactionDate.getTime())) {
      throw new Error(`Data inválida: ${dateStr}`);
    }

    // Extract description
    const description = row[mapping.descriptionColumn] || 'Transação importada';
    
    // Extract amount
    const amountStr = row[mapping.amountColumn];
    if (!amountStr) {
      throw new Error('Valor não encontrado');
    }

    let amount = parseFloat(
      amountStr
        .toString()
        .replace(/[^\d,.-]/g, '') // Remove non-numeric characters except comma, dot, minus
        .replace(',', '.') // Convert comma to dot for decimal
    );

    if (isNaN(amount)) {
      throw new Error(`Valor inválido: ${amountStr}`);
    }

    // Determine transaction type
    let type: 'income' | 'expense';
    
    if (mapping.typeColumn && row[mapping.typeColumn]) {
      const typeValue = row[mapping.typeColumn].toString().toLowerCase();
      
      if (fileType === 'ofx') {
        // OFX types
        type = ['credit', 'dep', 'directdep'].includes(typeValue) ? 'income' : 'expense';
      } else {
        // CSV types - check for common income indicators
        type = ['receita', 'crédito', 'depósito', 'salário', 'renda'].some(term => 
          typeValue.includes(term)
        ) ? 'income' : 'expense';
      }
    } else {
      // Determine by amount sign
      type = amount >= 0 ? 'income' : 'expense';
      amount = Math.abs(amount);
    }

    // Generate category based on description
    const category = this.categorizeTransaction(description);

    return {
      id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: description.trim(),
      amount,
      type,
      category,
      account: accountName,
      date: transactionDate,
      recurring: false,
      tags: ['importação', fileType],
    };
  }

  // Simple transaction categorization
  private categorizeTransaction(description: string): string {
    const desc = description.toLowerCase();
    
    // Income categories
    if (/salário|salario|ordenado|vencimento/.test(desc)) return 'Salário';
    if (/freelance|autônomo|autonomo|serviços|servicos/.test(desc)) return 'Freelance';
    if (/investimento|dividendo|rendimento|juros/.test(desc)) return 'Investimentos';
    
    // Expense categories
    if (/mercado|supermercado|alimentação|alimentacao|comida|restaurante/.test(desc)) return 'Alimentação';
    if (/transporte|combustível|combustivel|gasolina|uber|taxi|ônibus|onibus/.test(desc)) return 'Transporte';
    if (/aluguel|condomínio|condominio|água|agua|luz|energia|internet|telefone/.test(desc)) return 'Moradia';
    if (/médico|medico|hospital|farmácia|farmacia|saúde|saude/.test(desc)) return 'Saúde';
    if (/cinema|teatro|show|lazer|diversão|diversao/.test(desc)) return 'Lazer';
    if (/roupa|sapato|shopping|vestuário|vestuario/.test(desc)) return 'Vestuário';
    if (/escola|faculdade|curso|educação|educacao|livro/.test(desc)) return 'Educação';
    
    return 'Outros';
  }

  // Check for duplicate transactions
  private isDuplicateTransaction(transaction: Transaction): boolean {
    return this.existingTransactions.some(existing => 
      existing.description === transaction.description &&
      existing.amount === transaction.amount &&
      existing.type === transaction.type &&
      Math.abs(existing.date.getTime() - transaction.date.getTime()) < 24 * 60 * 60 * 1000 // Same day
    );
  }

  // Read file content
  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'));
      };
      
      reader.readAsText(file, 'UTF-8');
    });
  }

  // Validate file format
  static validateFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = [
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel',
      'application/x-ofx',
      'text/plain'
    ];
    
    const allowedExtensions = ['.csv', '.ofx', '.qfx', '.txt'];
    
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: 'Tipo de arquivo não suportado. Use CSV ou OFX.'
      };
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return {
        valid: false,
        error: 'Arquivo muito grande. Limite de 10MB.'
      };
    }
    
    return { valid: true };
  }
}

export default BankDataImporter;
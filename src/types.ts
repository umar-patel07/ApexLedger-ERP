export type UserRole = 'ADMIN' | 'ACCOUNTANT' | 'VIEWER';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export type ActivityLog = AuditLog;

export interface CompanyProfile {
  id: number;
  companyName: string;
  name?: string;
  taxId: string;
  taxNumber?: string;
  email: string;
  phone: string;
  address: string;
  country?: string;
  currency: string;
  currencySymbol: string;
  fiscalYearStart: string;
  website: string;
}

export interface Customer {
  id: number;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  creditLimit: number;
  balance: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'ACTIVE' | 'INACTIVE';
  totalInvoiced: number;
  totalPaid: number;
}

export interface Supplier {
  id: number;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  balance: number;
  paymentTerms: string;
  status: 'ACTIVE' | 'INACTIVE';
  totalPurchased: number;
  totalPaid: number;
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  categoryId: number;
  categoryName?: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStockAlert: number;
  unit: string;
  status: 'ACTIVE' | 'DISCONTINUED';
  profitMargin?: number;
  profitPerUnit?: number;
  totalValuation?: number;
}

export interface InvoiceItem {
  id?: number;
  invoiceId?: number;
  productId: number;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  costPriceSnapshot: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  customerId: number;
  customerName?: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE';
  status: 'ACTIVE' | 'CANCELLED';
  notes: string;
  createdBy: string;
  items?: InvoiceItem[];
}

export interface PurchaseItem {
  id?: number;
  purchaseId?: number;
  productId: number;
  productName: string;
  productCode: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Purchase {
  id: number;
  purchaseNumber: string;
  supplierId: number;
  supplierName?: string;
  purchaseDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  status: 'ACTIVE' | 'CANCELLED';
  notes: string;
  createdBy: string;
  items?: PurchaseItem[];
}

export interface Expense {
  id: number;
  expenseNumber: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'CASH' | 'BANK' | 'CREDIT_CARD';
  paymentAccountCode: string;
  expenseDate: string;
  status: 'ACTIVE' | 'CANCELLED';
  createdBy: string;
}

export interface Payment {
  id: number;
  paymentNumber: string;
  referenceType: 'INVOICE' | 'PURCHASE' | 'DIRECT';
  referenceId: number;
  partyType: 'CUSTOMER' | 'SUPPLIER';
  partyId: number;
  partyName?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'ONLINE';
  accountCode: string;
  status: 'ACTIVE' | 'CANCELLED';
  notes: string;
  createdBy: string;
}

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface ChartOfAccount {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  normalBalance: 'DEBIT' | 'CREDIT';
  balance: number;
  description: string;
  isSystem: boolean;
}

export interface JournalEntryLine {
  id?: number;
  journalEntryId?: number;
  accountCode: string;
  accountName?: string;
  debit: number;
  credit: number;
  description: string;
}

export interface JournalEntry {
  id: number;
  entryNumber: string;
  entryDate: string;
  description: string;
  referenceType: string;
  referenceId: number;
  status: 'ACTIVE' | 'CANCELLED';
  createdAt: string;
  createdBy: string;
  totalDebit?: number;
  totalCredit?: number;
  lines: JournalEntryLine[];
}

export interface Budget {
  id: number;
  category: string;
  fiscalPeriod: string;
  budgetAmount: number;
  actualAmount: number;
  actualSpent?: number;
  variance: number;
  variancePercent: number;
  alertThresholdPercent: number;
  isExceeded: boolean;
}

export interface RecurringTransaction {
  id: number;
  title: string;
  transactionType: 'EXPENSE' | 'INVOICE' | 'TRANSFER';
  amount: number;
  frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  nextRunDate: string;
  category: string;
  status: 'ACTIVE' | 'PAUSED';
}

export interface AuditLog {
  id: number;
  userId: number;
  username: string;
  action: string;
  entityType: string;
  entityId: number;
  details: string;
  timestamp: string;
}

export interface FinancialHealthMetrics {
  healthScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  liquidityRatio: number;
  netProfitMargin: number;
  operatingCashFlow: number;
  debtToEquity: number;
  insights: string[];
  anomalies: {
    category: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    amount: number;
  }[];
  forecast: {
    period: string;
    projectedInflow: number;
    projectedOutflow: number;
    netCashFlow: number;
  }[];
}

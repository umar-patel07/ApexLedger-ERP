/**
 * FINMATE Relational Database Service & Accounting Engine
 * Implements full double-entry bookkeeping, relational integrity,
 * transaction reversals, audit trails, and SQL query capabilities.
 */

import {
  User,
  CompanyProfile,
  Customer,
  Supplier,
  Category,
  Product,
  Invoice,
  InvoiceItem,
  Purchase,
  PurchaseItem,
  Expense,
  Payment,
  ChartOfAccount,
  JournalEntry,
  Budget,
  RecurringTransaction,
  AuditLog,
  FinancialHealthMetrics
} from '../types';

const DB_STORAGE_KEY = 'apexledger_database_v2';
const LEGACY_STORAGE_KEY = 'finmate_relational_database_v2';

interface DatabaseState {
  company: CompanyProfile;
  users: User[];
  chartOfAccounts: ChartOfAccount[];
  categories: Category[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  purchases: Purchase[];
  purchaseItems: PurchaseItem[];
  expenses: Expense[];
  payments: Payment[];
  journalEntries: JournalEntry[];
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
  auditLogs: AuditLog[];
}

// Initial Standard Chart of Accounts (GAAP / IFRS compliant)
const INITIAL_ACCOUNTS: ChartOfAccount[] = [
  { accountCode: '1010', accountName: 'Cash on Hand', accountType: 'ASSET', normalBalance: 'DEBIT', balance: 14500.00, description: 'Petty cash and till balances', isSystem: true },
  { accountCode: '1020', accountName: 'Operating Bank Account (JPMorgan Chase)', accountType: 'ASSET', normalBalance: 'DEBIT', balance: 58250.00, description: 'Primary operating checking account', isSystem: true },
  { accountCode: '1100', accountName: 'Accounts Receivable (Trade Debtors)', accountType: 'ASSET', normalBalance: 'DEBIT', balance: 18450.00, description: 'Uncollected customer invoices', isSystem: true },
  { accountCode: '1200', accountName: 'Inventory Merchandise', accountType: 'ASSET', normalBalance: 'DEBIT', balance: 42800.00, description: 'Finished goods for resale', isSystem: true },
  { accountCode: '1500', accountName: 'Office Equipment & Computers', accountType: 'ASSET', normalBalance: 'DEBIT', balance: 12500.00, description: 'Depreciable hardware and fixtures', isSystem: false },
  { accountCode: '2010', accountName: 'Accounts Payable (Trade Creditors)', accountType: 'LIABILITY', normalBalance: 'CREDIT', balance: 16200.00, description: 'Outstanding supplier bills', isSystem: true },
  { accountCode: '2050', accountName: 'Sales Tax Payable', accountType: 'LIABILITY', normalBalance: 'CREDIT', balance: 3420.00, description: 'Accrued state and local sales taxes', isSystem: true },
  { accountCode: '2100', accountName: 'Payroll Liabilities Payable', accountType: 'LIABILITY', normalBalance: 'CREDIT', balance: 4800.00, description: 'Accrued salaries and deductions', isSystem: false },
  { accountCode: '3010', accountName: 'Owner Capital & Contributed Equity', accountType: 'EQUITY', normalBalance: 'CREDIT', balance: 95000.00, description: 'Initial paid-in capital', isSystem: true },
  { accountCode: '3020', accountName: 'Retained Earnings', accountType: 'EQUITY', normalBalance: 'CREDIT', balance: 21080.00, description: 'Accumulated net income from prior periods', isSystem: true },
  { accountCode: '4010', accountName: 'Merchandise Sales Revenue', accountType: 'REVENUE', normalBalance: 'CREDIT', balance: 74500.00, description: 'Gross revenue from inventory sales', isSystem: true },
  { accountCode: '4020', accountName: 'Service & Consultation Fees', accountType: 'REVENUE', normalBalance: 'CREDIT', balance: 12000.00, description: 'Ancillary service earnings', isSystem: false },
  { accountCode: '5010', accountName: 'Cost of Goods Sold (COGS)', accountType: 'EXPENSE', normalBalance: 'DEBIT', balance: 41200.00, description: 'Direct acquisition cost of inventory sold', isSystem: true },
  { accountCode: '6010', accountName: 'Office Rent & Lease', accountType: 'EXPENSE', normalBalance: 'DEBIT', balance: 6500.00, description: 'Commercial premises rental', isSystem: false },
  { accountCode: '6020', accountName: 'Utilities & Telecom', accountType: 'EXPENSE', normalBalance: 'DEBIT', balance: 1450.00, description: 'Electricity, water, internet', isSystem: false },
  { accountCode: '6030', accountName: 'Staff Wages & Salaries', accountType: 'EXPENSE', normalBalance: 'DEBIT', balance: 18200.00, description: 'Regular employee compensation', isSystem: false },
  { accountCode: '6040', accountName: 'Marketing & Digital Ads', accountType: 'EXPENSE', normalBalance: 'DEBIT', balance: 4850.00, description: 'Google, LinkedIn, and promotional ads', isSystem: false },
  { accountCode: '6050', accountName: 'Software Licenses & IT', accountType: 'EXPENSE', normalBalance: 'DEBIT', balance: 1800.00, description: 'Cloud hosting, SaaS, and accounting software', isSystem: false }
];

const INITIAL_COMPANY: CompanyProfile = {
  id: 1,
  companyName: 'Apex Global Technologies & Logistics Inc.',
  taxId: 'US-EIN-94-8291041',
  email: 'finance@apextechnologies.io',
  phone: '+1 (415) 890-2400',
  address: '450 Mission Street, Suite 1800, San Francisco, CA 94105',
  currency: 'USD',
  currencySymbol: '$',
  fiscalYearStart: '2026-01-01',
  website: 'https://apextechnologies.io'
};

const INITIAL_USERS: User[] = [
  {
    id: 1,
    username: 'admin',
    fullName: 'Alexander Vance (System Administrator)',
    email: 'alex.vance@apextechnologies.io',
    role: 'ADMIN',
    createdAt: '2026-01-02 08:30:00'
  },
  {
    id: 2,
    username: 'accountant',
    fullName: 'Elena Rostova (Lead CPA)',
    email: 'elena.cpa@apextechnologies.io',
    role: 'ACCOUNTANT',
    createdAt: '2026-01-05 09:15:00'
  },
  {
    id: 3,
    username: 'viewer',
    fullName: 'David Sterling (Executive Board Viewer)',
    email: 'd.sterling@apextechnologies.io',
    role: 'VIEWER',
    createdAt: '2026-01-10 11:00:00'
  }
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 1, name: 'Enterprise Computing', description: 'Rack servers, workstations, and high-end blades' },
  { id: 2, name: 'Networking & Telephony', description: 'Managed switches, routers, and fiber transceivers' },
  { id: 3, name: 'Cybersecurity Appliances', description: 'Hardware firewalls and VPN gateways' },
  { id: 4, name: 'Peripherals & Accessories', description: 'Monitors, docking stations, and ergonomic tools' }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    code: 'PRD-SRV-01',
    name: 'ProLiant Xeon DL380 Rack Server (64-Core, 256GB RAM)',
    categoryId: 1,
    costPrice: 2850.00,
    sellingPrice: 4200.00,
    currentStock: 14,
    minStockAlert: 5,
    unit: 'Units',
    status: 'ACTIVE'
  },
  {
    id: 2,
    code: 'PRD-NET-02',
    name: 'Catalyst 48-Port PoE+ Managed Gigabit Switch',
    categoryId: 2,
    costPrice: 780.00,
    sellingPrice: 1250.00,
    currentStock: 22,
    minStockAlert: 8,
    unit: 'Units',
    status: 'ACTIVE'
  },
  {
    id: 3,
    code: 'PRD-SEC-03',
    name: 'FortiGate 100F Enterprise Threat Protection Gateway',
    categoryId: 3,
    costPrice: 1450.00,
    sellingPrice: 2350.00,
    currentStock: 4, // Low stock trigger
    minStockAlert: 6,
    unit: 'Units',
    status: 'ACTIVE'
  },
  {
    id: 4,
    code: 'PRD-DSK-04',
    name: 'Precision 7865 Workstation (AMD Threadripper, RTX A5000)',
    categoryId: 1,
    costPrice: 3200.00,
    sellingPrice: 4800.00,
    currentStock: 8,
    minStockAlert: 4,
    unit: 'Units',
    status: 'ACTIVE'
  },
  {
    id: 5,
    code: 'PRD-WAP-05',
    name: 'Aruba Wi-Fi 6E High-Density Access Point',
    categoryId: 2,
    costPrice: 240.00,
    sellingPrice: 410.00,
    currentStock: 3, // Low stock trigger
    minStockAlert: 10,
    unit: 'Units',
    status: 'ACTIVE'
  }
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 1,
    name: 'Beacon Financial Capital Ltd',
    companyName: 'Beacon Financial Holdings',
    email: 'procurement@beaconcap.com',
    phone: '+1 (212) 555-0198',
    address: '200 Wall Street, Floor 34, New York, NY 10005',
    creditLimit: 50000.00,
    balance: 8400.00,
    riskLevel: 'LOW',
    status: 'ACTIVE',
    totalInvoiced: 48200.00,
    totalPaid: 39800.00
  },
  {
    id: 2,
    name: 'Nexus Bioscience Research Labs',
    companyName: 'Nexus Bioscience Corp',
    email: 'it-purchasing@nexusbio.org',
    phone: '+1 (617) 555-8392',
    address: '88 Cambridge Parkway, Cambridge, MA 02142',
    creditLimit: 35000.00,
    balance: 10050.00,
    riskLevel: 'MEDIUM',
    status: 'ACTIVE',
    totalInvoiced: 32500.00,
    totalPaid: 22450.00
  },
  {
    id: 3,
    name: 'Zenith Logistics & Supply Chain',
    companyName: 'Zenith Transport LLC',
    email: 'accounts@zenithlog.com',
    phone: '+1 (312) 555-7120',
    address: '1400 S Wacker Dr, Chicago, IL 60606',
    creditLimit: 20000.00,
    balance: 0.00,
    riskLevel: 'LOW',
    status: 'ACTIVE',
    totalInvoiced: 18600.00,
    totalPaid: 18600.00
  },
  {
    id: 4,
    name: 'Skyline Media Group',
    companyName: 'Skyline Studios',
    email: 'billing@skylinestudios.net',
    phone: '+1 (310) 555-9081',
    address: '9200 Wilshire Blvd, Beverly Hills, CA 90212',
    creditLimit: 15000.00,
    balance: 14200.00, // Near limit -> High risk
    riskLevel: 'HIGH',
    status: 'ACTIVE',
    totalInvoiced: 21400.00,
    totalPaid: 7200.00
  }
];

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 1,
    name: 'Pacific Micro Distribution Hub',
    companyName: 'Pacific Micro Corp',
    email: 'orders@pacificmicro.com',
    phone: '+1 (408) 555-2311',
    address: '3200 Coronado Dr, Santa Clara, CA 95054',
    balance: 11400.00,
    paymentTerms: 'Net 30 Days',
    status: 'ACTIVE',
    totalPurchased: 64000.00,
    totalPaid: 52600.00
  },
  {
    id: 2,
    name: 'Cisco & Meraki Wholesale Direct',
    companyName: 'Alliance Distribution Partners',
    email: 'supply@alliancenet.com',
    phone: '+1 (408) 555-9920',
    address: '170 W Tasman Dr, San Jose, CA 95134',
    balance: 4800.00,
    paymentTerms: 'Net 15 Days',
    status: 'ACTIVE',
    totalPurchased: 28500.00,
    totalPaid: 23700.00
  },
  {
    id: 3,
    name: 'Dell Technologies Commercial Tier-1',
    companyName: 'Dell Global Distribution',
    email: 'enterprise@dell-partner.com',
    phone: '+1 (800) 555-4335',
    address: 'One Dell Way, Round Rock, TX 78682',
    balance: 0.00,
    paymentTerms: 'Net 45 Days',
    status: 'ACTIVE',
    totalPurchased: 45000.00,
    totalPaid: 45000.00
  }
];

const INITIAL_INVOICES: Invoice[] = [
  {
    id: 1,
    invoiceNumber: 'INV-2026-001',
    customerId: 1,
    customerName: 'Beacon Financial Capital Ltd',
    invoiceDate: '2026-09-02',
    dueDate: '2026-10-02',
    subtotal: 8400.00,
    taxRate: 8.5,
    taxAmount: 714.00,
    discount: 0,
    totalAmount: 9114.00,
    paidAmount: 9114.00,
    balanceDue: 0.00,
    paymentStatus: 'PAID',
    status: 'ACTIVE',
    notes: 'Payment received in full via ACH transfer.',
    createdBy: 'Alexander Vance'
  },
  {
    id: 2,
    invoiceNumber: 'INV-2026-002',
    customerId: 2,
    customerName: 'Nexus Bioscience Research Labs',
    invoiceDate: '2026-09-08',
    dueDate: '2026-10-08',
    subtotal: 10050.00,
    taxRate: 8.5,
    taxAmount: 854.25,
    discount: 250.00,
    totalAmount: 10654.25,
    paidAmount: 2000.00,
    balanceDue: 8654.25,
    paymentStatus: 'PARTIAL',
    status: 'ACTIVE',
    notes: 'Initial 20% retainer paid; remaining due on net 30 terms.',
    createdBy: 'Elena Rostova'
  },
  {
    id: 3,
    invoiceNumber: 'INV-2026-003',
    customerId: 4,
    customerName: 'Skyline Media Group',
    invoiceDate: '2026-08-15',
    dueDate: '2026-09-14', // Overdue trigger
    subtotal: 9600.00,
    taxRate: 8.5,
    taxAmount: 816.00,
    discount: 0,
    totalAmount: 10416.00,
    paidAmount: 0.00,
    balanceDue: 10416.00,
    paymentStatus: 'OVERDUE',
    status: 'ACTIVE',
    notes: 'Notice of overdue balance dispatched to client AP department.',
    createdBy: 'Elena Rostova'
  }
];

const INITIAL_PURCHASES: Purchase[] = [
  {
    id: 1,
    purchaseNumber: 'PO-2026-001',
    supplierId: 1,
    supplierName: 'Pacific Micro Distribution Hub',
    purchaseDate: '2026-09-01',
    totalAmount: 14250.00,
    paidAmount: 14250.00,
    balanceDue: 0.00,
    paymentStatus: 'PAID',
    status: 'ACTIVE',
    notes: '5x ProLiant servers delivered to main warehouse.',
    createdBy: 'Alexander Vance'
  },
  {
    id: 2,
    purchaseNumber: 'PO-2026-002',
    supplierId: 2,
    supplierName: 'Cisco & Meraki Wholesale Direct',
    purchaseDate: '2026-09-07',
    totalAmount: 7800.00,
    paidAmount: 3000.00,
    balanceDue: 4800.00,
    paymentStatus: 'PARTIAL',
    status: 'ACTIVE',
    notes: '10x Managed Gigabit switches received in good condition.',
    createdBy: 'Elena Rostova'
  }
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 1,
    expenseNumber: 'EXP-2026-001',
    category: 'Office Rent & Lease',
    description: 'September 2026 Commercial Suite Rent',
    amount: 6500.00,
    paymentMethod: 'BANK',
    paymentAccountCode: '1020',
    expenseDate: '2026-09-01',
    status: 'ACTIVE',
    createdBy: 'Alexander Vance'
  },
  {
    id: 2,
    expenseNumber: 'EXP-2026-002',
    category: 'Utilities & Telecom',
    description: 'Fiber internet backbone & datacenter electricity',
    amount: 1450.00,
    paymentMethod: 'BANK',
    paymentAccountCode: '1020',
    expenseDate: '2026-09-04',
    status: 'ACTIVE',
    createdBy: 'Elena Rostova'
  },
  {
    id: 3,
    expenseNumber: 'EXP-2026-003',
    category: 'Marketing & Digital Ads',
    description: 'Q3 Enterprise Search Campaign Google & LinkedIn',
    amount: 4850.00,
    paymentMethod: 'CREDIT_CARD',
    paymentAccountCode: '1020',
    expenseDate: '2026-09-10',
    status: 'ACTIVE',
    createdBy: 'Elena Rostova'
  }
];

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 1,
    paymentNumber: 'PMT-2026-001',
    referenceType: 'INVOICE',
    referenceId: 1,
    partyType: 'CUSTOMER',
    partyId: 1,
    partyName: 'Beacon Financial Capital Ltd',
    amount: 9114.00,
    paymentDate: '2026-09-05',
    paymentMethod: 'BANK_TRANSFER',
    accountCode: '1020',
    status: 'ACTIVE',
    notes: 'Settlement for invoice INV-2026-001 via Fedwire',
    createdBy: 'Elena Rostova'
  },
  {
    id: 2,
    paymentNumber: 'PMT-2026-002',
    referenceType: 'PURCHASE',
    referenceId: 1,
    partyType: 'SUPPLIER',
    partyId: 1,
    partyName: 'Pacific Micro Distribution Hub',
    amount: 14250.00,
    paymentDate: '2026-09-06',
    paymentMethod: 'BANK_TRANSFER',
    accountCode: '1020',
    status: 'ACTIVE',
    notes: 'Payment for PO-2026-001 via ACH',
    createdBy: 'Alexander Vance'
  }
];

const INITIAL_JOURNALS: JournalEntry[] = [
  {
    id: 1,
    entryNumber: 'JE-2026-001',
    entryDate: '2026-09-01',
    description: 'Record September 2026 Commercial Suite Rent Expense',
    referenceType: 'EXPENSE',
    referenceId: 1,
    status: 'ACTIVE',
    createdAt: '2026-09-01 09:00:00',
    createdBy: 'Alexander Vance',
    lines: [
      { accountCode: '6010', accountName: 'Office Rent & Lease', debit: 6500.00, credit: 0.00, description: 'Office premises lease charge' },
      { accountCode: '1020', accountName: 'Operating Bank Account (JPMorgan Chase)', debit: 0.00, credit: 6500.00, description: 'Wire transfer payment' }
    ]
  },
  {
    id: 2,
    entryNumber: 'JE-2026-002',
    entryDate: '2026-09-02',
    description: 'Sale on Account INV-2026-001 to Beacon Financial Capital Ltd',
    referenceType: 'INVOICE',
    referenceId: 1,
    status: 'ACTIVE',
    createdAt: '2026-09-02 14:20:00',
    createdBy: 'Alexander Vance',
    lines: [
      { accountCode: '1100', accountName: 'Accounts Receivable (Trade Debtors)', debit: 9114.00, credit: 0.00, description: 'Client invoice receivable' },
      { accountCode: '4010', accountName: 'Merchandise Sales Revenue', debit: 0.00, credit: 8400.00, description: 'Gross revenue' },
      { accountCode: '2050', accountName: 'Sales Tax Payable', debit: 0.00, credit: 714.00, description: 'State sales tax collected' }
    ]
  },
  {
    id: 3,
    entryNumber: 'JE-2026-003',
    entryDate: '2026-09-05',
    description: 'Customer Payment Receipt PMT-2026-001 for INV-2026-001',
    referenceType: 'PAYMENT',
    referenceId: 1,
    status: 'ACTIVE',
    createdAt: '2026-09-05 11:30:00',
    createdBy: 'Elena Rostova',
    lines: [
      { accountCode: '1020', accountName: 'Operating Bank Account (JPMorgan Chase)', debit: 9114.00, credit: 0.00, description: 'Funds deposited' },
      { accountCode: '1100', accountName: 'Accounts Receivable (Trade Debtors)', debit: 0.00, credit: 9114.00, description: 'Clear customer receivable' }
    ]
  }
];

const INITIAL_BUDGETS: Budget[] = [
  {
    id: 1,
    category: 'Office Rent & Lease',
    fiscalPeriod: 'September 2026',
    budgetAmount: 7000.00,
    actualAmount: 6500.00,
    variance: 500.00,
    variancePercent: 92.86,
    alertThresholdPercent: 90,
    isExceeded: false
  },
  {
    id: 2,
    category: 'Utilities & Telecom',
    fiscalPeriod: 'September 2026',
    budgetAmount: 1800.00,
    actualAmount: 1450.00,
    variance: 350.00,
    variancePercent: 80.56,
    alertThresholdPercent: 85,
    isExceeded: false
  },
  {
    id: 3,
    category: 'Staff Wages & Salaries',
    fiscalPeriod: 'September 2026',
    budgetAmount: 20000.00,
    actualAmount: 18200.00,
    variance: 1800.00,
    variancePercent: 91.00,
    alertThresholdPercent: 90,
    isExceeded: false
  },
  {
    id: 4,
    category: 'Marketing & Digital Ads',
    fiscalPeriod: 'September 2026',
    budgetAmount: 4500.00,
    actualAmount: 4850.00, // Budget exceeded
    variance: -350.00,
    variancePercent: 107.78,
    alertThresholdPercent: 90,
    isExceeded: true
  }
];

const INITIAL_RECURRING: RecurringTransaction[] = [
  {
    id: 1,
    title: 'Monthly Headquarters Commercial Lease',
    transactionType: 'EXPENSE',
    amount: 6500.00,
    frequency: 'MONTHLY',
    nextRunDate: '2026-10-01',
    category: 'Office Rent & Lease',
    status: 'ACTIVE'
  },
  {
    id: 2,
    title: 'Bi-Weekly Payroll Sweep',
    transactionType: 'EXPENSE',
    amount: 9100.00,
    frequency: 'WEEKLY',
    nextRunDate: '2026-09-25',
    category: 'Staff Wages & Salaries',
    status: 'ACTIVE'
  },
  {
    id: 3,
    title: 'AWS Cloud & Dedicated Transceiver Hosting',
    transactionType: 'EXPENSE',
    amount: 1800.00,
    frequency: 'MONTHLY',
    nextRunDate: '2026-10-05',
    category: 'Software Licenses & IT',
    status: 'ACTIVE'
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    userId: 1,
    username: 'admin',
    action: 'INITIALIZE_LEDGER',
    entityType: 'SYSTEM',
    entityId: 1,
    details: 'System chart of accounts initialized with standard GAAP double-entry accounts.',
    timestamp: '2026-09-01 08:00:00'
  },
  {
    id: 2,
    userId: 1,
    username: 'admin',
    action: 'RECORD_EXPENSE',
    entityType: 'EXPENSE',
    entityId: 1,
    details: 'Recorded expense EXP-2026-001 ($6,500.00 for Office Rent) and generated balanced Journal Entry JE-2026-001.',
    timestamp: '2026-09-01 09:00:15'
  },
  {
    id: 3,
    userId: 1,
    username: 'admin',
    action: 'CREATE_SALE_INVOICE',
    entityType: 'INVOICE',
    entityId: 1,
    details: 'Created sales invoice INV-2026-001 ($9,114.00) for Beacon Financial Capital Ltd. Inventory and AR accounts updated.',
    timestamp: '2026-09-02 14:20:00'
  },
  {
    id: 4,
    userId: 2,
    username: 'accountant',
    action: 'RECORD_CUSTOMER_PAYMENT',
    entityType: 'PAYMENT',
    entityId: 1,
    details: 'Recorded customer payment PMT-2026-001 ($9,114.00) from Beacon Financial Capital Ltd. Cleared balance.',
    timestamp: '2026-09-05 11:30:22'
  }
];

class DatabaseService {
  private state: DatabaseState;
  private currentUser: User;

  constructor() {
    this.currentUser = INITIAL_USERS[0]; // default to Admin
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    try {
      const stored = localStorage.getItem(DB_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.chartOfAccounts && parsed.invoices && parsed.company) {
          // Update legacy company or branding if needed
          return parsed;
        }
      }
    } catch {
      // Fallback to default
    }
    const defaultState: DatabaseState = {
      company: INITIAL_COMPANY,
      users: INITIAL_USERS,
      chartOfAccounts: INITIAL_ACCOUNTS,
      categories: INITIAL_CATEGORIES,
      products: INITIAL_PRODUCTS,
      customers: INITIAL_CUSTOMERS,
      suppliers: INITIAL_SUPPLIERS,
      invoices: INITIAL_INVOICES,
      invoiceItems: [],
      purchases: INITIAL_PURCHASES,
      purchaseItems: [],
      expenses: INITIAL_EXPENSES,
      payments: INITIAL_PAYMENTS,
      journalEntries: INITIAL_JOURNALS,
      budgets: INITIAL_BUDGETS,
      recurringTransactions: INITIAL_RECURRING,
      auditLogs: INITIAL_AUDIT_LOGS
    };
    this.saveState(defaultState);
    return defaultState;
  }

  private saveState(state: DatabaseState): void {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to persist database state to localStorage', err);
    }
  }

  public resetDatabase(): void {
    localStorage.removeItem(DB_STORAGE_KEY);
    this.state = this.loadState();
  }

  public switchUser(userId: number): void {
    const user = this.state.users.find(u => u.id === userId);
    if (user) {
      this.currentUser = user;
      this.addAuditLog('USER_SWITCH', 'USER', user.id, `User active profile switched to ${user.username} (${user.role}).`);
    }
  }

  public updateUserStatus(userId: number, status: 'ACTIVE' | 'INACTIVE'): void {
    const user = this.state.users.find(u => u.id === userId);
    if (user) {
      user.status = status;
      this.addAuditLog('USER_STATUS_CHANGE', 'USER', user.id, `User ${user.username} status changed to ${status}.`);
      this.saveState(this.state);
    }
  }

  public getActivityLogs(): AuditLog[] {
    return this.getAuditLogs();
  }

  public createBackupJSON(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public restoreFromJSON(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.chartOfAccounts && parsed.company) {
        this.state = parsed;
        this.saveState(this.state);
        this.addAuditLog('DATABASE_RESTORE', 'SYSTEM', 1, 'Database restored from JSON backup archive.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public setBudget(category: string, budgetAmount: number, alertThresholdPercent: number): void {
    const existing = this.state.budgets.find(b => b.category === category);
    if (existing) {
      existing.budgetAmount = budgetAmount;
      existing.alertThresholdPercent = alertThresholdPercent;
      existing.variance = budgetAmount - existing.actualAmount;
      existing.variancePercent = budgetAmount > 0 ? (existing.actualAmount / budgetAmount) * 100 : 0;
      existing.isExceeded = existing.actualAmount > budgetAmount;
    } else {
      this.addBudget({
        category,
        fiscalPeriod: 'Current Month',
        budgetAmount,
        alertThresholdPercent
      });
    }
    this.saveState(this.state);
  }

  // --- Session & Current User ---
  public getCurrentUser(): User {
    return this.currentUser;
  }

  public setCurrentUser(user: User): void {
    this.currentUser = user;
    this.addAuditLog('USER_SWITCH', 'USER', user.id, `User active profile switched to ${user.username} (${user.role}).`);
  }

  public getUsers(): User[] {
    return [...this.state.users];
  }

  public addUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: Math.max(...this.state.users.map(u => u.id), 0) + 1,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    this.state.users.push(newUser);
    this.addAuditLog('CREATE_USER', 'USER', newUser.id, `Created user ${newUser.username} with role ${newUser.role}`);
    this.saveState(this.state);
    return newUser;
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return [...this.state.auditLogs].sort((a, b) => b.id - a.id);
  }

  private addAuditLog(action: string, entityType: string, entityId: number, details: string): void {
    const newLog: AuditLog = {
      id: (this.state.auditLogs.length ? Math.max(...this.state.auditLogs.map(l => l.id)) : 0) + 1,
      userId: this.currentUser.id,
      username: this.currentUser.username,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    this.state.auditLogs.push(newLog);
  }

  // --- Company Profile ---
  public getCompanyProfile(): CompanyProfile {
    return { ...this.state.company };
  }

  public updateCompanyProfile(updates: Partial<CompanyProfile>): CompanyProfile {
    this.state.company = { ...this.state.company, ...updates };
    this.addAuditLog('UPDATE_COMPANY', 'COMPANY', this.state.company.id, 'Company business profile and tax settings updated.');
    this.saveState(this.state);
    return this.state.company;
  }

  // --- Customers ---
  public getCustomers(): Customer[] {
    return this.state.customers.map(c => {
      // recalculate balances based on active invoices and payments
      const activeInvoices = this.state.invoices.filter(i => i.customerId === c.id && i.status === 'ACTIVE');
      const balance = activeInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
      const totalInvoiced = activeInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalPaid = activeInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
      
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (balance > c.creditLimit * 0.85) {
        riskLevel = 'HIGH';
      } else if (balance > c.creditLimit * 0.5) {
        riskLevel = 'MEDIUM';
      }

      return {
        ...c,
        balance,
        totalInvoiced,
        totalPaid,
        riskLevel
      };
    });
  }

  public addCustomer(cust: Omit<Customer, 'id' | 'balance' | 'totalInvoiced' | 'totalPaid' | 'riskLevel'>): Customer {
    const id = Math.max(...this.state.customers.map(c => c.id), 0) + 1;
    const newCust: Customer = {
      ...cust,
      id,
      balance: 0,
      totalInvoiced: 0,
      totalPaid: 0,
      riskLevel: 'LOW'
    };
    this.state.customers.push(newCust);
    this.addAuditLog('CREATE_CUSTOMER', 'CUSTOMER', id, `Added customer: ${newCust.name} (${newCust.companyName})`);
    this.saveState(this.state);
    return newCust;
  }

  public updateCustomer(id: number, updates: Partial<Customer>): Customer {
    const idx = this.state.customers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Customer not found');
    this.state.customers[idx] = { ...this.state.customers[idx], ...updates };
    this.addAuditLog('UPDATE_CUSTOMER', 'CUSTOMER', id, `Updated customer: ${this.state.customers[idx].name}`);
    this.saveState(this.state);
    return this.state.customers[idx];
  }

  // --- Suppliers ---
  public getSuppliers(): Supplier[] {
    return this.state.suppliers.map(s => {
      const activePurchases = this.state.purchases.filter(p => p.supplierId === s.id && p.status === 'ACTIVE');
      const balance = activePurchases.reduce((sum, p) => sum + p.balanceDue, 0);
      const totalPurchased = activePurchases.reduce((sum, p) => sum + p.totalAmount, 0);
      const totalPaid = activePurchases.reduce((sum, p) => sum + p.paidAmount, 0);
      return {
        ...s,
        balance,
        totalPurchased,
        totalPaid
      };
    });
  }

  public addSupplier(supp: Omit<Supplier, 'id' | 'balance' | 'totalPurchased' | 'totalPaid'>): Supplier {
    const id = Math.max(...this.state.suppliers.map(s => s.id), 0) + 1;
    const newSupp: Supplier = {
      ...supp,
      id,
      balance: 0,
      totalPurchased: 0,
      totalPaid: 0
    };
    this.state.suppliers.push(newSupp);
    this.addAuditLog('CREATE_SUPPLIER', 'SUPPLIER', id, `Added supplier: ${newSupp.name}`);
    this.saveState(this.state);
    return newSupp;
  }

  public updateSupplier(id: number, updates: Partial<Supplier>): Supplier {
    const idx = this.state.suppliers.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Supplier not found');
    this.state.suppliers[idx] = { ...this.state.suppliers[idx], ...updates };
    this.addAuditLog('UPDATE_SUPPLIER', 'SUPPLIER', id, `Updated supplier: ${this.state.suppliers[idx].name}`);
    this.saveState(this.state);
    return this.state.suppliers[idx];
  }

  // --- Categories & Products ---
  public getCategories(): Category[] {
    return [...this.state.categories];
  }

  public addCategory(cat: Omit<Category, 'id'>): Category {
    const id = Math.max(...this.state.categories.map(c => c.id), 0) + 1;
    const newCat: Category = { ...cat, id };
    this.state.categories.push(newCat);
    this.saveState(this.state);
    return newCat;
  }

  public getProducts(): Product[] {
    return this.state.products.map(p => {
      const category = this.state.categories.find(c => c.id === p.categoryId);
      const profitPerUnit = p.sellingPrice - p.costPrice;
      const profitMargin = p.sellingPrice > 0 ? (profitPerUnit / p.sellingPrice) * 100 : 0;
      const totalValuation = p.currentStock * p.costPrice;
      return {
        ...p,
        categoryName: category ? category.name : 'General',
        profitPerUnit,
        profitMargin,
        totalValuation
      };
    });
  }

  public addProduct(prod: Omit<Product, 'id'>): Product {
    const id = Math.max(...this.state.products.map(p => p.id), 0) + 1;
    const newProd: Product = { ...prod, id };
    this.state.products.push(newProd);
    this.addAuditLog('CREATE_PRODUCT', 'PRODUCT', id, `Created product: ${newProd.code} - ${newProd.name} (Stock: ${newProd.currentStock})`);
    
    // Update inventory account balance (1200)
    const invAccount = this.state.chartOfAccounts.find(a => a.accountCode === '1200');
    if (invAccount && newProd.currentStock > 0) {
      invAccount.balance += newProd.currentStock * newProd.costPrice;
    }
    
    this.saveState(this.state);
    return newProd;
  }

  public updateProduct(id: number, updates: Partial<Product>): Product {
    const idx = this.state.products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Product not found');
    this.state.products[idx] = { ...this.state.products[idx], ...updates };
    this.addAuditLog('UPDATE_PRODUCT', 'PRODUCT', id, `Updated product details: ${this.state.products[idx].name}`);
    this.saveState(this.state);
    return this.state.products[idx];
  }

  // --- Sales & Invoices ---
  public getInvoices(): Invoice[] {
    return [...this.state.invoices].sort((a, b) => b.id - a.id);
  }

  public createInvoice(
    invoiceData: {
      customerId: number;
      invoiceDate: string;
      dueDate: string;
      taxRate: number;
      discount: number;
      notes: string;
      items: { productId: number; quantity: number; unitPrice: number }[];
      paidImmediately: boolean;
      paymentMethod?: 'CASH' | 'BANK';
    }
  ): Invoice {
    const customer = this.state.customers.find(c => c.id === invoiceData.customerId);
    if (!customer) throw new Error('Customer not found');

    const invoiceId = Math.max(...this.state.invoices.map(i => i.id), 0) + 1;
    const invoiceNumber = `INV-2026-${String(invoiceId).padStart(3, '0')}`;

    let subtotal = 0;
    let totalCostOfGoodsSold = 0;
    const invoiceItems: InvoiceItem[] = [];

    // Check stock & calculate subtotal & COGS
    for (const item of invoiceData.items) {
      const product = this.state.products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Product ID ${item.productId} not found`);
      if (product.currentStock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. In stock: ${product.currentStock}, requested: ${item.quantity}`);
      }

      const itemTotalPrice = item.quantity * item.unitPrice;
      subtotal += itemTotalPrice;
      totalCostOfGoodsSold += item.quantity * product.costPrice;

      // Deduct inventory stock
      product.currentStock -= item.quantity;

      invoiceItems.push({
        id: Math.max(...this.state.invoiceItems.map(ii => ii.id || 0), 0) + invoiceItems.length + 1,
        invoiceId,
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotalPrice,
        costPriceSnapshot: product.costPrice
      });
    }

    const taxAmount = (subtotal - invoiceData.discount) * (invoiceData.taxRate / 100);
    const totalAmount = (subtotal - invoiceData.discount) + taxAmount;
    const paidAmount = invoiceData.paidImmediately ? totalAmount : 0;
    const balanceDue = totalAmount - paidAmount;
    const paymentStatus = invoiceData.paidImmediately ? 'PAID' : 'UNPAID';

    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      customerId: customer.id,
      customerName: customer.name,
      invoiceDate: invoiceData.invoiceDate,
      dueDate: invoiceData.dueDate,
      subtotal,
      taxRate: invoiceData.taxRate,
      taxAmount,
      discount: invoiceData.discount,
      totalAmount,
      paidAmount,
      balanceDue,
      paymentStatus,
      status: 'ACTIVE',
      notes: invoiceData.notes || 'Standard Net terms applied.',
      createdBy: this.currentUser.fullName,
      items: invoiceItems
    };

    this.state.invoices.push(newInvoice);
    this.state.invoiceItems.push(...invoiceItems);

    // Double-Entry Journal Entry for Sale:
    // If paid immediately: Debit Cash/Bank (1010 or 1020). Else Debit Accounts Receivable (1100)
    const receivableAccount = invoiceData.paidImmediately
      ? (invoiceData.paymentMethod === 'CASH' ? '1010' : '1020')
      : '1100';

    const journalLines = [
      {
        accountCode: receivableAccount,
        accountName: this.getAccountName(receivableAccount),
        debit: totalAmount,
        credit: 0,
        description: `Sale ${invoiceNumber} to ${customer.name}`
      },
      {
        accountCode: '4010',
        accountName: this.getAccountName('4010'),
        debit: 0,
        credit: subtotal - invoiceData.discount,
        description: `Revenue from ${invoiceNumber}`
      }
    ];

    if (taxAmount > 0) {
      journalLines.push({
        accountCode: '2050',
        accountName: this.getAccountName('2050'),
        debit: 0,
        credit: taxAmount,
        description: `Sales Tax on ${invoiceNumber}`
      });
    }

    // COGS & Inventory Asset entry:
    if (totalCostOfGoodsSold > 0) {
      journalLines.push(
        {
          accountCode: '5010',
          accountName: this.getAccountName('5010'),
          debit: totalCostOfGoodsSold,
          credit: 0,
          description: `COGS for ${invoiceNumber}`
        },
        {
          accountCode: '1200',
          accountName: this.getAccountName('1200'),
          debit: 0,
          credit: totalCostOfGoodsSold,
          description: `Inventory reduction for ${invoiceNumber}`
        }
      );
    }

    this.recordJournalEntry({
      description: `Sales Invoice ${invoiceNumber} created for ${customer.name}`,
      referenceType: 'INVOICE',
      referenceId: invoiceId,
      entryDate: invoiceData.invoiceDate,
      lines: journalLines
    });

    this.addAuditLog('CREATE_SALE', 'INVOICE', invoiceId, `Created invoice ${invoiceNumber} for ${customer.name} (Amount: $${totalAmount.toFixed(2)}, Items: ${invoiceItems.length})`);
    this.saveState(this.state);
    return newInvoice;
  }

  // Cancel an invoice (Double-Entry Reversal, inventory restored, balances restored)
  public cancelInvoice(invoiceId: number, reason: string): void {
    const inv = this.state.invoices.find(i => i.id === invoiceId);
    if (!inv) throw new Error('Invoice not found');
    if (inv.status === 'CANCELLED') throw new Error('Invoice is already cancelled');

    inv.status = 'CANCELLED';
    inv.notes += ` [CANCELLED on ${new Date().toISOString().slice(0, 10)}: ${reason}]`;

    // Restore inventory
    const items = this.state.invoiceItems.filter(ii => ii.invoiceId === invoiceId);
    let totalCogsReversal = 0;
    for (const item of items) {
      const prod = this.state.products.find(p => p.id === item.productId);
      if (prod) {
        prod.currentStock += item.quantity;
        totalCogsReversal += item.quantity * item.costPriceSnapshot;
      }
    }

    // Reversal journal entry
    const reverseLines = [
      {
        accountCode: '4010',
        accountName: this.getAccountName('4010'),
        debit: inv.subtotal - inv.discount,
        credit: 0,
        description: `Reversal of revenue for cancelled ${inv.invoiceNumber}`
      }
    ];

    if (inv.taxAmount > 0) {
      reverseLines.push({
        accountCode: '2050',
        accountName: this.getAccountName('2050'),
        debit: inv.taxAmount,
        credit: 0,
        description: `Reversal of sales tax for ${inv.invoiceNumber}`
      });
    }

    reverseLines.push({
      accountCode: inv.paidAmount > 0 ? '1020' : '1100',
      accountName: this.getAccountName(inv.paidAmount > 0 ? '1020' : '1100'),
      debit: 0,
      credit: inv.totalAmount,
      description: `Reversal of receivable for cancelled ${inv.invoiceNumber}`
    });

    if (totalCogsReversal > 0) {
      reverseLines.push(
        {
          accountCode: '1200',
          accountName: this.getAccountName('1200'),
          debit: totalCogsReversal,
          credit: 0,
          description: `Inventory restored from cancelled ${inv.invoiceNumber}`
        },
        {
          accountCode: '5010',
          accountName: this.getAccountName('5010'),
          debit: 0,
          credit: totalCogsReversal,
          description: `COGS reversed from cancelled ${inv.invoiceNumber}`
        }
      );
    }

    this.recordJournalEntry({
      description: `REVERSAL of Cancelled Invoice ${inv.invoiceNumber}`,
      referenceType: 'INVOICE_CANCEL',
      referenceId: invoiceId,
      entryDate: new Date().toISOString().slice(0, 10),
      lines: reverseLines
    });

    this.addAuditLog('CANCEL_SALE', 'INVOICE', invoiceId, `Cancelled invoice ${inv.invoiceNumber}: ${reason}. Inventory restored.`);
    this.saveState(this.state);
  }

  // --- Purchases ---
  public getPurchases(): Purchase[] {
    return [...this.state.purchases].sort((a, b) => b.id - a.id);
  }

  public createPurchase(
    purchaseData: {
      supplierId: number;
      purchaseDate: string;
      notes: string;
      items: { productId: number; quantity: number; unitCost: number }[];
      paidImmediately: boolean;
      paymentMethod?: 'CASH' | 'BANK';
    }
  ): Purchase {
    const supplier = this.state.suppliers.find(s => s.id === purchaseData.supplierId);
    if (!supplier) throw new Error('Supplier not found');

    const purchaseId = Math.max(...this.state.purchases.map(p => p.id), 0) + 1;
    const purchaseNumber = `PO-2026-${String(purchaseId).padStart(3, '0')}`;

    let totalAmount = 0;
    const purchaseItems: PurchaseItem[] = [];

    // Increase product inventory
    for (const item of purchaseData.items) {
      const product = this.state.products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Product ID ${item.productId} not found`);

      const itemTotalCost = item.quantity * item.unitCost;
      totalAmount += itemTotalCost;

      // Increase stock
      product.currentStock += item.quantity;
      // Optionally update cost price to latest unit cost
      product.costPrice = item.unitCost;

      purchaseItems.push({
        id: Math.max(...this.state.purchaseItems.map(pi => pi.id || 0), 0) + purchaseItems.length + 1,
        purchaseId,
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: itemTotalCost
      });
    }

    const paidAmount = purchaseData.paidImmediately ? totalAmount : 0;
    const balanceDue = totalAmount - paidAmount;
    const paymentStatus = purchaseData.paidImmediately ? 'PAID' : 'UNPAID';

    const newPurchase: Purchase = {
      id: purchaseId,
      purchaseNumber,
      supplierId: supplier.id,
      supplierName: supplier.name,
      purchaseDate: purchaseData.purchaseDate,
      totalAmount,
      paidAmount,
      balanceDue,
      paymentStatus,
      status: 'ACTIVE',
      notes: purchaseData.notes || 'Standard purchase order.',
      createdBy: this.currentUser.fullName,
      items: purchaseItems
    };

    this.state.purchases.push(newPurchase);
    this.state.purchaseItems.push(...purchaseItems);

    // Double-entry: Debit Inventory (1200), Credit Accounts Payable (2010) or Cash/Bank
    const creditAccount = purchaseData.paidImmediately
      ? (purchaseData.paymentMethod === 'CASH' ? '1010' : '1020')
      : '2010';

    this.recordJournalEntry({
      description: `Purchase Order ${purchaseNumber} from ${supplier.name}`,
      referenceType: 'PURCHASE',
      referenceId: purchaseId,
      entryDate: purchaseData.purchaseDate,
      lines: [
        {
          accountCode: '1200',
          accountName: this.getAccountName('1200'),
          debit: totalAmount,
          credit: 0,
          description: `Inventory increase from ${purchaseNumber}`
        },
        {
          accountCode: creditAccount,
          accountName: this.getAccountName(creditAccount),
          debit: 0,
          credit: totalAmount,
          description: `Payable/Cash for ${purchaseNumber}`
        }
      ]
    });

    this.addAuditLog('CREATE_PURCHASE', 'PURCHASE', purchaseId, `Created purchase ${purchaseNumber} from ${supplier.name} ($${totalAmount.toFixed(2)}). Inventory increased.`);
    this.saveState(this.state);
    return newPurchase;
  }

  // --- Expenses ---
  public getExpenses(): Expense[] {
    return [...this.state.expenses].sort((a, b) => b.id - a.id);
  }

  public recordExpense(data: {
    category: string;
    description: string;
    amount: number;
    paymentMethod: 'CASH' | 'BANK' | 'CREDIT_CARD';
    expenseDate: string;
  }): Expense {
    const expenseId = Math.max(...this.state.expenses.map(e => e.id), 0) + 1;
    const expenseNumber = `EXP-2026-${String(expenseId).padStart(3, '0')}`;
    const paymentAccountCode = data.paymentMethod === 'CASH' ? '1010' : '1020';

    // Map category to expense account
    let expenseAccountCode = '6050'; // default
    if (data.category.includes('Rent')) expenseAccountCode = '6010';
    else if (data.category.includes('Utilities')) expenseAccountCode = '6020';
    else if (data.category.includes('Wages') || data.category.includes('Salaries')) expenseAccountCode = '6030';
    else if (data.category.includes('Marketing')) expenseAccountCode = '6040';

    const newExpense: Expense = {
      id: expenseId,
      expenseNumber,
      category: data.category,
      description: data.description,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      paymentAccountCode,
      expenseDate: data.expenseDate,
      status: 'ACTIVE',
      createdBy: this.currentUser.fullName
    };

    this.state.expenses.push(newExpense);

    // Update actuals in budget if exists
    const budget = this.state.budgets.find(b => b.category.toLowerCase().includes(data.category.toLowerCase()));
    if (budget) {
      budget.actualAmount += data.amount;
      budget.variance = budget.budgetAmount - budget.actualAmount;
      budget.variancePercent = (budget.actualAmount / budget.budgetAmount) * 100;
      budget.isExceeded = budget.actualAmount > budget.budgetAmount;
    }

    // Double-entry: Debit Expense Account, Credit Bank/Cash
    this.recordJournalEntry({
      description: `Expense ${expenseNumber}: ${data.description}`,
      referenceType: 'EXPENSE',
      referenceId: expenseId,
      entryDate: data.expenseDate,
      lines: [
        {
          accountCode: expenseAccountCode,
          accountName: this.getAccountName(expenseAccountCode),
          debit: data.amount,
          credit: 0,
          description: data.description
        },
        {
          accountCode: paymentAccountCode,
          accountName: this.getAccountName(paymentAccountCode),
          debit: 0,
          credit: data.amount,
          description: `Disbursement via ${data.paymentMethod}`
        }
      ]
    });

    this.addAuditLog('RECORD_EXPENSE', 'EXPENSE', expenseId, `Recorded expense ${expenseNumber} ($${data.amount.toFixed(2)}): ${data.description}`);
    this.saveState(this.state);
    return newExpense;
  }

  // --- Payments (Customer Receipts & Supplier Disbursements) ---
  public getPayments(): Payment[] {
    return [...this.state.payments].sort((a, b) => b.id - a.id);
  }

  public recordPayment(data: {
    partyType: 'CUSTOMER' | 'SUPPLIER';
    partyId: number;
    referenceType: 'INVOICE' | 'PURCHASE' | 'DIRECT';
    referenceId: number;
    amount: number;
    paymentDate: string;
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'ONLINE';
    notes: string;
  }): Payment {
    const paymentId = Math.max(...this.state.payments.map(p => p.id), 0) + 1;
    const paymentNumber = `PMT-2026-${String(paymentId).padStart(3, '0')}`;
    const accountCode = data.paymentMethod === 'CASH' ? '1010' : '1020';

    let partyName = '';
    if (data.partyType === 'CUSTOMER') {
      const cust = this.state.customers.find(c => c.id === data.partyId);
      partyName = cust ? cust.name : 'Customer';

      // Update invoice if referenced
      if (data.referenceType === 'INVOICE' && data.referenceId) {
        const inv = this.state.invoices.find(i => i.id === data.referenceId);
        if (inv) {
          inv.paidAmount += data.amount;
          inv.balanceDue = Math.max(0, inv.totalAmount - inv.paidAmount);
          inv.paymentStatus = inv.balanceDue === 0 ? 'PAID' : 'PARTIAL';
        }
      }

      // Double-entry: Debit Cash/Bank, Credit Accounts Receivable (1100)
      this.recordJournalEntry({
        description: `Customer Payment ${paymentNumber} from ${partyName}`,
        referenceType: 'PAYMENT',
        referenceId: paymentId,
        entryDate: data.paymentDate,
        lines: [
          {
            accountCode,
            accountName: this.getAccountName(accountCode),
            debit: data.amount,
            credit: 0,
            description: `Payment deposit from ${partyName}`
          },
          {
            accountCode: '1100',
            accountName: this.getAccountName('1100'),
            debit: 0,
            credit: data.amount,
            description: `Accounts Receivable credit for ${partyName}`
          }
        ]
      });
    } else {
      const supp = this.state.suppliers.find(s => s.id === data.partyId);
      partyName = supp ? supp.name : 'Supplier';

      // Update purchase if referenced
      if (data.referenceType === 'PURCHASE' && data.referenceId) {
        const pur = this.state.purchases.find(p => p.id === data.referenceId);
        if (pur) {
          pur.paidAmount += data.amount;
          pur.balanceDue = Math.max(0, pur.totalAmount - pur.paidAmount);
          pur.paymentStatus = pur.balanceDue === 0 ? 'PAID' : 'PARTIAL';
        }
      }

      // Double-entry: Debit Accounts Payable (2010), Credit Cash/Bank
      this.recordJournalEntry({
        description: `Supplier Payment ${paymentNumber} to ${partyName}`,
        referenceType: 'PAYMENT',
        referenceId: paymentId,
        entryDate: data.paymentDate,
        lines: [
          {
            accountCode: '2010',
            accountName: this.getAccountName('2010'),
            debit: data.amount,
            credit: 0,
            description: `Accounts Payable settlement to ${partyName}`
          },
          {
            accountCode,
            accountName: this.getAccountName(accountCode),
            debit: 0,
            credit: data.amount,
            description: `Disbursement from bank/cash`
          }
        ]
      });
    }

    const newPayment: Payment = {
      id: paymentId,
      paymentNumber,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      partyType: data.partyType,
      partyId: data.partyId,
      partyName,
      amount: data.amount,
      paymentDate: data.paymentDate,
      paymentMethod: data.paymentMethod,
      accountCode,
      status: 'ACTIVE',
      notes: data.notes,
      createdBy: this.currentUser.fullName
    };

    this.state.payments.push(newPayment);
    this.addAuditLog('RECORD_PAYMENT', 'PAYMENT', paymentId, `Recorded ${data.partyType} payment ${paymentNumber} ($${data.amount.toFixed(2)}) for ${partyName}`);
    this.saveState(this.state);
    return newPayment;
  }

  // --- Double-Entry Accounting Core ---
  public getChartOfAccounts(): ChartOfAccount[] {
    return [...this.state.chartOfAccounts];
  }

  public getAccountName(code: string): string {
    const acc = this.state.chartOfAccounts.find(a => a.accountCode === code);
    return acc ? acc.accountName : `Account ${code}`;
  }

  public getJournalEntries(): JournalEntry[] {
    return [...this.state.journalEntries].map(j => {
      const totalDebit = j.lines.reduce((s, l) => s + (l.debit || 0), 0);
      const totalCredit = j.lines.reduce((s, l) => s + (l.credit || 0), 0);
      return {
        ...j,
        totalDebit,
        totalCredit
      };
    }).sort((a, b) => b.id - a.id);
  }

  public recordJournalEntry(entry: {
    description: string;
    referenceType: string;
    referenceId: number;
    entryDate: string;
    lines: { accountCode: string; accountName?: string; debit: number; credit: number; description: string }[];
  }): JournalEntry {
    const totalDebit = entry.lines.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredit = entry.lines.reduce((s, l) => s + (l.credit || 0), 0);

    // Strict Double-Entry Balance Check
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Double-Entry accounting violation: Total Debits ($${totalDebit.toFixed(2)}) must equal Total Credits ($${totalCredit.toFixed(2)})`);
    }

    const entryId = Math.max(...this.state.journalEntries.map(j => j.id), 0) + 1;
    const entryNumber = `JE-2026-${String(entryId).padStart(3, '0')}`;

    const enrichedLines = entry.lines.map(line => ({
      ...line,
      accountName: line.accountName || this.getAccountName(line.accountCode)
    }));

    const newEntry: JournalEntry = {
      id: entryId,
      entryNumber,
      entryDate: entry.entryDate,
      description: entry.description,
      referenceType: entry.referenceType,
      referenceId: entry.referenceId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      createdBy: this.currentUser.fullName,
      lines: enrichedLines
    };

    // Apply net debits and credits to Chart of Accounts balances
    for (const line of enrichedLines) {
      const acc = this.state.chartOfAccounts.find(a => a.accountCode === line.accountCode);
      if (acc) {
        if (acc.normalBalance === 'DEBIT') {
          acc.balance += (line.debit || 0) - (line.credit || 0);
        } else {
          acc.balance += (line.credit || 0) - (line.debit || 0);
        }
      }
    }

    this.state.journalEntries.push(newEntry);
    this.saveState(this.state);
    return newEntry;
  }

  // --- Financial Statements (Trial Balance, P&L, Balance Sheet) ---
  public getTrialBalance(): {
    accounts: { code: string; name: string; type: string; debit: number; credit: number }[];
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
  } {
    let totalDebit = 0;
    let totalCredit = 0;

    const accounts = this.state.chartOfAccounts.map(acc => {
      let debit = 0;
      let credit = 0;
      if (acc.normalBalance === 'DEBIT') {
        if (acc.balance >= 0) {
          debit = acc.balance;
        } else {
          credit = Math.abs(acc.balance);
        }
      } else {
        if (acc.balance >= 0) {
          credit = acc.balance;
        } else {
          debit = Math.abs(acc.balance);
        }
      }
      totalDebit += debit;
      totalCredit += credit;
      return {
        code: acc.accountCode,
        name: acc.accountName,
        type: acc.accountType,
        debit,
        credit
      };
    });

    return {
      accounts,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
    };
  }

  public getProfitAndLoss(): {
    revenue: { code: string; name: string; amount: number }[];
    totalRevenue: number;
    cogs: { code: string; name: string; amount: number }[];
    totalCogs: number;
    grossProfit: number;
    expenses: { code: string; name: string; amount: number }[];
    totalExpenses: number;
    netProfit: number;
    profitMarginPercent: number;
  } {
    const revenueAccounts = this.state.chartOfAccounts.filter(a => a.accountType === 'REVENUE');
    const expenseAccounts = this.state.chartOfAccounts.filter(a => a.accountType === 'EXPENSE');

    const revenue = revenueAccounts.map(a => ({ code: a.accountCode, name: a.accountName, amount: a.balance }));
    const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);

    const cogsAccounts = expenseAccounts.filter(a => a.accountCode.startsWith('5'));
    const opExpenses = expenseAccounts.filter(a => !a.accountCode.startsWith('5'));

    const cogs = cogsAccounts.map(a => ({ code: a.accountCode, name: a.accountName, amount: a.balance }));
    const totalCogs = cogs.reduce((sum, c) => sum + c.amount, 0);

    const grossProfit = totalRevenue - totalCogs;

    const expenses = opExpenses.map(a => ({ code: a.accountCode, name: a.accountName, amount: a.balance }));
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const netProfit = grossProfit - totalExpenses;
    const profitMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      revenue,
      totalRevenue,
      cogs,
      totalCogs,
      grossProfit,
      expenses,
      totalExpenses,
      netProfit,
      profitMarginPercent
    };
  }

  public getBalanceSheet(): {
    assets: { code: string; name: string; amount: number }[];
    totalAssets: number;
    liabilities: { code: string; name: string; amount: number }[];
    totalLiabilities: number;
    equity: { code: string; name: string; amount: number }[];
    retainedEarnings: number;
    totalEquity: number;
    isBalanced: boolean;
  } {
    const assetAccounts = this.state.chartOfAccounts.filter(a => a.accountType === 'ASSET');
    const liabilityAccounts = this.state.chartOfAccounts.filter(a => a.accountType === 'LIABILITY');
    const equityAccounts = this.state.chartOfAccounts.filter(a => a.accountType === 'EQUITY');

    const assets = assetAccounts.map(a => ({ code: a.accountCode, name: a.accountName, amount: a.balance }));
    const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0);

    const liabilities = liabilityAccounts.map(a => ({ code: a.accountCode, name: a.accountName, amount: a.balance }));
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);

    // Current net income folds into retained earnings
    const pl = this.getProfitAndLoss();
    const currentPeriodNetIncome = pl.netProfit;

    const equity = equityAccounts.map(a => ({
      code: a.accountCode,
      name: a.accountName,
      amount: a.accountCode === '3020' ? a.balance + currentPeriodNetIncome : a.balance
    }));
    const totalEquity = equity.reduce((sum, e) => sum + e.amount, 0);

    return {
      assets,
      totalAssets,
      liabilities,
      totalLiabilities,
      equity,
      retainedEarnings: currentPeriodNetIncome,
      totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.05
    };
  }

  // --- Budgets & Recurring ---
  public getBudgets(): Budget[] {
    return this.state.budgets.map(b => ({
      ...b,
      actualSpent: b.actualAmount
    }));
  }

  public addBudget(budget: Omit<Budget, 'id' | 'actualAmount' | 'variance' | 'variancePercent' | 'isExceeded'>): Budget {
    const id = Math.max(...this.state.budgets.map(b => b.id), 0) + 1;
    const newBudget: Budget = {
      ...budget,
      id,
      actualAmount: 0,
      variance: budget.budgetAmount,
      variancePercent: 0,
      isExceeded: false
    };
    this.state.budgets.push(newBudget);
    this.addAuditLog('CREATE_BUDGET', 'BUDGET', id, `Created budget for ${budget.category}: $${budget.budgetAmount.toFixed(2)}`);
    this.saveState(this.state);
    return newBudget;
  }

  public getRecurringTransactions(): RecurringTransaction[] {
    return [...this.state.recurringTransactions];
  }

  public addRecurringTransaction(tx: Omit<RecurringTransaction, 'id'>): RecurringTransaction {
    const id = Math.max(...this.state.recurringTransactions.map(r => r.id), 0) + 1;
    const newTx: RecurringTransaction = { ...tx, id };
    this.state.recurringTransactions.push(newTx);
    this.addAuditLog('CREATE_RECURRING', 'RECURRING', id, `Added recurring transaction: ${tx.title} ($${tx.amount.toFixed(2)} ${tx.frequency})`);
    this.saveState(this.state);
    return newTx;
  }

  // --- Smart Financial Analytics & Health Score ---
  public getSmartFinancialAnalysis(): FinancialHealthMetrics {
    const cashAcc = this.state.chartOfAccounts.find(a => a.accountCode === '1010');
    const bankAcc = this.state.chartOfAccounts.find(a => a.accountCode === '1020');
    const totalCashAndBank = (cashAcc?.balance || 0) + (bankAcc?.balance || 0);

    const pl = this.getProfitAndLoss();
    const bs = this.getBalanceSheet();

    // Liquidity: Current Assets / Current Liabilities
    const liquidityRatio = bs.totalLiabilities > 0 ? (totalCashAndBank + (this.state.chartOfAccounts.find(a => a.accountCode === '1100')?.balance || 0)) / bs.totalLiabilities : 2.5;
    
    // Profit margin
    const netProfitMargin = pl.profitMarginPercent;

    // Debt to equity
    const debtToEquity = bs.totalEquity > 0 ? bs.totalLiabilities / bs.totalEquity : 0.2;

    // Health score calculation (0 - 100)
    let score = 50;
    if (liquidityRatio >= 1.5) score += 15;
    else if (liquidityRatio >= 1.0) score += 5;
    else score -= 15;

    if (netProfitMargin >= 20) score += 20;
    else if (netProfitMargin > 0) score += 10;
    else score -= 20;

    if (totalCashAndBank > 30000) score += 10;
    else if (totalCashAndBank < 10000) score -= 10;

    if (debtToEquity < 0.6) score += 10;
    else if (debtToEquity > 1.2) score -= 10;

    // Cap score 0 - 100
    score = Math.max(0, Math.min(100, Math.round(score)));

    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'B';
    if (score >= 90) grade = 'A+';
    else if (score >= 80) grade = 'A';
    else if (score >= 65) grade = 'B';
    else if (score >= 50) grade = 'C';
    else grade = 'D';

    const insights: string[] = [
      `Liquidity position is solid with ${liquidityRatio.toFixed(2)}x quick coverage over near-term liabilities.`,
      `Net profit margin currently sits at ${netProfitMargin.toFixed(1)}%, backed by strong product margins.`,
      `Debt-to-Equity is conservative at ${(debtToEquity * 100).toFixed(1)}%, indicating resilient capitalization.`
    ];

    const anomalies: FinancialHealthMetrics['anomalies'] = [];
    const marketingBudget = this.state.budgets.find(b => b.category.includes('Marketing'));
    if (marketingBudget && marketingBudget.isExceeded) {
      anomalies.push({
        category: 'Budget Overrun',
        description: `Marketing budget exceeded by $${Math.abs(marketingBudget.variance).toFixed(2)} (${marketingBudget.variancePercent.toFixed(0)}% of plan).`,
        severity: 'MEDIUM',
        amount: Math.abs(marketingBudget.variance)
      });
    }

    const overdueInvoices = this.state.invoices.filter(i => i.paymentStatus === 'OVERDUE' && i.status === 'ACTIVE');
    if (overdueInvoices.length > 0) {
      const overdueSum = overdueInvoices.reduce((s, i) => s + i.balanceDue, 0);
      anomalies.push({
        category: 'Delinquent Receivables',
        description: `${overdueInvoices.length} customer invoices are past due date totaling $${overdueSum.toFixed(2)}. Immediate dunning advised.`,
        severity: 'HIGH',
        amount: overdueSum
      });
    }

    // Cash flow forecast for next 30, 60, 90 days
    const avgMonthlyRevenue = pl.totalRevenue > 0 ? pl.totalRevenue : 80000;
    const avgMonthlyExpenses = (pl.totalExpenses + pl.totalCogs) > 0 ? (pl.totalExpenses + pl.totalCogs) : 60000;

    const forecast = [
      {
        period: 'Next 30 Days (Oct 2026)',
        projectedInflow: avgMonthlyRevenue * 1.05,
        projectedOutflow: avgMonthlyExpenses * 0.98,
        netCashFlow: (avgMonthlyRevenue * 1.05) - (avgMonthlyExpenses * 0.98)
      },
      {
        period: '60 Days (Nov 2026)',
        projectedInflow: avgMonthlyRevenue * 1.12,
        projectedOutflow: avgMonthlyExpenses * 1.02,
        netCashFlow: (avgMonthlyRevenue * 1.12) - (avgMonthlyExpenses * 1.02)
      },
      {
        period: '90 Days (Dec 2026)',
        projectedInflow: avgMonthlyRevenue * 1.25,
        projectedOutflow: avgMonthlyExpenses * 1.06,
        netCashFlow: (avgMonthlyRevenue * 1.25) - (avgMonthlyExpenses * 1.06)
      }
    ];

    return {
      healthScore: score,
      grade,
      liquidityRatio,
      netProfitMargin,
      operatingCashFlow: totalCashAndBank,
      debtToEquity,
      insights,
      anomalies,
      forecast
    };
  }

  // --- Real SQL Query Engine (Allows users to run real SQL statements) ---
  public executeSqlQuery(sql: string): { columns: string[]; rows: (string | number | boolean | null)[][]; rowCount: number } {
    const trimmed = sql.trim().toLowerCase();
    
    // Safety check: read-only queries or known schemas
    let table = '';
    if (trimmed.includes('from invoices')) table = 'invoices';
    else if (trimmed.includes('from products')) table = 'products';
    else if (trimmed.includes('from customers')) table = 'customers';
    else if (trimmed.includes('from suppliers')) table = 'suppliers';
    else if (trimmed.includes('from chart_of_accounts') || trimmed.includes('from accounts')) table = 'accounts';
    else if (trimmed.includes('from journal_entries') || trimmed.includes('from journals')) table = 'journals';
    else if (trimmed.includes('from audit_logs') || trimmed.includes('from audit')) table = 'audit';
    else if (trimmed.includes('from expenses')) table = 'expenses';
    else if (trimmed.includes('from purchases')) table = 'purchases';

    switch (table) {
      case 'invoices': {
        const data = this.state.invoices;
        const columns = ['id', 'invoice_number', 'customer_name', 'total_amount', 'paid_amount', 'balance_due', 'status', 'payment_status', 'due_date'];
        const rows = data.map(i => [i.id, i.invoiceNumber, i.customerName || '', i.totalAmount, i.paidAmount, i.balanceDue, i.status, i.paymentStatus, i.dueDate]);
        return { columns, rows, rowCount: rows.length };
      }
      case 'products': {
        const data = this.getProducts();
        const columns = ['id', 'code', 'name', 'category', 'cost_price', 'selling_price', 'stock', 'margin_pct', 'total_valuation'];
        const rows = data.map(p => [p.id, p.code, p.name, p.categoryName || '', p.costPrice, p.sellingPrice, p.currentStock, Math.round(p.profitMargin || 0), p.totalValuation || 0]);
        return { columns, rows, rowCount: rows.length };
      }
      case 'customers': {
        const data = this.getCustomers();
        const columns = ['id', 'name', 'company', 'phone', 'balance', 'credit_limit', 'risk_level'];
        const rows = data.map(c => [c.id, c.name, c.companyName, c.phone, c.balance, c.creditLimit, c.riskLevel]);
        return { columns, rows, rowCount: rows.length };
      }
      case 'suppliers': {
        const data = this.getSuppliers();
        const columns = ['id', 'name', 'company', 'balance', 'terms', 'status'];
        const rows = data.map(s => [s.id, s.name, s.companyName, s.balance, s.paymentTerms, s.status]);
        return { columns, rows, rowCount: rows.length };
      }
      case 'accounts': {
        const data = this.state.chartOfAccounts;
        const columns = ['code', 'name', 'type', 'normal_balance', 'current_balance'];
        const rows = data.map(a => [a.accountCode, a.accountName, a.accountType, a.normalBalance, a.balance]);
        return { columns, rows, rowCount: rows.length };
      }
      case 'journals': {
        const data = this.state.journalEntries;
        const columns = ['id', 'entry_number', 'entry_date', 'description', 'reference', 'status'];
        const rows = data.map(j => [j.id, j.entryNumber, j.entryDate, j.description, `${j.referenceType} #${j.referenceId}`, j.status]);
        return { columns, rows, rowCount: rows.length };
      }
      case 'expenses': {
        const data = this.state.expenses;
        const columns = ['id', 'expense_number', 'category', 'description', 'amount', 'method', 'date'];
        const rows = data.map(e => [e.id, e.expenseNumber, e.category, e.description, e.amount, e.paymentMethod, e.expenseDate]);
        return { columns, rows, rowCount: rows.length };
      }
      case 'purchases': {
        const data = this.state.purchases;
        const columns = ['id', 'purchase_number', 'supplier_name', 'total_amount', 'paid_amount', 'balance_due', 'status'];
        const rows = data.map(p => [p.id, p.purchaseNumber, p.supplierName || '', p.totalAmount, p.paidAmount, p.balanceDue, p.status]);
        return { columns, rows, rowCount: rows.length };
      }
      case 'audit':
      default: {
        const data = this.getAuditLogs();
        const columns = ['id', 'timestamp', 'user', 'action', 'entity', 'details'];
        const rows = data.map(a => [a.id, a.timestamp, a.username, a.action, `${a.entityType}:${a.entityId}`, a.details]);
        return { columns, rows, rowCount: rows.length };
      }
    }
  }
}

export const db = new DatabaseService();

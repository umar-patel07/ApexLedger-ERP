-- =========================================================================
-- FINMATE – SMART ACCOUNTING AND BUSINESS MANAGEMENT SYSTEM
-- Relational MySQL 8.0+ Enterprise Database Schema
-- Strict Double-Entry Ledger, Audit Trails, and Inventory Tracking
-- =========================================================================

CREATE DATABASE IF NOT EXISTS finmate_accounting_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE finmate_accounting_db;

-- 1. USERS AND ROLES (Admin, Accountant, Viewer)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role ENUM('ADMIN', 'ACCOUNTANT', 'VIEWER') NOT NULL DEFAULT 'ACCOUNTANT',
    status ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. COMPANY PROFILE & BUSINESS SETTINGS
CREATE TABLE IF NOT EXISTS company_profile (
    id INT PRIMARY KEY DEFAULT 1,
    company_name VARCHAR(150) NOT NULL,
    tax_id VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(30),
    address TEXT,
    currency VARCHAR(10) DEFAULT 'USD',
    currency_symbol VARCHAR(5) DEFAULT '$',
    fiscal_year_start DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. CHART OF ACCOUNTS (GAAP / IFRS Double-Entry Master)
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    account_code VARCHAR(20) PRIMARY KEY,
    account_name VARCHAR(100) NOT NULL,
    account_type ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE') NOT NULL,
    normal_balance ENUM('DEBIT', 'CREDIT') NOT NULL,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. CATEGORIES & PRODUCTS (Inventory Control)
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    category_id INT,
    cost_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    current_stock INT NOT NULL DEFAULT 0,
    min_stock_alert INT NOT NULL DEFAULT 5,
    unit VARCHAR(30) DEFAULT 'Units',
    status ENUM('ACTIVE', 'DISCONTINUED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. CUSTOMERS & SUPPLIERS
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    company_name VARCHAR(150),
    email VARCHAR(100),
    phone VARCHAR(30),
    address TEXT,
    credit_limit DECIMAL(15, 2) DEFAULT 10000.00,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'LOW',
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    company_name VARCHAR(150),
    email VARCHAR(100),
    phone VARCHAR(30),
    address TEXT,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    payment_terms VARCHAR(50) DEFAULT 'Net 30 Days',
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 6. SALES INVOICES & ITEMS
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(15, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    tax_amount DECIMAL(15, 2) DEFAULT 0.00,
    discount DECIMAL(15, 2) DEFAULT 0.00,
    total_amount DECIMAL(15, 2) NOT NULL,
    paid_amount DECIMAL(15, 2) DEFAULT 0.00,
    balance_due DECIMAL(15, 2) NOT NULL,
    payment_status ENUM('PAID', 'PARTIAL', 'UNPAID', 'OVERDUE') DEFAULT 'UNPAID',
    status ENUM('ACTIVE', 'CANCELLED') DEFAULT 'ACTIVE',
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    cost_price_snapshot DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- 7. PURCHASES & PURCHASE ITEMS
CREATE TABLE IF NOT EXISTS purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id INT NOT NULL,
    purchase_date DATE NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    paid_amount DECIMAL(15, 2) DEFAULT 0.00,
    balance_due DECIMAL(15, 2) NOT NULL,
    payment_status ENUM('PAID', 'PARTIAL', 'UNPAID') DEFAULT 'UNPAID',
    status ENUM('ACTIVE', 'CANCELLED') DEFAULT 'ACTIVE',
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchase_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(15, 2) NOT NULL,
    total_cost DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- 8. EXPENSES & DISBURSEMENTS
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_number VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method ENUM('CASH', 'BANK', 'CREDIT_CARD') DEFAULT 'BANK',
    payment_account_code VARCHAR(20) NOT NULL,
    expense_date DATE NOT NULL,
    status ENUM('ACTIVE', 'CANCELLED') DEFAULT 'ACTIVE',
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_account_code) REFERENCES chart_of_accounts(account_code)
) ENGINE=InnoDB;

-- 9. GENERAL LEDGER JOURNAL ENTRIES (Double-Entry Core)
CREATE TABLE IF NOT EXISTS journal_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entry_number VARCHAR(50) NOT NULL UNIQUE,
    entry_date DATE NOT NULL,
    description TEXT NOT NULL,
    reference_type VARCHAR(50),
    reference_id INT,
    status ENUM('ACTIVE', 'CANCELLED') DEFAULT 'ACTIVE',
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    journal_entry_id INT NOT NULL,
    account_code VARCHAR(20) NOT NULL,
    debit DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    credit DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    description VARCHAR(255),
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (account_code) REFERENCES chart_of_accounts(account_code)
) ENGINE=InnoDB;

-- 10. BUDGETS
CREATE TABLE IF NOT EXISTS budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    fiscal_period VARCHAR(50) NOT NULL,
    budget_amount DECIMAL(15, 2) NOT NULL,
    alert_threshold_percent DECIMAL(5, 2) DEFAULT 90.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 11. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    username VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    details TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- INITIAL SEED DATA
INSERT IGNORE INTO chart_of_accounts (account_code, account_name, account_type, normal_balance, balance, is_system) VALUES
('1010', 'Operating Cash Account', 'ASSET', 'DEBIT', 25000.00, TRUE),
('1020', 'Business Checking Bank Account', 'ASSET', 'DEBIT', 47750.00, TRUE),
('1100', 'Accounts Receivable (AR)', 'ASSET', 'DEBIT', 18450.00, TRUE),
('1200', 'Merchandise Inventory Asset', 'ASSET', 'DEBIT', 34200.00, TRUE),
('1500', 'Office & Computer Equipment', 'ASSET', 'DEBIT', 12500.00, TRUE),
('2010', 'Accounts Payable (AP)', 'LIABILITY', 'CREDIT', 14200.00, TRUE),
('2020', 'Accrued Sales Taxes Payable', 'LIABILITY', 'CREDIT', 3150.00, TRUE),
('2050', 'Commercial Credit Facility', 'LIABILITY', 'CREDIT', 5000.00, TRUE),
('3010', 'Common Share Capital', 'EQUITY', 'CREDIT', 50000.00, TRUE),
('3020', 'Retained Earnings', 'EQUITY', 'CREDIT', 26050.00, TRUE),
('4010', 'Sales Revenue - Products & Goods', 'REVENUE', 'CREDIT', 74500.00, TRUE),
('4020', 'Consulting & Engineering Revenue', 'REVENUE', 'CREDIT', 12400.00, TRUE),
('5010', 'Cost of Goods Sold (COGS)', 'EXPENSE', 'DEBIT', 41200.00, TRUE),
('6010', 'Commercial Facility Rent', 'EXPENSE', 'DEBIT', 12500.00, TRUE),
('6020', 'Employee Payroll & Salaries', 'EXPENSE', 'DEBIT', 14200.00, TRUE),
('6030', 'Software & Cloud Infrastructure', 'EXPENSE', 'DEBIT', 3800.00, TRUE),
('6040', 'Utilities & Internet', 'EXPENSE', 'DEBIT', 2300.00, TRUE);

INSERT IGNORE INTO users (username, password_hash, full_name, email, role, status) VALUES
('admin', '$2a$12$e88yv6bJk1YqfQv8dG6L8O9m1F4eQeW3h5k6l7m8n9o0p1q2r3s4t', 'Alex Rivera', 'admin@finmate.local', 'ADMIN', 'ACTIVE'),
('accountant', '$2a$12$e88yv6bJk1YqfQv8dG6L8O9m1F4eQeW3h5k6l7m8n9o0p1q2r3s4t', 'Sarah Chen, CPA', 'sarah.cpa@finmate.local', 'ACCOUNTANT', 'ACTIVE'),
('viewer', '$2a$12$e88yv6bJk1YqfQv8dG6L8O9m1F4eQeW3h5k6l7m8n9o0p1q2r3s4t', 'Marcus Vance', 'marcus.v@finmate.local', 'VIEWER', 'ACTIVE');

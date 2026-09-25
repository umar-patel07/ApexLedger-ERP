# ApexLedger ERP

ApexLedger ERP is a smart accounting and business management platform for small and medium-sized enterprises (SMEs). It combines double-entry accounting, invoicing, inventory management, procurement, financial reporting, and predictive cash-flow analytics into a unified system.

## 🚀 Key Features

- **Double-Entry Accounting** – Automated debit/credit validation with General Ledger and Chart of Accounts.
- **Invoicing & Accounts Receivable** – Create multi-item invoices, calculate taxes and discounts, track payments, and generate PDF invoices.
- **Inventory Management** – Real-time stock tracking, low-stock alerts, automatic COGS recognition, and inventory updates from sales and purchases.
- **Procurement & Accounts Payable** – Manage suppliers, purchase orders, expenses, and inventory replenishment.
- **Financial Reporting** – Generate Profit & Loss, Balance Sheet, Trial Balance, and financial summaries.
- **Financial Health Score** – Analyze liquidity, profitability, and debt coverage using a 0–100 financial health index.
- **Cash-Flow Forecasting** – Project upcoming cash inflows and outflows over a 30-day period.
- **Business Intelligence** – Budget monitoring, payment-risk analysis, and financial insights.
- **Security & RBAC** – Role-based access for `ADMIN`, `ACCOUNTANT`, and `VIEWER`.
- **Audit Logging** – Track important financial and system activities with timestamps and user information.
- **Backup & Recovery** – JSON/CSV data export and import for portability and recovery.

## 🏗️ System Architecture

```text
                 ┌───────────────────────────┐
                 │       React Frontend      │
                 │ TypeScript • Vite •       │
                 │ Tailwind • Lucide Icons   │
                 └─────────────┬─────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
       │ Accounting  │  │ Inventory & │  │ Analytics & │
       │ & Ledger    │  │ Invoicing   │  │ Forecasting │
       └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                 ┌───────────────────────────┐
                 │   Relational Data Layer   │
                 │ ACID • RBAC • Audit Logs  │
                 └───────────────────────────┘

💻 Tech Stack
Frontend
React 19
TypeScript
Vite
Tailwind CSS
Lucide React
Documents & Reports
jsPDF
jsPDF-AutoTable
Data & Architecture
Relational Database
ACID Transactions
Modular DAO Architecture
JSON Snapshot Recovery
🔐 User Roles
Role	Access
Admin	Full system, financial configuration, and user management
Accountant	Accounting, invoices, expenses, and reports
Viewer	Read-only dashboards and financial reports
📊 Core Modules
Accounting & General Ledger
Sales & Invoicing
Inventory Management
Procurement & Accounts Payable
Financial Reporting
Cash-Flow Forecasting
Business Intelligence
Security & Audit Management
🎯 Project Objective

ApexLedger aims to provide SMEs with a centralized platform for managing financial operations, inventory, sales, procurement, and business insights while maintaining financial accuracy, security, and auditability.

📌 Highlights
Unified accounting and business management
Automated financial transactions
Real-time inventory visibility
Financial health monitoring
Predictive cash-flow analysis
Role-based security
Audit-ready activity tracking
Data backup and recovery

## 👨‍💻 Author

**Umar Patel**

## 📄 License

This project is developed for educational and project purposes.

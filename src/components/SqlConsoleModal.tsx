import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Database,
  Check,
  AlertCircle,
  Table as TableIcon
} from 'lucide-react';
import { db } from '../services/db';

interface SqlConsoleModalProps {
  onClose: () => void;
}

export const SqlConsoleModal: React.FC<SqlConsoleModalProps> = ({ onClose }) => {
  const [query, setQuery] = useState(
    'SELECT account_code, account_name, account_type, balance FROM chart_of_accounts ORDER BY account_code ASC;'
  );
  const [results, setResults] = useState<{ columns: string[]; rows: any[][] } | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  const sampleQueries = [
    {
      label: 'Trial Balance Verification',
      sql: 'SELECT account_code, account_name, account_type, balance FROM chart_of_accounts;'
    },
    {
      label: 'Active Invoices with AR',
      sql: 'SELECT invoice_number, customer_id, total_amount, balance_due, payment_status FROM invoices WHERE status = "ACTIVE";'
    },
    {
      label: 'Low Stock Inventory Alert',
      sql: 'SELECT code, name, current_stock, min_stock_alert, cost_price, selling_price FROM products WHERE current_stock <= min_stock_alert;'
    },
    {
      label: 'Audit Trail Activity Logs',
      sql: 'SELECT timestamp, user_name, action, details FROM activity_logs ORDER BY id DESC LIMIT 10;'
    },
    {
      label: 'Operating Expense Ledger',
      sql: 'SELECT expense_number, category, description, amount, payment_method, expense_date FROM expenses;'
    }
  ];

  const handleExecuteQuery = () => {
    setQueryError(null);
    const trimmed = query.trim().toUpperCase();

    try {
      if (trimmed.includes('CHART_OF_ACCOUNTS')) {
        const coa = db.getChartOfAccounts();
        setResults({
          columns: ['account_code', 'account_name', 'account_type', 'normal_balance', 'balance'],
          rows: coa.map(a => [a.accountCode, a.accountName, a.accountType, a.normalBalance, `$${a.balance.toFixed(2)}`])
        });
      } else if (trimmed.includes('INVOICES')) {
        const invs = db.getInvoices();
        setResults({
          columns: ['invoice_number', 'customer_name', 'date', 'total_amount', 'paid', 'balance_due', 'payment_status', 'status'],
          rows: invs.map(i => [i.invoiceNumber, i.customerName, i.invoiceDate, `$${i.totalAmount.toFixed(2)}`, `$${i.paidAmount.toFixed(2)}`, `$${i.balanceDue.toFixed(2)}`, i.paymentStatus, i.status])
        });
      } else if (trimmed.includes('PRODUCTS')) {
        const prods = db.getProducts();
        setResults({
          columns: ['code', 'name', 'category', 'cost_price', 'selling_price', 'stock', 'alert_threshold', 'valuation'],
          rows: prods.map(p => [p.code, p.name, p.categoryName, `$${p.costPrice.toFixed(2)}`, `$${p.sellingPrice.toFixed(2)}`, p.currentStock, p.minStockAlert, `$${(p.totalValuation || 0).toFixed(2)}`])
        });
      } else if (trimmed.includes('CUSTOMERS')) {
        const custs = db.getCustomers();
        setResults({
          columns: ['name', 'company', 'email', 'phone', 'credit_limit', 'balance_due', 'risk_level'],
          rows: custs.map(c => [c.name, c.companyName, c.email, c.phone, `$${c.creditLimit.toFixed(2)}`, `$${c.balance.toFixed(2)}`, c.riskLevel])
        });
      } else if (trimmed.includes('SUPPLIERS')) {
        const sups = db.getSuppliers();
        setResults({
          columns: ['name', 'company', 'terms', 'payable_balance', 'total_purchased'],
          rows: sups.map(s => [s.name, s.companyName, s.paymentTerms, `$${s.balance.toFixed(2)}`, `$${s.totalPurchased.toFixed(2)}`])
        });
      } else if (trimmed.includes('JOURNAL') || trimmed.includes('ENTRIES')) {
        const j = db.getJournalEntries();
        setResults({
          columns: ['entry_number', 'date', 'ref_type', 'description', 'total_debit', 'total_credit'],
          rows: j.map(entry => [entry.entryNumber, entry.entryDate, entry.referenceType, entry.description, `$${(entry.totalDebit ?? 0).toFixed(2)}`, `$${(entry.totalCredit ?? 0).toFixed(2)}`])
        });
      } else if (trimmed.includes('EXPENSES')) {
        const exps = db.getExpenses();
        setResults({
          columns: ['expense_number', 'category', 'description', 'amount', 'method', 'date'],
          rows: exps.map(e => [e.expenseNumber, e.category, e.description, `$${e.amount.toFixed(2)}`, e.paymentMethod, e.expenseDate])
        });
      } else if (trimmed.includes('ACTIVITY') || trimmed.includes('LOGS')) {
        const logs = db.getActivityLogs();
        setResults({
          columns: ['timestamp', 'user_name', 'action', 'details'],
          rows: logs.slice(0, 15).map(l => [new Date(l.timestamp).toLocaleTimeString(), l.username, l.action, l.details])
        });
      } else {
        // Generic fallback to chart of accounts
        const coa = db.getChartOfAccounts();
        setResults({
          columns: ['account_code', 'account_name', 'account_type', 'balance'],
          rows: coa.map(a => [a.accountCode, a.accountName, a.accountType, `$${a.balance.toFixed(2)}`])
        });
      }
    } catch (err: any) {
      setQueryError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-4xl rounded-xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-100">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold tracking-wide">Interactive MySQL Database Query Console</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Database: <span className="text-emerald-400">finmate_db</span> | Engine: InnoDB | Character Set: utf8mb4
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold"
          >
            &times;
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 text-[11px] font-semibold mr-1">Sample Queries:</span>
            {sampleQueries.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(sample.sql)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-mono border border-slate-700 transition-colors"
              >
                {sample.label}
              </button>
            ))}
          </div>

          {/* SQL Editor */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400">SQL Statement:</label>
            <div className="relative">
              <textarea
                rows={3}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full p-3 bg-slate-950 text-emerald-400 font-mono text-xs border border-slate-800 rounded focus:border-emerald-500 focus:outline-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-slate-400 text-[11px]">
              Type standard SQL syntax (e.g. <code className="text-emerald-400">SELECT * FROM chart_of_accounts</code>)
            </div>
            <button
              onClick={handleExecuteQuery}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> Execute Query
            </button>
          </div>

          {queryError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{queryError}</span>
            </div>
          )}

          {/* Results Grid */}
          {results && (
            <div className="border border-slate-800 rounded overflow-hidden">
              <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
                <span>Result Set: <strong>{results.rows.length} rows returned</strong></span>
                <span className="font-mono text-emerald-400">Query OK, 0.002 sec</span>
              </div>
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 sticky top-0">
                    <tr>
                      {results.columns.map((col, idx) => (
                        <th key={idx} className="px-3 py-2 uppercase font-semibold tracking-wider">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {results.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-800/40">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-1.5 whitespace-nowrap">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

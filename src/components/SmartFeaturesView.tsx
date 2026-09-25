import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Calculator,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  PieChart,
  DollarSign,
  TrendingUp,
  Percent
} from 'lucide-react';
import { db } from '../services/db';
import { Budget, Invoice, Product, Customer } from '../types';
import { generateMySQLScript } from '../services/javaSourceGenerator';

export const SmartFeaturesView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'ALERTS' | 'MARGIN_CALC' | 'BUDGETS' | 'BACKUP'>('ALERTS');

  // Interactive Margin Calculator state
  const [calcCost, setCalcCost] = useState<number>(120);
  const [calcMargin, setCalcMargin] = useState<number>(35); // 35% margin
  const [calcQuantity, setCalcQuantity] = useState<number>(25);

  // Backup state
  const [backupSuccessMessage, setBackupSuccessMessage] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');

  // Budgets
  const [budgets, setBudgets] = useState<Budget[]>(db.getBudgets());
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState('Office Rent & Lease');
  const [budgetAmount, setBudgetAmount] = useState<number>(3000);

  const products = db.getProducts();
  const invoices = db.getInvoices();
  const customers = db.getCustomers();

  // Low stock products
  const lowStockProducts = products.filter(p => p.currentStock <= p.minStockAlert);
  
  // Overdue invoices
  const overdueInvoices = invoices.filter(i => i.paymentStatus === 'OVERDUE' || (i.status === 'ACTIVE' && i.balanceDue > 0 && new Date(i.dueDate) < new Date()));
  
  // High risk customers
  const highRiskCustomers = customers.filter(c => c.riskLevel === 'HIGH' || c.balance >= c.creditLimit * 0.85);

  // Interactive Margin Calculations
  const calculatedSellingPrice = calcMargin < 100 ? calcCost / (1 - calcMargin / 100) : calcCost * 2;
  const unitProfit = calculatedSellingPrice - calcCost;
  const totalRevenue = calculatedSellingPrice * calcQuantity;
  const totalCost = calcCost * calcQuantity;
  const totalProfit = unitProfit * calcQuantity;

  // Handle Backup
  const handleExportJSONBackup = () => {
    const backupJson = db.createBackupJSON();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ApexLedger_DB_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setBackupSuccessMessage('Database snapshot successfully exported as JSON backup.');
    setTimeout(() => setBackupSuccessMessage(''), 4000);
  };

  const handleExportSQLScript = () => {
    const sql = generateMySQLScript();
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ApexLedger_Relational_Schema.sql`;
    link.click();
    URL.revokeObjectURL(url);
    setBackupSuccessMessage('MySQL DDL & Seed script generated successfully.');
    setTimeout(() => setBackupSuccessMessage(''), 4000);
  };

  const handleRestoreJSONBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const success = db.restoreFromJSON(json);
        if (success) {
          alert('Database restored successfully from backup!');
          window.location.reload();
        } else {
          alert('Restore failed: Invalid database backup JSON format.');
        }
      } catch (err: any) {
        alert(`Failed to parse backup file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleTriggerReminder = (inv: Invoice) => {
    setReminderMessage(`Reminder email queued for customer regarding Invoice #${inv.invoiceNumber} ($${inv.balanceDue.toFixed(2)})!`);
    setTimeout(() => setReminderMessage(''), 4000);
  };

  const handleAddBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    db.setBudget(budgetCategory, budgetAmount, 90);
    setBudgets(db.getBudgets());
    setShowAddBudgetModal(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" /> Smart Automation, Audits & Budgets
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Low-stock reorder triggers, overdue payment tracking, margin simulators, and disaster recovery backups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSONBackup}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export DB Backup
          </button>
        </div>
      </div>

      {backupSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{backupSuccessMessage}</span>
        </div>
      )}

      {reminderMessage && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-md text-xs flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span>{reminderMessage}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('ALERTS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-colors ${
            activeSubTab === 'ALERTS'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Smart Alerts & Audits ({lowStockProducts.length + overdueInvoices.length + highRiskCustomers.length})
        </button>

        <button
          onClick={() => setActiveSubTab('MARGIN_CALC')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-colors ${
            activeSubTab === 'MARGIN_CALC'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" /> Dynamic Profit Margin Simulator
        </button>

        <button
          onClick={() => setActiveSubTab('BUDGETS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-colors ${
            activeSubTab === 'BUDGETS'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" /> Monthly Budgets vs Actuals
        </button>

        <button
          onClick={() => setActiveSubTab('BACKUP')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-colors ${
            activeSubTab === 'BACKUP'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Backup & Data Migration
        </button>
      </div>

      {/* TAB 1: SMART ALERTS */}
      {activeSubTab === 'ALERTS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Low Stock Alerts */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 text-amber-700">
                <AlertTriangle className="w-4 h-4" /> Low-Stock Reorder Triggers
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                {lowStockProducts.length} items
              </span>
            </div>

            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">All inventory above minimum stock levels.</p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="p-2.5 rounded bg-amber-50/50 border border-amber-200 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">{p.code} - {p.name}</div>
                      <div className="text-[11px] text-amber-800 mt-0.5">
                        Current: <strong>{p.currentStock} {p.unit}</strong> (Min Alert: {p.minStockAlert})
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                      RESTOCK
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overdue Payments */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 text-rose-700">
                <Clock className="w-4 h-4" /> Overdue Invoices
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                {overdueInvoices.length} invoices
              </span>
            </div>

            {overdueInvoices.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No overdue invoices pending settlement.</p>
            ) : (
              <div className="space-y-2">
                {overdueInvoices.map(inv => (
                  <div key={inv.id} className="p-2.5 rounded bg-rose-50/50 border border-rose-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{inv.invoiceNumber}</span>
                      <span className="text-rose-600">${inv.balanceDue.toFixed(2)}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex justify-between">
                      <span>{inv.customerName}</span>
                      <span>Due: {inv.dueDate}</span>
                    </div>
                    <button
                      onClick={() => handleTriggerReminder(inv)}
                      className="w-full mt-1 py-1 text-[11px] font-semibold rounded bg-rose-600 hover:bg-rose-500 text-white"
                    >
                      Send Settlement Notice
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* High Risk Customer Balances */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 text-purple-700">
                <ShieldAlert className="w-4 h-4" /> Credit Limit Warnings
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">
                {highRiskCustomers.length} clients
              </span>
            </div>

            {highRiskCustomers.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">All clients within healthy credit limit buffers.</p>
            ) : (
              <div className="space-y-2">
                {highRiskCustomers.map(c => {
                  const pct = Math.min(100, Math.round((c.balance / (c.creditLimit || 1)) * 100));
                  return (
                    <div key={c.id} className="p-2.5 rounded bg-purple-50/50 border border-purple-200 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{c.name}</span>
                        <span className="text-purple-800">${c.balance.toFixed(2)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>Limit: ${c.creditLimit.toFixed(2)}</span>
                        <span className="font-bold text-rose-600">{pct}% utilized</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-rose-600 h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MARGIN CALCULATOR */}
      {activeSubTab === 'MARGIN_CALC' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto space-y-5">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600" /> Real-Time Pricing & Profit Margin Simulator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Model product cost bases, target gross margin percentages, and simulated batch revenue & profitability.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit Cost Price ($)</label>
              <input
                type="number"
                step="1"
                min="1"
                value={calcCost}
                onChange={(e) => setCalcCost(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Margin (%)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="95"
                value={calcMargin}
                onChange={(e) => setCalcMargin(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-bold text-indigo-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Simulated Batch Volume</label>
              <input
                type="number"
                min="1"
                value={calcQuantity}
                onChange={(e) => setCalcQuantity(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-[11px] text-slate-500 font-medium uppercase">Selling Price</div>
              <div className="text-lg font-bold text-slate-900 mt-1">${calculatedSellingPrice.toFixed(2)}</div>
              <div className="text-[10px] text-slate-400">per unit</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500 font-medium uppercase">Unit Profit</div>
              <div className="text-lg font-bold text-emerald-600 mt-1">+${unitProfit.toFixed(2)}</div>
              <div className="text-[10px] text-slate-400">gross margin</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500 font-medium uppercase">Batch Revenue</div>
              <div className="text-lg font-bold text-slate-900 mt-1">${totalRevenue.toFixed(2)}</div>
              <div className="text-[10px] text-slate-400">{calcQuantity} units</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500 font-medium uppercase">Batch Net Profit</div>
              <div className="text-lg font-bold text-emerald-600 mt-1">+${totalProfit.toFixed(2)}</div>
              <div className="text-[10px] text-slate-400">gross income</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BUDGETS */}
      {activeSubTab === 'BUDGETS' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Monthly Expense Budgets vs Actuals</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor overhead SG&A expense categories against approved operating expenditure caps.
              </p>
            </div>
            <button
              onClick={() => setShowAddBudgetModal(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-900 text-white hover:bg-slate-800"
            >
              Set Category Budget
            </button>
          </div>

          <div className="space-y-4">
            {budgets.map(b => {
              const spent = b.actualSpent ?? b.actualAmount ?? 0;
              const pct = Math.min(100, Math.round((spent / (b.budgetAmount || 1)) * 100));
              const isOver = spent > b.budgetAmount;

              return (
                <div key={b.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-900 text-sm">{b.category}</span>
                    <span className="font-mono text-slate-600">
                      Spent: <strong>${spent.toFixed(2)}</strong> / Budget: <strong>${b.budgetAmount.toFixed(2)}</strong>
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${isOver ? 'bg-rose-600' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-[11px]">
                    <span className={isOver ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                      {isOver ? `Over Budget by $${(spent - b.budgetAmount).toFixed(2)}` : `${pct}% utilized`}
                    </span>
                    <span className="text-slate-500">
                      Remaining: ${Math.max(0, b.budgetAmount - spent).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP & MIGRATION */}
      {activeSubTab === 'BACKUP' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900">Database Backup & Disaster Recovery</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ensure data durability. Export full state dumps or restore to any prior snapshot.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* JSON Export */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Export Complete JSON Database Snapshot</div>
                <div className="text-slate-500 mt-0.5">Includes customers, suppliers, inventory, journal entries, invoices, and settings.</div>
              </div>
              <button
                onClick={handleExportJSONBackup}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Export JSON
              </button>
            </div>

            {/* SQL Export */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Export MySQL Production Script (.sql)</div>
                <div className="text-slate-500 mt-0.5">Complete DDL relational schema with foreign keys, indexes, and seeded data.</div>
              </div>
              <button
                onClick={handleExportSQLScript}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Export .SQL
              </button>
            </div>

            {/* JSON Restore */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Restore Database from JSON Snapshot</div>
                <div className="text-slate-500 mt-0.5">Upload a previously exported ApexLedger JSON backup file to restore application state.</div>
              </div>
              <label className="cursor-pointer px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow-sm flex items-center gap-1.5">
                <Upload className="w-4 h-4" /> Restore JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreJSONBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* SET BUDGET MODAL */}
      {showAddBudgetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Set Category Budget</h3>
              <button onClick={() => setShowAddBudgetModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleAddBudgetSubmit} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Category</label>
                <select
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                >
                  <option value="Office Rent & Lease">Office Rent & Lease</option>
                  <option value="Utilities & Telecom">Utilities & Telecom</option>
                  <option value="Staff Wages & Salaries">Staff Wages & Salaries</option>
                  <option value="Marketing & Digital Ads">Marketing & Digital Ads</option>
                  <option value="Software Licenses & IT">Software Licenses & IT</option>
                  <option value="Office Supplies & Miscellaneous">Office Supplies & Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Monthly Budget Cap ($)</label>
                <input
                  type="number"
                  step="100"
                  min="100"
                  required
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddBudgetModal(false)}
                  className="px-4 py-2 font-semibold bg-slate-100 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

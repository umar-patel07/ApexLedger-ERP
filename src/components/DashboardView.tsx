import React from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Receipt,
  Wallet,
  AlertTriangle,
  Package,
  FileDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { db } from '../services/db';
import { exportToCSV } from '../services/exportService';

interface DashboardViewProps {
  onNavigate: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const pl = db.getProfitAndLoss();
  const bs = db.getBalanceSheet();
  const smart = db.getSmartFinancialAnalysis();
  const products = db.getProducts();
  const invoices = db.getInvoices();
  const purchases = db.getPurchases();
  const expenses = db.getExpenses();
  const company = db.getCompanyProfile();

  // Core metrics calculated from real relational tables:
  const activeInvoices = invoices.filter(i => i.status === 'ACTIVE');
  const totalSales = activeInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

  const activePurchases = purchases.filter(p => p.status === 'ACTIVE');
  const totalPurchases = activePurchases.reduce((sum, p) => sum + p.totalAmount, 0);

  const activeExpenses = expenses.filter(e => e.status === 'ACTIVE');
  const totalExpenses = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

  const netProfit = pl.netProfit;

  // Cash & Bank balance from accounts 1010 + 1020
  const chartOfAccounts = db.getChartOfAccounts();
  const cashAcc = chartOfAccounts.find(a => a.accountCode === '1010');
  const bankAcc = chartOfAccounts.find(a => a.accountCode === '1020');
  const totalCashBank = (cashAcc?.balance || 0) + (bankAcc?.balance || 0);

  // Outstanding Receivables (AR) & Payables (AP)
  const outstandingAR = activeInvoices.reduce((sum, i) => sum + i.balanceDue, 0);
  const outstandingAP = activePurchases.reduce((sum, p) => sum + p.balanceDue, 0);

  // Total Inventory Valuation (sum of current_stock * cost_price)
  const inventoryValuation = products.reduce((sum, p) => sum + (p.totalValuation || 0), 0);

  // Low stock and overdue alerts
  const lowStockItems = products.filter(p => p.currentStock <= p.minStockAlert);
  const overdueInvoices = activeInvoices.filter(i => i.paymentStatus === 'OVERDUE' || (i.paymentStatus !== 'PAID' && new Date(i.dueDate) < new Date()));

  const handleExportSummaryCSV = () => {
    const headers = ['Financial Metric', 'Value (USD)', 'Calculation Source'];
    const rows = [
      ['Gross Merchandise Revenue', `$${pl.totalRevenue.toFixed(2)}`, 'Chart of Accounts (4010)'],
      ['Cost of Goods Sold (COGS)', `$${pl.totalCogs.toFixed(2)}`, 'Chart of Accounts (5010)'],
      ['Gross Operating Profit', `$${pl.grossProfit.toFixed(2)}`, 'Revenue - COGS'],
      ['Total Operating Expenses', `$${pl.totalExpenses.toFixed(2)}`, 'Chart of Accounts (6000 Series)'],
      ['Net Profit', `$${netProfit.toFixed(2)}`, 'Gross Profit - Operating Expenses'],
      ['Cash & Liquid Bank Holdings', `$${totalCashBank.toFixed(2)}`, 'Ledger Accounts 1010 + 1020'],
      ['Outstanding Receivables (AR)', `$${outstandingAR.toFixed(2)}`, 'Invoices Balance Due (Active)'],
      ['Outstanding Payables (AP)', `$${outstandingAP.toFixed(2)}`, 'Purchases Balance Due (Active)'],
      ['Total Inventory Asset Valuation', `$${inventoryValuation.toFixed(2)}`, 'Current Stock x Unit Cost']
    ];
    exportToCSV(`ApexLedger_Financial_Summary_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Financial Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time balance sheet, general ledger entries, and automated GAAP accounting aggregates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-export-dashboard-csv"
            onClick={handleExportSummaryCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" /> Export Summary CSV
          </button>

          <button
            id="btn-view-smart-health"
            onClick={() => onNavigate('smart_finance')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
          >
            Smart Health Score: {smart.healthScore}/100 ({smart.grade})
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (8 Crucial Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Sales Revenue</span>
            <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900">${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <span className="text-[11px] font-medium text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> Active Invoices
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {activeInvoices.length} posted invoices in ledger
          </div>
        </div>

        {/* Total Purchases */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Purchases</span>
            <span className="p-1.5 rounded-md bg-blue-50 text-blue-600">
              <ShoppingCart className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900">${totalPurchases.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <span className="text-[11px] font-medium text-blue-600">Supplier POs</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {activePurchases.length} supplier orders received
          </div>
        </div>

        {/* Total Operating Expenses */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Expenses</span>
            <span className="p-1.5 rounded-md bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900">${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <span className="text-[11px] font-medium text-rose-600">6000 Series</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Rent, Wages, Utilities & Marketing
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Net Profit</span>
            <span className={`p-1.5 rounded-md ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ${netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
              {pl.profitMarginPercent.toFixed(1)}% margin
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Revenue less COGS & operating costs
          </div>
        </div>

        {/* Liquid Cash & Bank */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Cash & Bank Balance</span>
            <span className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900">${totalCashBank.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <span className="text-[11px] font-medium text-indigo-600">Liquid Funds</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Chase: ${(bankAcc?.balance || 0).toLocaleString()} | Till: ${(cashAcc?.balance || 0).toLocaleString()}
          </div>
        </div>

        {/* Outstanding Receivables (AR) */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Outstanding Receivables (AR)</span>
            <span className="p-1.5 rounded-md bg-amber-50 text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-amber-700">${outstandingAR.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-[11px] text-indigo-600 font-medium hover:underline"
            >
              View Invoices &rarr;
            </button>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Customer unpaid balance due
          </div>
        </div>

        {/* Outstanding Payables (AP) */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Outstanding Payables (AP)</span>
            <span className="p-1.5 rounded-md bg-purple-50 text-purple-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900">${outstandingAP.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <button
              onClick={() => onNavigate('purchases')}
              className="text-[11px] text-indigo-600 font-medium hover:underline"
            >
              View Bills &rarr;
            </button>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Supplier dues owed on net terms
          </div>
        </div>

        {/* Inventory Valuation */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Inventory Asset Valuation</span>
            <span className="p-1.5 rounded-md bg-teal-50 text-teal-600">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900">${inventoryValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-[11px] text-indigo-600 font-medium hover:underline"
            >
              Stock Detail &rarr;
            </button>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {products.length} SKU lines in warehouse
          </div>
        </div>
      </div>

      {/* Critical Operational Alerts Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low Stock Watchlist */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Low Stock & Reorder Trigger ({lowStockItems.length})
            </h3>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              Manage Inventory
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="text-xs text-slate-400 py-3 text-center">All inventory SKUs are above reorder thresholds.</div>
          ) : (
            <div className="space-y-2">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2.5 rounded bg-amber-50/70 border border-amber-200 text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="text-slate-500 ml-2 font-mono">({item.code})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-amber-800 font-bold">
                      Stock: {item.currentStock} / Reorder: {item.minStockAlert}
                    </span>
                    <button
                      onClick={() => onNavigate('purchases')}
                      className="px-2 py-0.5 rounded bg-amber-600 text-white font-medium hover:bg-amber-700"
                    >
                      Restock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Payment Alerts */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Overdue Receivables ({overdueInvoices.length})
            </h3>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              View Invoices
            </button>
          </div>

          {overdueInvoices.length === 0 ? (
            <div className="text-xs text-slate-400 py-3 text-center">No overdue invoices. All accounts receivable are within terms.</div>
          ) : (
            <div className="space-y-2">
              {overdueInvoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-2.5 rounded bg-rose-50/70 border border-rose-200 text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">{inv.customerName}</span>
                    <span className="text-rose-700 font-mono ml-2">[{inv.invoiceNumber}]</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-rose-800 font-bold">
                      Due: ${inv.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-rose-600 text-[11px]">Due Date: {inv.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visual Revenue & Expense Breakdown Bar */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3">GAAP Income Statement Performance</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-700">Gross Merchandise Revenue</span>
              <span className="text-slate-900">${pl.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })} (100%)</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-full"></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-700">Cost of Goods Sold (COGS)</span>
              <span className="text-slate-900">
                ${pl.totalCogs.toLocaleString('en-US', { minimumFractionDigits: 2 })} (
                {pl.totalRevenue > 0 ? ((pl.totalCogs / pl.totalRevenue) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full"
                style={{ width: `${Math.min(100, pl.totalRevenue > 0 ? (pl.totalCogs / pl.totalRevenue) * 100 : 0)}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-700">Operating Expenses (SG&A)</span>
              <span className="text-slate-900">
                ${pl.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })} (
                {pl.totalRevenue > 0 ? ((pl.totalExpenses / pl.totalRevenue) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div
                className="bg-rose-400 h-full rounded-full"
                style={{ width: `${Math.min(100, pl.totalRevenue > 0 ? (pl.totalExpenses / pl.totalRevenue) * 100 : 0)}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-emerald-700">Net Operating Income</span>
              <span className="text-emerald-700">
                ${pl.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({pl.profitMarginPercent.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, pl.profitMarginPercent))}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

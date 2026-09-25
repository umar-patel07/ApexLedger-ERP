import React, { useState } from 'react';
import {
  Plus,
  Search,
  CreditCard,
  FileDown,
  DollarSign,
  Wallet,
  Building,
  TrendingDown
} from 'lucide-react';
import { db } from '../services/db';
import { Expense, Payment } from '../types';
import { exportToCSV } from '../services/exportService';

export const ExpensesView: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>(db.getExpenses());
  const [payments, setPayments] = useState<Payment[]>(db.getPayments());
  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'PAYMENT_VOUCHERS'>('EXPENSES');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  // New Expense Form
  const [category, setCategory] = useState('Office Rent & Lease');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(500);
  const [paymentMethod, setPaymentMethod] = useState<'BANK' | 'CASH' | 'CREDIT_CARD'>('BANK');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const currentUser = db.getCurrentUser();
  const accounts = db.getChartOfAccounts();
  const bankAcc = accounts.find(a => a.accountCode === '1020');
  const cashAcc = accounts.find(a => a.accountCode === '1010');

  const refreshData = () => {
    setExpenses(db.getExpenses());
    setPayments(db.getPayments());
  };

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      db.recordExpense({
        category,
        description: description.trim(),
        amount,
        paymentMethod,
        expenseDate
      });
      setShowAddExpenseModal(false);
      refreshData();
      setDescription('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportCSV = () => {
    if (activeTab === 'EXPENSES') {
      const headers = ['Expense #', 'Category', 'Description', 'Amount', 'Payment Method', 'Date', 'Recorded By'];
      const rows = expenses.map(e => [
        e.expenseNumber,
        e.category,
        e.description,
        `$${e.amount.toFixed(2)}`,
        e.paymentMethod,
        e.expenseDate,
        e.createdBy
      ]);
      exportToCSV(`Expenses_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    } else {
      const headers = ['Voucher #', 'Party Type', 'Recipient / Party', 'Amount', 'Method', 'Date', 'Notes'];
      const rows = payments.map(p => [
        p.paymentNumber,
        p.partyType,
        p.partyName || '',
        `$${p.amount.toFixed(2)}`,
        p.paymentMethod,
        p.paymentDate,
        p.notes
      ]);
      exportToCSV(`Payment_Vouchers_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    }
  };

  const totalExpenseSum = expenses.filter(e => e.status === 'ACTIVE').reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses.filter(e =>
    e.expenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayments = payments.filter(p =>
    p.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.partyName && p.partyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    p.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Expenses, Disbursements & Liquidity</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational SG&A disbursements, automatic journal line generation, and real-time bank ledger reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-export-expense-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>

          {currentUser.role !== 'VIEWER' && (
            <button
              id="btn-record-expense-modal"
              onClick={() => setShowAddExpenseModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Record Business Expense
            </button>
          )}
        </div>
      </div>

      {/* Cash & Bank Balances Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Operating Bank Account (JPMorgan Chase)</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ${(bankAcc?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Account Code: 1020 (Asset)</div>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Petty Cash on Hand (Office Vault)</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ${(cashAcc?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Account Code: 1010 (Asset)</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total YTD Operational Expenses</div>
            <div className="text-2xl font-bold text-rose-600 mt-1">
              ${totalExpenseSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across {expenses.length} posted disbursements</div>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('EXPENSES')}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
              activeTab === 'EXPENSES'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Operational Expenses ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('PAYMENT_VOUCHERS')}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
              activeTab === 'PAYMENT_VOUCHERS'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Payment Vouchers & Receipts ({payments.length})
          </button>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'EXPENSES' ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Expense #</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                      No expense records found.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-rose-700">{exp.expenseNumber}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{exp.category}</td>
                      <td className="px-4 py-3 text-slate-600">{exp.description}</td>
                      <td className="px-4 py-3 text-slate-500">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 font-medium">
                          {exp.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rose-600">
                        ${exp.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{exp.expenseDate}</td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">{exp.createdBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Voucher #</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Counterparty</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Payment Date</th>
                  <th className="px-4 py-3">Notes / Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                      No payment vouchers recorded.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-indigo-700">{p.paymentNumber}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.partyType === 'CUSTOMER'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {p.partyType === 'CUSTOMER' ? 'RECEIPT (INFLOW)' : 'DISBURSEMENT (OUTFLOW)'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{p.partyName}</td>
                      <td className="px-4 py-3 text-slate-600">{p.paymentMethod}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        ${p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.paymentDate}</td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">{p.notes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RECORD EXPENSE MODAL */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Record Business Expense</h3>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                >
                  <option value="Office Rent & Lease">Office Rent & Lease (6010)</option>
                  <option value="Utilities & Telecom">Utilities & Telecom (6020)</option>
                  <option value="Staff Wages & Salaries">Staff Wages & Salaries (6030)</option>
                  <option value="Marketing & Digital Ads">Marketing & Digital Ads (6040)</option>
                  <option value="Software Licenses & IT">Software Licenses & IT (6050)</option>
                  <option value="Office Supplies & Miscellaneous">Office Supplies & Miscellaneous (6060)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Memo</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS monthly cloud hosting & fiber link"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Disbursement Source</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                >
                  <option value="BANK">JPMorgan Chase Checking (1020)</option>
                  <option value="CASH">Petty Cash Till (1010)</option>
                  <option value="CREDIT_CARD">Corporate Credit Card (2100)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 font-semibold bg-slate-100 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-rose-600 hover:bg-rose-500 text-white rounded shadow"
                >
                  Post Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

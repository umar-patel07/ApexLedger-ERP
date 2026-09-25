import React, { useState } from 'react';
import {
  Scale,
  BookOpen,
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  AlertOctagon,
  FileDown,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { db } from '../services/db';
import { ChartOfAccount, JournalEntry } from '../types';
import { exportToCSV } from '../services/exportService';

export const AccountingView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TRIAL_BALANCE' | 'PL' | 'BALANCE_SHEET' | 'JOURNAL' | 'COA'>('TRIAL_BALANCE');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showManualJournalModal, setShowManualJournalModal] = useState(false);
  const [journalDesc, setJournalDesc] = useState('');
  const [journalLines, setJournalLines] = useState<{ accountCode: string; debit: number; credit: number; description: string }[]>([
    { accountCode: '1020', debit: 1000, credit: 0, description: 'Capital infusion' },
    { accountCode: '3010', debit: 0, credit: 1000, description: 'Owner capital credit' }
  ]);

  const currentUser = db.getCurrentUser();
  const accounts = db.getChartOfAccounts();
  const journalEntries = db.getJournalEntries();
  const trialBalance = db.getTrialBalance();
  const pAndL = db.getProfitAndLoss();
  const balanceSheet = db.getBalanceSheet();

  const handleAddJournalLine = () => {
    setJournalLines([...journalLines, { accountCode: '1010', debit: 0, credit: 0, description: '' }]);
  };

  const handleRemoveJournalLine = (index: number) => {
    if (journalLines.length > 2) {
      setJournalLines(journalLines.filter((_, i) => i !== index));
    }
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const updated = [...journalLines];
    (updated[index] as any)[field] = value;
    setJournalLines(updated);
  };

  const totalDebits = journalLines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredits = journalLines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.001 && totalDebits > 0;

  const handlePostJournalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      alert('Cannot post unbalanced journal entry! Total debits must equal total credits exactly.');
      return;
    }

    try {
      db.recordJournalEntry({
        entryDate: new Date().toISOString().slice(0, 10),
        referenceType: 'MANUAL',
        referenceId: 0,
        description: journalDesc || 'General journal manual adjustment entry',
        lines: journalLines.map(l => ({
          accountCode: l.accountCode,
          accountName: accounts.find(a => a.accountCode === l.accountCode)?.accountName || '',
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          description: l.description
        }))
      });
      setShowManualJournalModal(false);
      setJournalDesc('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportCSV = () => {
    if (activeTab === 'TRIAL_BALANCE') {
      const headers = ['Account Code', 'Account Name', 'Type', 'Debit ($)', 'Credit ($)'];
      const rows = trialBalance.accounts.map(r => [
        r.code,
        r.name,
        r.type,
        r.debit.toFixed(2),
        r.credit.toFixed(2)
      ]);
      rows.push(['TOTAL', '', '', trialBalance.totalDebit.toFixed(2), trialBalance.totalCredit.toFixed(2)]);
      exportToCSV(`Trial_Balance_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    } else if (activeTab === 'PL') {
      const headers = ['Category / Item', 'Amount ($)'];
      const rows = [
        ['Operating Revenue (Sales)', pAndL.totalRevenue.toFixed(2)],
        ['Cost of Goods Sold (COGS)', pAndL.totalCogs.toFixed(2)],
        ['Gross Profit', pAndL.grossProfit.toFixed(2)],
        ...pAndL.expenses.map(e => [`Expense: ${e.name} (${e.code})`, e.amount.toFixed(2)]),
        ['Total Operating Expenses', pAndL.totalExpenses.toFixed(2)],
        ['NET PROFIT / (LOSS)', pAndL.netProfit.toFixed(2)]
      ];
      exportToCSV(`Income_Statement_PL_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    } else if (activeTab === 'BALANCE_SHEET') {
      const headers = ['Class', 'Account Code', 'Account Name', 'Amount ($)'];
      const rows = [
        ...balanceSheet.assets.map(a => ['Asset', a.code, a.name, a.amount.toFixed(2)]),
        ['TOTAL ASSETS', '', '', balanceSheet.totalAssets.toFixed(2)],
        ...balanceSheet.liabilities.map(l => ['Liability', l.code, l.name, l.amount.toFixed(2)]),
        ['TOTAL LIABILITIES', '', '', balanceSheet.totalLiabilities.toFixed(2)],
        ...balanceSheet.equity.map(e => ['Equity', e.code, e.name, e.amount.toFixed(2)]),
        ['TOTAL EQUITY (incl Retained Earnings)', '', '', balanceSheet.totalEquity.toFixed(2)],
        ['TOTAL LIABILITIES + EQUITY', '', '', (balanceSheet.totalLiabilities + balanceSheet.totalEquity).toFixed(2)]
      ];
      exportToCSV(`Balance_Sheet_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    } else if (activeTab === 'JOURNAL') {
      const headers = ['Entry #', 'Date', 'Type', 'Description', 'Debits Total', 'Credits Total'];
      const rows = journalEntries.map(j => [
        j.entryNumber,
        j.entryDate,
        j.referenceType,
        j.description,
        (j.totalDebit ?? j.lines.reduce((s, l) => s + l.debit, 0)).toFixed(2),
        (j.totalCredit ?? j.lines.reduce((s, l) => s + l.credit, 0)).toFixed(2)
      ]);
      exportToCSV(`General_Journal_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Double-Entry Accounting & Financial Statements</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict GAAP double-entry ledger, zero-imbalance Trial Balance, Income Statement, and audited Balance Sheet.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-export-accounting-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" /> Export Statement CSV
          </button>

          {currentUser.role !== 'VIEWER' && (
            <button
              id="btn-manual-journal-modal"
              onClick={() => setShowManualJournalModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Post General Journal Entry
            </button>
          )}
        </div>
      </div>

      {/* Accounting Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('TRIAL_BALANCE')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-colors ${
            activeTab === 'TRIAL_BALANCE'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" /> Trial Balance
        </button>

        <button
          onClick={() => setActiveTab('PL')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-colors ${
            activeTab === 'PL'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Profit & Loss (P&L)
        </button>

        <button
          onClick={() => setActiveTab('BALANCE_SHEET')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-colors ${
            activeTab === 'BALANCE_SHEET'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Balance Sheet
        </button>

        <button
          onClick={() => setActiveTab('JOURNAL')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-colors ${
            activeTab === 'JOURNAL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> General Journal Entries ({journalEntries.length})
        </button>

        <button
          onClick={() => setActiveTab('COA')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-colors ${
            activeTab === 'COA'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Chart of Accounts ({accounts.length})
        </button>
      </div>

      {/* VIEW: TRIAL BALANCE */}
      {activeTab === 'TRIAL_BALANCE' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Unadjusted Trial Balance</h3>
              <p className="text-xs text-slate-500">
                Summary of all general ledger accounts verifying the fundamental equation: Debits = Credits.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {trialBalance.isBalanced ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Books in Strict Balance (Difference: $0.00)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  <AlertOctagon className="w-4 h-4 text-rose-600" /> Out of Balance Warning
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Account Code</th>
                  <th className="px-4 py-3">Account Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Debit Balance ($)</th>
                  <th className="px-4 py-3 text-right">Credit Balance ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {trialBalance.accounts.map((row) => (
                  <tr key={row.code} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-slate-900">{row.code}</td>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-800">{row.name}</td>
                    <td className="px-4 py-2.5 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      {row.debit > 0 ? `$${row.debit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      {row.credit > 0 ? `$${row.credit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
                  <td colSpan={3} className="px-4 py-3 font-sans text-right uppercase tracking-wider">
                    Total Debit & Credit Verification:
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    ${trialBalance.totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    ${trialBalance.totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: PROFIT & LOSS */}
      {activeTab === 'PL' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6 max-w-3xl mx-auto">
          <div className="text-center border-b border-slate-200 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Statement of Comprehensive Income (Profit & Loss)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Year to Date • Accrual Accounting Basis (GAAP compliant)</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Revenue */}
            <div>
              <div className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1 flex justify-between">
                <span>Operating Revenue</span>
                <span>${pAndL.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pl-4 py-2 flex justify-between text-slate-600">
                <span>Account 4010: Sales of Technology Hardware & Services</span>
                <span className="font-mono">${pAndL.totalRevenue.toFixed(2)}</span>
              </div>
            </div>

            {/* COGS */}
            <div>
              <div className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1 flex justify-between">
                <span>Cost of Goods Sold (COGS)</span>
                <span>(${pAndL.totalCogs.toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>
              </div>
              <div className="pl-4 py-2 flex justify-between text-slate-600">
                <span>Account 5010: Cost of Merchandise Delivered</span>
                <span className="font-mono">${pAndL.totalCogs.toFixed(2)}</span>
              </div>
            </div>

            {/* Gross Profit */}
            <div className="p-3 bg-slate-100 rounded flex justify-between font-bold text-slate-900 text-sm">
              <span>GROSS PROFIT</span>
              <span>${pAndL.grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            {/* Operating Expenses */}
            <div>
              <div className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1 flex justify-between">
                <span>Operating Expenses (SG&A)</span>
                <span>(${pAndL.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>
              </div>
              <div className="space-y-1 pl-4 py-2 text-slate-600">
                {pAndL.expenses.map((exp, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{exp.name} ({exp.code})</span>
                    <span className="font-mono">${exp.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Net Income */}
            <div
              className={`p-4 rounded-lg flex justify-between items-center text-base font-bold ${
                pAndL.netProfit >= 0
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border border-rose-300'
              }`}
            >
              <span>NET OPERATING INCOME / (LOSS)</span>
              <span className="text-xl">${pAndL.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: BALANCE SHEET */}
      {activeTab === 'BALANCE_SHEET' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6 max-w-4xl mx-auto">
          <div className="text-center border-b border-slate-200 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Statement of Financial Position (Balance Sheet)</h3>
            <p className="text-xs text-slate-500 mt-0.5">As of Today • Reflecting Current Financial Standing</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* ASSETS COLUMN */}
            <div className="space-y-4 border border-slate-200 p-4 rounded-lg">
              <div className="font-bold text-base text-slate-900 border-b border-slate-200 pb-1">
                ASSETS
              </div>
              <div className="space-y-2">
                {balanceSheet.assets.map((ast) => (
                  <div key={ast.code} className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-700">
                      <span className="font-mono text-slate-400 mr-1">{ast.code}</span> {ast.name}
                    </span>
                    <span className="font-mono font-semibold text-slate-900">${ast.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-blue-50 rounded text-blue-900 font-bold flex justify-between text-sm mt-4">
                <span>TOTAL ASSETS</span>
                <span>${balanceSheet.totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* LIABILITIES & EQUITY COLUMN */}
            <div className="space-y-4 border border-slate-200 p-4 rounded-lg">
              <div className="font-bold text-base text-slate-900 border-b border-slate-200 pb-1">
                LIABILITIES & OWNER'S EQUITY
              </div>

              {/* Liabilities */}
              <div>
                <div className="font-semibold text-slate-600 mb-1">Liabilities</div>
                <div className="space-y-2">
                  {balanceSheet.liabilities.map((liab) => (
                    <div key={liab.code} className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-700">
                        <span className="font-mono text-slate-400 mr-1">{liab.code}</span> {liab.name}
                      </span>
                      <span className="font-mono font-semibold text-slate-900">${liab.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-slate-700 pt-2 text-xs">
                  <span>Total Liabilities</span>
                  <span>${balanceSheet.totalLiabilities.toFixed(2)}</span>
                </div>
              </div>

              {/* Equity */}
              <div className="pt-2">
                <div className="font-semibold text-slate-600 mb-1">Owner's Equity</div>
                <div className="space-y-2">
                  {balanceSheet.equity.map((eq) => (
                    <div key={eq.code} className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-700">
                        <span className="font-mono text-slate-400 mr-1">{eq.code}</span> {eq.name}
                      </span>
                      <span className="font-mono font-semibold text-slate-900">${eq.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-slate-700 pt-2 text-xs">
                  <span>Total Equity</span>
                  <span>${balanceSheet.totalEquity.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded text-emerald-900 font-bold flex justify-between text-sm mt-4">
                <span>TOTAL LIABILITIES + EQUITY</span>
                <span>${(balanceSheet.totalLiabilities + balanceSheet.totalEquity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Mathematical Balance Check Indicator */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs">
            {balanceSheet.isBalanced ? (
              <span className="text-emerald-700 font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Perfect Balance: Assets (${balanceSheet.totalAssets.toFixed(2)}) = Liabilities + Equity (${(balanceSheet.totalLiabilities + balanceSheet.totalEquity).toFixed(2)})
              </span>
            ) : (
              <span className="text-rose-700 font-bold flex items-center justify-center gap-1.5">
                <AlertOctagon className="w-4 h-4" /> Imbalance detected!
              </span>
            )}
          </div>
        </div>
      )}

      {/* VIEW: GENERAL JOURNAL */}
      {activeTab === 'JOURNAL' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">General Journal Audit Log</h3>
            <span className="text-xs text-slate-500">{journalEntries.length} total entries posted</span>
          </div>
          <div className="divide-y divide-slate-200">
            {journalEntries.map((j) => (
              <div key={j.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex flex-wrap items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-700">{j.entryNumber}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-medium">{j.entryDate}</span>
                    <span className="text-slate-400">•</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {j.referenceType}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">Authorized by: {j.createdBy}</div>
                </div>

                <div className="text-xs font-semibold text-slate-800 mb-2">{j.description}</div>

                {/* Lines */}
                <div className="bg-slate-50 rounded p-2 text-xs font-mono">
                  <table className="w-full">
                    <thead>
                      <tr className="text-slate-400 text-[10px] text-left">
                        <th className="pb-1">Account</th>
                        <th className="pb-1 text-right">Debit ($)</th>
                        <th className="pb-1 text-right">Credit ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50">
                      {j.lines.map((line, idx) => (
                        <tr key={idx} className="py-1">
                          <td className="py-1 text-slate-700">
                            {line.credit > 0 ? (
                              <span className="pl-6 text-slate-500">To {line.accountCode} - {line.accountName}</span>
                            ) : (
                              <span className="font-medium text-slate-900">{line.accountCode} - {line.accountName}</span>
                            )}
                          </td>
                          <td className="py-1 text-right text-slate-800">
                            {line.debit > 0 ? line.debit.toFixed(2) : ''}
                          </td>
                          <td className="py-1 text-right text-slate-800">
                            {line.credit > 0 ? line.credit.toFixed(2) : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: CHART OF ACCOUNTS */}
      {activeTab === 'COA' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Standard Chart of Accounts (COA)</h3>
            <span className="text-xs text-slate-500">5 GAAP Account Types</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Account Title</th>
                <th className="px-4 py-3">Classification</th>
                <th className="px-4 py-3">Normal Balance</th>
                <th className="px-4 py-3 text-right">Current Ledger Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((a) => (
                <tr key={a.accountCode} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{a.accountCode}</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-800">{a.accountName}</td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {a.accountType}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{a.normalBalance}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                    ${a.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MANUAL JOURNAL ENTRY MODAL */}
      {showManualJournalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Post Manual General Journal Entry</h3>
                <p className="text-xs text-slate-400">Total debits must equal total credits to preserve ledger integrity.</p>
              </div>
              <button onClick={() => setShowManualJournalModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handlePostJournalSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Journal Entry Memo / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Month-end depreciation adjustment or capital transfer"
                  value={journalDesc}
                  onChange={(e) => setJournalDesc(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-bold text-slate-800 uppercase tracking-wide">Journal Account Lines</label>
                  <button
                    type="button"
                    onClick={handleAddJournalLine}
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Line
                  </button>
                </div>

                <div className="space-y-2 border border-slate-200 p-3 rounded-lg bg-slate-50/50">
                  {journalLines.map((line, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2 bg-white p-2 rounded border border-slate-200">
                      <div className="flex-1 min-w-[180px]">
                        <select
                          value={line.accountCode}
                          onChange={(e) => handleLineChange(idx, 'accountCode', e.target.value)}
                          className="w-full p-1.5 text-xs bg-slate-50 border border-slate-300 rounded"
                        >
                          {accounts.map(a => (
                            <option key={a.accountCode} value={a.accountCode}>
                              {a.accountCode} - {a.accountName} ({a.accountType})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Debit ($)"
                          value={line.debit || ''}
                          onChange={(e) => handleLineChange(idx, 'debit', Number(e.target.value))}
                          className="w-full p-1.5 text-xs text-right border border-slate-300 rounded font-mono"
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Credit ($)"
                          value={line.credit || ''}
                          onChange={(e) => handleLineChange(idx, 'credit', Number(e.target.value))}
                          className="w-full p-1.5 text-xs text-right border border-slate-300 rounded font-mono"
                        />
                      </div>

                      {journalLines.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveJournalLine(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Balance Verification Footer */}
              <div className={`p-3 rounded-lg flex justify-between items-center text-xs ${
                isBalanced ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' : 'bg-rose-50 text-rose-900 border border-rose-300'
              }`}>
                <div>
                  Debits: <strong>${totalDebits.toFixed(2)}</strong> | Credits: <strong>${totalCredits.toFixed(2)}</strong>
                </div>
                <div className="font-bold">
                  {isBalanced ? 'Balanced: Ready to post' : `Imbalance: $${Math.abs(totalDebits - totalCredits).toFixed(2)}`}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowManualJournalModal(false)}
                  className="px-4 py-2 font-semibold bg-slate-100 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isBalanced}
                  className="px-5 py-2 font-bold bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded shadow"
                >
                  Commit Journal Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

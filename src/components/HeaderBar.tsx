import React from 'react';
import {
  Building2,
  ShieldCheck,
  Plus,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { User, UserRole } from '../types';

interface HeaderBarProps {
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
  onOpenQuickSale: () => void;
  onOpenQuickExpense: () => void;
  onOpenSqlConsole?: () => void;
  onResetDb?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentUser,
  users,
  onSwitchUser,
  onOpenQuickSale,
  onOpenQuickExpense
}) => {
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'ACCOUNTANT':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'VIEWER':
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 select-none">
      {/* Enterprise Status Top Bar */}
      <div className="flex items-center justify-between px-5 py-1.5 bg-slate-950 text-xs border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 text-slate-300">
          <span className="font-semibold tracking-wide text-white">ApexLedger ERP</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Enterprise Accounting & Business Management Suite</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400 text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Cloud Synchronized</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">Fiscal Year 2026</span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <div className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>256-Bit SSL Secured</span>
          </div>
        </div>
      </div>

      {/* Main Header Action Area */}
      <div className="flex flex-wrap items-center justify-between px-5 py-2.5 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black shadow-inner shadow-indigo-400/40 tracking-tight">
            AL
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              ApexLedger ERP
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-950 text-indigo-300 border border-indigo-800">
                Double-Entry GAAP
              </span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" /> Apex Global Technologies & Logistics Inc.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons & Role Switcher */}
        <div className="flex items-center gap-3">
          {currentUser.role !== 'VIEWER' && (
            <>
              <button
                id="btn-quick-sale"
                onClick={onOpenQuickSale}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer"
                title="Create a new sales invoice"
              >
                <Plus className="w-3.5 h-3.5" /> New Sale
              </button>

              <button
                id="btn-quick-expense"
                onClick={onOpenQuickExpense}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm transition-colors cursor-pointer"
                title="Record a business expense"
              >
                <Plus className="w-3.5 h-3.5" /> Expense
              </button>
            </>
          )}

          {/* Role Switcher */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-slate-200 leading-tight">{currentUser.fullName}</div>
              <div className="text-[11px] text-slate-400">{currentUser.email}</div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${getRoleBadge(currentUser.role)}`}>
                {currentUser.role}
              </span>

              <select
                id="select-user-role"
                value={currentUser.id}
                onChange={(e) => {
                  const target = users.find(u => u.id === Number(e.target.value));
                  if (target) onSwitchUser(target);
                }}
                className="bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                title="Switch active user profile"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.username} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

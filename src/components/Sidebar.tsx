import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Package,
  Users,
  Truck,
  CreditCard,
  Scale,
  BrainCircuit,
  PiggyBank,
  ShieldCheck,
  Building,
  AlertCircle
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'sales'
  | 'purchases'
  | 'inventory'
  | 'customers'
  | 'suppliers'
  | 'expenses'
  | 'accounting'
  | 'smart_finance'
  | 'budgets'
  | 'audit'
  | 'company';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lowStockCount: number;
  overdueCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  lowStockCount,
  overdueCount
}) => {
  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
    section?: string;
  }[] = [
    { section: 'OVERVIEW', id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { section: 'OPERATIONS', id: 'sales', label: 'Sales & Invoices', icon: Receipt, badge: overdueCount, badgeColor: 'bg-rose-500 text-white' },
    { id: 'purchases', label: 'Purchases & Bills', icon: ShoppingCart },
    { id: 'inventory', label: 'Products & Inventory', icon: Package, badge: lowStockCount, badgeColor: 'bg-amber-500 text-slate-950 font-bold' },
    { section: 'RELATIONSHIPS', id: 'customers', label: 'Customers & AR', icon: Users },
    { id: 'suppliers', label: 'Suppliers & AP', icon: Truck },
    { section: 'FINANCIAL CONTROL', id: 'expenses', label: 'Expenses & Cash/Bank', icon: CreditCard },
    { id: 'accounting', label: 'Double-Entry Accounting', icon: Scale },
    { id: 'smart_finance', label: 'Smart Health & Forecast', icon: BrainCircuit },
    { id: 'budgets', label: 'Budgets & Recurring', icon: PiggyBank },
    { section: 'GOVERNANCE & SYSTEM', id: 'audit', label: 'Security & Audit Trail', icon: ShieldCheck },
    { id: 'company', label: 'Company Profile', icon: Building }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 flex-shrink-0 select-none">
      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <React.Fragment key={item.id}>
              {item.section && (
                <div className="text-[10px] font-bold text-slate-400 tracking-wider px-3 pt-3 pb-1">
                  {item.section}
                </div>
              )}
              <button
                id={`nav-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-700 text-slate-200'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* System Engine Health Footer */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="text-slate-400 font-medium">Ledger Engine:</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500 text-[10px]">
          <span>Double-Entry GAAP</span>
          <span>ApexLedger v2.4</span>
        </div>
      </div>
    </aside>
  );
};

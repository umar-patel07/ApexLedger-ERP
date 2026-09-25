import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { User } from './types';
import { HeaderBar } from './components/HeaderBar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { SalesView } from './components/SalesView';
import { PurchasesView } from './components/PurchasesView';
import { InventoryView } from './components/InventoryView';
import { CustomersView } from './components/CustomersView';
import { SuppliersView } from './components/SuppliersView';
import { ExpensesView } from './components/ExpensesView';
import { AccountingView } from './components/AccountingView';
import { SmartFeaturesView } from './components/SmartFeaturesView';
import { UsersView } from './components/UsersView';
import { CompanyView } from './components/CompanyView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(db.getCurrentUser());
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Stats for badge counters in sidebar
  const products = db.getProducts();
  const invoices = db.getInvoices();
  const lowStockCount = products.filter(p => p.currentStock <= p.minStockAlert).length;
  const overdueCount = invoices.filter(
    i => i.paymentStatus === 'OVERDUE' || (i.status === 'ACTIVE' && i.balanceDue > 0 && new Date(i.dueDate) < new Date())
  ).length;

  const handleSwitchUser = (user: User) => {
    db.switchUser(user.id);
    setCurrentUser(user);
    setUsers(db.getUsers());
  };

  const handleResetDb = () => {
    if (window.confirm('Reset database to pristine initial double-entry records?')) {
      db.resetDatabase();
      setCurrentUser(db.getCurrentUser());
      setUsers(db.getUsers());
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden">
      {/* Top Application Header with User Role Switcher & Quick Actions */}
      <HeaderBar
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        onOpenQuickSale={() => setActiveTab('sales')}
        onOpenQuickExpense={() => setActiveTab('expenses')}
      />

      {/* Main Body: Sidebar + Dynamic Workspace Views */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          lowStockCount={lowStockCount}
          overdueCount={overdueCount}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardView onNavigate={(tab) => setActiveTab(tab)} />}
            {activeTab === 'sales' && <SalesView />}
            {activeTab === 'purchases' && <PurchasesView />}
            {activeTab === 'inventory' && <InventoryView />}
            {activeTab === 'customers' && <CustomersView />}
            {activeTab === 'suppliers' && <SuppliersView />}
            {activeTab === 'expenses' && <ExpensesView />}
            {activeTab === 'accounting' && <AccountingView />}
            {activeTab === 'smart_finance' && <SmartFeaturesView />}
            {activeTab === 'budgets' && <SmartFeaturesView />}
            {activeTab === 'audit' && <UsersView />}
            {activeTab === 'company' && <CompanyView />}
          </div>
        </main>
      </div>
    </div>
  );
}

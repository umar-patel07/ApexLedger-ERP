import React, { useState } from 'react';
import {
  Plus,
  Search,
  Users,
  CreditCard,
  AlertCircle,
  FileDown,
  Building,
  Mail,
  Phone,
  DollarSign
} from 'lucide-react';
import { db } from '../services/db';
import { Customer } from '../types';
import { exportToCSV } from '../services/exportService';

export const CustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(db.getCustomers());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [paymentModalCustomer, setPaymentModalCustomer] = useState<Customer | null>(null);

  // New Customer Form
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(25000);

  // Record Payment Form
  const [paymentAmount, setPaymentAmount] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CASH' | 'CHECK' | 'ONLINE'>('BANK_TRANSFER');
  const [paymentNotes, setPaymentNotes] = useState('');

  const currentUser = db.getCurrentUser();

  const refreshData = () => {
    setCustomers(db.getCustomers());
  };

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      db.addCustomer({
        name: name.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        creditLimit,
        status: 'ACTIVE'
      });
      setShowAddModal(false);
      refreshData();
      // Reset
      setName('');
      setCompanyName('');
      setEmail('');
      setPhone('');
      setAddress('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalCustomer) return;
    try {
      db.recordPayment({
        partyType: 'CUSTOMER',
        partyId: paymentModalCustomer.id,
        referenceType: 'DIRECT',
        referenceId: 0,
        amount: paymentAmount,
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod,
        notes: paymentNotes || `Customer balance remittance from ${paymentModalCustomer.name}`
      });
      setPaymentModalCustomer(null);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Customer Name', 'Company', 'Email', 'Phone', 'Credit Limit', 'Current Balance Due', 'Risk Level', 'Total Invoiced', 'Total Paid'];
    const rows = customers.map(c => [
      c.name,
      c.companyName,
      c.email,
      c.phone,
      `$${c.creditLimit.toFixed(2)}`,
      `$${c.balance.toFixed(2)}`,
      c.riskLevel,
      `$${c.totalInvoiced.toFixed(2)}`,
      `$${c.totalPaid.toFixed(2)}`
    ]);
    exportToCSV(`Customers_AR_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalOutstanding = customers.reduce((sum, c) => sum + c.balance, 0);

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customers & Accounts Receivable</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Credit limits, payment history, balance aging, risk scoring, and customer remittance collections.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-export-customers-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>

          {currentUser.role !== 'VIEWER' && (
            <button
              id="btn-add-customer-modal"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Customer
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Accounts Receivable (AR)</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Uncollected across all client accounts</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Active Customer Accounts</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{customers.length} Accounts</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Registered corporate clients</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">High Credit Risk Clients</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {customers.filter(c => c.riskLevel === 'HIGH').length} Clients
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Balances &gt; 85% of allocated credit limit</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer name, company, or email address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Customer / Entity</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3 text-right">Credit Limit</th>
                <th className="px-4 py-3 text-right">Current Balance Due</th>
                <th className="px-4 py-3 text-center">Risk Level</th>
                <th className="px-4 py-3 text-right">Lifetime Invoiced</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No customers found matching search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Building className="w-3 h-3" /> {c.companyName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{c.email}</div>
                      <div className="text-[11px] text-slate-400">{c.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      ${c.creditLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      <span className={c.balance > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                        ${c.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.riskLevel === 'HIGH'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : c.riskLevel === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {c.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700 font-semibold">
                      ${c.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {currentUser.role !== 'VIEWER' && (
                        <button
                          id={`btn-remit-${c.id}`}
                          onClick={() => {
                            setPaymentModalCustomer(c);
                            setPaymentAmount(c.balance > 0 ? c.balance : 1000);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                          title="Record customer remittance"
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {paymentModalCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Record Customer Remittance</h3>
                <p className="text-xs text-slate-400">{paymentModalCustomer.name}</p>
              </div>
              <button onClick={() => setPaymentModalCustomer(null)} className="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-3 text-xs">
              <div className="p-3 bg-indigo-50 rounded border border-indigo-200 text-indigo-900">
                Current Outstanding Balance Due: <strong>${paymentModalCustomer.balance.toFixed(2)}</strong>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                >
                  <option value="BANK_TRANSFER">Bank Wire / ACH (Account 1020)</option>
                  <option value="CASH">Cash Deposit (Account 1010)</option>
                  <option value="CHECK">Corporate Check (Account 1020)</option>
                  <option value="ONLINE">Online Portal Remittance</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Transaction Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Wire confirmation #WIRE-82914"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaymentModalCustomer(null)}
                  className="px-4 py-2 font-semibold bg-slate-100 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded shadow"
                >
                  Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Add New Customer</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="p-6 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer / Contact Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Horizon Analytics"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Registered Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Horizon Holdings Inc."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="billing@horizon.com"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Credit Limit ($)</label>
                <input
                  type="number"
                  min="0"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, Suite, City, State, ZIP"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold bg-slate-100 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded shadow"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

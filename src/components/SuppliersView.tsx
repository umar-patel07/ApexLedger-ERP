import React, { useState } from 'react';
import {
  Plus,
  Search,
  Truck,
  FileDown,
  Building,
  DollarSign
} from 'lucide-react';
import { db } from '../services/db';
import { Supplier } from '../types';
import { exportToCSV } from '../services/exportService';

export const SuppliersView: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(db.getSuppliers());
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [paymentModalSupplier, setPaymentModalSupplier] = useState<Supplier | null>(null);

  // New Supplier Form
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');

  // Record Disbursement Form
  const [disbursementAmount, setDisbursementAmount] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CASH' | 'CHECK' | 'ONLINE'>('BANK_TRANSFER');
  const [paymentNotes, setPaymentNotes] = useState('');

  const currentUser = db.getCurrentUser();

  const refreshData = () => {
    setSuppliers(db.getSuppliers());
  };

  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      db.addSupplier({
        name: name.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        paymentTerms,
        status: 'ACTIVE'
      });
      setShowAddModal(false);
      refreshData();
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
    if (!paymentModalSupplier) return;
    try {
      db.recordPayment({
        partyType: 'SUPPLIER',
        partyId: paymentModalSupplier.id,
        referenceType: 'DIRECT',
        referenceId: 0,
        amount: disbursementAmount,
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod,
        notes: paymentNotes || `Supplier bill settlement to ${paymentModalSupplier.name}`
      });
      setPaymentModalSupplier(null);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Supplier Name', 'Company', 'Email', 'Phone', 'Payment Terms', 'Current Payable Balance', 'Total Purchased', 'Total Paid'];
    const rows = suppliers.map(s => [
      s.name,
      s.companyName,
      s.email,
      s.phone,
      s.paymentTerms,
      `$${s.balance.toFixed(2)}`,
      `$${s.totalPurchased.toFixed(2)}`,
      `$${s.totalPaid.toFixed(2)}`
    ]);
    exportToCSV(`Suppliers_AP_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPayables = suppliers.reduce((sum, s) => sum + s.balance, 0);

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Suppliers & Accounts Payable</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage vendor directories, net payment terms, purchase order balances, and cash disbursements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-export-suppliers-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>

          {currentUser.role !== 'VIEWER' && (
            <button
              id="btn-add-supplier-modal"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Supplier
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Accounts Payable (AP)</div>
          <div className="text-2xl font-bold text-purple-700 mt-1">${totalPayables.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Owed to trade suppliers</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Active Supplier Partners</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{suppliers.length} Vendors</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Approved procurement channels</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Procurement Volume</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            ${suppliers.reduce((s, sup) => s + sup.totalPurchased, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Cumulative merchandise orders</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by supplier name, company, or email address..."
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
                <th className="px-4 py-3">Supplier / Vendor</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Terms</th>
                <th className="px-4 py-3 text-right">Payable Balance</th>
                <th className="px-4 py-3 text-right">Total Purchased</th>
                <th className="px-4 py-3 text-right">Total Paid</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Building className="w-3 h-3" /> {s.companyName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{s.email}</div>
                      <div className="text-[11px] text-slate-400">{s.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{s.paymentTerms}</td>
                    <td className="px-4 py-3 text-right font-bold">
                      <span className={s.balance > 0 ? 'text-purple-700' : 'text-slate-500'}>
                        ${s.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700 font-semibold">
                      ${s.totalPurchased.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      ${s.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {currentUser.role !== 'VIEWER' && (
                        <button
                          id={`btn-pay-supplier-${s.id}`}
                          onClick={() => {
                            setPaymentModalSupplier(s);
                            setDisbursementAmount(s.balance > 0 ? s.balance : 500);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                          title="Record payment voucher"
                        >
                          Disburse Payment
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

      {/* RECORD DISBURSEMENT MODAL */}
      {paymentModalSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Disburse Supplier Settlement</h3>
                <p className="text-xs text-slate-400">{paymentModalSupplier.name}</p>
              </div>
              <button onClick={() => setPaymentModalSupplier(null)} className="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-3 text-xs">
              <div className="p-3 bg-purple-50 rounded border border-purple-200 text-purple-900">
                Current Outstanding AP Balance: <strong>${paymentModalSupplier.balance.toFixed(2)}</strong>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Disbursement Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={disbursementAmount}
                  onChange={(e) => setDisbursementAmount(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Disbursement Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                >
                  <option value="BANK_TRANSFER">Bank Wire / Corporate ACH (Account 1020)</option>
                  <option value="CASH">Petty Cash (Account 1010)</option>
                  <option value="CHECK">Accounts Payable Check (Account 1020)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Voucher Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Check #89201 or wire transfer confirmation"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaymentModalSupplier(null)}
                  className="px-4 py-2 font-semibold bg-slate-100 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded shadow"
                >
                  Post Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SUPPLIER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Add Supplier Vendor</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="p-6 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vendor Contact Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Micron Components"
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
                    placeholder="e.g. Micron Global Trading Corp"
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
                    placeholder="sales@microncorp.com"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (800) 555-9000"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Standard Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                >
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 15 Days">Net 15 Days</option>
                  <option value="Net 30 Days">Net 30 Days</option>
                  <option value="Net 45 Days">Net 45 Days</option>
                  <option value="Net 60 Days">Net 60 Days</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address</label>
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
                  className="px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

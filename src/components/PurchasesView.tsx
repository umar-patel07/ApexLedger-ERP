import React, { useState } from 'react';
import {
  Plus,
  Search,
  ShoppingCart,
  CheckCircle,
  Clock,
  AlertCircle,
  FileDown,
  Trash2
} from 'lucide-react';
import { db } from '../services/db';
import { Purchase, Supplier, Product } from '../types';
import { exportToCSV } from '../services/exportService';

export const PurchasesView: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>(db.getPurchases());
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const suppliers = db.getSuppliers();
  const products = db.getProducts();
  const currentUser = db.getCurrentUser();

  // New Purchase Form
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(suppliers[0]?.id || 1);
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>('Standard inventory procurement.');
  const [paidImmediately, setPaidImmediately] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK'>('BANK');

  const [purchaseItems, setPurchaseItems] = useState<{ productId: number; quantity: number; unitCost: number }[]>([
    { productId: products[0]?.id || 1, quantity: 5, unitCost: products[0]?.costPrice || 50 }
  ]);

  const refreshPurchases = () => {
    setPurchases(db.getPurchases());
  };

  const handleAddItemRow = () => {
    const firstProd = products[0];
    if (firstProd) {
      setPurchaseItems([...purchaseItems, { productId: firstProd.id, quantity: 1, unitCost: firstProd.costPrice }]);
    }
  };

  const handleRemoveItemRow = (index: number) => {
    if (purchaseItems.length > 1) {
      setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
    }
  };

  const handleProductChange = (index: number, prodId: number) => {
    const prod = products.find(p => p.id === prodId);
    const updated = [...purchaseItems];
    updated[index].productId = prodId;
    if (prod) {
      updated[index].unitCost = prod.costPrice;
    }
    setPurchaseItems(updated);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...purchaseItems];
    updated[index].quantity = Math.max(1, qty);
    setPurchaseItems(updated);
  };

  const handleUnitCostChange = (index: number, cost: number) => {
    const updated = [...purchaseItems];
    updated[index].unitCost = Math.max(0, cost);
    setPurchaseItems(updated);
  };

  const modalTotal = purchaseItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  const handleCreatePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      db.createPurchase({
        supplierId: selectedSupplierId,
        purchaseDate,
        notes,
        items: purchaseItems,
        paidImmediately,
        paymentMethod
      });
      setShowCreateModal(false);
      refreshPurchases();
      // Reset
      setPurchaseItems([{ productId: products[0]?.id || 1, quantity: 5, unitCost: products[0]?.costPrice || 50 }]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record purchase');
    }
  };

  const handleExportCSV = () => {
    const headers = ['PO Number', 'Supplier', 'Date', 'Total Amount', 'Paid Amount', 'Balance Due', 'Payment Status', 'Status'];
    const rows = purchases.map(p => [
      p.purchaseNumber,
      p.supplierName || '',
      p.purchaseDate,
      `$${p.totalAmount.toFixed(2)}`,
      `$${p.paidAmount.toFixed(2)}`,
      `$${p.balanceDue.toFixed(2)}`,
      p.paymentStatus,
      p.status
    ]);
    exportToCSV(`Purchases_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const filteredPurchases = purchases.filter(p =>
    p.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.supplierName && p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Purchases & Supplier Procurement</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-increments warehouse inventory stock, posts balanced Accounts Payable journals, and tracks trade payables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-export-purchases-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>

          {currentUser.role !== 'VIEWER' && (
            <button
              id="btn-create-purchase-modal"
              onClick={() => {
                setErrorMessage('');
                setShowCreateModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Record New Purchase
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by PO number or supplier name..."
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
                <th className="px-4 py-3">PO #</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
                <th className="px-4 py-3 text-right">Balance Due</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No purchase orders recorded yet.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">{p.purchaseNumber}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{p.supplierName}</td>
                    <td className="px-4 py-3 text-slate-600">{p.purchaseDate}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      ${p.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      <span className={p.balanceDue > 0 ? 'text-purple-700' : 'text-slate-500'}>
                        ${p.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.paymentStatus === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" /> {p.paymentStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">{p.createdBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD NEW PURCHASE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Record Supplier Purchase Order</h3>
                <p className="text-xs text-slate-400">
                  Increases inventory quantities in stock and posts Credit to Accounts Payable (2010).
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreatePurchaseSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Supplier</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.companyName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-800 font-bold text-xs uppercase tracking-wide">
                    Products to Procure (Stock will increase automatically)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another SKU
                  </button>
                </div>

                <div className="space-y-2 border border-slate-200 p-3 rounded-lg bg-slate-50/50">
                  {purchaseItems.map((item, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded border border-slate-200">
                      <div className="flex-1 min-w-[200px]">
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductChange(idx, Number(e.target.value))}
                          className="w-full p-1.5 text-xs bg-slate-50 border border-slate-300 rounded"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.code} - {p.name} (Current: {p.currentStock})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                          className="w-full p-1.5 text-xs text-right border border-slate-300 rounded"
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Unit Cost"
                          value={item.unitCost}
                          onChange={(e) => handleUnitCostChange(idx, Number(e.target.value))}
                          className="w-full p-1.5 text-xs text-right border border-slate-300 rounded"
                        />
                      </div>

                      <div className="w-24 text-right font-bold text-slate-800">
                        ${(item.quantity * item.unitCost).toFixed(2)}
                      </div>

                      {purchaseItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paidImmediately}
                      onChange={(e) => setPaidImmediately(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Disburse Payment Immediately (Cash/Bank)
                  </label>
                </div>

                {paidImmediately && (
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="purPayMethod"
                        checked={paymentMethod === 'BANK'}
                        onChange={() => setPaymentMethod('BANK')}
                      />
                      Bank Account (1020)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="purPayMethod"
                        checked={paymentMethod === 'CASH'}
                        onChange={() => setPaymentMethod('CASH')}
                      />
                      Cash (1010)
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Notes / PO Reference</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="bg-slate-100 p-4 rounded-lg flex justify-between items-center text-xs">
                <span className="text-slate-600">Total Purchase Value:</span>
                <span className="text-base font-bold text-slate-900">${modalTotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded bg-indigo-600 hover:bg-indigo-700 text-white shadow"
                >
                  Save & Increase Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

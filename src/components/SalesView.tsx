import React, { useState } from 'react';
import {
  Plus,
  Search,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Filter,
  FileDown
} from 'lucide-react';
import { db } from '../services/db';
import { Invoice, Product, Customer } from '../types';
import { generateInvoicePDF, exportToCSV } from '../services/exportService';

export const SalesView: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(db.getInvoices());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE' | 'CANCELLED'>('ALL');
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cancelModalInvoice, setCancelModalInvoice] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // New Sale Form State
  const customers = db.getCustomers();
  const products = db.getProducts();
  const company = db.getCompanyProfile();
  const currentUser = db.getCurrentUser();

  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(customers[0]?.id || 1);
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [taxRate, setTaxRate] = useState<number>(8.5);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('Standard 30 days settlement terms.');
  const [paidImmediately, setPaidImmediately] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK'>('BANK');

  const [saleItems, setSaleItems] = useState<{ productId: number; quantity: number; unitPrice: number }[]>([
    { productId: products[0]?.id || 1, quantity: 1, unitPrice: products[0]?.sellingPrice || 100 }
  ]);

  const [errorMessage, setErrorMessage] = useState<string>('');

  const refreshInvoices = () => {
    setInvoices(db.getInvoices());
  };

  // Item management in modal
  const handleAddItemRow = () => {
    const firstProd = products[0];
    if (firstProd) {
      setSaleItems([...saleItems, { productId: firstProd.id, quantity: 1, unitPrice: firstProd.sellingPrice }]);
    }
  };

  const handleRemoveItemRow = (index: number) => {
    if (saleItems.length > 1) {
      setSaleItems(saleItems.filter((_, i) => i !== index));
    }
  };

  const handleProductChange = (index: number, prodId: number) => {
    const prod = products.find(p => p.id === prodId);
    const updated = [...saleItems];
    updated[index].productId = prodId;
    if (prod) {
      updated[index].unitPrice = prod.sellingPrice;
    }
    setSaleItems(updated);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...saleItems];
    updated[index].quantity = Math.max(1, qty);
    setSaleItems(updated);
  };

  const handleUnitPriceChange = (index: number, price: number) => {
    const updated = [...saleItems];
    updated[index].unitPrice = Math.max(0, price);
    setSaleItems(updated);
  };

  // Calculate modal totals
  const modalSubtotal = saleItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const modalTaxAmount = (modalSubtotal - discount) * (taxRate / 100);
  const modalGrandTotal = Math.max(0, modalSubtotal - discount) + modalTaxAmount;

  const handleCreateSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      db.createInvoice({
        customerId: selectedCustomerId,
        invoiceDate,
        dueDate,
        taxRate,
        discount,
        notes,
        items: saleItems,
        paidImmediately,
        paymentMethod
      });
      setShowCreateModal(false);
      refreshInvoices();
      // Reset form
      setSaleItems([{ productId: products[0]?.id || 1, quantity: 1, unitPrice: products[0]?.sellingPrice || 100 }]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create invoice');
    }
  };

  const handleCancelInvoiceConfirm = () => {
    if (!cancelModalInvoice) return;
    try {
      db.cancelInvoice(cancelModalInvoice.id, cancelReason || 'Customer requested cancellation');
      setCancelModalInvoice(null);
      setCancelReason('');
      refreshInvoices();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Invoice No', 'Customer', 'Date', 'Due Date', 'Total', 'Paid', 'Balance Due', 'Payment Status', 'Record Status'];
    const rows = invoices.map(i => [
      i.invoiceNumber,
      i.customerName || '',
      i.invoiceDate,
      i.dueDate,
      `$${i.totalAmount.toFixed(2)}`,
      `$${i.paidAmount.toFixed(2)}`,
      `$${i.balanceDue.toFixed(2)}`,
      i.paymentStatus,
      i.status
    ]);
    exportToCSV(`Sales_Invoices_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'CANCELLED') return inv.status === 'CANCELLED';
    return inv.status === 'ACTIVE' && inv.paymentStatus === statusFilter;
  });

  return (
    <div className="space-y-5">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sales & Customer Invoices</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated double-entry sales journal, inventory stock decrements, and client AR ledger sync.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-export-sales-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>

          {currentUser.role !== 'VIEWER' && (
            <button
              id="btn-create-sale-modal"
              onClick={() => {
                setErrorMessage('');
                setShowCreateModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Create New Invoice
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="input-search-sales"
            type="text"
            placeholder="Search by invoice # or customer company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          {(['ALL', 'PAID', 'PARTIAL', 'UNPAID', 'OVERDUE', 'CANCELLED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
                <th className="px-4 py-3 text-right">Balance Due</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No sales invoices match your query.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        inv.status === 'CANCELLED' ? 'opacity-60 bg-slate-50/50' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{inv.customerName}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{inv.invoiceDate}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className={inv.paymentStatus === 'OVERDUE' ? 'text-rose-600 font-bold' : ''}>
                          {inv.dueDate}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        ${inv.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        <span className={inv.balanceDue > 0 ? 'text-amber-700' : 'text-slate-500'}>
                          ${inv.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {inv.paymentStatus === 'PAID' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> Paid
                          </span>
                        )}
                        {inv.paymentStatus === 'PARTIAL' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock className="w-3 h-3" /> Partial
                          </span>
                        )}
                        {inv.paymentStatus === 'UNPAID' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle className="w-3 h-3" /> Unpaid
                          </span>
                        )}
                        {inv.paymentStatus === 'OVERDUE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3" /> Overdue
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            id={`btn-pdf-${inv.id}`}
                            onClick={() => generateInvoicePDF(inv, company)}
                            className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded"
                            title="Download PDF Invoice"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {currentUser.role === 'ADMIN' && inv.status === 'ACTIVE' && (
                            <button
                              id={`btn-cancel-${inv.id}`}
                              onClick={() => setCancelModalInvoice(inv)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                              title="Cancel invoice (Strict double-entry reversal)"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW SALE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Create New Sales Invoice</h3>
                <p className="text-xs text-slate-400">
                  Updates inventory stock, creates balanced GAAP journal entry, and syncs accounts receivable.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSaleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Customer & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Customer</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.companyName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-800 font-bold text-xs uppercase tracking-wide">
                    Invoice Products & Line Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Product
                  </button>
                </div>

                <div className="space-y-2 border border-slate-200 p-3 rounded-lg bg-slate-50/50">
                  {saleItems.map((item, idx) => {
                    const currentProd = products.find(p => p.id === item.productId);
                    const isStockLow = currentProd && currentProd.currentStock < item.quantity;

                    return (
                      <div key={idx} className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded border border-slate-200">
                        <div className="flex-1 min-w-[200px]">
                          <select
                            value={item.productId}
                            onChange={(e) => handleProductChange(idx, Number(e.target.value))}
                            className="w-full p-1.5 text-xs bg-slate-50 border border-slate-300 rounded"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.code} - {p.name} (In Stock: {p.currentStock})
                              </option>
                            ))}
                          </select>
                          {isStockLow && (
                            <div className="text-[10px] text-rose-600 font-bold mt-0.5">
                              Warning: Only {currentProd?.currentStock} units in stock!
                            </div>
                          )}
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
                            placeholder="Price"
                            value={item.unitPrice}
                            onChange={(e) => handleUnitPriceChange(idx, Number(e.target.value))}
                            className="w-full p-1.5 text-xs text-right border border-slate-300 rounded"
                          />
                        </div>

                        <div className="w-24 text-right font-bold text-slate-800">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </div>

                        {saleItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tax, Discount, Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Discount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Timing</label>
                  <label className="flex items-center gap-2 mt-2 font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paidImmediately}
                      onChange={(e) => setPaidImmediately(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Paid Upfront Immediately
                  </label>
                </div>
              </div>

              {paidImmediately && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Deposit Account</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'BANK'}
                        onChange={() => setPaymentMethod('BANK')}
                      />
                      Operating Bank Account (1020)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'CASH'}
                        onChange={() => setPaymentMethod('CASH')}
                      />
                      Cash Till (1010)
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Invoice Notes / Terms</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Total Summary Footer */}
              <div className="bg-slate-100 p-4 rounded-lg flex justify-between items-center text-xs">
                <div className="text-slate-600">
                  Subtotal: <span className="font-semibold text-slate-800">${modalSubtotal.toFixed(2)}</span> | Tax: <span className="font-semibold text-slate-800">${modalTaxAmount.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">
                    Grand Total: ${modalGrandTotal.toFixed(2)}
                  </div>
                </div>
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
                  className="px-5 py-2 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white shadow"
                >
                  Save & Post Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL INVOICE CONFIRMATION MODAL */}
      {cancelModalInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Cancel Invoice {cancelModalInvoice.invoiceNumber}?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              In accordance with GAAP double-entry accounting standards, financial transactions are never hard-deleted.
              This action will mark the invoice as <strong>CANCELLED</strong>, post a balanced reversal journal entry,
              restore product inventory, and adjust client accounts receivable.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for cancellation:</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Order cancelled by client or billing correction"
                className="w-full p-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setCancelModalInvoice(null)}
                className="px-4 py-2 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Abort
              </button>
              <button
                onClick={handleCancelInvoiceConfirm}
                className="px-4 py-2 text-xs font-bold rounded bg-rose-600 hover:bg-rose-500 text-white shadow"
              >
                Confirm Reversal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

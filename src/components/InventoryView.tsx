import React, { useState } from 'react';
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  FileDown,
  TrendingUp,
  Tag,
  DollarSign,
  Boxes
} from 'lucide-react';
import { db } from '../services/db';
import { Product, Category } from '../types';
import { exportToCSV } from '../services/exportService';

export const InventoryView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(db.getProducts());
  const [categories, setCategories] = useState<Category[]>(db.getCategories());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'ALL'>('ALL');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Modals
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  // New Product Form
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [costPrice, setCostPrice] = useState<number>(100);
  const [sellingPrice, setSellingPrice] = useState<number>(150);
  const [initialStock, setInitialStock] = useState<number>(10);
  const [minAlert, setMinAlert] = useState<number>(5);
  const [unit, setUnit] = useState('Units');

  // New Category Form
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const currentUser = db.getCurrentUser();

  const refreshData = () => {
    setProducts(db.getProducts());
    setCategories(db.getCategories());
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      db.addProduct({
        code: code.trim(),
        name: name.trim(),
        categoryId,
        costPrice,
        sellingPrice,
        currentStock: initialStock,
        minStockAlert: minAlert,
        unit,
        status: 'ACTIVE'
      });
      setShowAddProductModal(false);
      refreshData();
      // Reset
      setCode('');
      setName('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      db.addCategory({
        name: catName.trim(),
        description: catDesc.trim()
      });
      setShowAddCategoryModal(false);
      refreshData();
      setCatName('');
      setCatDesc('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportCSV = () => {
    const headers = ['SKU Code', 'Product Name', 'Category', 'Cost Price', 'Selling Price', 'Margin %', 'Stock', 'Min Alert', 'Total Valuation'];
    const rows = products.map(p => [
      p.code,
      p.name,
      p.categoryName || '',
      `$${p.costPrice.toFixed(2)}`,
      `$${p.sellingPrice.toFixed(2)}`,
      `${(p.profitMargin || 0).toFixed(1)}%`,
      p.currentStock,
      p.minStockAlert,
      `$${(p.totalValuation || 0).toFixed(2)}`
    ]);
    exportToCSV(`Inventory_Report_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategoryId !== 'ALL' && p.categoryId !== selectedCategoryId) return false;
    if (filterLowStockOnly && p.currentStock > p.minStockAlert) return false;
    return true;
  });

  const totalStockCount = products.reduce((sum, p) => sum + p.currentStock, 0);
  const totalValuation = products.reduce((sum, p) => sum + (p.totalValuation || 0), 0);
  const lowStockCount = products.filter(p => p.currentStock <= p.minStockAlert).length;

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Products & Warehouse Inventory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated stock increments on purchase, decrements on sale, unit profit margin tracking, and reorder warnings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-export-inventory-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>

          {currentUser.role !== 'VIEWER' && (
            <>
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <Tag className="w-3.5 h-3.5" /> New Category
              </button>

              <button
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Product SKU
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Inventory Asset Valuation</div>
            <div className="text-xl font-bold text-slate-900 mt-1">${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Account 1200: Merchandise Asset</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Physical Stock Units in Warehouse</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{totalStockCount.toLocaleString()} units</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across {products.length} registered SKUs</div>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Low Stock Alerts</div>
            <div className="text-xl font-bold text-amber-600 mt-1">{lowStockCount} items requiring restock</div>
            <div className="text-[11px] text-slate-400 mt-0.5">At or below reorder threshold</div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search SKU code or product description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="p-1.5 text-xs bg-slate-50 border border-slate-300 rounded"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={filterLowStockOnly}
              onChange={(e) => setFilterLowStockOnly(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            Low Stock Only ({lowStockCount})
          </label>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Cost Price</th>
                <th className="px-4 py-3 text-right">Selling Price</th>
                <th className="px-4 py-3 text-right">Profit / Margin</th>
                <th className="px-4 py-3 text-center">In Stock</th>
                <th className="px-4 py-3 text-right">Valuation</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.currentStock <= p.minStockAlert;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-indigo-700">{p.code}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                      <td className="px-4 py-3 text-slate-500">{p.categoryName}</td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        ${p.costPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        ${p.sellingPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-emerald-600">
                          +${(p.profitPerUnit || 0).toFixed(2)}
                        </span>
                        <span className="text-slate-400 ml-1 font-mono text-[11px]">
                          ({(p.profitMargin || 0).toFixed(1)}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-xs ${
                              isLow ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'text-slate-800'
                            }`}
                          >
                            {p.currentStock} {p.unit}
                          </span>
                          {isLow && (
                            <span title="Stock at or below reorder alert threshold">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">
                        ${(p.totalValuation || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Add New Product SKU</h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="p-6 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PRD-SRV-09"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Description / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dell PowerEdge Enterprise Storage Controller"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Opening Stock</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={initialStock}
                    onChange={(e) => setInitialStock(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reorder Alert</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={minAlert}
                    onChange={(e) => setMinAlert(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-100 rounded text-slate-600 text-[11px] flex justify-between">
                <span>Unit Profit: <strong>${(sellingPrice - costPrice).toFixed(2)}</strong></span>
                <span>
                  Gross Margin: <strong>{sellingPrice > 0 ? (((sellingPrice - costPrice) / sellingPrice) * 100).toFixed(1) : 0}%</strong>
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 font-semibold bg-slate-100 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded shadow"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">New Category</h3>
              <button onClick={() => setShowAddCategoryModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleAddCategorySubmit} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Storage & RAID Arrays"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 font-semibold bg-slate-100 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

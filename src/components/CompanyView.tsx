import React, { useState } from 'react';
import {
  Building2,
  Save,
  CheckCircle2,
  Globe,
  Mail,
  Phone,
  FileText,
  DollarSign
} from 'lucide-react';
import { db } from '../services/db';
import { CompanyProfile } from '../types';

export const CompanyView: React.FC = () => {
  const [profile, setProfile] = useState<CompanyProfile>(db.getCompanyProfile());
  const [savedMessage, setSavedMessage] = useState(false);
  const currentUser = db.getCurrentUser();

  const handleChange = (field: keyof CompanyProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateCompanyProfile(profile);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" /> Company Profile & Enterprise Configuration
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure legal business information, federal tax identifiers, fiscal accounting periods, and PDF header metadata.
          </p>
        </div>

        {savedMessage && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Changes Saved Successfully
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6 text-xs">
        {/* Basic Info */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
            Legal Business Identification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Registered Name</label>
              <input
                type="text"
                required
                value={profile.name}
                disabled={currentUser.role === 'VIEWER'}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tax ID / EIN Number</label>
              <input
                type="text"
                required
                value={profile.taxNumber}
                disabled={currentUser.role === 'VIEWER'}
                onChange={(e) => handleChange('taxNumber', e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono"
              />
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
            Official Communications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corporate Email</label>
              <input
                type="email"
                required
                value={profile.email}
                disabled={currentUser.role === 'VIEWER'}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corporate Telephone</label>
              <input
                type="text"
                value={profile.phone}
                disabled={currentUser.role === 'VIEWER'}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Website</label>
              <input
                type="text"
                value={profile.website}
                disabled={currentUser.role === 'VIEWER'}
                onChange={(e) => handleChange('website', e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Physical Address */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
            Headquarters Address (Printed on Invoices)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
              <input
                type="text"
                value={profile.address}
                disabled={currentUser.role === 'VIEWER'}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Country</label>
              <input
                type="text"
                value={profile.country}
                disabled={currentUser.role === 'VIEWER'}
                onChange={(e) => handleChange('country', e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Accounting Preferences */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">
            Accounting Standards & Currency
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reporting Currency</label>
              <select
                value={profile.currency}
                disabled={currentUser.role === 'VIEWER'}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="CAD">CAD ($) - Canadian Dollar</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fiscal Year Start Month</label>
              <select
                value={profile.fiscalYearStart}
                disabled={currentUser.role === 'VIEWER'}
                onChange={(e) => handleChange('fiscalYearStart', e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
              >
                <option value="January">January (Calendar Year)</option>
                <option value="April">April (UK / Commonwealth Standard)</option>
                <option value="July">July (Mid-Year)</option>
                <option value="October">October (US Federal Standard)</option>
              </select>
            </div>
          </div>
        </div>

        {currentUser.role !== 'VIEWER' && (
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              id="btn-save-company"
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" /> Save Profile Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

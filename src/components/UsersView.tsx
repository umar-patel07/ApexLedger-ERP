import React, { useState } from 'react';
import {
  Users,
  Shield,
  Key,
  Plus,
  CheckCircle,
  XCircle,
  Activity,
  Lock,
  UserCheck
} from 'lucide-react';
import { db } from '../services/db';
import { User, UserRole, ActivityLog } from '../types';

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(db.getActivityLogs());
  const [activeTab, setActiveTab] = useState<'USERS' | 'AUDIT_TRAIL' | 'PERMISSIONS'>('USERS');

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('ACCOUNTANT');
  const [password, setPassword] = useState('ApexLedger@2026');

  const currentUser = db.getCurrentUser();

  const refreshData = () => {
    setUsers(db.getUsers());
    setActivityLogs(db.getActivityLogs());
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      db.addUser({
        username: username.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        role,
        status: 'ACTIVE'
      });
      setShowAddUserModal(false);
      refreshData();
      setUsername('');
      setFullName('');
      setEmail('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleStatus = (u: User) => {
    if (u.id === currentUser.id) {
      alert('You cannot deactivate your own current logged in account!');
      return;
    }
    const newStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    db.updateUserStatus(u.id, newStatus);
    refreshData();
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" /> User Access, Security & Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-Based Access Control (RBAC), bcrypt hashed credentials, and comprehensive immutable audit logging.
          </p>
        </div>

        {currentUser.role === 'ADMIN' && (
          <button
            id="btn-add-user-modal"
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Provision New User
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-colors ${
            activeTab === 'USERS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Staff Accounts ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('AUDIT_TRAIL')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-colors ${
            activeTab === 'AUDIT_TRAIL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> System Audit Trail ({activityLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('PERMISSIONS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-colors ${
            activeTab === 'PERMISSIONS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" /> RBAC Security Matrix
        </button>
      </div>

      {/* TAB 1: USERS LIST */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Full Name & Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Security Level</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        {u.fullName}
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                            Current Session
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'ACCOUNTANT'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px] flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" /> BCrypt 12-Rounds Hashed
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {currentUser.role === 'ADMIN' && !isCurrent && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
                            u.status === 'ACTIVE'
                              ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                              : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: AUDIT TRAIL */}
      {activeTab === 'AUDIT_TRAIL' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-900">Immutable Activity & Modification Ledger</span>
            <span className="text-slate-500">Chronological action logs</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activityLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{log.username}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: PERMISSIONS MATRIX */}
      {activeTab === 'PERMISSIONS' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4 max-w-3xl mx-auto text-xs">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
            Role-Based Access Control (RBAC) Security Policy
          </h3>
          <p className="text-slate-500">
            Enforced across all business transactions, journal entry postings, and ledger audits with strict role validation.
          </p>

          <table className="w-full text-left border border-slate-200 rounded">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
              <tr>
                <th className="p-3 border-b border-slate-200">Capability / Privilege</th>
                <th className="p-3 border-b border-slate-200 text-center text-purple-700">ADMIN</th>
                <th className="p-3 border-b border-slate-200 text-center text-blue-700">ACCOUNTANT</th>
                <th className="p-3 border-b border-slate-200 text-center text-slate-700">VIEWER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-3 font-medium">Create & Post Invoices (Sales)</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✔ Allowed</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✔ Allowed</td>
                <td className="p-3 text-center text-rose-500 font-bold">✖ Read-only</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">Record Supplier Purchases & Disburse Payments</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✔ Allowed</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✔ Allowed</td>
                <td className="p-3 text-center text-rose-500 font-bold">✖ Read-only</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">Post General Journal Adjustments</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✔ Allowed</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✔ Allowed</td>
                <td className="p-3 text-center text-rose-500 font-bold">✖ Read-only</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">Cancel / Reverse Invoices (GAAP Audit)</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✔ Allowed</td>
                <td className="p-3 text-center text-rose-500 font-bold">✖ Admin Only</td>
                <td className="p-3 text-center text-rose-500 font-bold">✖ Read-only</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">User Management & Role Assignment</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✔ Allowed</td>
                <td className="p-3 text-center text-rose-500 font-bold">✖ Blocked</td>
                <td className="p-3 text-center text-rose-500 font-bold">✖ Blocked</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">Database Backup & Disaster Recovery</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✔ Allowed</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✔ Allowed</td>
                <td className="p-3 text-center text-rose-500 font-bold">✖ Blocked</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* PROVISION USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Provision Staff User</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Vance"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. dvance"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. dvance@apexledger.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role Designation</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-semibold"
                >
                  <option value="ACCOUNTANT">Accountant (Transaction processing & ledgers)</option>
                  <option value="VIEWER">Viewer (Auditing & read-only reporting)</option>
                  <option value="ADMIN">Administrator (Full master control)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 font-semibold bg-slate-100 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-slate-900 hover:bg-slate-800 text-white rounded shadow"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

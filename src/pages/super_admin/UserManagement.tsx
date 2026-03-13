import React, { useState, useMemo } from 'react';
import { useData } from '../../hooks/useData';
import { useAuth } from '../../hooks/useAuth';
import { User, Role } from '../../types';
import {
  Shield, ShieldAlert, ShieldCheck, Search, UserPlus,
  X, Check, Building2, Pencil, Trash2, ChevronDown
} from 'lucide-react';

type ModalMode = 'add' | 'edit';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'ADMIN', label: 'Department Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
];

export const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const { users, departments, addUser, updateUser, deleteUser, approveUser, rejectUser, accessRequests } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'approved' | 'requests'>('approved');

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [selectedUser, setSelectedUser] = useState<Partial<User> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  if (!user || user.role !== 'SUPER_ADMIN') return null;

  const filteredUsers = useMemo(() => {
    const listToFilter = activeTab === 'requests' ? accessRequests : users;
    
    return listToFilter.filter(u => {
      const name = 'name' in u ? u.name : '';
      const email = 'email' in u ? u.email : '';
      const role = 'role' in u ? u.role : '';
      const departmentId = 'departmentId' in u ? u.departmentId : '';

      const matchesSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'ALL' || role === roleFilter;
      const matchesDept = deptFilter === 'ALL' || departmentId === deptFilter;
      
      return matchesSearch && matchesRole && matchesDept;
    });
  }, [users, accessRequests, searchTerm, roleFilter, deptFilter, activeTab]);

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="flex items-center gap-1.5 text-rose-400 bg-rose-400/10 px-2.5 py-1 rounded-md text-xs font-semibold border border-rose-400/20">
            <ShieldAlert size={12} /> Super Admin
          </span>
        );
      case 'ADMIN':
        return (
          <span className="flex items-center gap-1.5 text-violet-400 bg-violet-400/10 px-2.5 py-1 rounded-md text-xs font-semibold border border-violet-400/20">
            <ShieldCheck size={12} /> Admin
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-slate-400 bg-slate-700/50 px-2.5 py-1 rounded-md text-xs font-semibold border border-white/10">
            <Shield size={12} /> Employee
          </span>
        );
    }
  };

  const openAddModal = () => {
    setSelectedUser({ name: '', email: '', role: 'EMPLOYEE' });
    setModalMode('add');
    setShowModal(true);
  };

  const openEditModal = (u: User) => {
    setSelectedUser({ ...u });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedUser?.name?.trim() || !selectedUser?.email?.trim() || !selectedUser?.role) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      setIsSaving(true);
      if (modalMode === 'add') {
        await addUser({
          name: selectedUser.name.trim(),
          email: selectedUser.email.trim(),
          role: selectedUser.role,
          departmentId: selectedUser.departmentId,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=8b5cf6&color=fff`,
          approvalStatus: 'APPROVED'
        });
      } else if (selectedUser.id) {
        await updateUser(selectedUser.id, selectedUser as User);
      }
      setShowModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      setIsSaving(true);
      await deleteUser(userId, user?.id);
    } finally {
      setIsSaving(false);
      setShowDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 w-full">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">User Management</h1>
            <p className="text-slate-400">Create, edit, and manage all user accounts and their roles.</p>
          </div>
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 self-start overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'approved' 
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20 active-light-tab' 
                : 'text-slate-400 hover:text-slate-300 light-tab'
              }`}
            >
              Approved Accounts
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'requests' 
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20 active-light-tab' 
                : 'text-slate-400 hover:text-slate-300 light-tab'
              }`}
            >
              Access Requests
              {accessRequests.length > 0 && (
                <span className="bg-amber-400 text-amber-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {accessRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>
        <button onClick={openAddModal} className="btn-primary shrink-0 self-start lg:self-auto">
          <UserPlus size={18} /> Add New User
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: users.length, color: 'text-[var(--text-primary)]' },
          { label: 'Super Admins', value: users.filter(u => u.role === 'SUPER_ADMIN').length, color: 'text-rose-500' },
          { label: 'Dept Admins', value: users.filter(u => u.role === 'ADMIN').length, color: 'text-violet-500' },
          { label: 'Employees', value: users.filter(u => u.role === 'EMPLOYEE').length, color: 'text-cyan-500' },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-4">
            <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="glass-card overflow-hidden">
        {/* Filters Row */}
        <div className="p-4 border-b border-white/5 flex flex-wrap gap-3 items-center">
          <div className="relative w-full sm:flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as Role | 'ALL')}
              className="appearance-none bg-slate-900/50 border border-white/10 rounded-lg py-2 pl-3 pr-8 text-sm text-slate-300 focus:outline-none focus:border-violet-500/50 cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
          <div className="relative w-full sm:w-auto">
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="appearance-none bg-slate-900/50 border border-white/10 rounded-lg py-2 pl-3 pr-8 text-sm text-slate-300 focus:outline-none focus:border-violet-500/50 cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
          <span className="text-xs text-slate-500 w-full sm:w-auto sm:ml-auto text-left sm:text-right">{filteredUsers.length} of {activeTab === 'requests' ? accessRequests.length : users.length} {activeTab === 'requests' ? 'requests' : 'users'}</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6 font-medium">User Profile</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Department</th>
                <th className="p-4 pr-6 text-right font-medium">
                  {activeTab === 'requests' ? 'Approval Actions' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500 text-sm">No users match the current filters.</td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const data = u as any; // Mix of User and AccessRequest
                  const dept = departments.find(d => d.id === data.departmentId);
                  const isSelf = data.id === user.id;
                  return (
                    <tr key={data.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <img src={data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=8b5cf6&color=fff`} alt={data.name} className="w-9 h-9 rounded-full border border-white/10" />
                          <div>
                            <p className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                              {data.name}
                              {isSelf && <span className="text-[10px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded font-bold">YOU</span>}
                              {data.isInvited && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider italic">Invited</span>}
                            </p>
                            <p className="text-xs text-slate-500">{data.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{getRoleBadge(data.role)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          {dept ? (
                            <>
                              <Building2 size={14} className="text-slate-600" />
                              {dept.name}
                            </>
                          ) : (
                            <span className="italic text-slate-600">No department</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          {activeTab === 'requests' ? (
                            <>
                              <button
                                onClick={async () => {
                                  await approveUser(data.id);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md transition-all border border-emerald-500/20 shadow-sm shadow-emerald-500/5 group/btn"
                              >
                                <Check size={14} className="group-hover/btn:scale-110 transition-transform" /> Approve
                              </button>
                               <button
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to reject and delete the access request from ${data.name}?`)) {
                                    await rejectUser(data.id);
                                  }
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-md transition-all border border-rose-500/20 shadow-sm shadow-rose-500/5 group/btn"
                              >
                                <X size={14} className="group-hover/btn:scale-110 transition-transform" /> Reject
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => openEditModal(u)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 rounded-md transition-colors"
                              >
                                <Pencil size={13} /> Edit
                              </button>
                              {!isSelf && (
                                <button
                                  onClick={() => setShowDeleteConfirm(u.id)}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-md transition-colors"
                                >
                                  <Trash2 size={13} /> Remove
                                </button>
                              )}
                            </>
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

      {/* Add/Edit Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">{modalMode === 'add' ? 'Add New User' : 'Edit User'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-500 hover:text-white rounded-md hover:bg-white/10 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={selectedUser.name || ''}
                  onChange={e => setSelectedUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Juan Dela Cruz"
                  className="input-field"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={selectedUser.email || ''}
                  onChange={e => setSelectedUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="name@fastservices.com"
                  className="input-field"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</label>
                <select
                  value={selectedUser.role || 'EMPLOYEE'}
                  onChange={e => setSelectedUser(prev => ({ ...prev, role: e.target.value as Role }))}
                  className="input-field appearance-none"
                >
                  {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value} className="bg-slate-900">{r.label}</option>)}
                </select>
              </div>
              {selectedUser.role !== 'SUPER_ADMIN' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Department</label>
                  <select
                    value={selectedUser.departmentId || ''}
                    onChange={e => setSelectedUser(prev => ({ ...prev, departmentId: e.target.value || undefined }))}
                    className="input-field appearance-none"
                  >
                    <option value="" className="bg-slate-900">No Department</option>
                    {departments.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={handleSave}
                disabled={isSaving || !selectedUser.name?.trim() || !selectedUser.email?.trim()}
                className="btn-primary"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={16} /> {modalMode === 'add' ? 'Create User' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-sm p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-2">Remove User?</h3>
            <p className="text-sm text-slate-400 mb-6">This action will remove the user from the system. This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteConfirm(null)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white font-medium rounded-lg hover:bg-rose-600 transition-colors text-sm shadow-[0_4px_14px_rgba(239,68,68,0.4)] disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { useTickets } from '../../hooks/useTickets';
import { Department } from '../../types';
import {
  Building2, Plus, Pencil, Trash2, X, Check,
  Users, Ticket as TicketIcon, ShieldCheck, Search
} from 'lucide-react';

export const DepartmentsManagement: React.FC = () => {
  const { user } = useAuth();
  const { users, departments, addDepartment, updateDepartment, deleteDepartment } = useData();
  const { tickets } = useTickets();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedDept, setSelectedDept] = useState<Partial<Department> | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  const admins = users.filter(u => u.role === 'ADMIN');

  const filteredDepts = departments.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDeptStats = (dept: Department) => {
    const deptTickets = tickets.filter(t => t.departmentId === dept.id);
    const active = deptTickets.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED');
    
    // Prioritize the specific adminId linked in the department record
    let admin = users.find(u => u.id === dept.adminId);
    
    // Fallback: search users for anyone with ADMIN role in this department
    if (!admin) {
      admin = users.find(u => u.departmentId === dept.id && u.role === 'ADMIN');
    }
    
    const members = users.filter(u => u.departmentId === dept.id);
    return { totalTickets: deptTickets.length, activeTickets: active.length, admin, members: members.length };
  };

  const openAddModal = () => {
    setSelectedDept({ name: '', description: '' });
    setModalMode('add');
    setShowModal(true);
  };

  const openEditModal = (dept: Department) => {
    setSelectedDept({ ...dept });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedDept?.name?.trim() || isProcessing) return;
    
    try {
      setIsProcessing(true);
    if (modalMode === 'add') {
      await addDepartment({
        name: selectedDept.name,
        description: selectedDept.description || '',
        adminId: selectedDept.adminId,
      });
    } else if (selectedDept.id) {
      await updateDepartment(selectedDept.id, selectedDept as Department);
    }
      setShowModal(false);
      setSelectedDept(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (deptId: string) => {
    try {
      setIsProcessing(true);
      await deleteDepartment(deptId);
      setShowDeleteConfirm(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Department Management</h1>
          <p className="text-slate-400">Configure departments, assign admins, and manage routing for the ticketing system.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <Plus size={18} /> Add Department
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="text-xs text-slate-500 mb-1">Total Departments</div>
          <div className="text-2xl font-bold text-white">{departments.length}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-slate-500 mb-1">Departments with Admin</div>
          <div className="text-2xl font-bold text-violet-400">
            {departments.filter(d => d.adminId).length}
          </div>
        </div>
        <div className="glass-card p-4 col-span-2 md:col-span-1">
          <div className="text-xs text-slate-500 mb-1">Unassigned Departments</div>
          <div className="text-2xl font-bold text-orange-400">
            {departments.filter(d => !d.adminId).length}
          </div>
        </div>
      </div>

      {/* Departments Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <span className="text-xs text-slate-500 ml-auto">{filteredDepts.length} departments</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6 font-medium">Department</th>
                <th className="p-4 font-medium">Assigned Admin</th>
                <th className="p-4 font-medium text-center">Members</th>
                <th className="p-4 font-medium text-center">Active Tickets</th>
                <th className="p-4 pr-6 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredDepts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500 text-sm">No departments found.</td>
                </tr>
              ) : (
                filteredDepts.map(dept => {
                  const stats = getDeptStats(dept);
                  return (
                    <tr key={dept.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                            <Building2 size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-200">{dept.name}</p>
                            <p className="text-xs text-slate-500 max-w-xs truncate">{dept.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {stats.admin ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={stats.admin.avatar}
                              alt={stats.admin.name}
                              className="w-6 h-6 rounded-full border border-white/10"
                            />
                            <div>
                              <p className="text-xs font-medium text-slate-300">{stats.admin.name}</p>
                              <p className="text-[10px] text-slate-500 flex items-center gap-1"><ShieldCheck size={9} /> Admin</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded-md font-medium">
                            ⚠ Unassigned
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-slate-300 text-sm">
                          <Users size={14} className="text-slate-500" /> {stats.members}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-cyan-400 text-sm font-medium">
                          <TicketIcon size={14} className="text-slate-500" /> {stats.activeTickets}
                        </div>
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(dept)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 rounded-md transition-colors"
                          >
                            <Pencil size={13} /> Edit
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(dept.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-md transition-colors"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
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

      {/* Add / Edit Modal */}
      {showModal && selectedDept !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">{modalMode === 'add' ? 'Add New Department' : 'Edit Department'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-500 hover:text-white rounded-md hover:bg-white/10 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Department Name *</label>
                <input
                  type="text"
                  value={selectedDept.name || ''}
                  onChange={e => setSelectedDept(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. IT Support"
                  className="input-field"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={selectedDept.description || ''}
                  onChange={e => setSelectedDept(p => ({ ...p, description: e.target.value }))}
                  placeholder="What does this department handle?"
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assign Department Admin</label>
                <select
                  value={selectedDept.adminId || ''}
                  onChange={e => setSelectedDept(p => ({ ...p, adminId: e.target.value || undefined }))}
                  className="input-field appearance-none"
                >
                  <option value="" className="bg-slate-900">— None / Unassigned —</option>
                  {admins.map(a => (
                    <option key={a.id} value={a.id} className="bg-slate-900">{a.name} ({a.email})</option>
                  ))}
                </select>
                <p className="text-xs text-slate-600">Only users with the 'Admin' role are shown here.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={handleSave}
                disabled={!selectedDept.name?.trim() || isProcessing}
                className="btn-primary disabled:opacity-50 min-w-[120px]"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={16} /> {modalMode === 'add' ? 'Create Department' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-sm p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-2">Delete Department?</h3>
            <p className="text-sm text-slate-400 mb-2">
              This will remove <span className="text-white font-semibold">{departments.find(d => d.id === showDeleteConfirm)?.name}</span> from the system.
            </p>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-5">
              <p className="text-xs text-orange-400">⚠ Existing tickets routed to this department will no longer have a valid routing target.</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteConfirm(null)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={isProcessing}
                className="px-4 py-2 bg-rose-500 text-white font-medium rounded-lg hover:bg-rose-600 transition-colors text-sm flex items-center gap-2 shadow-[0_4px_14px_rgba(239,68,68,0.4)] disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

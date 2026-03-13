import React, { useState } from 'react';
import { useData } from '../../hooks/useData';
import { useAuth } from '../../hooks/useAuth';
import { KBArticle } from '../../types';
import { Search, Plus, Edit2, Trash2, BookOpen, AlertCircle, Hash, Building2 } from 'lucide-react';
import dayjs from 'dayjs';

interface KBFormData {
  title: string;
  category: string;
  departmentId: string;
  content: string;
  videoUrl: string;
}

const initialFormData: KBFormData = {
  title: '',
  category: '',
  departmentId: '',
  content: '',
  videoUrl: ''
};

export const KnowledgeBaseManagement: React.FC = () => {
  const { articles, departments, addArticle, updateArticle, deleteArticle } = useData();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KBArticle | null>(null);
  const [formData, setFormData] = useState<KBFormData>(initialFormData);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (user?.role !== 'SUPER_ADMIN') return null;

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set(articles.map(a => a.category)));

  const handleOpenModal = (article?: KBArticle) => {
    if (article) {
      setEditingArticle(article);
      setFormData({
        title: article.title,
        category: article.category,
        departmentId: article.departmentId || '',
        content: article.content,
        videoUrl: article.videoUrl || ''
      });
    } else {
      setEditingArticle(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingArticle(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const articleData = {
      title: formData.title,
      category: formData.category,
      departmentId: formData.departmentId || undefined,
      content: formData.content,
      videoUrl: formData.videoUrl || undefined,
      createdBy: user.id
    };

    if (editingArticle) {
      updateArticle(editingArticle.id, articleData);
    } else {
      addArticle(articleData);
    }
    
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    deleteArticle(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Knowledge Base Config</h1>
          <p className="text-slate-400">Manage help articles, FAQs, and guides for employees.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add Article
        </button>
      </div>

      <div className="glass-card overflow-hidden flex flex-col">
        <div className="p-5 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between bg-white/[0.02]">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
          <div className="text-sm font-medium text-slate-400 bg-white/5 px-3 py-1.5 rounded-md border border-white/5">
            Total Articles: <span className="text-white">{articles.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6 font-medium">Article</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Department</th>
                <th className="p-4 font-medium">Last Updated</th>
                <th className="p-4 pr-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <BookOpen size={32} className="mx-auto mb-3 text-slate-600" />
                    No articles found.
                  </td>
                </tr>
              ) : (
                filteredArticles.map(article => {
                  const dept = departments.find(d => d.id === article.departmentId);
                  return (
                    <tr key={article.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="font-semibold text-white group-hover:text-violet-400 transition-colors">{article.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 max-w-[300px] mt-0.5">{article.content}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-white/5">
                          <Hash size={12} className="text-slate-500"/>
                          {article.category}
                        </span>
                      </td>
                      <td className="p-4">
                        {dept ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                            <Building2 size={12} />
                            {dept.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Global</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        {dayjs(article.updatedAt).format('MMM D, YYYY')}
                      </td>
                      <td className="p-4 pr-6">
                         <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                               onClick={() => handleOpenModal(article)}
                               className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                               title="Edit Article"
                             >
                               <Edit2 size={16} />
                             </button>
                             {confirmDeleteId === article.id ? (
                               <div className="flex items-center gap-1 bg-rose-500/10 p-1 rounded-lg border border-rose-500/20">
                                 <button
                                   onClick={() => handleDelete(article.id)}
                                   className="text-xs px-2 py-1 bg-rose-500 text-white rounded hover:bg-rose-600 transition-colors font-medium"
                                 >
                                   Confirm
                                 </button>
                                 <button
                                   onClick={() => setConfirmDeleteId(null)}
                                   className="text-xs px-2 py-1 text-slate-400 hover:text-white transition-colors"
                                 >
                                   Cancel
                                 </button>
                               </div>
                             ) : (
                               <button
                                 onClick={() => setConfirmDeleteId(article.id)}
                                 className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                                 title="Delete Article"
                               >
                                 <Trash2 size={16} />
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-2xl p-6 animate-slide-up flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingArticle ? 'Edit Article' : 'New Article'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white transition-colors">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Article Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors"
                    placeholder="e.g., How to connect to VPN"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                    <input
                      type="text"
                      required
                      list="category-suggestions"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors"
                      placeholder="e.g., Network Access"
                    />
                    <datalist id="category-suggestions">
                      {categories.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5 flex justify-between">
                      Department <span className="text-slate-500 text-xs font-normal">Optional</span>
                    </label>
                    <select
                      value={formData.departmentId}
                      onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 transition-colors appearance-none"
                    >
                      <option value="">Global (All Departments)</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Content</label>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 mb-3 flex gap-3 text-indigo-300 text-sm">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <p>Articles support basic markdown. You can also add a YouTube embed link (e.g., https://www.youtube.com/embed/...) below.</p>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">YouTube Embed URL</label>
                    <input
                      type="url"
                      value={formData.videoUrl}
                      onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors"
                      placeholder="e.g., https://www.youtube.com/embed/VIDEO_ID"
                    />
                  </div>

                  <textarea
                    required
                    rows={8}
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors font-mono text-sm resize-none custom-scrollbar"
                    placeholder="Write your article content here..."
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex gap-3 justify-end sticky bottom-0 bg-slate-900/95 backdrop-blur py-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingArticle ? 'Save Changes' : 'Create Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTickets } from '../../hooks/useTickets';
import { useAuth } from '../../hooks/useAuth';
import { analyzePriority, suggestCategory } from '../../lib/aiPriority';
import { useData } from '../../hooks/useData';
import { PriorityBadge } from '../ui/PriorityBadge';
import { Bot, Loader2, Upload, X, FileText, Image as ImageIcon, File, Search, Check, ChevronDown, Maximize2, Clipboard } from 'lucide-react';
import { Priority } from '../../types';
import { compressImage } from '../../utils/imageCompression';

interface AttachmentPreview {
  file: File;
  preview?: string; // data URL for images
}

export const TicketForm: React.FC = () => {
  const { addTicket } = useTickets();
  const { user } = useAuth();
  const { departments, categories, config } = useData();
  const dropRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const [pasteFeedback, setPasteFeedback] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mobileView = window.innerWidth < 768;

  const [aiAnalysis, setAiAnalysis] = useState<{ priority: Priority, confidence: number, reasoning: string } | null>(null);
  const [manualPriority, setManualPriority] = useState<Priority | null>(null);

  useEffect(() => {
    if (categoryId) {
      const cat = categories.find(c => c.id === categoryId);
      if (cat) setManualPriority(cat.defaultPriority);
    }
  }, [categoryId, categories]);

  useEffect(() => {
    if (title.length > 5 || description.length > 10) {
      const timer = setTimeout(() => {
        const result = analyzePriority(title, description, {
          urgent: config.urgentKeywords,
          high: config.highKeywords,
          medium: config.mediumKeywords
        });
        setAiAnalysis(result);
        setManualPriority(result.priority);
        
        const suggestedId = suggestCategory(`${title} ${description}`, categories);
        if (suggestedId && !categorySearch && !categoryId && !customCategory) {
          const suggested = categories.find(c => c.id === suggestedId);
          if (suggested) { /* highlight candidate if needed */ }
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setAiAnalysis(null);
    }
  }, [title, description, categoryId, customCategory, categories, categorySearch]);

  const addFiles = useCallback(async (files: File[]) => {
    const compressedFiles = await Promise.all(
      files.map(f => compressImage(f))
    );

    const previews: AttachmentPreview[] = compressedFiles.map(f => ({ file: f }));
    // Generate preview URLs for images
    previews.forEach((p, i) => {
      if (p.file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => {
          setAttachments(prev => {
            const updated = [...prev];
            const idx = prev.findIndex((a, ai) => ai >= prev.length - previews.length + i && a.file === p.file);
            if (idx >= 0) updated[idx] = { ...updated[idx], preview: e.target?.result as string };
            return updated;
          });
        };
        reader.readAsDataURL(p.file);
      }
    });
    setAttachments(prev => [...prev, ...previews]);
  }, []);
  useEffect(() => {
    const handleFsChange = () => {
      // Close lightbox automatically when exiting fullscreen
      if (document.fullscreenElement === null) {
        setLightboxSrc(null);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);


  // Ctrl+V paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            // The file from clipboard already has a type; just use it.
            imageFiles.push(file);
          }
        }
      }
      if (imageFiles.length > 0) {
        addFiles(imageFiles);
        setPasteFeedback(true);
        setTimeout(() => setPasteFeedback(false), 2000);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addFiles]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={16} />;
    if (type.includes('pdf')) return <FileText size={16} />;
    return <File size={16} />;
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDepartmentId('');
    setCategoryId('');
    setCustomCategory('');
    setCategorySearch('');
    setAttachments([]);
    setAiAnalysis(null);
    setManualPriority(null);
    setIsConfirming(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !departmentId) return;

    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    try {
      setIsSubmitting(true);
      const filesToUpload = attachments.map(a => a.file);
      await addTicket({
        title,
        description,
        departmentId,
        categoryId: categoryId || undefined,
        customCategory: customCategory || undefined,
        priority: aiAnalysis?.priority || manualPriority || 'LOW',
        status: 'OPEN',
        createdBy: user?.id || 'unknown',
      }, filesToUpload);
  
      resetForm();
      alert('Ticket submitted successfully!');
    } catch (error) {
      console.error('Failed to submit ticket:', error);
      setIsConfirming(false);
    } finally {
      setIsSubmitting(false);
    }
    // navigate('/employee'); // Stay on page as requested to see unfilled fields, or user can navigate manually
  };

  return (
    <>
      {lightboxSrc && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center animate-fade-in cursor-zoom-out"
          onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen();
            setLightboxSrc(null);
          }}
        >
          <img
            src={lightboxSrc}
            alt="Fullscreen Preview"
            className="max-w-full max-h-full object-contain shadow-2xl"
          />
          {/* Subtle exit hint */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-[10px] uppercase tracking-widest font-medium pointer-events-none">
            Press Esc or click to exit
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 animate-slide-up">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="glass-card p-4 sm:p-6 lg:p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Create New Ticket</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Department</label>
                  <div className="relative">
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      required
                      className="input-field appearance-none bg-slate-900/50 pr-10"
                    >
                      <option value="" disabled>Select department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id} className="bg-slate-900 text-slate-200">{d.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2 relative">
                  <label className="text-sm font-medium text-slate-300">Category</label>
                  <div className="relative">
                    <div 
                      onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                      className="input-field bg-slate-900/50 flex items-center justify-between cursor-pointer hover:bg-slate-900/70 transition-colors"
                    >
                      <span className={categoryId || customCategory ? 'text-white' : 'text-slate-500'}>
                        {categoryId 
                          ? categories.find(c => c.id === categoryId)?.name 
                          : customCategory 
                            ? customCategory 
                            : 'Select or type'}
                      </span>
                      <ChevronDown size={16} className={`text-slate-500 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isCategoryOpen && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-2 border-b border-white/5 bg-slate-800/50">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <input
                              autoFocus
                              type="text"
                              placeholder="Search or type..."
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                              className="w-full bg-slate-950/50 border border-white/5 rounded-lg py-2 pl-9 pr-3 text-sm lg:text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="max-h-[300px] lg:max-h-60 overflow-y-auto p-1 custom-scrollbar">
                          {categories
                            .filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                            .map(c => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setCategoryId(c.id);
                                  setCustomCategory('');
                                  setCategorySearch('');
                                  setIsCategoryOpen(false);
                                }}
                                className="w-full text-left p-3 rounded-lg hover:bg-white/5 flex items-center justify-between group transition-colors"
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm text-slate-200 group-hover:text-white">{c.name}</span>
                                  <span className="text-[10px] text-slate-500 line-clamp-1">{c.description}</span>
                                </div>
                                {categoryId === c.id && <Check size={14} className="text-violet-400" />}
                              </button>
                            ))}
                          
                          {categorySearch && !categories.some(c => c.name.toLowerCase() === categorySearch.toLowerCase()) && (
                            <button
                              type="button"
                              onClick={() => {
                                setCustomCategory(categorySearch);
                                setCategoryId('');
                                setIsCategoryOpen(false);
                              }}
                              className="w-full text-left p-3 rounded-lg hover:bg-violet-500/10 border border-dashed border-violet-500/20 m-1 flex items-center gap-3 transition-colors"
                            >
                              <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                                <Bot size={14} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-violet-300">Use custom: "{categorySearch}"</span>
                                <span className="text-[10px] text-slate-500 italic">AI will classify this request</span>
                              </div>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {isCategoryOpen && <div className="fixed inset-0 z-40" onClick={() => setIsCategoryOpen(false)} />}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Subject / Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Summary of the issue"
                  className="input-field bg-slate-900/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={mobileView ? 4 : 6}
                  placeholder="Provide as much detail as possible..."
                  className="input-field bg-slate-900/50 resize-none min-h-[120px]"
                />
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">Attachments</label>
                  <div className={`hidden sm:flex items-center gap-1.5 text-xs transition-all duration-300 ${pasteFeedback ? 'text-violet-400 opacity-100' : 'text-slate-500 opacity-70'}`}>
                    <Clipboard size={12} />
                    {pasteFeedback ? 'Image pasted!' : 'Ctrl+V to paste image'}
                  </div>
                </div>
                <div 
                  ref={dropRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 transition-all flex flex-col items-center justify-center gap-3 group ${
                    isDragging 
                      ? 'border-violet-500 bg-violet-500/10' 
                      : 'border-white/10 bg-slate-900/40 hover:border-white/20 hover:bg-slate-900/60'
                  }`}
                >
                  <input 
                    type="file" 
                    multiple 
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isDragging ? 'bg-violet-500 text-white' : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-slate-300'
                  }`}>
                    <Upload size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-300">
                      <span className="text-violet-400">Tap to upload</span>
                    </p>
                    <p className="hidden sm:block text-xs text-slate-500 mt-1">or drag and drop here</p>
                  </div>
                </div>

                {/* Thumbnail Grid */}
                {attachments.length > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/10 bg-slate-900/60 transition-all duration-200">
                        {att.preview ? (
                          <div className="relative cursor-pointer" onClick={() => setLightboxSrc(att.preview!)}>
                             <img
                                src={att.preview}
                                alt={att.file.name}
                                className="w-full h-24 sm:h-32 object-cover"
                             />
                             <div className="absolute inset-0 bg-black/0 sm:group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
                               <Maximize2 size={18} className="text-white opacity-0 sm:group-hover:opacity-100" />
                             </div>
                           </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-24 sm:h-32 gap-2 text-slate-500">
                            <div className="text-violet-400">{getFileIcon(att.file.type)}</div>
                            <span className="text-[10px] text-slate-500 px-2 truncate w-full text-center">{att.file.name}</span>
                          </div>
                        )}
                        <div className="p-2 flex items-center justify-between gap-1 border-t border-white/5 bg-slate-900">
                          <span className="text-[10px] text-slate-400 truncate flex-1">{att.file.name}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeAttachment(idx); }}
                            className="p-1 text-slate-500 hover:text-rose-400"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-end gap-4">
                {isConfirming && (
                  <button
                    type="button"
                    onClick={() => setIsConfirming(false)}
                    className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                  >
                    Go Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || !title || !description || !departmentId}
                  className={`w-full sm:w-auto btn-primary px-8 py-3 transition-all duration-300 ${isConfirming ? 'bg-emerald-600 border-emerald-400' : ''}`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : isConfirming ? (
                    'Confirm Submission'
                  ) : (
                    'Submit Ticket'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* AI Priority Preview Panel */}
        <div className="lg:col-span-1 order-first lg:order-last">
          <div className="glass-card p-4 sm:p-6 border-violet-500/20 sticky top-4 lg:top-[90px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <h3 className="font-semibold text-white">Analysis</h3>
              </div>
              {aiAnalysis && <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400">Real-time</span>}
            </div>
            
            <div className="bg-slate-950/40 rounded-xl p-4 border border-white/5 min-h-[100px] flex flex-col justify-center">
              {!title && !description ? (
                <div className="text-center py-2">
                  <p className="text-xs text-slate-500">Analysis will appear as you type</p>
                </div>
              ) : !aiAnalysis ? (
                <div className="flex items-center gap-3 text-violet-400 justify-center">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs font-medium">Analyzing...</span>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Priority</span>
                    <PriorityBadge priority={aiAnalysis.priority} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Reason</span>
                    <p className="text-xs text-slate-300 leading-relaxed italic">"{aiAnalysis.reasoning}"</p>
                  </div>
                  <div className="pt-2">
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-600 to-cyan-400 transition-all duration-700 ease-out"
                        style={{ width: `${aiAnalysis.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

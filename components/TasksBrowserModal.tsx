import React, { useState, useEffect } from 'react';
import { useTasks } from '../store/TasksProvider';
import { AppContext } from '../App';
import { useContext } from 'react';

interface TasksBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TasksBrowserModal: React.FC<TasksBrowserModalProps> = ({ isOpen, onClose }) => {
  const { language } = useContext(AppContext);
  const { tasks, isLoading, refreshTasks, completeTask, createTask, login, accessToken } = useTasks();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newDue, setNewDue] = useState('');

  useEffect(() => {
    if (isOpen && accessToken) {
      refreshTasks();
    }
  }, [isOpen, accessToken, refreshTasks]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    // Format due date to RFC3339 if provided (YYYY-MM-DD -> YYYY-MM-DDT00:00:00Z)
    const formattedDue = newDue ? `${newDue}T00:00:00Z` : undefined;
    await createTask(newTitle, newNotes, formattedDue);
    setNewTitle('');
    setNewNotes('');
    setNewDue('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-emerald-400" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.4-1.4L10 14.2l7.6-7.6L19 8l-9 9z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {language === 'ar' ? 'مهام جوجل' : 'Google Tasks'}
              </h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                {language === 'ar' ? 'نظام إدارة المشاريع المتزامن' : 'Synchronized Task Management'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {!accessToken ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
               <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <h3 className="text-white font-bold text-lg mb-2">{language === 'ar' ? 'الاتصال مطلوب' : 'Connection Required'}</h3>
            <p className="text-gray-500 text-sm max-w-xs mb-8">{language === 'ar' ? 'يرجى تسجيل الدخول للوصول إلى مهام جوجل ومزامنتها مع المحطة.' : 'Please connect your Google account to access and sync tasks.'}</p>
            <button onClick={login} className="px-8 py-3 bg-emerald-500 text-black font-black rounded-2xl hover:scale-105 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
              {language === 'ar' ? 'ربط الحساب' : 'Connect Account'}
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
            
            {/* Quick Add Toggle */}
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all group ${
                isAdding ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/[0.03] border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isAdding ? 'bg-emerald-500 text-black' : 'bg-white/5 text-emerald-400 group-hover:bg-emerald-500/20'}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4"/></svg>
                </div>
                <span className="text-sm font-bold text-white">{language === 'ar' ? 'إضافة مهمة جديدة' : 'Add New Task'}</span>
              </div>
              <svg className={`w-5 h-5 text-gray-600 transition-transform ${isAdding ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
            </button>

            {/* Add Form */}
            {isAdding && (
              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4 animate-slide-down">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5 block px-1">{language === 'ar' ? 'عنوان المهمة' : 'Task Title'}</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder={language === 'ar' ? 'ماذا تريد أن تفعل؟' : 'What needs to be done?'}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:border-emerald-500/50 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5 block px-1">{language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</label>
                    <input 
                      type="date" 
                      value={newDue}
                      onChange={e => setNewDue(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/50 transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={handleCreate}
                      disabled={!newTitle.trim()}
                      className="w-full h-[50px] bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/10 active:scale-95 text-sm uppercase tracking-wider"
                    >
                      {language === 'ar' ? 'تأكيد الإضافة' : 'Confirm Task'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tasks List */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="p-12 flex flex-col items-center gap-4 opacity-50">
                  <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                  <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">{language === 'ar' ? 'جاري المزامنة...' : 'Syncing...'}</span>
                </div>
              ) : tasks.length === 0 ? (
                <div className="p-12 text-center opacity-30 flex flex-col items-center">
                  <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  <p className="font-bold">{language === 'ar' ? 'لا يوجد مهام حالية' : 'Zero Tasks Found'}</p>
                </div>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="group p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-emerald-500/20 transition-all flex items-center gap-4 hover:bg-white/[0.04] relative">
                    <button 
                      onClick={() => completeTask(task.id)}
                      className="w-6 h-6 rounded-lg border-2 border-emerald-500/30 group-hover:border-emerald-500 flex items-center justify-center transition-all bg-emerald-500/0 hover:bg-emerald-500/10"
                    >
                      <svg className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-40 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>
                    </button>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{task.title}</h4>
                      {task.due && (
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-1 uppercase font-black tracking-tighter">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          {new Date(task.due).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' })}
                        </div>
                      )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                       <button className="p-2 text-gray-600 hover:text-emerald-400">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Footer Area */}
        <div className="p-4 border-t border-white/5 bg-black/40 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
            <span>{language === 'ar' ? 'المزامنة النشطة' : 'Active Sync'}</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              {language === 'ar' ? 'متصل بمهام جوجل' : 'Verified Google Tasks'}
            </span>
        </div>
      </div>
      
      <style>{`
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TasksBrowserModal;

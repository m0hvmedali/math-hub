import React, { useState, useEffect, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { AppContext } from '../App';
import { QuickNote } from '../components/FloatingQuickNote';

const NOTE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Yellow: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
  Pink: { bg: '#FCE7F3', text: '#9D174D', border: '#EC4899' },
  Green: { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
  Blue: { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' },
  Purple: { bg: '#EDE9FE', text: '#5B21B6', border: '#8B5CF6' },
  Orange: { bg: '#FFEDD5', text: '#9A3412', border: '#F97316' },
};

const NotesPage: React.FC = () => {
  const { user, language } = useContext(AppContext) as any;
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!user || !supabase) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('quick_notes')
        .select('*')
        .eq('user_id', user)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setNotes(data);
      }
      setLoading(false);
    };

    fetchNotes();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!supabase || !window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه الملحوظة؟' : 'Are you sure you want to delete this note?')) return;
    
    const { error } = await supabase.from('quick_notes').delete().eq('id', id);
    if (!error) {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-12 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">
              {language === 'ar' ? 'جميع الملاحظات' : 'Global Sticky Notes'}
            </h1>
            <p className="text-gray-500 font-medium">
              {language === 'ar' 
                ? 'جميع الأفكار والملاحظات التي سجلتها أثناء المذاكرة' 
                : 'All ideas and notes you captured during your study sessions'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-brand-cyan bg-brand-cyan/10 px-6 py-3 rounded-2xl border border-brand-cyan/20">
            <span>{notes.length} {language === 'ar' ? 'ملاحظة' : 'Notes Saved'}</span>
          </div>
        </header>

        {notes.length === 0 ? (
          <div className="text-center py-24 bg-white/5 rounded-[2.5rem] border border-white/5">
            <span className="text-6xl mb-6 block">📝</span>
            <h3 className="text-xl font-bold text-white mb-2">
              {language === 'ar' ? 'لا يوجد ملاحظات حتى الآن' : 'No notes captured yet'}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {language === 'ar'
                ? 'استخدم الزر العائم في أي صفحة لتسجيل أفكارك سريعاً'
                : 'Use the floating quick note button on any page to record your ideas instantly'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {notes.map((note) => {
              const theme = NOTE_COLORS[note.color] || NOTE_COLORS.Yellow;
              return (
                <div
                  key={note.id}
                  className="group relative flex flex-col rounded-[2rem] shadow-xl transition-all hover:scale-[1.02] active:scale-95 overflow-hidden"
                  style={{ background: theme.bg, border: `2px solid ${theme.border}` }}
                >
                  <div className="p-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: theme.text }}>
                        {new Date(note.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <button 
                        onClick={() => handleDelete(note.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-black/5 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={theme.text}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>

                    <p 
                      className="text-lg font-medium leading-relaxed whitespace-pre-wrap mb-6" 
                      style={{ color: theme.text, fontFamily: "'Caveat', cursive, sans-serif" }}
                    >
                      {note.content}
                    </p>

                    <div className="mt-auto pt-4 border-t border-black/5 flex flex-col gap-2">
                       {note.subject_name && (
                         <NavLink 
                            to={note.page_path} 
                            className="text-[10px] font-bold px-3 py-2 rounded-xl flex items-center gap-2 transition-all hover:brightness-95"
                            style={{ background: `${theme.border}30`, color: theme.text }}
                         >
                           <span className="opacity-60">📍</span>
                           <span className="truncate">
                             {note.subject_name} 
                             {note.branch_name && ` → ${note.branch_name}`}
                             {note.lesson_name && ` → ${note.lesson_name}`}
                           </span>
                         </NavLink>
                       )}
                       {!note.subject_name && (
                         <NavLink 
                            to={note.page_path} 
                            className="text-[10px] font-bold px-3 py-2 rounded-xl flex items-center gap-2 transition-all hover:brightness-95"
                            style={{ background: `${theme.border}30`, color: theme.text }}
                         >
                           <span className="opacity-60">🌐</span>
                           <span className="truncate">{language === 'ar' ? 'الموقع العام' : 'General Site'}</span>
                         </NavLink>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPage;

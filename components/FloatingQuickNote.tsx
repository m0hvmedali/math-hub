import React, { useState, useEffect, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { AppContext } from '../App';
import { useHubCore } from '../utils/HubCore';
import { useGoogleOmni } from '../services/platform-sdk';

export interface QuickNote {
  id: string;
  user_id: string;
  content: string;
  color: string;
  subject_id?: string | null;
  branch_id?: string | null;
  lesson_id?: string | null;
  subject_name?: string;
  branch_name?: string;
  lesson_name?: string;
  page_path: string;
  created_at: string;
}

const NOTE_COLORS = [
  { name: 'Yellow',  bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
  { name: 'Pink',    bg: '#FCE7F3', text: '#9D174D', border: '#EC4899' },
  { name: 'Green',   bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
  { name: 'Blue',    bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' },
  { name: 'Purple',  bg: '#EDE9FE', text: '#5B21B6', border: '#8B5CF6' },
  { name: 'Orange',  bg: '#FFEDD5', text: '#9A3412', border: '#F97316' },
];

interface FloatingQuickNoteProps {
  hideButton?: boolean;
  forceOpen?: boolean;
  onClose?: () => void;
}

const FloatingQuickNote: React.FC<FloatingQuickNoteProps> = ({ hideButton, forceOpen, onClose }) => {
  const location = useLocation();
  const { user, subjects } = useContext(AppContext) as any;
  const { docs, auth } = useGoogleOmni();
  const [isOpen, setIsOpen] = useState(false);
  const effectiveOpen = forceOpen !== undefined ? forceOpen : isOpen;
  const [noteContent, setNoteContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  // Drag state
  const [position, setPosition] = useState({ x: 24, y: window.innerHeight - 96 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  useEffect(() => {
    // Move up on mobile to avoid nav bar
    const initialY = window.innerWidth < 768 ? window.innerHeight - 160 : window.innerHeight - 96;
    setPosition({ x: 24, y: initialY });
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, initialX: position.x, initialY: position.y };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: Math.max(0, Math.min(window.innerWidth - 60, dragRef.current.initialX + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 60, dragRef.current.initialY + dy))
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
  };


  // Register with HubCore
  useHubCore({
    id: 'QuickNoteAtom',
    state: { isOpen, noteLength: noteContent.length },
    actions: {
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen(p => !p),
      setColor: (name: string) => {
        const c = NOTE_COLORS.find(col => col.name === name);
        if (c) setSelectedColor(c);
      }
    }
  });

  if (!user) return null;

  // Extract context from current URL path
  const getContext = () => {
    const path = location.pathname;
    const parts = path.split('/');
    let subjectId: string | null = null;
    let branchId: string | null = null;
    let lessonId: string | null = null;
    let subjectName = '';
    let branchName = '';
    let lessonName = '';

    // Pattern: /subject/:subjectId/branch/:branchId/lesson/:lessonId
    const subjectIdx = parts.indexOf('subject');
    if (subjectIdx !== -1 && parts[subjectIdx + 1]) {
      subjectId = parts[subjectIdx + 1];
      const subject = subjects.find((s: any) => s.id === subjectId);
      if (subject) {
        subjectName = subject.name;
        const branchIdx = parts.indexOf('branch');
        if (branchIdx !== -1 && parts[branchIdx + 1]) {
          branchId = parts[branchIdx + 1];
          const branch = subject.branches?.find((b: any) => b.id === branchId);
          if (branch) {
            branchName = branch.name;
            const lessonIdx = parts.indexOf('lesson');
            if (lessonIdx !== -1 && parts[lessonIdx + 1]) {
              lessonId = parts[lessonIdx + 1];
              const lesson = branch.lessons?.find((l: any) => l.id === lessonId);
              if (lesson) lessonName = lesson.name;
            }
          }
        }
      }
    }

    return { subjectId, branchId, lessonId, subjectName, branchName, lessonName, path };
  };

  const handleSave = async () => {
    if (!noteContent.trim() || !supabase) return;
    setIsSaving(true);

    const ctx = getContext();

    const { error } = await supabase.from('quick_notes').insert({
      user_id: user,
      content: noteContent.trim(),
      color: selectedColor.name,
      subject_id: ctx.subjectId,
      branch_id: ctx.branchId,
      lesson_id: ctx.lessonId,
      subject_name: ctx.subjectName,
      branch_name: ctx.branchName,
      lesson_name: ctx.lessonName,
      page_path: ctx.path,
    });

    setIsSaving(false);

    if (!error) {
      setShowSuccess(true);
      setNoteContent('');
      setTimeout(() => {
        setShowSuccess(false);
        setIsOpen(false);
      }, 1200);
    } else {
      console.error("Quick Note Save Error:", error);
    }
  };

  const handleExportDocs = async () => {
    if (!noteContent.trim() || !docs) return;
    try {
      if (!auth.getToken()) {
        await auth.login();
      }
      setIsExporting(true);
      const ctx = getContext();
      const title = ctx.lessonName ? `Math Hub Note: ${ctx.lessonName}` : 'Math Hub Quick Note';
      const result = await docs.exportNoteToDoc(title, noteContent);
      setExportUrl(result.url);
      setTimeout(() => setExportUrl(null), 4000);
    } catch (err) {
      console.error("Docs export failed", err);
      alert("Failed to export to Google Docs. Please check console.");
    } finally {
      setIsExporting(false);
    }
  };

  const ctx = getContext();
  const contextLabel = ctx.lessonName
    ? `📍 ${ctx.subjectName} → ${ctx.branchName} → ${ctx.lessonName}`
    : ctx.subjectName
      ? `📍 ${ctx.subjectName}`
      : '📍 General Note';

  return (
    <>
      {/* Floating Quick Note Button */}
      {!hideButton && (
        <button
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={(e) => {
            if (dragRef.current && (Math.abs(e.clientX - dragRef.current.startX) > 5 || Math.abs(e.clientY - dragRef.current.startY) > 5)) return;
            setIsOpen(!isOpen);
          }}
          className="fixed z-[95] group flex items-center justify-center w-14 h-14 rounded-full border border-white/10 shadow-xl hover:border-amber-400/50 transition-colors cursor-move"
          style={{ 
            background: 'rgba(10, 10, 10, 0.9)', 
            backdropFilter: 'blur(16px)',
            left: position.x,
            top: position.y,
            touchAction: 'none'
          }}
          title="Quick Note (Drag to move)"
        >
          <span className="text-xl pointer-events-none">📝</span>
        </button>
      )}

      {/* Sticky Note Modal */}
      {effectiveOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onClose ? onClose() : setIsOpen(false)} />
          
          {/* Sticky Note */}
          <div
            className="relative w-full max-w-sm animate-scale-in origin-bottom-left rounded-3xl shadow-2xl overflow-hidden"
            style={{
              background: selectedColor.bg,
              border: `2px solid ${selectedColor.border}`,
            }}
          >
            {/* Header */}
            <div className="p-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📝</span>
                <span className="text-sm font-black uppercase tracking-wider" style={{ color: selectedColor.text }}>
                  Quick Note
                </span>
              </div>
              <button onClick={() => onClose ? onClose() : setIsOpen(false)} className="p-1.5 rounded-full hover:bg-black/10 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={selectedColor.text}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Context Badge */}
            <div className="px-4 pb-2">
              <span
                className="text-[10px] font-bold px-3 py-1 rounded-full inline-block"
                style={{ background: `${selectedColor.border}20`, color: selectedColor.text }}
              >
                {contextLabel}
              </span>
            </div>

            {/* Note Content */}
            <div className="px-4 pb-3">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write your idea here..."
                rows={5}
                autoFocus
                className="w-full bg-transparent border-none outline-none resize-none text-base font-medium leading-relaxed placeholder-opacity-40"
                style={{ color: selectedColor.text, fontFamily: "'Caveat', 'Cairo', cursive, sans-serif" }}
              />
            </div>

            {/* Color Picker */}
            <div className="px-4 pb-3 flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest mr-1" style={{ color: selectedColor.text, opacity: 0.5 }}>Color</span>
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedColor(c)}
                  className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background: c.bg,
                    borderColor: selectedColor.name === c.name ? c.border : 'transparent',
                    boxShadow: selectedColor.name === c.name ? `0 0 8px ${c.border}60` : 'none',
                  }}
                />
              ))}
            </div>

            {/* Save Button */}
            <div className="p-4 pt-2 flex flex-col gap-2">
              {showSuccess ? (
                <div className="w-full py-3 rounded-2xl text-center font-black text-sm flex items-center justify-center gap-2"
                     style={{ background: '#10B981', color: 'white' }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Saved!
                </div>
              ) : exportUrl ? (
                <a
                  href={exportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-2xl text-center font-black text-sm flex items-center justify-center gap-2 bg-blue-500 text-white"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  Open in Google Docs
                </a>
              ) : (
                <>
                  <button
                    onClick={handleExportDocs}
                    disabled={!noteContent.trim() || isExporting || isSaving}
                    className="w-full py-2.5 rounded-2xl font-bold text-sm bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/30 transition-all disabled:opacity-40"
                  >
                    {isExporting ? 'Exporting...' : '📄 Export to Google Docs'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!noteContent.trim() || isSaving || isExporting}
                    className="w-full py-3 rounded-2xl font-black text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
                    style={{ background: selectedColor.border }}
                  >
                    {isSaving ? 'Saving...' : '💾 Save locally'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingQuickNote;

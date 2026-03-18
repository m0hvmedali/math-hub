import React, { useState, useCallback } from 'react';
import { useGoogleOmni } from '../services/platform-sdk';

interface GoogleServicesFABProps {
  onOpenGmail: () => void;
  onOpenCalendar: () => void;
  onOpenTasks: () => void;
  onOpenDrive: () => void;
  onOpenYouTube: () => void;
}

const GoogleServicesFAB: React.FC<GoogleServicesFABProps> = ({
  onOpenGmail,
  onOpenCalendar,
  onOpenTasks,
  onOpenDrive,
  onOpenYouTube,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { auth } = useGoogleOmni();
  const isConnected = !!auth.getToken();

  if (!isConnected) return null;

  const SERVICES = [
    {
      label: 'Gmail',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
        </svg>
      ),
      color: 'text-red-400 bg-red-500/10 border-red-500/20 hover:bg-red-500/20',
      action: onOpenGmail,
    },
    {
      label: 'Calendar',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
        </svg>
      ),
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20',
      action: onOpenCalendar,
    },
    {
      label: 'Tasks',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.4-1.4L10 14.2l7.6-7.6L19 8l-9 9z"/>
        </svg>
      ),
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20',
      action: onOpenTasks,
    },
    {
      label: 'Drive',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M7.71 3.5L1.15 15l3.43 6L10.14 9.5L7.71 3.5zm.56 5.5L12 21h7.7l-3.43-6-8-6zM22.85 15L18 6H9.5l3.43 6L22.85 15z"/>
        </svg>
      ),
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20',
      action: onOpenDrive,
    },
    {
      label: 'YouTube',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z"/>
        </svg>
      ),
      color: 'text-red-500 bg-red-500/10 border-red-500/20 hover:bg-red-500/20',
      action: onOpenYouTube,
    },
  ];

  return (
    <div className="fixed bottom-24 right-5 z-50 flex flex-col-reverse items-end gap-3">
      {/* Service Buttons */}
      {isOpen && SERVICES.map((svc, i) => (
        <div
          key={svc.label}
          className="flex items-center gap-2"
          style={{
            animation: `fadeInUp 0.2s ease forwards ${i * 0.05}s`,
            opacity: 0,
          }}
        >
          <span className="text-[11px] font-bold text-white/70 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10 select-none">
            {svc.label}
          </span>
          <button
            onClick={() => { svc.action(); setIsOpen(false); }}
            className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-200 shadow-lg ${svc.color}`}
          >
            {svc.icon}
          </button>
        </div>
      ))}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 border ${
          isOpen
            ? 'bg-white/10 border-white/20 rotate-45'
            : 'bg-gradient-to-br from-blue-500 to-indigo-600 border-white/10'
        }`}
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        ) : (
          <span className="text-white font-black text-2xl" style={{fontFamily:'sans-serif'}}>G</span>
        )}
      </button>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default GoogleServicesFAB;

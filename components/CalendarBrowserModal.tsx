import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../App';
import { calendar, auth } from '../services/platform-sdk';

interface CalendarBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalendarBrowserModal: React.FC<CalendarBrowserModalProps> = ({ isOpen, onClose }) => {
  const { language } = useContext(AppContext);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessToken = auth.getToken();

  const fetchEvents = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await calendar.getEvents();
      setEvents(data.items || []);
    } catch (err) {
      setError('Failed to load events');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && accessToken) {
      fetchEvents();
    }
  }, [isOpen, accessToken]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-400" fill="currentColor">
                <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {language === 'ar' ? 'تقويم جوجل' : 'Google Calendar'}
              </h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                {language === 'ar' ? 'مزامنة المواعيد والدروس' : 'Event & Schedule Sync'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {!accessToken ? (
           <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400">
              <p>{language === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please connect your account'}</p>
           </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {isLoading ? (
               <div className="p-12 flex flex-col items-center gap-4 opacity-50">
                  <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  <span className="text-xs font-bold text-blue-400 uppercase">{language === 'ar' ? 'جاري التحميل...' : 'Syncing Calendar...'}</span>
               </div>
            ) : events.length === 0 ? (
               <div className="p-12 text-center opacity-30 flex flex-col items-center">
                  <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  <p className="font-bold">{language === 'ar' ? 'لا توجد مواعيد قادمة' : 'No Upcoming Events'}</p>
               </div>
            ) : (
              events.map(event => (
                <div key={event.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-blue-500/20 transition-all flex items-center gap-5 hover:bg-white/[0.04]">
                  <div className="flex flex-col items-center justify-center w-14 h-14 bg-blue-500/10 rounded-xl border border-blue-500/20 shrink-0">
                     <span className="text-[10px] font-black uppercase text-blue-400 leading-none">
                        {new Date(event.start?.dateTime || event.start?.date).toLocaleDateString('en-US', { month: 'short' })}
                     </span>
                     <span className="text-xl font-black text-white mt-0.5 leading-none">
                        {new Date(event.start?.dateTime || event.start?.date).getDate()}
                     </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{event.summary}</h4>
                    <div className="flex items-center gap-3 mt-1 opacity-50 text-[10px] font-bold uppercase tracking-tighter">
                       <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          {event.start?.dateTime ? new Date(event.start.dateTime).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : (language === 'ar' ? 'طوال اليوم' : 'All Day')}
                       </span>
                       {event.location && (
                         <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            {event.location}
                         </span>
                       )}
                    </div>
                  </div>
                  <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-600 hover:text-blue-400 transition-colors">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer Area */}
        <div className="p-4 border-t border-white/5 bg-black/40 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
            <span>{language === 'ar' ? 'جدول المواعيد' : 'SYNCED CALENDAR'}</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
              {language === 'ar' ? 'متصل بخرائط والتقويم' : 'Verified Google Calendar'}
            </span>
        </div>
      </div>
    </div>
  );
};

export default CalendarBrowserModal;

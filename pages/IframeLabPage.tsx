import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Maximize2, Minimize2, RefreshCw } from 'lucide-react';

interface IframeLabData {
  id: string;
  title: string;
  description: string;
  url: string;
  color: string;
  createdAt: number;
}

const LABS_STORAGE_KEY = 'iframe_labs';

export const getIframeLabs = (): IframeLabData[] => {
  try {
    return JSON.parse(localStorage.getItem(LABS_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

export const saveIframeLab = (lab: Omit<IframeLabData, 'id' | 'createdAt'>) => {
  const labs = getIframeLabs();
  const newLab: IframeLabData = { ...lab, id: crypto.randomUUID(), createdAt: Date.now() };
  localStorage.setItem(LABS_STORAGE_KEY, JSON.stringify([...labs, newLab]));
  return newLab;
};

export const deleteIframeLab = (id: string) => {
  const labs = getIframeLabs().filter(l => l.id !== id);
  localStorage.setItem(LABS_STORAGE_KEY, JSON.stringify(labs));
};

// ─── Full-page iframe renderer ─────────────────────────────────────────────
const IframeLabPage: React.FC = () => {
  const { labId } = useParams<{ labId: string }>();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lab, setLab] = useState<IframeLabData | null>(null);

  useEffect(() => {
    const found = getIframeLabs().find(l => l.id === labId);
    if (found) setLab(found);
    else navigate('/labs');
  }, [labId]);

  const refresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const toggleFullscreen = () => {
    const el = document.getElementById('iframe-wrapper');
    if (!document.fullscreenElement) {
      el?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!lab) return null;

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-black/90 backdrop-blur-xl border-b border-white/5 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/labs')}
            className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-black text-white">{lab.title}</h1>
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">IFRAME LAB</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-white/30 text-xs font-bold uppercase tracking-widest">
              <div className="w-3 h-3 border-2 border-white/10 border-t-white rounded-full animate-spin" />
              جاري التحميل...
            </div>
          )}
          <button onClick={refresh} className="p-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-all" title="إعادة تحميل">
            <RefreshCw className="w-4 h-4" />
          </button>
          <a href={lab.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-all" title="فتح في نافذة جديدة">
            <ExternalLink className="w-4 h-4" />
          </a>
          <button onClick={toggleFullscreen} className="p-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-all" title="تكبير">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* iframe */}
      <div id="iframe-wrapper" className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
              <div className="absolute inset-0 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-white/40 font-bold text-xs uppercase tracking-widest animate-pulse">تحميل المختبر...</p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={lab.url}
          title={lab.title}
          className="w-full h-full border-none"
          style={{ height: 'calc(100vh - 73px)' }}
          onLoad={() => setIsLoading(false)}
          allow="fullscreen; camera; microphone; accelerometer; gyroscope"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
        />
      </div>
    </div>
  );
};

export default IframeLabPage;

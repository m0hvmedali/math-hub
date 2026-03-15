import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface IframeLabData {
  id: string;
  title: string;
  description: string;
  url: string;
  icon?: string;
  color: string;
  createdAt: number;
}

const LABS_STORAGE_KEY = 'iframe_labs';

// Migration helper - move local labs to Supabase if any exist
export const migrateLabsToSupabase = async () => {
  const localLabs = JSON.parse(localStorage.getItem(LABS_STORAGE_KEY) || '[]');
  if (localLabs.length > 0 && supabase) {
    for (const lab of localLabs) {
        await supabase.from('iframe_labs').insert([{
            id: lab.id,
            title: lab.title,
            description: lab.description,
            url: lab.url,
            icon: 'Globe',
            color: lab.color,
            created_at: new Date(lab.createdAt).toISOString()
        }]);
    }
    localStorage.removeItem(LABS_STORAGE_KEY);
  }
};

export const getIframeLabs = async (): Promise<IframeLabData[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('iframe_labs')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching labs:', error);
    return [];
  }
  
  return data.map(d => ({
    id: d.id,
    title: d.title,
    description: d.description,
    url: d.url,
    icon: d.icon,
    color: d.color,
    createdAt: new Date(d.created_at).getTime()
  }));
};

export const saveIframeLab = async (lab: Omit<IframeLabData, 'id' | 'createdAt'>) => {
  if (!supabase) return null;
  const newLab = {
    title: lab.title,
    description: lab.description,
    url: lab.url,
    icon: lab.icon || 'Globe',
    color: lab.color,
    created_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('iframe_labs')
    .insert([newLab])
    .select()
    .single();

  if (error) {
    console.error('Error saving lab:', error);
    throw error;
  }
  
  return data;
};

export const deleteIframeLab = async (id: string) => {
  if (!supabase) return;
  const { error } = await supabase
    .from('iframe_labs')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting lab:', error);
    throw error;
  }
};

// ─── Full-page iframe renderer ─────────────────────────────────────────────
interface IframeLabPageProps {
  manualUrl?: string;
  manualTitle?: string;
}

const IframeLabPage: React.FC<IframeLabPageProps> = ({ manualUrl, manualTitle }) => {
  const { labId } = useParams<{ labId: string }>();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lab, setLab] = useState<IframeLabData | null>(manualUrl ? {
    id: 'manual',
    title: manualTitle || 'Lab',
    description: '',
    url: manualUrl,
    color: 'accent-blue',
    createdAt: Date.now()
  } : null);

  useEffect(() => {
    const loadLab = async () => {
        if (manualUrl) return;
        if (labId === 'study-english') {
          setLab({
            id: 'study-english',
            title: 'Study English with me',
            description: 'Interactive English language learning environment.',
            url: 'https://claude.site/public/artifacts/f3e3bf68-e68d-4ba3-99d3-676a45050812/embed',
            color: 'brand-cyan',
            createdAt: Date.now(),
            icon: 'SparkleIcon'
          });
          return;
        }
        
        if (!supabase) return;
        const { data, error } = await supabase
            .from('iframe_labs')
            .select('*')
            .eq('id', labId)
            .single();

        if (data && !error) {
            setLab({
                id: data.id,
                title: data.title,
                description: data.description,
                url: data.url,
                icon: data.icon,
                color: data.color,
                createdAt: new Date(data.created_at).getTime()
            });
        } else {
            navigate('/labs');
        }
    };
    
    loadLab();
  }, [labId, manualUrl]);

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

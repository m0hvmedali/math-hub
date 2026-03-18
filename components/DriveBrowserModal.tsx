/**
 * DriveBrowserModal - Full Google Drive browser in a modal window
 * Shows files/folders with ability to navigate, open links, and view files.
 */
import React, { useState, useEffect } from 'react';
import { useGoogleOmni } from '../services/platform-sdk';

interface DriveBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DriveBrowserModal: React.FC<DriveBrowserModalProps> = ({ isOpen, onClose }) => {
  const { drive, auth } = useGoogleOmni();
  const [files, setFiles] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{id: string | null, name: string}[]>([{id: null, name: 'My Drive'}]);

  useEffect(() => {
    if (isOpen && auth.getToken()) {
      loadFolder(null);
    }
  }, [isOpen]);

  const loadFolder = async (folderId: string | null) => {
    setIsLoading(true);
    try {
      const res = await drive.listFolder(folderId || 'root');
      setFiles(res.files || []);
      setCurrentFolderId(folderId);
    } catch {
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) { loadFolder(null); return; }
    setIsLoading(true);
    try {
      const res = await drive.search(query);
      setFiles(res.files || []);
    } catch {
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToFolder = (folder: any) => {
    setBreadcrumbs(prev => [...prev, {id: folder.id, name: folder.name}]);
    loadFolder(folder.id);
  };

  const navigateBreadcrumb = (index: number) => {
    const crumb = breadcrumbs[index];
    setBreadcrumbs(prev => prev.slice(0, index + 1));
    loadFolder(crumb.id);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') return '📁';
    if (mimeType?.includes('video')) return '🎬';
    if (mimeType?.includes('image')) return '🖼️';
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return '📊';
    if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) return '📽️';
    if (mimeType?.includes('document') || mimeType?.includes('word')) return '📝';
    return '📄';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="w-full max-w-3xl h-[80vh] bg-[#0d0d0d] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/10 bg-[#111] shrink-0">
          <div className="w-9 h-9 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-yellow-400" fill="currentColor">
              <path d="M7.71 3.5L1.15 15l3.43 6L10.14 9.5L7.71 3.5zm.56 5.5L12 21h7.7l-3.43-6-8-6zM22.85 15L18 6H9.5l3.43 6L22.85 15z"/>
            </svg>
          </div>
          <h2 className="text-white font-bold text-lg flex-1">Google Drive</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Search */}
        <div className="flex gap-2 px-5 py-3 border-b border-white/5 shrink-0">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search Drive..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/20"
          />
          <button onClick={handleSearch} className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 text-sm transition-all">
            Search
          </button>
          <button 
            onClick={() => { setQuery(''); setBreadcrumbs([{id: null, name: 'My Drive'}]); loadFolder(null); }}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 text-sm transition-all"
          >
            Reset
          </button>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 px-5 py-2 text-sm shrink-0 overflow-x-auto">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              <button
                onClick={() => navigateBreadcrumb(i)}
                className={`hover:text-white transition-all truncate max-w-[120px] ${i === breadcrumbs.length - 1 ? 'text-white font-bold' : 'text-gray-500'}`}
              >
                {crumb.name}
              </button>
              {i < breadcrumbs.length - 1 && <span className="text-gray-700 shrink-0">/</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-500">Loading...</div>
          ) : files.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-600">Empty folder</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {files.map(file => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.07] transition-all cursor-pointer group"
                  onClick={() => {
                    if (file.mimeType === 'application/vnd.google-apps.folder') {
                      navigateToFolder(file);
                    } else if (file.webViewLink) {
                      window.open(file.webViewLink, '_blank');
                    }
                  }}
                >
                  <span className="text-2xl shrink-0">{getFileIcon(file.mimeType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{file.name}</p>
                    <p className="text-[11px] text-gray-600 truncate">{file.mimeType?.replace('application/vnd.google-apps.', '').replace('application/', '')}</p>
                  </div>
                  {file.webViewLink && file.mimeType !== 'application/vnd.google-apps.folder' && (
                    <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-300 shrink-0 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriveBrowserModal;

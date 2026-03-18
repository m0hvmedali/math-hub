import React, { useState, useEffect, useRef } from 'react';
import { useGoogleOmni } from '../services/platform-sdk';

// Helper to decode base64url email body
const decodeBase64 = (encoded: string): string => {
  try {
    const fixed = encoded.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(escape(atob(fixed)));
  } catch {
    return encoded;
  }
};

// Extract header value from message payload headers
const getHeader = (headers: any[], name: string): string => {
  return headers?.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
};

// Extract body from message parts recursively
const extractBody = (payload: any): string => {
  if (!payload) return '';
  if (payload.body?.data) return decodeBase64(payload.body.data);
  if (payload.parts) {
    const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html');
    if (htmlPart?.body?.data) return decodeBase64(htmlPart.body.data);
    const textPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
    if (textPart?.body?.data) return decodeBase64(textPart.body.data);
    // Recurse into nested parts
    for (const part of payload.parts) {
      const found = extractBody(part);
      if (found) return found;
    }
  }
  return '';
};

type MailView = 'inbox' | 'compose' | 'thread';

interface GmailPageProps {
  onClose?: () => void;
  asModal?: boolean;
}

const GmailPage: React.FC<GmailPageProps> = ({ onClose, asModal = false }) => {
  const { gmail, auth } = useGoogleOmni();
  const isConnected = !!auth.getToken();

  const [view, setView] = useState<MailView>('inbox');
  const [messages, setMessages] = useState<any[]>([]);
  const [fullMessages, setFullMessages] = useState<Record<string, any>>({});
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState<any>(null);

  // Compose state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<'success' | 'error' | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const loadInbox = async (query = '') => {
    if (!isConnected) return;
    setIsLoading(true);
    try {
      const [profileData, msgData] = await Promise.all([
        gmail.getProfile(),
        gmail.listMessages(query || 'in:inbox', 25)
      ]);
      setProfile(profileData);
      const items = msgData.messages || [];
      // Fetch metadata for each message 
      const detailedMessages = await Promise.all(
        items.slice(0, 20).map(async (msg: any) => {
          try {
            const detail = await gmail.getMessage(msg.id);
            return detail;
          } catch {
            return msg;
          }
        })
      );
      setMessages(detailedMessages);
    } catch (err) {
      console.error('Gmail load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInbox();
  }, [isConnected]);

  const handleOpenThread = async (msg: any) => {
    setSelectedThread(msg);
    setView('thread');
    if (msg.labelIds?.includes('UNREAD')) {
      try { await gmail.markAsRead(msg.id); } catch {}
    }
  };

  const handleSend = async () => {
    if (!composeTo || !composeSubject || !composeBody) return;
    setIsSending(true);
    try {
      await gmail.send(composeTo, composeSubject, composeBody);
      setSendResult('success');
      setComposeTo(''); setComposeSubject(''); setComposeBody('');
      setTimeout(() => { setSendResult(null); setView('inbox'); }, 2000);
    } catch {
      setSendResult('error');
      setTimeout(() => setSendResult(null), 3000);
    } finally {
      setIsSending(false);
    }
  };

  const handleTrash = async (msgId: string) => {
    try {
      await gmail.trash(msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
      if (view === 'thread') setView('inbox');
    } catch (err) {
      console.error('Trash error:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
        <svg className="w-16 h-16 opacity-30" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/></svg>
        <p className="text-lg">Connect Google to view Gmail</p>
      </div>
    );
  }

  const containerClass = asModal
    ? 'flex flex-col h-full bg-[#0d0d0d] overflow-hidden'
    : 'flex flex-col min-h-screen bg-[#0d0d0d]';

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-white/10 bg-[#111] shrink-0">
        <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-400" fill="currentColor">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
          </svg>
        </div>
        <div className="flex-1">
          <h1 className="text-white font-bold text-lg">Gmail</h1>
          {profile && <p className="text-gray-500 text-xs">{profile.emailAddress}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setView('compose'); }}
            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            Compose
          </button>
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      {view === 'inbox' && (
        <div className="px-6 py-3 border-b border-white/5">
          <div className="flex gap-2">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadInbox(searchQuery)}
              placeholder="Search mail..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-white/20"
            />
            <button
              onClick={() => loadInbox(searchQuery)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 transition-all text-sm"
            >
              Search
            </button>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {/* ── INBOX VIEW ── */}
        {view === 'inbox' && (
          <div>
            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-gray-500">Loading inbox...</div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-gray-500">No messages</div>
            ) : (
              <div className="divide-y divide-white/5">
                {messages.map(msg => {
                  const headers = msg.payload?.headers || [];
                  const from = getHeader(headers, 'From');
                  const subject = getHeader(headers, 'Subject');
                  const date = getHeader(headers, 'Date');
                  const isUnread = msg.labelIds?.includes('UNREAD');
                  const snippet = msg.snippet || '';

                  return (
                    <div
                      key={msg.id}
                      onClick={() => handleOpenThread(msg)}
                      className={`px-6 py-4 cursor-pointer transition-all hover:bg-white/5 ${isUnread ? 'bg-white/[0.03]' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isUnread ? 'bg-blue-400' : 'bg-transparent'}`}/>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className={`text-sm truncate ${isUnread ? 'text-white font-bold' : 'text-gray-300 font-medium'}`}>
                              {from.replace(/<.*>/, '').trim() || from}
                            </p>
                            <span className="text-[11px] text-gray-600 shrink-0">
                              {new Date(date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className={`text-sm truncate ${isUnread ? 'text-gray-200' : 'text-gray-400'}`}>{subject}</p>
                          <p className="text-xs text-gray-600 truncate mt-0.5">{snippet}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── THREAD VIEW ── */}
        {view === 'thread' && selectedThread && (() => {
          const headers = selectedThread.payload?.headers || [];
          const from = getHeader(headers, 'From');
          const subject = getHeader(headers, 'Subject');
          const date = getHeader(headers, 'Date');
          const body = extractBody(selectedThread.payload);

          return (
            <div className="p-6">
              <button onClick={() => setView('inbox')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                Back to Inbox
              </button>
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/10">
                  <h2 className="text-white font-bold text-lg mb-2">{subject}</h2>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400"><span className="text-gray-300 font-medium">{from}</span></p>
                    <span className="text-xs text-gray-600">{new Date(date).toLocaleString('ar-EG')}</span>
                  </div>
                </div>
                <div className="p-5">
                  {body.includes('<') ? (
                    <iframe
                      srcDoc={body}
                      className="w-full min-h-[400px] bg-white rounded-xl border-0"
                      title="email-body"
                      sandbox="allow-same-origin"
                    />
                  ) : (
                    <pre className="text-gray-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">{body}</pre>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setComposeTo(from); setComposeSubject(`Re: ${subject}`); setView('compose'); }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-sm font-bold hover:bg-blue-500/20 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                  Reply
                </button>
                <button
                  onClick={() => handleTrash(selectedThread.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  Trash
                </button>
              </div>
            </div>
          );
        })()}

        {/* ── COMPOSE VIEW ── */}
        {view === 'compose' && (
          <div className="p-6 max-w-2xl mx-auto">
            <button onClick={() => setView('inbox')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Cancel
            </button>
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 pt-5 pb-3 border-b border-white/10">
                <h2 className="text-white font-bold text-lg">New Message</h2>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">To</label>
                  <input
                    value={composeTo}
                    onChange={e => setComposeTo(e.target.value)}
                    placeholder="recipient@email.com"
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-white/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Subject</label>
                  <input
                    value={composeSubject}
                    onChange={e => setComposeSubject(e.target.value)}
                    placeholder="Subject..."
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-white/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Message</label>
                  <textarea
                    value={composeBody}
                    onChange={e => setComposeBody(e.target.value)}
                    placeholder="Write your message here..."
                    rows={10}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/20 resize-none"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSend}
                    disabled={isSending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                  >
                    {isSending ? 'Sending...' : 'Send'}
                  </button>
                  {sendResult === 'success' && <span className="text-green-400 text-sm font-bold">✓ Sent!</span>}
                  {sendResult === 'error' && <span className="text-red-400 text-sm font-bold">✗ Failed to send</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GmailPage;

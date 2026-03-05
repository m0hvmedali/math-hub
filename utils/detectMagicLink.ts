import { ContentType } from '../types';

export interface MagicLinkResult {
    type: ContentType;
    content: string;
    title: string;
    icon: string;
    color: string;
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
    'video': { icon: '🎬', color: '#f472b6', label: 'Video' },
    'google-docs': { icon: '📄', color: '#4285F4', label: 'Google Docs' },
    'google-slides': { icon: '📊', color: '#F4B400', label: 'Google Slides' },
    'google-sites': { icon: '🌐', color: '#0F9D58', label: 'Google Sites' },
    'google-drive': { icon: '☁️', color: '#34A853', label: 'Google Drive' },
    'pdf': { icon: '📄', color: '#fb923c', label: 'PDF' },
    'image': { icon: '🖼️', color: '#34d399', label: 'Image' },
    'audio': { icon: '🎧', color: '#a78bfa', label: 'Audio' },
    'embed': { icon: '🧩', color: '#94a3b8', label: 'Embed' },
};

export const detectMagicLink = (url: string): MagicLinkResult | null => {
    if (!url || !url.startsWith('http')) return null;

    const lowerUrl = url.toLowerCase();

    // YouTube / Video
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
        return { type: 'video', content: url, title: 'YouTube Video', ...TYPE_CONFIG['video'] };
    }

    // Google Docs
    if (url.includes('docs.google.com/document/d/')) {
        return { type: 'google-docs', content: url, title: 'Google Document', ...TYPE_CONFIG['google-docs'] };
    }

    // Google Slides
    if (url.includes('docs.google.com/presentation/d/')) {
        return { type: 'google-slides', content: url, title: 'Google Slides', ...TYPE_CONFIG['google-slides'] };
    }

    // Google Sites
    if (url.includes('sites.google.com/')) {
        return { type: 'google-sites', content: url, title: 'Google Site', ...TYPE_CONFIG['google-sites'] };
    }

    // Google Drive
    if (url.includes('drive.google.com/file/d/')) {
        return { type: 'google-drive', content: url, title: 'Google Drive File', ...TYPE_CONFIG['google-drive'] };
    }

    // Canva
    if (url.includes('canva.com/')) {
        return { type: 'google-slides', content: url, title: 'Canva Design', ...TYPE_CONFIG['google-slides'] };
    }

    // Miro
    if (url.includes('miro.com/')) {
        return { type: 'google-sites', content: url, title: 'Miro Board', ...TYPE_CONFIG['google-sites'] };
    }

    // PDF
    if (lowerUrl.endsWith('.pdf')) {
        return { type: 'pdf', content: url, title: 'PDF Document', ...TYPE_CONFIG['pdf'] };
    }

    // Images
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
        return { type: 'image', content: url, title: 'Image', ...TYPE_CONFIG['image'] };
    }

    // Audio
    if (lowerUrl.match(/\.(mp3|wav|ogg|aac)$/)) {
        return { type: 'audio', content: url, title: 'Audio', ...TYPE_CONFIG['audio'] };
    }

    // Default to Embed - Handle any valid URL
    try {
        const domain = new URL(url).hostname.replace('www.', '');
        return {
            type: 'link',
            content: url,
            title: domain.charAt(0).toUpperCase() + domain.slice(1),
            ...TYPE_CONFIG['embed']
        };
    } catch {
        return { type: 'link', content: url, title: 'External Resource', ...TYPE_CONFIG['embed'] };
    }
};

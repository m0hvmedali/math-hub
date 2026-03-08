import React, { useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { ContentBlock, ContentType } from '../types';
import { MarkdownIcon, ImageIcon, AudioIcon, VideoIcon, PdfIcon, LinkIcon, XIcon, WhiteboardIcon, NotebookLMIcon, FlashcardIcon, SparkleIcon, CheckCircleIcon, CodeIcon } from './Icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../supabaseClient';
import { getAiResponse } from '../utils/aiHelper';
import { detectMagicLink, MagicLinkResult } from '../utils/detectMagicLink';
import RichTextEditor from './RichTextEditor';
import WhiteboardBlock from './WhiteboardBlock';


interface ContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (contentBlock: Omit<ContentBlock, 'id'> | Omit<ContentBlock, 'id'>[]) => void;
}

const getGoogleDriveEmbedUrl = (url: string): string | null => {
    // Standardize Drive Links to Viewer Mode
    const fileRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
    const fileMatch = url.match(fileRegex);
    if (fileMatch && fileMatch[1]) {
        return `https://docs.google.com/viewer?srcid=${fileMatch[1]}&embedded=true`;
    }
    const docsRegex = /docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/;
    const docsMatch = url.match(docsRegex);
    if (docsMatch && docsMatch[1] && docsMatch[2]) {
        return `https://docs.google.com/viewer?srcid=${docsMatch[2]}&embedded=true`;
    }
    return null;
};

const getYoutubeEmbedUrl = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

const ContentModal: React.FC<ContentModalProps> = ({ isOpen, onClose, onSave }) => {
    const { language } = useContext(AppContext);
    const navigate = useNavigate();
    const [contentType, setContentType] = useState<ContentType | 'magic'>('magic');
    const [magicLinkResult, setMagicLinkResult] = useState<MagicLinkResult | null>(null);
    const [markdown, setMarkdown] = useState('');
    const [whiteboardText, setWhiteboardText] = useState('');
    const [notebooklmText, setNotebooklmText] = useState('');
    const [richTextData, setRichTextData] = useState('');

    // Flashcard State
    const [flashcardFront, setFlashcardFront] = useState('');
    const [flashcardBack, setFlashcardBack] = useState('');

    // Shared styling state
    const [selectedColor, setSelectedColor] = useState('bg-cinematic-card');
    const [customColorHex, setCustomColorHex] = useState('');
    const [resourceTitle, setResourceTitle] = useState('');

    // HTML Code State
    const [htmlCode, setHtmlCode] = useState('');
    const [cssCode, setCssCode] = useState('');
    const [jsCode, setJsCode] = useState('');

    // Quiz State
    const [quizQuestion, setQuizQuestion] = useState('');
    const [quizOptions, setQuizOptions] = useState(['', '', '', '']);
    const [quizCorrect, setQuizCorrect] = useState(0);
    const [quizImageFile, setQuizImageFile] = useState<File | null>(null);

    // CSV State
    const [isCsvMode, setIsCsvMode] = useState(false);
    const [csvText, setCsvText] = useState('');

    // Carousel State
    const [carouselTitle, setCarouselTitle] = useState('');
    const [carouselImages, setCarouselImages] = useState<string[]>([]);
    const [isUploadingMultiple, setIsUploadingMultiple] = useState(false);

    const [linkUrl, setLinkUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const quizImageInputRef = useRef<HTMLInputElement>(null);
    const multiImageInputRef = useRef<HTMLInputElement>(null);

    const bgColors = [
        { name: 'Default', class: 'bg-cinematic-card' },
        { name: 'Electric Blue', class: 'bg-blue-600' },
        { name: 'Bright Green', class: 'bg-green-500' },
        { name: 'Hot Pink', class: 'bg-pink-500' },
        { name: 'Vivid Purple', class: 'bg-purple-500' },
        { name: 'Vibrant Orange', class: 'bg-orange-500' },
        { name: 'Neon Yellow', class: 'bg-yellow-400' },
        { name: 'Teal Glow', class: 'bg-teal-500' },
    ];

    if (!isOpen) return null;

    const handleSummarize = async () => {
        const textToSummarize = contentType === 'markdown' ? markdown : whiteboardText;
        if (!textToSummarize.trim()) {
            alert("Please enter some text to summarize.");
            return;
        }
        setIsSummarizing(true);
        try {
            const response = await getAiResponse(
                `Summarize the following text clearly for a student: ${textToSummarize}`,
                null,
                null,
                { systemContext: "You are a helpful educational assistant." }
            );
            const finalVal = response.raw || response.structured?.simplified_explanation || JSON.stringify(response);
            if (contentType === 'markdown') {
                setMarkdown(finalVal);
            } else if (contentType === 'whiteboard') {
                setWhiteboardText(finalVal);
            }
        } catch (error) {
            console.error("Error summarizing text:", error);
        } finally {
            setIsSummarizing(false);
        }
    };

    useEffect(() => {
        if (contentType === 'magic' && linkUrl.trim()) {
            const detected = detectMagicLink(linkUrl.trim());
            setMagicLinkResult(detected);
        } else {
            setMagicLinkResult(null);
        }
    }, [linkUrl, contentType]);

    // Sync from fullscreen whiteboard if coming back
    useEffect(() => {
        if (isOpen && contentType === 'whiteboard') {
            const savedTitle = localStorage.getItem('temp_whiteboard_title');
            const savedData = localStorage.getItem('temp_whiteboard_data');
            if (savedTitle) setResourceTitle(savedTitle);
            if (savedData) setWhiteboardText(savedData);
        }
    }, [contentType, isOpen]);

    const handleSave = async () => {
        const finalColor = customColorHex || (selectedColor !== 'bg-cinematic-card' ? selectedColor : undefined);
        const fileName = resourceTitle.trim() || undefined;

        if (contentType === 'magic' && magicLinkResult) {
            onSave({
                type: magicLinkResult.type,
                content: magicLinkResult.content,
                url: magicLinkResult.content,
                fileName: resourceTitle.trim() || magicLinkResult.title,
                color: magicLinkResult.color
            });
        } else if (contentType === 'markdown') {
            if (markdown.trim()) onSave({ type: 'markdown', content: markdown, color: selectedColor, customColor: customColorHex || undefined, fileName });
        } else if (contentType === 'whiteboard') {
            onSave({ type: 'whiteboard', content: 'Canvas Whiteboard', whiteboardData: whiteboardText, title: resourceTitle.trim() || undefined, fileName: resourceTitle.trim() || undefined });
            localStorage.removeItem('temp_whiteboard_title');
            localStorage.removeItem('temp_whiteboard_data');
        } else if (contentType === 'rich-text') {
            onSave({ type: 'rich-text', content: 'Native Document', richTextData: richTextData, title: resourceTitle.trim() || undefined, fileName: resourceTitle.trim() || undefined });
        } else if (contentType === 'notebooklm') {
            if (notebooklmText.trim()) onSave({ type: 'notebooklm', content: notebooklmText, fileName });
        } else if (contentType === 'flashcard') {
            if (isCsvMode) {
                if (!csvText.trim()) {
                    alert("Please enter CSV content.");
                    return;
                }
                const lines = csvText.trim().split('\n');
                const newCards: Omit<ContentBlock, 'id'>[] = [];

                lines.forEach(line => {
                    const parts = line.split(',');
                    if (parts.length >= 2) {
                        const front = parts[0].trim();
                        const back = parts.slice(1).join(',').trim();

                        // Select a random color for each card for the cinematic look
                        const randomColor = bgColors[Math.floor(Math.random() * (bgColors.length - 1)) + 1].class;

                        newCards.push({
                            type: 'flashcard',
                            front,
                            back,
                            content: '',
                            color: randomColor,
                            fileName: 'Imported Flashcard'
                        });
                    }
                });

                if (newCards.length > 0) {
                    onSave(newCards);
                } else {
                    alert("No valid flashcards found in CSV. Use Format: Question,Answer");
                    return;
                }
            } else {
                if (flashcardFront.trim() && flashcardBack.trim()) {
                    onSave({
                        type: 'flashcard',
                        front: flashcardFront,
                        back: flashcardBack,
                        content: '',
                        color: selectedColor,
                        customColor: customColorHex || undefined,
                        fileName: resourceTitle.trim() || 'Flashcard'
                    });
                }
            }
        } else if (contentType === 'carousel') {
            if (carouselImages.length > 0) {
                onSave({
                    type: 'carousel',
                    content: '',
                    images: carouselImages,
                    title: resourceTitle.trim() || carouselTitle || 'Mission Gallery',
                    fileName: resourceTitle.trim() || carouselTitle || 'Image Carousel'
                });
            } else {
                alert("Please upload at least one image for the carousel.");
                return;
            }
        } else if (contentType === 'link') {
            if (linkUrl.trim()) {
                onSave({ type: 'link', content: linkUrl, url: linkUrl, fileName: resourceTitle.trim() || 'Direct Link' });
            } else {
                alert('Please enter a valid URL.');
                return;
            }
        } else if (contentType === 'podcast') {
            const embedUrl = getGoogleDriveEmbedUrl(linkUrl);
            if (embedUrl) {
                onSave({ type: 'podcast', content: embedUrl, fileName: resourceTitle.trim() || 'Podcast Audio' });
            } else {
                alert('Invalid Google Drive URL for podcast.');
                return;
            }
        } else if (contentType === 'html-code') {
            if (htmlCode.trim()) {
                onSave({
                    type: 'html-code',
                    content: htmlCode,
                    htmlContent: htmlCode,
                    cssContent: cssCode,
                    jsContent: jsCode,
                    fileName: resourceTitle.trim() || 'Custom Code'
                });
            } else {
                alert('Please enter some HTML code.');
                return;
            }

        } else if (contentType === 'raw-html') {
            if (htmlCode.trim()) {
                onSave({
                    type: 'raw-html',
                    content: htmlCode,
                    fileName: resourceTitle.trim() || 'Genius Runner Code'
                });
            } else {
                alert('Please enter some code.');
                return;
            }
        } else if (contentType === 'google-docs' || contentType === 'google-slides' || contentType === 'google-sites') {
            if (linkUrl.trim()) {
                const labels: Record<string, string> = { 'google-docs': 'Google Document', 'google-slides': 'Google Slides', 'google-sites': 'Google Site' };
                onSave({ type: contentType, content: linkUrl, fileName: resourceTitle.trim() || labels[contentType] || contentType });
            } else {
                alert('Please enter a valid Google URL.');
                return;
            }
        } else if (contentType === 'google-drive') {
            const embedUrl = getGoogleDriveEmbedUrl(linkUrl);
            if (embedUrl) {
                onSave({ type: 'google-drive', content: embedUrl, fileName: resourceTitle.trim() || 'Google Drive File' });
            } else {
                alert("Invalid Google Drive URL.");
                return;
            }
        } else if (contentType === 'video') {
            // Check if it's YouTube
            const ytEmbed = getYoutubeEmbedUrl(linkUrl);
            if (ytEmbed) {
                onSave({ type: 'video', content: ytEmbed, fileName: resourceTitle.trim() || 'YouTube Video' });
            } else {
                if (file) {
                    await uploadAndSaveFile();
                    return;
                }
                alert("Please enter a valid YouTube URL or upload a video file.");
                return;
            }
        } else if (contentType === 'quiz') {
            let imageUrl = '';
            if (quizImageFile) {
                const filePath = `public/${Date.now()}_quiz_${quizImageFile.name}`;
                const { error } = await supabase!.storage.from('lesson_files').upload(filePath, quizImageFile);
                if (!error) {
                    const { data } = supabase!.storage.from('lesson_files').getPublicUrl(filePath);
                    imageUrl = data.publicUrl;
                }
            }

            onSave({
                type: 'quiz',
                content: imageUrl, // Content holds the image URL for quiz type
                question: quizQuestion,
                options: quizOptions,
                correctAnswer: quizCorrect,
                fileName: resourceTitle.trim() || 'Quiz Question'
            });

        } else { // File types (Image, Audio, PDF)
            await uploadAndSaveFile();
            return;
        }
        resetAndClose();
    };

    const uploadAndSaveFile = async () => {
        if (file) {
            const filePath = `public/${Date.now()}_${file.name}`;
            const { error } = await supabase!.storage.from('lesson_files').upload(filePath, file);
            if (error) {
                console.error('Error uploading file:', error);
                alert('Failed to upload file.');
                return;
            }
            const { data } = supabase!.storage.from('lesson_files').getPublicUrl(filePath);
            onSave({ type: contentType as ContentType, content: data.publicUrl, fileName: resourceTitle.trim() || file.name });
            resetAndClose();
        }
    }

    const resetAndClose = () => {
        setMarkdown('');
        setWhiteboardText('');
        setNotebooklmText('');
        setFlashcardFront('');
        setFlashcardBack('');
        setIsCsvMode(false);
        setCsvText('');
        setCarouselImages([]);
        setCarouselTitle('');
        setResourceTitle('');
        setQuizQuestion('');
        setQuizOptions(['', '', '', '']);
        setQuizCorrect(0);
        setQuizImageFile(null);
        setLinkUrl('');
        setFile(null);
        setSelectedColor('bg-cinematic-card');
        localStorage.removeItem('temp_whiteboard_title');
        localStorage.removeItem('temp_whiteboard_data');
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (multiImageInputRef.current) multiImageInputRef.current.value = '';
        onClose();
    };


    const fileAcceptMap: any = {
        image: 'image/*',
        audio: 'audio/*',
        video: 'video/*',
        pdf: 'application/pdf',
    };

    const renderColorPicker = () => (
        <div className="space-y-4 mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
            <label className="text-xs font-black text-white uppercase tracking-widest flex items-center justify-between">
                Card Appearance
                <span className="text-accent-blue text-[10px] bg-accent-blue/10 px-2 py-0.5 rounded-full">Pro Customization</span>
            </label>

            <div className="flex flex-wrap gap-3">
                {/* Transparent/Default Option */}
                <button
                    onClick={() => { setSelectedColor('bg-cinematic-card'); setCustomColorHex(''); }}
                    className={`h-10 px-4 rounded-xl border-2 transition-all font-bold text-xs flex items-center gap-2 ${selectedColor === 'bg-cinematic-card' && !customColorHex ? 'border-white bg-white text-black' : 'border-white/20 text-gray-400 hover:border-white/50'}`}
                >
                    <div className="w-4 h-4 rounded-full border border-gray-500 bg-cinematic-card"></div>
                    Default
                </button>

                {/* Preset Colors */}
                {bgColors.filter(c => c.name !== 'Default').map((c) => (
                    <button
                        key={c.name}
                        onClick={() => { setSelectedColor(c.class); setCustomColorHex(''); }}
                        className={`w-10 h-10 rounded-xl border-2 transition-all shadow-lg ${c.class} ${selectedColor === c.class && !customColorHex ? 'border-white scale-110 shadow-white/30' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'}`}
                        title={c.name}
                    />
                ))}
            </div>

            {/* Free Custom Color Input */}
            <div className="flex items-center gap-4 bg-black/20 p-3 rounded-xl border border-white/5">
                <div className="relative group">
                    <input
                        type="color"
                        value={customColorHex || '#1e293b'}
                        onChange={(e) => { setCustomColorHex(e.target.value); setSelectedColor('bg-cinematic-card'); }}
                        className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0 opacity-0 absolute inset-0 z-10"
                    />
                    <div className="w-12 h-12 rounded-lg border-2 border-white/20 group-hover:border-white/50 transition-all flex items-center justify-center" style={{ backgroundColor: customColorHex || '#1e293b' }}>
                        <SparkleIcon className="w-5 h-5 text-white mix-blend-difference" />
                    </div>
                </div>
                <div className="flex-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Custom Hex Color</label>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-mono text-sm">#</span>
                        <input
                            type="text"
                            value={customColorHex.replace('#', '')}
                            onChange={(e) => { setCustomColorHex(`#${e.target.value}`); setSelectedColor('bg-cinematic-card'); }}
                            placeholder="FFFFFF"
                            className="bg-transparent border-b border-white/10 text-white font-mono text-sm focus:outline-none focus:border-accent-blue w-24"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderContentInput = () => {
        switch (contentType) {
            case 'magic':
                return (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 animate-fade-in">
                        <div className="text-center space-y-4 max-w-lg">
                            <div className="relative inline-block">
                                <div className="absolute -inset-4 bg-brand-purple/20 rounded-full blur-2xl animate-pulse" />
                                <div className="relative w-20 h-20 bg-gradient-to-br from-brand-purple/20 to-brand-cyan/20 rounded-3xl flex items-center justify-center text-4xl shadow-glow-brand border border-white/10">
                                    {magicLinkResult?.icon || '✨'}
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight">Magic Embed</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Paste any link (Google Docs, Slides, YouTube, PDF, etc.) and we'll automatically frame it perfectly for your lesson.
                            </p>
                        </div>

                        <div className="w-full max-w-xl relative group">
                            <input
                                autoFocus
                                type="url"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="Paste your link here..."
                                className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-5 text-white text-lg focus:outline-none focus:border-brand-purple/50 transition-all placeholder:text-gray-700 shadow-2xl"
                                dir="ltr"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                {linkUrl && (
                                    <button onClick={() => setLinkUrl('')} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
                                        <XIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {magicLinkResult && (
                            <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-6 animate-scale-in">
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: magicLinkResult.color + '20', border: `1px solid ${magicLinkResult.color}40` }}>
                                    {magicLinkResult.icon}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1" style={{ color: magicLinkResult.color }}>Detected Type</p>
                                    <p className="text-white font-bold">{magicLinkResult.title}</p>
                                </div>
                                <div className="text-brand-cyan animate-pulse">
                                    <CheckCircleIcon className="w-6 h-6" />
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'markdown':
                return (
                    <div className="h-[60vh] flex flex-col">
                        {renderColorPicker()}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                            <div className="relative h-full">
                                <textarea
                                    value={markdown}
                                    onChange={(e) => setMarkdown(e.target.value)}
                                    placeholder="Write your notes in Markdown..."
                                    className={`w-full h-full p-3 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-white transition-colors ${selectedColor}`}
                                />
                                <button onClick={handleSummarize} disabled={isSummarizing} className="absolute bottom-3 right-3 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 disabled:bg-gray-500 flex items-center">
                                    <SparkleIcon className={`w-5 h-5 ${isSummarizing ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                            <div className={`prose prose-invert p-3 rounded-md overflow-y-auto border border-gray-700 transition-colors ${selectedColor}`}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown || "Preview..."}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                );
            case 'flashcard':
                return (
                    <div className="h-[60vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4 bg-white/5 p-3 rounded-xl border border-white/10">
                            <span className="text-sm font-bold text-gray-300">Manual Entry</span>
                            <button
                                onClick={() => setIsCsvMode(!isCsvMode)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-tighter transition-all ${isCsvMode ? 'bg-accent-blue text-white' : 'bg-gray-800 text-gray-500'}`}
                            >
                                {isCsvMode ? 'Switch to Manual' : 'CSV Bulk Import'}
                            </button>
                        </div>

                        {isCsvMode ? (
                            <div className="space-y-4">
                                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 text-blue-200 text-sm">
                                    <span className="text-xl">📊</span>
                                    <p>Paste your CSV data here. Format: <b>Question, Answer</b> (one per line). Each card will get a random cinematic color.</p>
                                </div>
                                <textarea
                                    value={csvText}
                                    onChange={(e) => setCsvText(e.target.value)}
                                    placeholder="Derivative of sin(x), cos(x)&#10;Capital of France, Paris&#10;..."
                                    className="w-full h-[40vh] bg-gray-900 border border-gray-700 rounded-xl p-4 text-white font-mono text-sm focus:border-accent-blue outline-none"
                                />
                            </div>
                        ) : (
                            <>
                                {renderColorPicker()}
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2">Front (Question/Term)</label>
                                        <textarea
                                            value={flashcardFront}
                                            onChange={(e) => setFlashcardFront(e.target.value)}
                                            placeholder="e.g. What is the derivative of sin(x)?"
                                            className={`w-full h-32 p-3 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-pink resize-none text-white ${selectedColor}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2">Back (Answer/Definition)</label>
                                        <textarea
                                            value={flashcardBack}
                                            onChange={(e) => setFlashcardBack(e.target.value)}
                                            placeholder="e.g. cos(x)"
                                            className={`w-full h-32 p-3 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-green resize-none text-white ${selectedColor}`}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                );
            case 'carousel':
                return (
                    <div className="h-[60vh] flex flex-col gap-6 p-4 overflow-y-auto">
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">Gallery Title</label>
                            <input
                                type="text"
                                value={carouselTitle}
                                onChange={(e) => setCarouselTitle(e.target.value)}
                                placeholder="e.g. Operational Intel / Biology Diagrams"
                                className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold focus:border-accent-blue outline-none"
                            />
                        </div>

                        <div className="flex-1 flex flex-col gap-4">
                            <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest">Mission Photos</label>

                            <div
                                onClick={() => multiImageInputRef.current?.click()}
                                className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-all cursor-pointer ${isUploadingMultiple ? 'border-accent-blue bg-accent-blue/5' : 'border-gray-700 hover:border-accent-blue hover:bg-white/5'}`}
                            >
                                <input
                                    type="file"
                                    ref={multiImageInputRef}
                                    multiple
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const files = Array.from(e.target.files || []) as File[];
                                        if (files.length === 0) return;

                                        setIsUploadingMultiple(true);
                                        const uploadedUrls: string[] = [];

                                        for (const f of files) {
                                            const filePath = `public/${Date.now()}_carousel_${f.name}`;
                                            const { error } = await supabase!.storage.from('lesson_files').upload(filePath, f);
                                            if (!error) {
                                                const { data } = supabase!.storage.from('lesson_files').getPublicUrl(filePath);
                                                uploadedUrls.push(data.publicUrl);
                                            }
                                        }

                                        setCarouselImages(prev => [...prev, ...uploadedUrls]);
                                        setIsUploadingMultiple(false);
                                    }}
                                    className="hidden"
                                />

                                {isUploadingMultiple ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-accent-blue font-bold animate-pulse">Uploading Intel...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <ImageIcon className="w-12 h-12 text-gray-600" />
                                        <span className="text-gray-400 font-medium">Click to upload multiple images</span>
                                        <span className="text-xs text-gray-600">Shift-click or drag & drop files</span>
                                    </div>
                                )}
                            </div>

                            {carouselImages.length > 0 && (
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 p-3 bg-black/40 rounded-2xl border border-white/5">
                                    {carouselImages.map((src, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group/img">
                                            <img src={src} className="w-full h-full object-cover" />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCarouselImages(prev => prev.filter((_, i) => i !== idx));
                                                }}
                                                className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity font-bold"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'quiz':
                return (
                    <div className="h-[60vh] overflow-y-auto pr-2">
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-accent-green cursor-pointer" onClick={() => quizImageInputRef.current?.click()}>
                                <input type="file" ref={quizImageInputRef} accept="image/*" className="hidden" onChange={(e) => setQuizImageFile(e.target.files?.[0] || null)} />
                                {quizImageFile ? (
                                    <p className="text-accent-green font-bold">{quizImageFile.name}</p>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <ImageIcon className="w-8 h-8 text-gray-500" />
                                        <span className="text-gray-400">Upload Question Image (Optional)</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Question Text</label>
                                <textarea
                                    value={quizQuestion}
                                    onChange={(e) => setQuizQuestion(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-accent-green outline-none"
                                    rows={3}
                                    placeholder="Enter the question here..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-gray-400 text-sm mb-1">Options (Select the correct one)</label>
                                {quizOptions.map((opt, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <button
                                            onClick={() => setQuizCorrect(idx)}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${quizCorrect === idx ? 'bg-accent-green border-accent-green text-black' : 'border-gray-600 text-gray-400 hover:border-white'}`}
                                        >
                                            {['A', 'B', 'C', 'D'][idx]}
                                        </button>
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => {
                                                const newOpts = [...quizOptions];
                                                newOpts[idx] = e.target.value;
                                                setQuizOptions(newOpts);
                                            }}
                                            className={`flex-1 bg-gray-800 border rounded-lg p-2 text-white outline-none ${quizCorrect === idx ? 'border-accent-green' : 'border-gray-700'}`}
                                            placeholder={`Option ${idx + 1}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'google-drive':
                return (
                    <div className="h-[60vh] flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                        <LinkIcon className="w-12 h-12 text-gray-500 mb-4" />
                        <label className="text-lg font-medium text-gray-300 mb-4">Embed from Google Drive</label>
                        <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="Paste Google Drive Share Link..."
                            className="w-full max-w-lg p-3 bg-gray-800 border border-gray-700 rounded-md text-white"
                        />
                        <p className="text-xs text-gray-500 mt-2">Works with Docs, Slides, Sheets, and Files.</p>
                    </div>
                );
            case 'google-docs':
            case 'google-slides':
            case 'google-sites': {
                const docsMeta: Record<string, { label: string; icon: string; placeholder: string; color: string }> = {
                    'google-docs': { label: 'Google Docs', icon: '📄', placeholder: 'Paste Google Docs link...', color: '#4285F4' },
                    'google-slides': { label: 'Google Slides', icon: '📊', placeholder: 'Paste Google Slides link (Publish to web)...', color: '#F4B400' },
                    'google-sites': { label: 'Google Sites', icon: '🌐', placeholder: 'Paste Google Sites URL...', color: '#0F9D58' },
                };
                const meta = docsMeta[contentType];
                return (
                    <div className="h-[60vh] flex flex-col items-center justify-center gap-6 p-8">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: meta.color + '20', border: `1px solid ${meta.color}40` }}>
                            {meta.icon}
                        </div>
                        <div className="text-center">
                            <h3 className="text-white font-bold text-lg mb-1">{meta.label}</h3>
                            <p className="text-gray-400 text-sm max-w-sm">
                                سيتم عرض المحتوى مدمجاً بالكامل داخل الدرس وكأنه جزء من الموقع.
                            </p>
                        </div>
                        <input
                            type="url"
                            value={linkUrl}
                            onChange={e => setLinkUrl(e.target.value)}
                            placeholder={meta.placeholder}
                            className="w-full max-w-lg p-4 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none font-mono"
                            style={{ borderColor: linkUrl ? meta.color : undefined }}
                        />
                    </div>
                );
            }
            case 'video':
                return (
                    <div className="h-[60vh] flex flex-col gap-6 p-4">
                        <div className="border-b border-gray-700 pb-6">
                            <label className="block text-lg font-medium text-gray-300 mb-2">YouTube Link</label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="Paste YouTube URL..."
                                    className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-md text-white"
                                />
                            </div>
                        </div>
                        <div className="text-center text-gray-500 font-bold">- OR -</div>
                        <div className="flex-1 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center p-4">
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="video/*"
                                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                className="hidden"
                            />
                            <button onClick={() => fileInputRef.current?.click()} className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 mb-2">
                                Upload Video File
                            </button>
                            {file && <p className="text-accent-green">{file.name}</p>}
                        </div>
                    </div>
                );
            case 'link':
                return (
                    <div className="h-[60vh] flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                        <LinkIcon className="w-12 h-12 text-gray-500 mb-4" />
                        <label className="text-lg font-medium text-gray-300 mb-4">Direct Link</label>
                        <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full max-w-lg p-3 bg-gray-800 border border-gray-700 rounded-md text-white"
                        />
                        <p className="text-xs text-gray-500 mt-2">Enter any URL to create a clickable link card</p>
                    </div>
                );
            case 'podcast':
                return (
                    <div className="h-[60vh] flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                        <AudioIcon className="w-12 h-12 text-gray-500 mb-4" />
                        <label className="text-lg font-medium text-gray-300 mb-4">Podcast from Google Drive</label>
                        <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="Paste Google Drive audio file share link..."
                            className="w-full max-w-lg p-3 bg-gray-800 border border-gray-700 rounded-md text-white"
                        />
                        <p className="text-xs text-gray-500 mt-2">Audio will be displayed with a custom player</p>
                    </div>
                );
            case 'html-code':
                return (
                    <div className="h-[60vh] overflow-y-auto space-y-4 p-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">HTML Code</label>
                            <textarea
                                value={htmlCode}
                                onChange={(e) => setHtmlCode(e.target.value)}
                                placeholder="<div>Hello World</div>"
                                className="w-full h-32 p-3 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-accent-blue outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">CSS (Optional)</label>
                            <textarea
                                value={cssCode}
                                onChange={(e) => setCssCode(e.target.value)}
                                placeholder="body { color: white; }"
                                className="w-full h-32 p-3 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-accent-blue outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">JavaScript (Optional)</label>
                            <textarea
                                value={jsCode}
                                onChange={(e) => setJsCode(e.target.value)}
                                placeholder="console.log('Hello');"
                                className="w-full h-32 p-3 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-accent-blue outline-none"
                            />
                        </div>
                        <p className="text-xs text-gray-400 text-center">Code will run in an isolated Shadow DOM</p>
                    </div>
                );
            case 'raw-html':
                return (
                    <div className="h-[60vh] overflow-y-auto space-y-4 p-4">
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex gap-3 text-yellow-200 text-sm">
                            <span className="text-xl">⚡</span>
                            <p>Paste your full code (HTML + CSS + JS) here. It will run in an isolated Genius Runner container.</p>
                        </div>
                        <textarea
                            value={htmlCode}
                            onChange={(e) => setHtmlCode(e.target.value)}
                            placeholder="<!DOCTYPE html><html>...</html>"
                            className="w-full h-[50vh] bg-cinematic-bg border border-cinematic-border rounded-xl p-4 text-white font-mono text-sm focus:border-accent-green outline-none shadow-inner"
                        />
                    </div>
                );
            case 'image':
            case 'audio':
            case 'pdf':
                return (
                    <div className="h-[60vh] flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-8">
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept={fileAcceptMap[contentType]}
                            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                            className="hidden"
                        />
                        <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                            Choose File
                        </button>
                        {file && <p className="mt-4 text-accent-green">{file.name}</p>}
                    </div>
                );
            case 'whiteboard':
                return (
                    <div className="flex flex-col items-center justify-center p-20 text-center gap-6">
                        <div className="w-24 h-24 bg-brand-cyan/20 rounded-full flex items-center justify-center text-5xl animate-pulse">✏️</div>
                        <h3 className="text-2xl font-bold text-white tracking-widest uppercase">{language === 'ar' ? 'السبورة الذكية' : 'Smart Whiteboard'}</h3>
                        <p className="text-gray-400 max-w-sm">
                            {language === 'ar' ? 'افتح السبورة في وضع ملء الشاشة للبدء في الرسم والشرح بوضوح.' : 'Open the whiteboard in fullscreen mode to start sketching and explaining clearly.'}
                        </p>
                        <button
                            onClick={() => {
                                // Store current session data in localStorage so the page can pick it up
                                localStorage.setItem('temp_whiteboard_title', resourceTitle || 'New Whiteboard');
                                localStorage.setItem('temp_whiteboard_data', whiteboardText || '');
                                navigate('/whiteboard/temp/new');
                            }}
                            className="bg-brand-cyan text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-glow-brand"
                        >
                            {language === 'ar' ? 'فتح في وضع ملء الشاشة 🚀' : 'Open Fullscreen 🚀'}
                        </button>
                    </div>
                );
            case 'rich-text':
                return (
                    <div className="h-[60vh] flex flex-col gap-4">
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <RichTextEditor
                                placeholder="Create your Google Docs style lesson here..."
                                onSave={(html) => setRichTextData(html)}
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const contentTypeOptions = [
        { type: 'magic' as const, icon: '✨', label: 'Magic' },
        { type: 'markdown' as ContentType, icon: <MarkdownIcon className="w-5 h-5" />, label: 'Note' },
        { type: 'flashcard' as ContentType, icon: <FlashcardIcon className="w-5 h-5" />, label: 'Flashcard' },
        { type: 'carousel' as ContentType, icon: '🎞️', label: 'Carousel' },
        { type: 'quiz' as ContentType, icon: <CheckCircleIcon className="w-5 h-5" />, label: 'Quiz' },
        { type: 'html-code' as ContentType, icon: '💻', label: 'Custom Code' },
        { type: 'raw-html' as ContentType, icon: '🚀', label: 'Genius Runner' },
        { type: 'link' as ContentType, icon: <LinkIcon className="w-5 h-5" />, label: 'Link' },
        { type: 'google-docs' as ContentType, icon: '📄', label: 'Docs' },
        { type: 'google-slides' as ContentType, icon: '📊', label: 'Slides' },
        { type: 'google-sites' as ContentType, icon: '🌐', label: 'Sites' },
        { type: 'google-drive' as ContentType, icon: '☁️', label: 'Drive' },
        { type: 'podcast' as ContentType, icon: <AudioIcon className="w-5 h-5" />, label: 'Podcast' },
        { type: 'video' as ContentType, icon: <VideoIcon className="w-5 h-5" />, label: 'Video' },
        { type: 'image' as ContentType, icon: <ImageIcon className="w-5 h-5" />, label: 'Image' },
        { type: 'pdf' as ContentType, icon: <PdfIcon className="w-5 h-5" />, label: 'PDF' },
        { type: 'whiteboard' as ContentType, icon: <WhiteboardIcon className="w-5 h-5" />, label: 'Draw' },
        { type: 'rich-text' as ContentType, icon: <MarkdownIcon className="w-5 h-5" />, label: 'Document' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-cinematic-card border border-cinematic-border rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-brand-dark to-transparent">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Architect Terminal</h2>
                        <p className="text-[10px] text-brand-cyan font-bold uppercase tracking-widest">Deploying Knowledge Assets</p>
                    </div>
                    <button onClick={resetAndClose} className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Sidebar - Asset Types */}
                    <div className="w-full md:w-64 bg-black/40 border-r border-white/5 overflow-y-auto p-4 flex md:flex-col gap-2 custom-scrollbar">
                        {contentTypeOptions.map((opt) => (
                            <button
                                key={opt.type}
                                onClick={() => setContentType(opt.type)}
                                className={`flex items-center gap-3 p-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-left truncate min-w-[120px] md:min-w-0 ${contentType === opt.type ? 'bg-brand-cyan text-black shadow-glow-brand' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}
                            >
                                <span className="text-lg">{opt.icon}</span>
                                <span className="hidden md:inline">{opt.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Main Editor Area */}
                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-black/20">
                        {/* Global Resource Title Input */}
                        <div className="mb-8 group">
                            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 px-1 group-focus-within:text-brand-cyan transition-colors">
                                Resource Title (Optional)
                            </label>
                            <input
                                type="text"
                                value={resourceTitle}
                                onChange={(e) => setResourceTitle(e.target.value)}
                                placeholder="Enter a descriptive name for this asset..."
                                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-bold focus:border-brand-cyan focus:bg-white/10 outline-none transition-all placeholder:text-gray-700"
                            />
                        </div>

                        {renderContentInput()}
                    </div>
                </div>

                <div className="px-8 py-6 border-t border-white/10 flex justify-between items-center bg-black/40">
                    <button onClick={resetAndClose} className="px-6 py-2 text-gray-500 font-bold uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-10 py-3 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                        Deploy Asset
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContentModal;
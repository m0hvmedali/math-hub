import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import './RichTextEditor.css';

interface RichTextEditorProps {
    initialValue?: string;
    onSave?: (html: string) => void;
    readOnly?: boolean;
    placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    const addImage = () => {
        const url = window.prompt('URL');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    return (
        <div className="sticky top-4 z-20 px-4 mb-2 pointer-events-none">
            <div className="flex flex-wrap items-center gap-1 p-1.5 bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto inline-flex">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    className={`p-2 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all ${editor.isActive('bold') ? 'bg-brand-purple text-white shadow-glow-brand' : 'text-gray-400'}`}
                    title="Bold"
                >
                    <b className="text-sm">B</b>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    className={`p-2 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all ${editor.isActive('italic') ? 'bg-brand-purple text-white shadow-glow-brand' : 'text-gray-400'}`}
                    title="Italic"
                >
                    <i className="text-sm italic">I</i>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`p-2 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all ${editor.isActive('underline') ? 'bg-brand-purple text-white shadow-glow-brand' : 'text-gray-400'}`}
                    title="Underline"
                >
                    <u className="text-sm">U</u>
                </button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={`p-2 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all ${editor.isActive({ textAlign: 'left' }) ? 'bg-brand-purple text-white shadow-glow-brand' : 'text-gray-400'}`}
                    title="Align Left"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" /></svg>
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={`p-2 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all ${editor.isActive({ textAlign: 'center' }) ? 'bg-brand-purple text-white shadow-glow-brand' : 'text-gray-400'}`}
                    title="Align Center"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" /></svg>
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className={`p-2 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all ${editor.isActive({ textAlign: 'right' }) ? 'bg-brand-purple text-white shadow-glow-brand' : 'text-gray-400'}`}
                    title="Align Right"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" /></svg>
                </button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all ${editor.isActive('bulletList') ? 'bg-brand-purple text-white shadow-glow-brand' : 'text-gray-400'}`}
                    title="Bullet List"
                >
                    <span className="text-xl">•</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all ${editor.isActive('orderedList') ? 'bg-brand-purple text-white shadow-glow-brand' : 'text-gray-400'}`}
                    title="Ordered List"
                >
                    <span className="text-sm font-bold">1.</span>
                </button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-2 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all ${editor.isActive('heading', { level: 1 }) ? 'bg-brand-purple text-white shadow-glow-brand' : 'text-gray-400'}`}
                    title="Heading 1"
                >
                    <span className="text-xs font-black uppercase">H1</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all ${editor.isActive('heading', { level: 2 }) ? 'bg-brand-purple text-white shadow-glow-brand' : 'text-gray-400'}`}
                    title="Heading 2"
                >
                    <span className="text-xs font-black uppercase">H2</span>
                </button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button
                    onClick={() => {
                        const url = window.prompt('URL');
                        if (url) editor.chain().focus().setLink({ href: url }).run();
                    }}
                    className={`p-2 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all ${editor.isActive('link') ? 'bg-brand-purple text-white shadow-glow-brand' : 'text-gray-400'}`}
                    title="Link"
                >
                    <span className="text-lg">🔗</span>
                </button>
                <button
                    onClick={addImage}
                    className="p-2 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-gray-400 transition-all"
                    title="Image"
                >
                    <span className="text-lg">🖼️</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHighlight().run()}
                    className={`p-2 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all ${editor.isActive('highlight') ? 'bg-brand-purple text-white shadow-glow-brand' : 'text-gray-400'}`}
                    title="Highlight"
                >
                    <span className="text-lg">🖍️</span>
                </button>
            </div>
        </div>
    );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialValue, onSave, readOnly, placeholder }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Highlight,
            Link.configure({ openOnClick: false }),
            Image,
            Placeholder.configure({ placeholder: placeholder || 'Start writing your lesson...' }),
        ],
        content: initialValue || '',
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            // We can emit the HTML or JSON. HTML is better for simple display.
            if (onSave) onSave(editor.getHTML());
        },
    });

    const handleManualSave = useCallback(() => {
        if (editor && onSave) {
            onSave(editor.getHTML());
        }
    }, [editor, onSave]);

    if (!editor) return null;

    return (
        <div className="rich-text-editor-container bg-cinematic-card border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            {!readOnly && <MenuBar editor={editor} />}
            <div className="p-8 min-h-[400px]">
                <EditorContent editor={editor} />
            </div>
            {!readOnly && onSave && (
                <div className="px-8 py-4 bg-black/20 border-t border-white/5 flex justify-end">
                    <button
                        onClick={handleManualSave}
                        className="bg-brand-purple hover:bg-brand-purple/80 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-glow-brand"
                    >
                        💾 Save Document
                    </button>
                </div>
            )}
        </div>
    );
};

export default RichTextEditor;

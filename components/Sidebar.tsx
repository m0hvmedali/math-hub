import React from 'react';
import { XIcon } from './Icons';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, title, children }) => {
    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-[var(--overlay-bg)] backdrop-blur-sm z-[60] transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Content */}
            <div className={`
                fixed top-0 right-0 h-full w-full max-w-md glass-card shadow-2xl z-[70] 
                transform transition-all duration-500 ease-out flex flex-col !rounded-none !rounded-l-3xl
                ${isOpen ? 'translate-x-0 opacity-100 visible' : 'translate-x-full opacity-0 invisible pointer-events-none'}
            `}>
                <header className="p-6 border-b border-[var(--glass-border)] flex items-center justify-between">
                    <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--glass-bg)] rounded-full transition-colors">
                        <XIcon className="w-6 h-6 text-[var(--text-muted)]" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </>
    );
};

export default Sidebar;

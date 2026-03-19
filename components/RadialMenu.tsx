import React, { useState } from 'react';
import { PlusIcon, BookOpenIcon, SparkleIcon, TargetIcon } from './Icons';

interface RadialMenuProps {
    onAddSubject: () => void;
    onAddBranch: () => void;
    onAddLesson: () => void;
}

const RadialMenu: React.FC<RadialMenuProps> = ({ onAddSubject, onAddBranch, onAddLesson }) => {
    const [isOpen, setIsOpen] = useState(false);

    const items = [
        { icon: SparkleIcon, label: 'Subject', color: 'bg-accent-blue', action: onAddSubject, angle: -90 },
        { icon: TargetIcon, label: 'Branch', color: 'bg-accent-cyan', action: onAddBranch, angle: -135 },
        { icon: BookOpenIcon, label: 'Lesson', color: 'bg-accent-green', action: onAddLesson, angle: -180 },
    ];

    return (
        <div className="fixed bottom-32 right-8 z-50">
            {/* Backdrop for closing */}
            {isOpen && <div className="fixed inset-0" onClick={() => setIsOpen(false)}></div>}

            <div className="relative">
                {/* Menu Items */}
                {items.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            item.action();
                            setIsOpen(false);
                        }}
                        className={`absolute w-14 h-14 rounded-full ${item.color} text-white shadow-lg flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 group overflow-visible`}
                        style={{
                            transform: isOpen
                                ? `translate(${Math.cos(item.angle * Math.PI / 180) * 100}px, ${Math.sin(item.angle * Math.PI / 180) * 100}px)`
                                : 'translate(0, 0)',
                            opacity: isOpen ? 1 : 0,
                            pointerEvents: isOpen ? 'auto' : 'none'
                        }}
                    >
                        <item.icon className="w-6 h-6" />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.label}
                        </span>
                    </button>
                ))}

                {/* Main Toggle Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`relative w-16 h-16 rounded-full bg-accent-blue text-white shadow-[0_0_20px_rgba(58,123,213,0.4)] flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 z-10 ${isOpen ? 'rotate-45' : ''}`}
                >
                    <PlusIcon className="w-8 h-8" />

                    {/* Glowing Ring */}
                    <div className="absolute inset-0 rounded-full border border-accent-blue animate-ping opacity-20"></div>
                </button>
            </div>
        </div>
    );
};

export default RadialMenu;

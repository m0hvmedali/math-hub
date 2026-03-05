import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BeakerIcon, ActivityIcon, CpuIcon, SparkleIcon } from '../components/Icons';
import { ArrowLeft } from 'lucide-react';

const LabCard: React.FC<{
    title: string;
    description: string;
    icon: any;
    path: string;
    color: string;
    status?: 'active' | 'beta' | 'coming-soon';
}> = ({ title, description, icon: Icon, path, color, status = 'active' }) => {
    const navigate = useNavigate();
    const isComingSoon = status === 'coming-soon';

    return (
        <div
            onClick={() => !isComingSoon && navigate(path)}
            className={`group relative glass-card p-8 cursor-pointer transition-all duration-500 hover:scale-[1.03] ${isComingSoon ? 'opacity-60 grayscale' : 'hover:!border-' + color + '/50 shadow-glass-hover'}`}
        >
            <div className={`absolute -top-4 -right-4 px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${status === 'active' ? 'bg-brand-cyan text-white border-brand-cyan/30' :
                status === 'beta' ? 'bg-brand-magenta text-white border-brand-magenta/30' :
                    'bg-gray-500 text-white border-gray-400/30'
                }`}>
                {status}
            </div>

            <div className="flex flex-col gap-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-${color}/20 to-transparent border border-${color}/30 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className={`w-8 h-8 text-${color}`} />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2 tracking-tight group-hover:text-brand-cyan transition-colors lowercase">
                        {title}
                    </h3>
                    <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>

            {!isComingSoon && (
                <div className="mt-8 flex items-center text-xs font-black tracking-widest text-brand-cyan opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 group-hover:transition-all">
                    ENTER ENGINE <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </div>
            )}
        </div>
    );
};

const LabsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen p-6 md:p-12 animate-fade-in max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-brand-cyan/10 rounded-lg">
                            <BeakerIcon className="w-6 h-6 text-brand-cyan" />
                        </div>
                        <span className="text-xs font-black tracking-[0.2em] text-brand-cyan uppercase">Research & Development</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-[var(--text-primary)] tracking-tight">
                        Experimental <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-magenta">Labs</span>
                    </h1>
                </div>
                <p className="text-[var(--text-secondary)] font-medium max-w-md text-lg">
                    A collection of high-performance mathematical engines and simulation environments.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <LabCard
                    title="Function Lab"
                    description="Advanced symbolic math engine with support for limits, derivatives, integrals, and real-time physical simulation."
                    icon={ActivityIcon}
                    path="/labs/function"
                    color="brand-cyan"
                    status="active"
                />

                <LabCard
                    title="تحضير الالكانات"
                    description="Interactive organic chemistry lab for synthesizing, naming (IUPAC), and visualizing 3D structures of alkanes."
                    icon={BeakerIcon}
                    path="/labs/alkanes"
                    color="accent-green"
                    status="active"
                />

                <LabCard
                    title="Matrix Engine"
                    description="Linear algebra playground for vector spaces, transformation matrices, and eigen-decomposition visualization."
                    icon={CpuIcon}
                    path="/labs/matrix"
                    color="brand-magenta"
                    status="coming-soon"
                />

                <LabCard
                    title="Geometry Core"
                    description="Non-Euclidean geometry exploration and 3D topological surfaces with raytracing support."
                    icon={SparkleIcon}
                    path="/labs/geometry"
                    color="accent-green"
                    status="coming-soon"
                />
            </div>

            <div className="mt-20 p-8 glass-card border-brand-cyan/20 bg-brand-cyan/5 overflow-hidden relative group">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]"></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                    <h2 className="text-3xl font-black text-[var(--text-primary)] mb-4">Have an idea for a new lab?</h2>
                    <p className="text-[var(--text-secondary)] mb-8 max-w-xl">Our wisdom engine is always looking for new ways to visualize the complexities of the universe.</p>
                    <button className="btn-power px-8 py-3 rounded-xl font-bold">Request Feature</button>
                </div>
            </div>
        </div>
    );
};

export default LabsPage;

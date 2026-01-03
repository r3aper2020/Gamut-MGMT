import React from 'react';
import { type ClaimData } from '@/types/jobs';
import { BrainCircuit, Ruler, Activity } from 'lucide-react';
import { USDZViewer } from './components/USDZViewer';

interface JobSiteModelTabProps {
    data?: ClaimData;
}

export const JobSiteModelTab: React.FC<JobSiteModelTabProps> = ({ data }) => {
    // Visualization State
    const [visualTab, setVisualTab] = React.useState<'3D' | 'SKETCH'>('3D');
    const sketchUrl = data?.preScan?.sketchUrl;
    const model3dUrl = data?.preScan?.model3dUrl;
    const measurements = data?.preScan?.measurements || [];

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-in slide-in-from-bottom-4 fade-in duration-500">

            {/* LEFT PANEL: SITE VISUALIZATION (Major Focus) */}
            <div className="xl:col-span-8 glass p-1 rounded-2xl border border-white/5 relative group overflow-hidden h-[700px] flex flex-col shadow-2xl">
                <div className="flex-1 relative bg-[#151515] rounded-t-xl overflow-hidden">

                    {/* 3D MODEL VIEW */}
                    {visualTab === '3D' && (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center animate-in fade-in zoom-in duration-500 bg-black">
                            {model3dUrl ? (
                                <div className="w-full h-full relative group">
                                    <USDZViewer url={model3dUrl} />
                                    {/* Overlay Hint */}
                                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 pointer-events-none">
                                        <div className="flex items-center gap-2 text-xs font-bold text-white">
                                            <BrainCircuit size={14} className="text-accent-electric" />
                                            Interactive 3D Model
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-text-muted">
                                    <Activity size={48} className="mb-2 opacity-20" />
                                    <span>No 3D Model Data Available</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SKETCH VIEW */}
                    {visualTab === 'SKETCH' && (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center animate-in fade-in zoom-in duration-500 bg-white/5">
                            {sketchUrl ? (
                                <img
                                    src={sketchUrl}
                                    alt="Property Sketch"
                                    className="w-full h-full object-contain"
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <div className="flex flex-col items-center text-text-muted">
                                    <Activity size={48} className="mb-2 opacity-20" />
                                    <span>No Sketch Available</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Toolbar */}
                <div className="h-16 bg-[#0a0a0a] border-t border-white/5 flex items-center px-6 gap-6 justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent-electric/10 rounded-lg text-accent-electric">
                            <BrainCircuit size={20} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white uppercase tracking-wide">Site Visualization</div>
                            <div className="text-[10px] text-text-muted font-mono">Interactive Analysis View</div>
                        </div>
                    </div>

                    <div className="flex bg-white/5 rounded-lg p-1.5 gap-2 border border-white/5">
                        {[
                            { id: '3D', label: '3D Scan', icon: BrainCircuit },
                            { id: 'SKETCH', label: 'Floor Plan', icon: Ruler }
                        ].map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setVisualTab(mode.id as '3D' | 'SKETCH')}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all uppercase tracking-wider
                                    ${visualTab === mode.id
                                        ? 'bg-accent-electric text-black shadow-[0_0_15px_rgba(0,242,255,0.3)]'
                                        : 'text-text-muted hover:bg-white/5 hover:text-white'}
                                `}
                            >
                                <mode.icon size={14} />
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: MEASUREMENTS */}
            <div className="xl:col-span-4 flex flex-col gap-6 h-[700px]">
                {/* 3. Measurements (List View) */}
                <div className="glass flex-1 rounded-2xl border border-white/5 flex flex-col min-h-0">
                    <div className="p-5 pb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <Ruler size={16} />
                            <h3 className="text-xs font-black uppercase tracking-widest">Measurements</h3>
                        </div>
                        <div className="text-[10px] font-mono text-accent-primary">{measurements.length} Zones</div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {measurements.length > 0 ? (
                            measurements.map((m, idx) => (
                                <div key={idx} className="bg-white/5 p-3 rounded-lg border border-white/5 flex justify-between items-center hover:bg-white/10 transition-colors group">
                                    <div>
                                        <div className="font-bold text-white text-sm">{m.room}</div>
                                        <div className="text-[10px] text-text-muted mt-0.5">
                                            H: {m.height} <span className="mx-1 text-white/10">|</span> P: {m.perimeter}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-accent-electric font-mono font-bold text-sm tracking-tight">{m.area}</div>
                                        <div className="text-[9px] text-text-muted uppercase">Area</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-text-muted gap-2 opacity-50">
                                <Ruler size={24} />
                                <span className="text-xs italic">No measurements</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

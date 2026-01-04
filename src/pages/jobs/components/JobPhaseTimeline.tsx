import React from 'react';
import { CheckCircle2, Briefcase, BrainCircuit, Ruler, Users } from 'lucide-react';


export type TabType = 'OVERVIEW' | 'INTELLIGENCE' | 'MODEL' | 'SCOPE' | 'PHOTOS' | 'DOCS';

interface JobPhaseTimelineProps {
    effectivePhases: any[];
    activePhaseId: string | null;
    setActivePhaseId: (id: string) => void;
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    activePhase?: any;
}

export const JobPhaseTimeline: React.FC<JobPhaseTimelineProps> = ({
    effectivePhases,
    activePhaseId,
    setActivePhaseId,
    activeTab,
    setActiveTab,
    activePhase
}) => {
    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-1">

            {/* Phase Timeline Refined */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide -mx-6 px-6 lg:mx-0 lg:px-0">
                {effectivePhases.map((phase: any) => {
                    const isActive = (activePhaseId || activePhase?.id) === phase.id;
                    const isCompleted = phase.status === 'COMPLETED';

                    return (
                        <button
                            key={phase.id}
                            onClick={() => setActivePhaseId(phase.id)}
                            className={`
                                group relative flex flex-col items-start min-w-[120px] px-4 py-2 rounded-lg transition-all border
                                ${isActive
                                    ? 'bg-white/5 border-accent-electric/50 shadow-[0_0_20px_rgba(0,242,255,0.1)]'
                                    : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10 text-text-muted'}
                            `}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                {isCompleted ? (
                                    <CheckCircle2 size={14} className="text-green-500" />
                                ) : (
                                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-accent-electric animate-pulse' : 'bg-white/20'}`}></div>
                                )}
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-accent-electric' : 'text-text-muted'}`}>
                                    {phase.status}
                                </span>
                            </div>
                            <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-text-muted group-hover:text-white'}`}>
                                {phase.name}
                            </span>

                            {/* Active Indicator Line */}
                            {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-electric shadow-[0_0_10px_#00f2ff]"></div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content Tabs */}
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5 self-start">
                {[
                    { id: 'OVERVIEW', label: 'Overview', icon: Briefcase },
                    { id: 'INTELLIGENCE', label: 'Intelligence', icon: BrainCircuit },
                    { id: 'MODEL', label: '3D Model', icon: BrainCircuit },
                    { id: 'SCOPE', label: 'Scope', icon: Ruler },
                    { id: 'PHOTOS', label: 'Photos', icon: Users },
                ].map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`
                                px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all
                                ${isActive
                                    ? 'bg-accent-electric text-black shadow-lg shadow-accent-electric/20'
                                    : 'text-text-muted hover:text-white hover:bg-white/5'}
                            `}
                        >
                            <tab.icon size={14} />
                            <span className="hidden md:inline">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

        </div>
    );
};

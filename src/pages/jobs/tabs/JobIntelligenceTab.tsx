import React, { useState } from 'react';
import { type ClaimData } from '@/types/jobs';
import {
    Eye,
    Hammer,
    Droplets,
    AlertTriangle,
    CheckCircle2,
    Activity,
    ShieldAlert,
    Search,
    Wind
} from 'lucide-react';
import { FindingDetailModal, type SmartFinding } from '../modals/FindingDetailModal';

// Map stored icon names to components
const ICON_MAP: Record<string, any> = {
    'Droplets': Droplets,
    'AlertTriangle': AlertTriangle,
    'Hammer': Hammer,
    'Wind': Wind
};

interface JobIntelligenceTabProps {
    data?: ClaimData;
    departmentType?: 'MITIGATION' | 'RECONSTRUCTION' | 'GENERAL';
}

export const JobIntelligenceTab: React.FC<JobIntelligenceTabProps> = ({ data, departmentType = 'GENERAL' }) => {

    const [selectedFinding, setSelectedFinding] = useState<SmartFinding | null>(null);

    // Parse Findings from Data (or use empty array)
    const rawFindings = (data as any)?.findings || [];

    // Transform raw findings to include actual Icon components
    const processedFindings: SmartFinding[] = rawFindings.map((f: any) => ({
        ...f,
        icon: ICON_MAP[f.iconName] || AlertTriangle, // Default to Alert
        relatedPhotos: f.photos, // Pass full enriched photo objects
        relatedLineItems: f.lineItems
    }));

    const mitigationNotes = processedFindings.filter(f => f.phase === 'Mitigation');
    const restorationNotes = processedFindings.filter(f => f.phase === 'Restoration');

    // Dynamic Field Analysis
    const fieldAnalysis = {
        summary: (data?.aiAnalysis?.summary) || "No AI analysis available.",
        confidence: data?.aiAnalysis?.confidence || 0
    };

    // Dynamic Classification
    const classification = data?.classification || {
        category: 0,
        categoryDescription: "Unknown",
        class: 0,
        classDescription: "Unknown",
        riskLevel: "Unknown"
    };

    // Logic to determine active view
    const showMitigation = departmentType === 'MITIGATION' || departmentType === 'GENERAL';
    const showRestoration = departmentType === 'RECONSTRUCTION' || departmentType === 'GENERAL';

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">

            {/* HER0 CARD: FIELD EXECUTIVE SUMMARY */}
            <div className="bg-[#111] rounded-3xl p-8 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Activity size={150} className="text-accent-electric" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-accent-electric/10 flex items-center justify-center border border-accent-electric/20 text-accent-electric">
                                <Eye size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Field Analysis Summary</h2>
                                <div className="text-xs text-accent-electric font-mono flex items-center gap-2">
                                    <span className="flex w-2 h-2 rounded-full bg-accent-electric animate-pulse"></span>
                                    AI ANALYSIS COMPLETE
                                </div>
                            </div>
                        </div>
                        <p className="text-lg text-text-secondary leading-relaxed max-w-3xl">
                            {fieldAnalysis.summary}
                        </p>

                        {/* APPLIED STANDARDS */}
                        {(data?.aiAnalysis?.referencedStandards && data.aiAnalysis.referencedStandards.length > 0) && (
                            <div className="mt-6 pt-6 border-t border-white/5">
                                <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Applied Standards & Citations</h4>
                                <div className="flex flex-wrap gap-2">
                                    {data.aiAnalysis.referencedStandards.map((std: any, i: number) => (
                                        <div key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-text-secondary flex items-center gap-2 hover:bg-white/10 transition-colors cursor-help" title={std.description}>
                                            <span className="text-accent-electric font-bold">{std.code}</span>
                                            <span className="w-px h-3 bg-white/10"></span>
                                            <span className="truncate max-w-[200px]">{std.description}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 min-w-[200px]">
                        <div className="text-text-muted text-xs font-bold uppercase tracking-widest mb-2">Confidence</div>
                        <div className="flex items-end gap-2 mb-1">
                            <div className="text-4xl font-black text-white">{fieldAnalysis.confidence}%</div>
                            <div className="text-sm text-green-500 font-medium mb-1.5 flex items-center gap-1">
                                <CheckCircle2 size={14} /> Verified
                            </div>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-accent-electric w-[94%]"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ROW 2: LOSS CLASSIFICATION (Category & Class) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#111] rounded-2xl p-6 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <div className="text-text-muted text-xs font-bold uppercase tracking-widest mb-1">IICRC Category</div>
                            <div className="text-2xl font-black text-white">Category {classification.category}</div>
                            <div className="text-xs text-red-400 font-bold">{classification.categoryDescription}</div>
                        </div>
                    </div>
                    <div className="h-full w-px bg-white/5 mx-4 hidden md:block" />
                </div>

                <div className="bg-[#111] rounded-2xl p-6 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                            <Droplets size={24} />
                        </div>
                        <div>
                            <div className="text-text-muted text-xs font-bold uppercase tracking-widest mb-1">IICRC Class</div>
                            <div className="text-2xl font-black text-white">Class {classification.class}</div>
                            <div className="text-xs text-blue-400 font-bold">{classification.classDescription}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ROW 3: SPLIT FINDINGS (Conditional) */}
            <div className={`grid gap-6 ${departmentType === 'GENERAL' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>

                {/* COL 1: MITIGATION FINDINGS (Stop Loss) */}
                {(showMitigation) && (
                    <div className={`bg-[#111] rounded-3xl border border-white/5 overflow-hidden flex flex-col h-full ${!showRestoration ? 'border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)]' : ''}`}>
                        <div className="p-6 border-b border-white/5 bg-blue-500/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                    <Droplets size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Mitigation Findings</h3>
                                    <p className="text-xs text-blue-300/60 font-medium uppercase tracking-wider">Stop The Loss</p>
                                </div>
                                {!showRestoration && <span className="ml-auto text-[10px] bg-blue-500 text-white px-2 py-1 rounded font-bold uppercase">Primary Focus</span>}
                            </div>
                        </div>

                        <div className="p-6 space-y-4 flex-1">
                            {mitigationNotes.length === 0 ? (
                                <div className="text-center py-10 text-text-muted text-sm italic">No mitigation findings recorded.</div>
                            ) : (
                                mitigationNotes.map((note) => (
                                    <div
                                        key={note.id}
                                        onClick={() => setSelectedFinding(note)}
                                        className="group cursor-pointer flex gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Search size={14} className="text-blue-400" />
                                        </div>
                                        <div className="mt-1">
                                            <div className={`w-8 h-8 rounded-full ${note.bg} border ${note.border} flex items-center justify-center`}>
                                                <note.icon size={14} className={note.color} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-white text-sm leading-relaxed mb-2 group-hover:text-blue-200 transition-colors">{note.text}</div>
                                            <div className="flex items-center gap-2 text-[10px] text-text-muted font-mono uppercase">
                                                <span>{note.time}</span>
                                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                                <span className="text-white/60">{note.user}</span>
                                                {note.relatedLineItems && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-white/20" />
                                                        <span className="text-blue-400 flex items-center gap-1">
                                                            <CheckCircle2 size={10} /> {note.relatedLineItems.length} Items
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* COL 2: RESTORATION NOTES (Put Back) */}
                {(showRestoration) && (
                    <div className={`bg-[#111] rounded-3xl border border-white/5 overflow-hidden flex flex-col h-full ${!showMitigation ? 'border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : ''}`}>
                        <div className="p-6 border-b border-white/5 bg-green-500/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                                    <Hammer size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Restoration Scope Notes</h3>
                                    <p className="text-xs text-green-300/60 font-medium uppercase tracking-wider">Put It Back</p>
                                </div>
                                {!showMitigation && <span className="ml-auto text-[10px] bg-green-500 text-white px-2 py-1 rounded font-bold uppercase">Primary Focus</span>}
                            </div>
                        </div>

                        <div className="p-6 space-y-4 flex-1">
                            {restorationNotes.length === 0 ? (
                                <div className="text-center py-10 text-text-muted text-sm italic">No restoration notes recorded.</div>
                            ) : (
                                restorationNotes.map((note) => (
                                    <div
                                        key={note.id}
                                        onClick={() => setSelectedFinding(note)}
                                        className="group cursor-pointer flex gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-green-500/50 hover:bg-green-500/5 transition-all relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Search size={14} className="text-green-400" />
                                        </div>
                                        <div className="mt-1">
                                            <div className={`w-8 h-8 rounded-full ${note.bg} border ${note.border} flex items-center justify-center`}>
                                                <note.icon size={14} className={note.color} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-white text-sm leading-relaxed mb-2 group-hover:text-green-200 transition-colors">{note.text}</div>
                                            <div className="flex items-center gap-2 text-[10px] text-text-muted font-mono uppercase">
                                                <span>{note.time}</span>
                                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                                <span className="text-white/60">{note.user}</span>
                                                {note.relatedLineItems && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-white/20" />
                                                        <span className="text-green-400 flex items-center gap-1">
                                                            <CheckCircle2 size={10} /> {note.relatedLineItems.length} Items
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                        </div>
                    </div>
                )}

            </div>

            {/* DETAIL MODAL */}
            {selectedFinding && (
                <FindingDetailModal
                    finding={selectedFinding}
                    onClose={() => setSelectedFinding(null)}
                />
            )}

        </div>
    );
};

import React from 'react';
import { type Job, type ClaimData } from '@/types/jobs';
import { MapPin, Activity, Droplets, Flame, Wind, Zap, AlertTriangle, Info, Briefcase, Calendar, Clock, ShieldCheck, Users } from 'lucide-react';

interface JobOverviewTabProps {
    job: Job;
    data?: ClaimData;
    leadTech?: { displayName: string };
    supervisor?: { displayName: string };
}

// Helper to determine Loss Type Icon & Color
const getLossTypeConfig = (lossType: string = '') => {
    const type = lossType.toLowerCase();
    if (type.includes('water')) return { icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Water Damage' };
    if (type.includes('fire') || type.includes('smoke')) return { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'Fire Loss' };
    if (type.includes('mold') || type.includes('micro')) return { icon: AlertTriangle, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Microbial' };
    if (type.includes('storm') || type.includes('wind')) return { icon: Wind, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', label: 'Storm Damage' };
    return { icon: Zap, color: 'text-accent-electric', bg: 'bg-accent-electric/10', border: 'border-accent-electric/20', label: lossType || 'General Loss' };
};

export const JobOverviewTab: React.FC<JobOverviewTabProps> = ({ job, data, leadTech, supervisor }) => {
    // Data Extraction
    const lossConfig = getLossTypeConfig(job.details.lossCategory || (job.details as any)['type'] || 'General');
    const LossIcon = lossConfig.icon;
    const actions = data?.aiAnalysis?.recommendedActions?.slice(0, 3) || [];

    // Days Open Calculation
    let daysOpen = 0;
    if (job.dates?.fnolReceivedDate) {
        const fnol = new Date(job.dates.fnolReceivedDate.seconds * 1000);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - fnol.getTime());
        daysOpen = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 animate-in slide-in-from-bottom-4 fade-in duration-500">

            {/* LEFT COLUMN: VISUALS & STATUS (40% - 2 cols on xl) */}
            <div className="xl:col-span-2 flex flex-col gap-6">

                {/* 1. Map Card */}
                <div className="glass p-1 rounded-2xl border border-white/5 flex flex-col relative group aspect-square overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-[#151515] rounded-xl z-0">
                        {/* Mock Map Tiles */}
                        <div className="absolute inset-0 opacity-30"
                            style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '15px 15px' }}>
                        </div>
                        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-100,100 Q200,400 600,100" fill="none" stroke="white" strokeWidth="4" />
                        </svg>
                    </div>
                    {/* Central Pin */}
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <div className="relative">
                            <MapPin size={48} className="text-accent-primary drop-shadow-[0_4px_15px_rgba(0,0,0,0.5)] fill-black/50" />
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-black/50 blur-sm rounded-full"></div>
                        </div>
                    </div>
                    {/* Address Banner */}
                    <div className="absolute bottom-4 left-4 right-4 z-20">
                        <div className="bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-lg">
                            <h2 className="text-lg font-black text-white leading-tight">{job.property.address}</h2>
                            <div className="text-text-muted font-medium mt-1 text-xs uppercase">
                                {job.property.city}, {job.property.state} {job.property.zip}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Loss Tech Specs */}
                <div className={`glass p-5 rounded-2xl border ${lossConfig.border} flex items-center gap-4 relative overflow-hidden`}>
                    <div className={`absolute inset-0 ${lossConfig.bg} opacity-10`}></div>
                    <div className={`p-3 rounded-xl ${lossConfig.bg} ${lossConfig.color} border ${lossConfig.border}`}>
                        <LossIcon size={32} />
                    </div>
                    <div className="flex-1">
                        <div className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-0.5">Loss Type</div>
                        <div className="text-xl font-black text-white tracking-tight">{lossConfig.label}</div>
                    </div>
                </div>

                {/* 3. Team Roster */}
                <div className="glass p-5 rounded-2xl border border-white/5 flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-white/50 mb-1">
                        <Users size={16} />
                        <h3 className="text-[10px] font-black uppercase tracking-widest">Assigned Team</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Lead Tech */}
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <div className="text-[10px] text-text-muted uppercase font-bold mb-2">Lead Technician</div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-accent-electric text-black flex items-center justify-center font-bold text-xs shadow-lg shadow-accent-electric/20">
                                    {(leadTech) ? leadTech.displayName[0] : '?'}
                                </div>
                                <div className="text-white font-bold text-sm truncate">{leadTech?.displayName || 'Unassigned'}</div>
                            </div>
                        </div>
                        {/* Supervisor */}
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <div className="text-[10px] text-text-muted uppercase font-bold mb-2">Supervisor</div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-xs border border-white/10">
                                    {(supervisor) ? supervisor.displayName[0] : '?'}
                                </div>
                                <div className="text-white/80 font-bold text-sm truncate">{supervisor?.displayName || 'Unassigned'}</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* RIGHT COLUMN: DATA & NARRATIVE (60% - 3 cols on xl) */}
            <div className="xl:col-span-3 flex flex-col gap-6">

                {/* 1. Identity Header (Insurance & Dates) */}
                <div className="glass p-6 rounded-2xl border border-white/5 bg-linear-to-br from-white/5 to-transparent">
                    <div className="flex flex-col md:flex-row gap-8 justify-between items-start">

                        {/* Carrier Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 text-accent-electric mb-2">
                                <Briefcase size={18} />
                                <h3 className="text-xs font-black uppercase tracking-widest">Insurance Information</h3>
                            </div>
                            <div className="text-2xl font-black text-white mb-1">{job.insurance.carrier || 'Unknown Carrier'}</div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-text-muted bg-white/10 px-2 py-0.5 rounded">Claim #</span>
                                <span className="font-mono text-lg text-white/90 tracking-wide select-all">{job.insurance.claimNumber || 'N/A'}</span>
                            </div>
                        </div>

                        {/* Critical Dates */}
                        <div className="flex gap-6 border-l border-white/10 pl-6">
                            <div>
                                <div className="flex items-center gap-1.5 text-text-muted text-[10px] font-bold uppercase mb-1">
                                    <Calendar size={12} /> Loss Date
                                </div>
                                <div className="text-white font-bold">
                                    {job.dates?.lossDate ? new Date(job.dates.lossDate.seconds * 1000).toLocaleDateString() : '-'}
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 text-text-muted text-[10px] font-bold uppercase mb-1">
                                    <Clock size={12} /> Days Open
                                </div>
                                <div className="text-accent-electric font-bold text-lg leading-none">
                                    {daysOpen} <span className="text-xs text-text-muted font-normal">Days</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* 2. Loss Description (Primary Narrative) */}
                <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-white/70">
                            <Info size={18} />
                            <h3 className="text-xs font-black uppercase tracking-widest">Loss Description</h3>
                        </div>
                        {/* Access Info Badges Inline */}
                        <div className="flex gap-2">
                            <div className="bg-black/20 px-2.5 py-1 rounded border border-white/10 text-[10px] font-bold text-white/60 flex items-center gap-1.5">
                                <ShieldCheck size={12} /> Lockbox: <span className="text-white">{job.details.lockBoxCode || 'N/A'}</span>
                            </div>
                            <div className="bg-black/20 px-2.5 py-1 rounded border border-white/10 text-[10px] font-bold text-white/60 flex items-center gap-1.5">
                                <ShieldCheck size={12} /> Gate: <span className="text-white">{job.details.gateEntryCode || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-5 border border-white/5 flex-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                        <p className="text-base text-text-secondary leading-relaxed whitespace-pre-wrap">
                            {job.details.lossDescription ||
                                "No detailed loss description provided for this claim. Please verify details with the carrier or homeowner upon arrival."}
                        </p>
                    </div>
                </div>

                {/* 3. Quick Actions (Triage) */}
                <div className="glass p-5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 mb-3 text-accent-electric">
                        <Activity size={16} />
                        <h3 className="text-xs font-black uppercase tracking-widest">Recommended Triage Actions</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {actions.length > 0 ? actions.map((action, idx) => (
                            <div key={idx} className="bg-white/5 px-3 py-2 rounded-lg border border-white/5 text-xs text-white/80 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent-electric shrink-0"></div>
                                {action}
                            </div>
                        )) : (
                            <div className="text-text-muted text-xs italic p-2">Pending AI analysis...</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

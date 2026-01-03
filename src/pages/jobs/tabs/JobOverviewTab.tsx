
import React from 'react';
import { type Job, type LossClassification } from '@/types/jobs';
import {
    Users,
    Activity,
    AlertCircle,
    ShieldAlert,
    Droplets,
    Flame,
    Wind,
    CloudRain,
    HelpCircle,
    Biohazard,
    Sprout
} from 'lucide-react';
import { JobMap } from '@/components/map/JobMap';

interface JobOverviewTabProps {
    job: Job;
    classification?: LossClassification;
    leadTech?: { displayName: string; photoURL?: string };
    supervisor?: { displayName: string; photoURL?: string };
}

const getLossIcon = (type: string) => {
    if (!type) return { Icon: HelpCircle, color: 'text-text-muted', bg: 'bg-white/5', border: 'border-white/10' };
    const t = type.toLowerCase();

    if (t.includes('water')) return {
        Icon: Droplets,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20'
    };
    if (t.includes('fire')) return {
        Icon: Flame,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20'
    };
    if (t.includes('storm')) return {
        Icon: CloudRain,
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/20'
    };
    if (t.includes('wind')) return {
        Icon: Wind,
        color: 'text-gray-300',
        bg: 'bg-gray-500/10',
        border: 'border-gray-500/20'
    };
    if (t.includes('mold')) return {
        Icon: Sprout,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20'
    };
    if (t.includes('bio')) return {
        Icon: Biohazard,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20'
    };

    return { Icon: HelpCircle, color: 'text-text-muted', bg: 'bg-white/5', border: 'border-white/10' };
};

export const JobOverviewTab: React.FC<JobOverviewTabProps> = ({ job, classification, leadTech, supervisor }) => {
    const lossStyle = getLossIcon(job.details.lossCategory);

    // Mock Activity Feed based on Job Data
    // ... (lines 66-188) omitted for brevity, assuming replace_file_content handles large jumps, but best to stick to chunks

    // NOTE: Splitting this into two tool calls or one larger one. I'll use one larger one but I need to be careful about the intervening lines.
    // The previous tool already updated getLossIcon. Now I need to update the usage in the render function.
    // I will target the exact block where lossStyle is used.

    // Actually, I can't target non-contiguous blocks with replace_file_content.
    // I will start with the first usage line (calling getLossIcon)
    // and then the rendering block.

    // Block 1: Calling the function (removing the size arg)

    // Mock Activity Feed based on Job Data
    // In a real app, this would query a 'timeline' or 'audit_logs' collection
    const activities = [
        { type: 'created', label: 'Job Created', date: job.createdAt, user: 'System' },
        ...(job.phases?.filter(p => p.status === 'COMPLETED').map(p => ({
            type: 'phase_complete',
            label: `Phase Completed: ${p.name} `,
            date: p.completedAt,
            user: 'Team'
        })) || [])
    ].sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));

    // Fallback if no activity
    if (activities.length === 0) {
        activities.push({ type: 'info', label: 'No recent activity', date: null, user: '-' });
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 fade-in duration-500">

            {/* CARD 1: MAP (Top Left - 2 cols) */}
            <div className="md:col-span-2 lg:col-span-2 xl:col-span-2 row-span-2 rounded-3xl border border-white/5 flex flex-col relative group overflow-hidden shadow-2xl min-h-[320px]">
                <JobMap
                    address={job.property.address}
                    city={job.property.city}
                    state={job.property.state}
                    zip={job.property.zip}
                />
            </div>


            {/* CARD 2: ACTIVITY FEED (Top Right - 2 cols) */}
            <div className="md:col-span-2 lg:col-span-1 xl:col-span-2 row-span-2 rounded-3xl bg-[#111] border border-white/5 relative overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Activity size={18} className="text-accent-electric" />
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Live Activity</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-green-500 uppercase">Live</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                    {/* Activity Items */}
                    <div className="relative">
                        {/* Vertical Line */}
                        <div className="absolute left-8 top-0 bottom-0 w-px bg-white/5"></div>

                        {activities.map((act, i) => (
                            <div key={i} className="relative pl-16 pr-6 py-4 hover:bg-white/5 transition-colors group">
                                {/* Dot */}
                                <div className="absolute left-[29px] top-6 w-1.5 h-1.5 rounded-full bg-white/20 border border-[#111] ring-4 ring-[#111] group-hover:bg-accent-electric transition-colors z-10"></div>

                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-white mb-0.5">{act.label}</p>
                                        <div className="flex items-center gap-2 text-xs text-text-muted">
                                            <span className="flex items-center gap-1"><Users size={10} /> {act.user}</span>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-mono text-text-muted opacity-50 whitespace-nowrap">
                                        {act.date ? new Date(act.date.seconds * 1000).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Filler items if empty */}
                        {activities.length < 3 && (
                            <div className="p-8 text-center text-text-muted text-xs italic opacity-50">
                                End of timeline.
                            </div>
                        )}
                    </div>
                </div>
            </div>


            {/* CARD 3: CRITICAL NOTES (Bottom Left - 1 col) */}
            <div className="xl:col-span-1 bg-[#1A1A1A] rounded-3xl p-6 border border-white/5 flex flex-col gap-4">
                <div className="flex items-center justify-between text-accent-secondary mb-2">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={18} />
                        <h3 className="text-xs font-black uppercase tracking-widest">Critical Notes</h3>
                    </div>
                    <button className="text-[10px] font-bold bg-white/5 px-2 py-1 rounded hover:bg-white/10 transition-colors">+ Add</button>
                </div>

                <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/5 text-sm text-text-secondary italic">
                    {job.details.notes ? (
                        <span className="not-italic text-white">{job.details.notes}</span>
                    ) : "No critical notes pinned."}
                </div>
            </div>

            {/* CARD 3b: LOSS CLASSIFICATION (New - 1 col) */}
            <div className="xl:col-span-1 bg-[#111] rounded-3xl p-6 border border-white/5 flex flex-col justify-between group hover:border-white/10 transition-all relative overflow-hidden">
                {/* Background Decorator */}
                <div className={`absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none ${lossStyle.color}`}>
                    <lossStyle.Icon size={120} />
                </div>

                {/* Header with Icon */}
                <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl ${lossStyle.bg} ${lossStyle.border} border ${lossStyle.color} shadow-lg shadow-black/20`}>
                            <lossStyle.Icon size={24} />
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-bold text-text-muted mb-0.5 tracking-wider">Loss Type</div>
                            <div className="text-lg font-black text-white leading-none">{job.details.lossCategory}</div>
                        </div>
                    </div>
                </div>

                {/* Description - Cleaner */}
                <div className="text-sm text-text-secondary leading-relaxed mb-6 font-medium relative z-10">
                    "{job.details.lossDescription}"
                </div>

                {/* IICRC Data - Simplified Pill Design */}
                <div className="grid grid-cols-2 gap-3 relative z-10">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center text-center">
                        <div className="text-[10px] uppercase font-bold text-text-muted mb-1">Category</div>
                        <div className="flex items-center gap-1.5 text-red-500">
                            <span className="text-xl font-black">{classification?.category || '?'}</span>
                            {classification?.riskLevel === 'High' && <ShieldAlert size={12} />}
                        </div>
                        <div className="text-[10px] font-medium text-white/50 truncate w-full px-2" title={classification?.categoryDescription}>
                            {classification?.categoryDescription}
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center text-center">
                        <div className="text-[10px] uppercase font-bold text-text-muted mb-1">Class</div>
                        <div className="text-xl font-black text-blue-500">{classification?.class || '?'}</div>
                        <div className="text-[10px] font-medium text-white/50 truncate w-full px-2" title={classification?.classDescription}>
                            {classification?.classDescription}
                        </div>
                    </div>
                </div>
            </div>


            {/* CARD 4: TEAM ROSTER (Bottom Right - 2 cols) */}
            <div className="xl:col-span-2 rounded-3xl bg-[#111] border border-white/5 p-6 flex flex-col hover:border-white/10 transition-colors">
                <div className="flex items-center gap-2 text-text-muted mb-6">
                    <Users size={18} />
                    <h3 className="text-xs font-black uppercase tracking-widest">Assigned Team</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Supervisor */}
                    <div className="bg-white/5 p-3 rounded-xl flex items-center gap-3 border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm border border-white/10 overflow-hidden shrink-0">
                            {supervisor?.photoURL ?
                                <img src={supervisor.photoURL} alt="Sup" className="w-full h-full object-cover" /> :
                                (supervisor?.displayName?.[0] || '?')
                            }
                        </div>
                        <div className="overflow-hidden">
                            <div className="text-[10px] font-bold text-text-muted uppercase truncate">Supervisor</div>
                            <div className="text-sm font-bold text-white truncate">{supervisor?.displayName || 'Unassigned'}</div>
                        </div>
                    </div>

                    {/* Lead Tech */}
                    <div className="bg-accent-electric/5 p-3 rounded-xl flex items-center gap-3 border border-accent-electric/10">
                        <div className="w-10 h-10 rounded-full bg-accent-electric text-black flex items-center justify-center font-bold text-sm shadow-lg shadow-accent-electric/20 overflow-hidden shrink-0">
                            {leadTech?.photoURL ?
                                <img src={leadTech.photoURL} alt="Tech" className="w-full h-full object-cover" /> :
                                (leadTech?.displayName?.[0] || '?')
                            }
                        </div>
                        <div className="overflow-hidden">
                            <div className="text-[10px] font-bold text-accent-electric uppercase truncate">Lead Tech</div>
                            <div className="text-sm font-bold text-white truncate">{leadTech?.displayName || 'Unassigned'}</div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

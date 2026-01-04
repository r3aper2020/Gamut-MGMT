import React from 'react';
import { type Job, type LossClassification } from '@/types/jobs';
import { ShieldAlert, Droplets, Flame, Wind, CloudRain, HelpCircle, Biohazard, Sprout } from 'lucide-react';

interface JobLossCardProps {
    job: Job;
    classification?: LossClassification;
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

export const JobLossCard: React.FC<JobLossCardProps> = ({ job, classification }) => {
    const lossStyle = getLossIcon(job.details.lossCategory);

    return (
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
    );
};

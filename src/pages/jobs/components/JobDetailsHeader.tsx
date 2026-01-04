import React from 'react';
import { ArrowLeft, MapPin, Activity, Building2, Hash, Users, Calendar, Clock, Send, Pencil } from 'lucide-react';
import { type Job } from '@/types/jobs';
import { type UserProfile } from '@/types/team';

interface JobDetailsHeaderProps {
    job: Job;
    profile: UserProfile | null;
    navigate: (path: number) => void;
    daysOpen: number;
    isManagerOrAdmin: boolean;
    canTransfer: boolean;
    onStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onEdit: () => void;
    onHandoff: () => void;
}

export const JobDetailsHeader: React.FC<JobDetailsHeaderProps> = ({
    job,
    profile,
    navigate,
    daysOpen,
    isManagerOrAdmin,
    canTransfer,
    onStatusChange,
    onEdit,
    onHandoff
}) => {
    return (
        <div className="bg-black/40 backdrop-blur-md border-b border-white/5 shadow-2xl z-50 shrink-0">

            {/* Top Row: Navigation, Title, Status Actions */}
            <div className="px-6 py-4 flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-all border border-white/5"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-white tracking-tight">{job.customer.name}</h1>
                            {/* Status Chip */}
                            <div className="bg-accent-electric/10 border border-accent-electric/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase text-accent-electric tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-electric animate-pulse"></span>
                                {(() => {
                                    // Match Header Dropdown Logic
                                    if (profile?.departmentId && job.departmentId !== profile.departmentId) {
                                        const phase = job.phases?.find(p => p.departmentId === profile.departmentId);
                                        return (phase?.stage || 'REVIEW').replace('_', ' ');
                                    }
                                    return job.status.replace('_', ' ');
                                })()}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-text-muted font-medium">
                            <span className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
                                <MapPin size={12} className="text-accent-primary" />
                                {job.property.address}, {job.property.city}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Status Dropdown (Manager/Admin Only) */}
                    {isManagerOrAdmin && (
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Activity size={14} className="text-accent-electric animate-pulse" />
                            </div>
                            <select
                                value={(() => {
                                    // Display effective status if historical for this user
                                    if (profile?.departmentId && job.departmentId !== profile.departmentId) {
                                        const phase = job.phases?.find(p => p.departmentId === profile.departmentId);
                                        // Allow all supported statuses
                                        if (phase?.stage) return phase.stage;
                                        // Fallback default
                                        return 'REVIEW';
                                    }
                                    return job.status;
                                })()}
                                onChange={onStatusChange}
                                className="appearance-none pl-9 pr-8 py-2 bg-accent-electric/10 border border-accent-electric/50 hover:border-accent-electric text-accent-electric font-black uppercase text-xs rounded-lg cursor-pointer outline-none transition-all shadow-[0_0_10px_rgba(0,242,255,0.1)] hover:shadow-[0_0_20px_rgba(0,242,255,0.2)] tracking-wider"
                            >
                                <option value="PENDING" className="bg-[#111] text-text-muted font-medium">Pending</option>
                                <option value="IN_PROGRESS" className="bg-[#111] text-blue-400 font-bold">Work in Progress</option>
                                <option value="REVIEW" className="bg-[#111] text-yellow-500 font-bold">Manager Review</option>
                                <option value="BILLING" className="bg-[#111] text-orange-400 font-bold">Billing</option>
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-accent-electric">
                                <ArrowLeft size={10} className="-rotate-90" />
                            </div>
                        </div>
                    )}

                    {canTransfer && (
                        <button
                            onClick={onHandoff}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-black hover:border-green-500 rounded-lg font-bold transition-all shadow-[0_0_10px_rgba(34,197,94,0.1)] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] text-xs uppercase tracking-wider"
                        >
                            <Send size={14} />
                            <span className="hidden sm:inline">Push Job</span>
                        </button>
                    )}
                    {isManagerOrAdmin && (
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-white font-bold text-xs uppercase tracking-wider"
                        >
                            <Pencil size={14} />
                            <span className="hidden sm:inline">Edit</span>
                        </button>
                    )}
                </div>
            </div>

            {/* INFO BAR: Persistent Context */}
            <div className="px-6 py-2 bg-transparent border-t border-white/5 flex items-center gap-8 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 shrink-0">
                    <Building2 size={14} className="text-text-muted" />
                    <span className="text-[10px] uppercase font-bold text-text-muted">Carrier</span>
                    <span className="text-sm font-bold text-white truncate max-w-[150px]">{job.insurance.carrier || 'N/A'}</span>
                </div>
                <div className="w-px h-4 bg-white/10 shrink-0"></div>
                <div className="flex items-center gap-2 shrink-0">
                    <Hash size={14} className="text-text-muted" />
                    <span className="text-[10px] uppercase font-bold text-text-muted">Claim #</span>
                    <span className="text-sm font-mono text-accent-electric tracking-wide select-all">{job.insurance.claimNumber || 'N/A'}</span>
                </div>
                <div className="w-px h-4 bg-white/10 shrink-0"></div>
                <div className="flex items-center gap-2 shrink-0">
                    <Users size={14} className="text-text-muted" />
                    <span className="text-[10px] uppercase font-bold text-text-muted">Adjuster</span>
                    <span className="text-sm font-bold text-white truncate">{job.insurance.adjusterName || 'N/A'}</span>
                </div>
                <div className="w-px h-4 bg-white/10 shrink-0"></div>
                <div className="flex items-center gap-2 shrink-0">
                    <Calendar size={14} className="text-text-muted" />
                    <span className="text-[10px] uppercase font-bold text-text-muted">Loss Date</span>
                    <span className="text-sm font-bold text-white">{job.dates?.lossDate ? new Date(job.dates.lossDate.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="w-px h-4 bg-white/10 shrink-0"></div>
                <div className="flex items-center gap-2 shrink-0 ml-auto">
                    <div className="flex flex-col items-end leading-none">
                        <span className="text-[10px] uppercase font-bold text-text-muted">Open</span>
                        <span className="text-sm font-bold text-accent-electric">{daysOpen} Days</span>
                    </div>
                    <Clock size={20} className="text-accent-electric/50" />
                </div>
            </div>

        </div >
    );
};

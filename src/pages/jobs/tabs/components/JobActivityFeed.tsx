import React from 'react';
import { Activity, Users } from 'lucide-react';
import { type Job } from '@/types/jobs';

interface JobActivityFeedProps {
    job: Job;
}

export const JobActivityFeed: React.FC<JobActivityFeedProps> = ({ job }) => {
    // Activity Timeline
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
    );
};

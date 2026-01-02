import React from 'react';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { type Job } from '@/types/jobs';

interface RecentActivityProps {
    jobs: Job[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ jobs }) => {
    // Sort jobs by createdAt descending just in case, though parent should handle logic
    // We'll assume jobs are passed in correct order or sliced. 
    // For now, let's just display what's passed.

    // Helper to get status color/icon
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'PENDING': return { color: 'text-status-fnol', icon: AlertCircle, bg: 'bg-status-fnol/10' };
            case 'IN_PROGRESS': return { color: 'text-status-mitigation', icon: AlertCircle, bg: 'bg-status-mitigation/10' };
            case 'REVIEW': return { color: 'text-accent-primary', icon: CheckCircle2, bg: 'bg-accent-primary/10' };
            case 'BILLING': return { color: 'text-status-success', icon: CheckCircle2, bg: 'bg-status-success/10' };
            default: return { color: 'text-text-muted', icon: Clock, bg: 'bg-white/5' };
        }
    };

    if (jobs.length === 0) {
        return (
            <div className="bg-surface-glass border border-white/10 rounded-2xl p-6 h-full min-h-[300px] flex items-center justify-center text-text-muted">
                No recent activity found.
            </div>
        );
    }

    return (
        <div className="glass p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock size={20} className="text-accent-electric" />
                Recent Activity
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {jobs.map(job => {
                    const config = getStatusConfig(job.status);
                    const Icon = config.icon;

                    // Context-aware link construction
                    const jobLink = job.officeId && job.departmentId
                        ? `/office/${job.officeId}/department/${job.departmentId}/jobs`
                        : `/jobs`; // Fallback only if data missing

                    return (
                        <Link
                            key={job.id}
                            to={jobLink}
                            className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 no-underline group"
                        >
                            <div className={`p-2 rounded-full ${config.bg} ${config.color} shrink-0`}>
                                <Icon size={18} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-text-primary truncate group-hover:text-accent-electric transition-colors">
                                    {job.customer.name}
                                </div>
                                <div className="text-xs text-text-secondary truncate">
                                    {job.property.address}
                                </div>
                            </div>

                            <div className="text-right shrink-0">
                                <div className={`text-xs font-bold ${config.color}`}>
                                    {job.status}
                                </div>
                                <div className="text-[10px] text-text-muted mt-1">
                                    {/* Format date properly locally if needed, for now just show fallback */}
                                    View
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="pt-4 mt-2 border-t border-white/5 text-center">
                <Link to="/jobs" className="text-sm text-accent-electric hover:text-accent-electric/80 font-medium">
                    View All Activity
                </Link>
            </div>
        </div>
    );
};

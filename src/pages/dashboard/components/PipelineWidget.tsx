import React from 'react';
import { GitPullRequest, ArrowRight } from 'lucide-react';
import { type Job } from '@/types/jobs';

interface PipelineWidgetProps {
    jobs: Job[];
}

export const PipelineWidget: React.FC<PipelineWidgetProps> = ({ jobs }) => {
    const statuses = ['PENDING', 'IN_PROGRESS', 'REVIEW', 'BILLING'];

    // Count jobs by status
    const counts = statuses.reduce((acc, status) => {
        acc[status] = jobs.filter(j => j.status === status).length;
        return acc;
    }, {} as Record<string, number>);

    // Total active jobs for percentage
    const total = jobs.length || 1;

    return (
        <div className="glass border border-white/10 rounded-2xl p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <GitPullRequest size={20} className="text-accent-primary" />
                Job Pipeline
            </h3>

            <div className="flex-1 flex flex-col gap-4 justify-center">
                {statuses.map((status) => {
                    const count = counts[status] || 0;
                    const percent = Math.round((count / total) * 100);

                    // Color mapping
                    let colorClass = 'bg-white/10';
                    let textClass = 'text-text-muted';
                    if (status === 'PENDING') { colorClass = 'bg-status-fnol'; textClass = 'text-status-fnol'; }
                    if (status === 'IN_PROGRESS') { colorClass = 'bg-status-mitigation'; textClass = 'text-status-mitigation'; }
                    if (status === 'REVIEW') { colorClass = 'bg-accent-primary'; textClass = 'text-accent-primary'; }
                    if (status === 'BILLING') { colorClass = 'bg-status-success'; textClass = 'text-status-success'; }

                    return (
                        <div key={status} className="group">
                            <div className="flex justify-between items-center mb-1 text-sm">
                                <span className={`font-semibold ${textClass}`}>{status}</span>
                                <span className="text-text-secondary font-mono">{count}</span>
                            </div>
                            <div className="h-2 w-full bg-surface-elevation-1 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${colorClass} transition-all duration-700 ease-out opacity-80 group-hover:opacity-100`}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between text-xs text-text-muted">
                <span>Active Cycle Time: <span className="text-text-primary">14 Days</span></span>
                <span className="flex items-center gap-1 hover:text-accent-electric cursor-pointer transition-colors">View Details <ArrowRight size={12} /></span>
            </div>
        </div>
    );
};

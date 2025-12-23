import React from 'react';
import {
    LayoutDashboard,
    AlertTriangle,
    TrendingUp,
    Banknote,
    Clock,
    Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { type Job } from '@/types/jobs';
import { type Task } from '@/types/jobs';
import { type DashboardMetrics, formatCurrency } from '@/utils/dashboardMetrics';
import { RevenueWidget } from './RevenueWidget';
import { PipelineWidget } from './PipelineWidget';
// import { TasksWidget } from './TasksWidget';

export interface HubPulseEntity {
    id: string;
    name: string;
    subtext: string;
    activeCount: number;
    link: string;
    personnelCount: number | string;
}

interface PulseExecutiveProps {
    stats: DashboardMetrics;
    entities: HubPulseEntity[];
    entityType: 'OFFICE' | 'DEPARTMENT';
    jobs: Job[];
    tasks: Task[];
    showRevenue?: boolean;
    showEntityGrid?: boolean;
}

export const PulseExecutive: React.FC<PulseExecutiveProps> = ({
    stats,
    entities,
    entityType,
    jobs,
    // tasks,
    showRevenue = true,
    showEntityGrid = true
}) => {
    // Determine Grid Columns based on Revenue Visibility
    const topGridCols = showRevenue ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-3";

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* 1. TOP METRICS GRID */}
            <div className={`grid ${topGridCols} gap-4`}>

                {/* Metric 1: Active Jobs */}
                <div className="glass p-5 relative overflow-hidden group hover:border-accent-electric/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <LayoutDashboard size={40} className="text-accent-electric" />
                    </div>
                    <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Active Jobs</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-white">{stats.activeCount}</h3>
                        <span className="text-emerald-400 text-xs font-medium flex items-center">
                            <TrendingUp size={12} className="mr-1" /> Moving
                        </span>
                    </div>
                    <div className="mt-4 flex gap-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        {/* Mini Pipeline bar */}
                        <div className="bg-blue-500 h-full" style={{ width: `${(stats.pipeline['MITIGATION'] / stats.activeCount) * 100}%` }} />
                        <div className="bg-purple-500 h-full" style={{ width: `${(stats.pipeline['RECONSTRUCTION'] / stats.activeCount) * 100}%` }} />
                        <div className="bg-amber-500 h-full" style={{ width: `${(stats.pipeline['FNOL'] / stats.activeCount) * 100}%` }} />
                    </div>
                </div>

                {/* Metric 2: Revenue (Conditional) */}
                {showRevenue && (
                    <div className="glass p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Banknote size={40} className="text-emerald-500" />
                        </div>
                        <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Revenue (Est)</p>
                        <div className="mt-2 flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</h3>
                        </div>
                        <div className="mt-4 text-xs text-text-muted flex justify-between">
                            <span>Avg Val: {formatCurrency(stats.avgJobValue)}</span>
                        </div>
                    </div>
                )}

                {/* Metric 3: Stuck Jobs (Risk) */}
                <div className="glass p-5 relative overflow-hidden group hover:border-red-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertTriangle size={40} className="text-red-500" />
                    </div>
                    <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Stuck Jobs</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-white">{stats.stuckCount}</h3>
                        <span className="text-text-muted text-xs">No update {'>'} 7 days</span>
                    </div>
                    {stats.stuckCount > 0 && (
                        <div className="mt-4">
                            <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">
                                Requires Attention
                            </span>
                        </div>
                    )}
                </div>

                {/* Metric 4: Aging Health (15+ Days) */}
                <div className="glass p-5 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock size={40} className="text-indigo-500" />
                    </div>
                    <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Oldest (15+ Days)</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-white">{stats.aging['15+']}</h3>
                        <span className="text-text-muted text-xs">Total Aged Jobs</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-text-muted">0-7d</span>
                            <span className="text-xs font-medium text-white">{stats.aging['0-3'] + stats.aging['4-7']}</span>
                        </div>
                        <div className="w-px bg-white/10 h-8 self-center" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-text-muted">8-14d</span>
                            <span className="text-xs font-medium text-white">{stats.aging['8-14']}</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Column 1: Pipeline Visualization & Activity (2 Cols) */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Pipeline Widget */}
                    <div className="h-96">
                        <PipelineWidget jobs={jobs} />
                    </div>
                </div>

                {/* Column 2: Revenue & Tasks (1 Col) */}
                <div className="flex flex-col gap-6 xl:col-span-1">
                    {showRevenue ? (
                        <div className="h-64">
                            <RevenueWidget jobs={jobs} />
                        </div>
                    ) : (
                        <div className="h-64 glass p-6 flex flex-col items-center justify-center text-text-muted">
                            <Banknote size={32} className="mb-2 opacity-50" />
                            <span className="italic">Financials Hidden</span>
                        </div>
                    )}
                    <div className="flex-1">
                        {/* <TasksWidget tasks={tasks} /> */}
                    </div>
                </div>

            </div>


            {/* BOTTOM SECTION: Entity Grid */}
            {showEntityGrid && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            {entityType === 'OFFICE' ? 'Branch Performance' : 'Department Breakdown'}
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {entities.map(entity => (
                            <Link
                                to={entity.link}
                                key={entity.id}
                                className="glass p-4 hover:border-accent-electric/50 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-medium text-white group-hover:text-accent-electric transition-colors">{entity.name}</h4>
                                        <p className="text-xs text-text-muted">{entity.subtext}</p>
                                    </div>
                                    <div className="bg-surface-elevation-2 px-2 py-1 rounded text-xs font-medium text-white border border-white/5">
                                        {entity.activeCount} Active
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-text-muted mt-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-1">
                                        <Activity size={12} />
                                        <span>High Activity</span>
                                    </div>
                                    <div className="flex items-center gap-1 ml-auto">
                                        <span>View Details</span>
                                        <TrendingUp size={12} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

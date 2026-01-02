import React from 'react';
import {
    Briefcase,
    Users,
    AlertTriangle,
    Clock,
    Megaphone
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { type Department } from '@/types/org';
import { type UserProfile } from '@/types/team';
import { JobRow } from '@/pages/jobs/components/JobRow';
import { type Job } from '@/types/jobs';
import { type Task } from '@/types/jobs';
import { type DashboardMetrics } from '@/utils/dashboardMetrics';
import { PipelineWidget } from './PipelineWidget';
// import { TasksWidget } from './TasksWidget';

export interface PulseManagerProps {
    stats: DashboardMetrics;
    jobs: Job[];
    tasks: Task[];
    departments: Department[];
    users: UserProfile[];
}

export const PulseManager: React.FC<PulseManagerProps> = ({
    stats,
    jobs,
    departments,
    users
    // tasks
}) => {
    const { departmentId } = useParams();
    const unassignedJobs = jobs.filter(j =>
        !j.assignments?.leadTechnicianId &&
        j.departmentId === departmentId
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ACTION REQUIRED BANNER */}
            {unassignedJobs.length > 0 && (
                <div className="glass border-red-500/30 p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Megaphone size={100} className="text-red-500" />
                    </div>

                    <div className="flex items-center gap-2 text-red-400 mb-4">
                        <AlertTriangle size={20} className="animate-pulse" />
                        <h3 className="text-sm font-black uppercase tracking-widest">Action Required</h3>
                    </div>

                    <div className="space-y-3">
                        {unassignedJobs.slice(0, 3).map(job => (
                            <JobRow
                                key={job.id}
                                job={job}
                                departments={departments}
                                users={users}
                            />
                        ))}
                        {unassignedJobs.length > 3 && (
                            <div className="text-center pt-2">
                                <span className="text-xs text-text-muted font-medium">+{unassignedJobs.length - 3} more unassigned jobs</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* 1. TOP OPERATIONAL KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Metric 1: My Dept Active */}
                <div className="glass p-5 relative overflow-hidden group hover:border-blue-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Briefcase size={40} className="text-blue-500" />
                    </div>
                    <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Dept Active</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-white">{stats.activeCount}</h3>
                        <span className="text-text-muted text-xs">Claims in Progress</span>
                    </div>
                    <div className="mt-4 flex gap-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: '60%' }} />
                    </div>
                </div>

                {/* Metric 2: Stalled / Stuck */}
                <div className="glass p-5 relative overflow-hidden group hover:border-red-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertTriangle size={40} className="text-red-500" />
                    </div>
                    <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Stalled Jobs</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-white">{stats.stuckCount}</h3>
                        <span className="text-xs text-red-400">Needs Update</span>
                    </div>
                </div>

                {/* Metric 3: Team Tasks (Mocked as pending tasks for now) */}
                {/* <div className="glass p-5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ClipboardList size={40} className="text-amber-500" />
                    </div>
                    <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Open Tasks</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-white">{tasks.filter(t => !t.completed).length}</h3>
                        <span className="text-xs text-text-muted">Due Soon</span>
                    </div>
                </div> */}

                {/* Metric 4: Cycle Time (Placeholder) */}
                <div className="glass p-5 relative overflow-hidden group hover:border-purple-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock size={40} className="text-purple-500" />
                    </div>
                    <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Avg Age</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-white">4.2</h3>
                        <span className="text-xs text-text-muted">Days / Stage</span>
                    </div>
                </div>

            </div>

            {/* MAIN: Pipeline & Tasks */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Left: Volume Pipeline (No Money) */}
                <div className="h-96">
                    <PipelineWidget jobs={jobs} />
                </div>

                {/* Right: Team Activity / Tasks */}
                <div className="flex flex-col gap-6">
                    {/* <TasksWidget tasks={tasks} /> */}

                    {/* Placeholder Team Workload */}
                    <div className="flex-1 glass p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Users size={20} className="text-secondary-cyan" />
                            <h3 className="text-lg font-semibold text-white">Team Availability</h3>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">T{i}</div>
                                        <span className="text-sm text-text-primary">Tech Member {i}</span>
                                    </div>
                                    <div className="text-xs text-emerald-400">Available</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

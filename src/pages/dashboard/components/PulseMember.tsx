import React from 'react';
import {
    Briefcase,
    CheckSquare,
    User
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';

import { RecentActivity } from './RecentActivity';
import { TasksWidget } from './TasksWidget';
import { type Job, type Task } from '@/types/jobs';

export interface PulseMemberProps {
    jobs: Job[];
    tasks: Task[];
    username: string;
}

export const PulseMember: React.FC<PulseMemberProps> = ({
    jobs,
    tasks,
    username
}) => {
    // Member only cares about their active jobs
    const myActiveJobs = jobs.filter(j => j.status !== 'CLOSEOUT');
    const myCompletedTasks = tasks.filter(t => t.completed).length;

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Personal Header */}
            <header className="mb-2">
                <div className="flex items-center gap-2 text-accent-electric text-xs font-bold uppercase tracking-widest mb-2">
                    <User size={14} /> My Workbench
                </div>
                <h1 className="text-3xl font-bold tracking-tight m-0">
                    Welcome back, {username}
                </h1>
            </header>

            {/* Personal Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                    { label: 'My Active Jobs', value: myActiveJobs.length, icon: Briefcase, color: 'var(--accent-electric)' },
                    { label: 'My Pending Tasks', value: tasks.filter(t => !t.completed).length, icon: CheckSquare, color: 'var(--status-review)' },
                    { label: 'Tasks Completed', value: myCompletedTasks, icon: CheckSquare, color: 'var(--status-success)' },
                ].map((stat, i) => (
                    <StatCard key={i} {...stat} />
                ))}
            </div>

            {/* Member Grid: Tasks focused */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">

                {/* Left: Tasks & Actions */}
                <div className="flex flex-col gap-6">

                    <div className="flex-1">
                        <TasksWidget tasks={tasks} />
                    </div>
                </div>

                {/* Right: My Recent Activity (Filtered to my jobs) */}
                <div className="flex flex-col gap-6">
                    <div className="h-full">
                        <RecentActivity jobs={jobs} />
                    </div>
                </div>
            </div>
        </div>
    );
};

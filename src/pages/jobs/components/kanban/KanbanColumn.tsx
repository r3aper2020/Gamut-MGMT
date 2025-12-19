import React from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { MoreHorizontal } from 'lucide-react';
import { type Job } from '@/types/jobs';
import { KanbanCard } from '@/pages/jobs/components/kanban/KanbanCard';

export type LaneId = 'unassigned' | 'in_progress' | 'review' | 'done';

export interface Lane {
    id: LaneId;
    title: string;
    colors: string;
}

interface KanbanColumnProps {
    lane: Lane;
    jobs: Job[];
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ lane, jobs }) => {
    const { setNodeRef } = useSortable({ id: lane.id, data: { type: 'Lane', lane } });

    return (
        <div ref={setNodeRef} className="flex flex-col min-w-[320px] h-full">
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lane.colors }} />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white m-0">
                        {lane.title}
                    </h3>
                    <span className="text-xs text-text-muted font-medium">
                        {jobs.length}
                    </span>
                </div>
                <MoreHorizontal size={16} className="text-text-muted cursor-pointer hover:text-white" />
            </div>

            <div className="flex-1 bg-white/5 rounded-2xl p-3 flex flex-col gap-3">
                <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
                    {jobs.map(job => (
                        <KanbanCard key={job.id} job={job} />
                    ))}
                    {jobs.length === 0 && (
                        <div className="h-24 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-text-muted text-sm">
                            Drop Items Here
                        </div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
};

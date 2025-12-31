import React from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { MoreHorizontal, Plus } from 'lucide-react';
import { type Job } from '@/types/jobs';
import { KanbanCard } from '@/pages/jobs/components/kanban/KanbanCard';

export type LaneId = 'assigned' | 'in_progress' | 'review' | 'done';

export interface Lane {
    id: LaneId;
    title: string;
    colors: string;
}

interface KanbanColumnProps {
    lane: Lane;
    jobs: Job[];
    onAdd?: () => void;
    onJobClick?: (job: Job) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ lane, jobs, onAdd, onJobClick }) => {
    const { setNodeRef } = useSortable({ id: lane.id, data: { type: 'Lane', lane } });

    return (
        <div ref={setNodeRef} className="flex flex-col min-w-[320px] h-full group/column">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-white m-0">
                        {lane.title}
                    </h3>
                    <span className="text-xs text-text-secondary font-medium">
                        {jobs.length}
                    </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover/column:opacity-100 transition-opacity">
                    <MoreHorizontal size={16} className="text-text-muted cursor-pointer hover:text-white transition-colors" />
                    {onAdd && (
                        <button onClick={onAdd} className="p-1 hover:bg-white/10 rounded">
                            <Plus size={16} className="text-text-muted hover:text-white" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 rounded-2xl flex flex-col gap-3 min-h-[500px]">
                {/* Asana-style 'Quick Add' at top of list */}
                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-muted hover:text-white hover:bg-white/5 rounded-xl transition-all text-left mb-1 group/add"
                    >
                        <div className="w-5 h-5 rounded-md border border-white/20 flex items-center justify-center group-hover/add:border-accent-electric group-hover/add:text-accent-electric transition-colors">
                            <Plus size={12} />
                        </div>
                        Add Task
                    </button>
                )}

                <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
                    {jobs.map(job => (
                        <KanbanCard
                            key={job.id}
                            job={job}
                            onClick={() => onJobClick?.(job)}
                        />
                    ))}
                    {jobs.length === 0 && (
                        <div className="flex-1 border border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center text-text-muted text-xs gap-2 py-10 opacity-50">
                            <span>Drag tasks here</span>
                        </div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
};

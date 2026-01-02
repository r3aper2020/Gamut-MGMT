import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar } from 'lucide-react';
import { type Job } from '@/types/jobs';
import { useAuth } from '@/contexts/AuthContext';

interface KanbanCardProps {
    job: Job;
    isOverlay?: boolean;
    onClick?: () => void;
}

// Internal View Component
export const KanbanCardView: React.FC<{
    job: Job;
    isOverlay?: boolean;
    onClick?: () => void;
    innerRef?: (node: HTMLElement | null) => void;
    style?: React.CSSProperties;
    attributes?: any;
    listeners?: any;
    isDragging?: boolean;
}> = ({ job, isOverlay, onClick, innerRef, style, attributes, listeners, isDragging }) => {
    const { profile } = useAuth();

    // Check if this is a historical job (transferred away)
    const isTransferred = profile?.role === 'DEPT_MANAGER' && profile.departmentId && job.departmentId !== profile.departmentId;

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const daysInStage = React.useMemo(() => {
        const nowMs = Date.now();
        return Math.floor((nowMs - (job.updatedAt?.toMillis() || nowMs)) / (1000 * 3600 * 24));
    }, [job.updatedAt]);
    const isStagnant = daysInStage > 5 && job.status !== 'BILLING';

    return (
        <div
            ref={innerRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={`group w-full ${isDragging ? 'z-50' : ''}`}
        >
            <div
                className={`
                    relative p-4 rounded-xl border transition-colors duration-200
                    ${isOverlay
                        ? 'bg-[#1e293b] shadow-2xl border-accent-electric/50 cursor-grabbing'
                        : 'bg-[#1e293b] border-white/5 hover:border-white/10 cursor-grab shadow-sm'
                    }
                    ${isStagnant ? 'border-red-500/30' : ''}
                `}
            >
                {/* Status Color Bar */}
                {isStagnant && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Stagnant Job" />
                )}

                {/* Tags / Meta */}
                <div className="flex items-center gap-2 mb-3">
                    {isTransferred ? (
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white/10 text-white border border-white/10 flex items-center gap-1">
                            Transferred
                        </span>
                    ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white/5 text-text-muted border border-white/5">
                            {job.insurance.carrier}
                        </span>
                    )}
                    {daysInStage > 2 && (
                        <span className="text-[10px] text-text-muted flex items-center gap-1">
                            <Calendar size={10} /> {daysInStage}d
                        </span>
                    )}
                </div>

                {/* Title */}
                <h4 className="text-sm font-semibold text-white mb-1 group-hover:text-accent-electric transition-colors line-clamp-2">
                    {job.customer.name}
                </h4>

                {/* Subtitle / Address */}
                <div className="text-xs text-text-muted mb-4 truncate leading-relaxed">
                    {job.property.address}
                </div>

                {/* Footer: Assignees & ID */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex -space-x-2">
                        {job.assignedUserIds && job.assignedUserIds.length > 0 ? (
                            job.assignedUserIds.slice(0, 3).map((uid) => (
                                <div key={uid} className="w-6 h-6 rounded-full border border-[#1e293b] ring-1 ring-white/10 bg-gray-700 flex items-center justify-center text-[9px] font-bold text-white uppercase">
                                    {uid.slice(0, 1)}
                                </div>
                            ))
                        ) : (
                            <div className="w-6 h-6 rounded-full border border-dashed border-white/20 flex items-center justify-center text-[8px] text-text-muted">
                                ?
                            </div>
                        )}
                    </div>

                    <span className="text-[10px] font-mono text-text-muted/50">
                        #{job.id.slice(0, 5)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export const KanbanCard: React.FC<KanbanCardProps> = ({ job, isOverlay = false, onClick }) => {
    // If overlay is explicitly passed to the main component (legacy check), Render View directly
    // But typically we should use KanbanCardView for overlay.
    // However, if we are using useSortable, we must provide the id.

    // For normal sorting usage:
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: job.id, data: { type: 'Job', job } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        touchAction: 'none' as const
    };

    if (isOverlay) {
        // If someone inadvertently passes isOverlay to this, we probably shouldn't have called useSortable if possible,
        // but hooks order matters. 
        // We will just render the View without the dragging props if we want 'overlay' style without 'sortable' logic?
        // Actually, if isOverlay is true, we should default to the View component.
        // But to fix the BUG, the component rendered in DragOverlay MUST NOT HAVE useSortable.
        return <KanbanCardView job={job} isOverlay={true} />;
    }

    return (
        <KanbanCardView
            job={job}
            innerRef={setNodeRef}
            style={style}
            attributes={attributes}
            listeners={listeners}
            onClick={onClick}
            isDragging={isDragging}
        />
    );
};

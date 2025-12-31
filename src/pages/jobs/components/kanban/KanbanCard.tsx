import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar } from 'lucide-react';
import { type Job } from '@/types/jobs';

interface KanbanCardProps {
    job: Job;
    isOverlay?: boolean;
    onClick?: () => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ job, isOverlay = false, onClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: job.id, data: { type: 'Job', job } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        touchAction: 'none' as const
    };

    const [now, setNow] = React.useState<number | null>(null);
    React.useEffect(() => {
        setNow(Date.now());
    }, []);

    const daysInStage = now
        ? Math.floor((now - (job.updatedAt?.toMillis() || now)) / (1000 * 3600 * 24))
        : 0;
    const isStagnant = daysInStage > 5 && job.status !== 'CLOSEOUT';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={`group w-full ${isDragging ? 'z-50' : ''}`}
        >
            <div
                className={`
                    relative p-4 rounded-xl border transition-all duration-200
                    ${isOverlay
                        ? 'bg-[#1e293b] shadow-2xl scale-105 border-accent-electric/50 cursor-grabbing'
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
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white/5 text-text-muted border border-white/5">
                        {job.insurance.carrier}
                    </span>
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

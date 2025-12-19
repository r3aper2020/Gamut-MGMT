import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Briefcase, AlertCircle } from 'lucide-react';
import { type Job } from '@/types/jobs';

interface KanbanCardProps {
    job: Job;
    isOverlay?: boolean;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ job, isOverlay = false }) => {
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
            className="glass hover:bg-white/5 transition-colors"
        >
            <div
                className={`p-4 rounded-xl transition-all duration-300 border-l-4 ${isOverlay ? 'bg-[#1a1a20] shadow-2xl scale-105 cursor-grabbing' : 'bg-transparent cursor-grab'} ${isStagnant ? 'border-red-500 shadow-[inset_4px_0_10px_rgba(239,68,68,0.1)]' : 'border-transparent'}`}
            >
                <div className="flex justify-between mb-3">
                    <div className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                        <Briefcase size={12} /> {job.insurance.carrier}
                    </div>
                    {isStagnant && (
                        <div className="text-xs flex items-center gap-1 text-[#ef4444]">
                            <AlertCircle size={12} /> {daysInStage}d
                        </div>
                    )}
                </div>

                <div className="text-base font-semibold mb-1 text-white">
                    {job.customer.name}
                </div>
                <div className="text-[0.8125rem] text-text-muted flex items-center gap-1 mb-4">
                    {job.property.address}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <div className="flex items-center -space-x-2">
                        {job.assignedUserIds && job.assignedUserIds.length > 0 ? (
                            job.assignedUserIds.map((uid) => (
                                <div key={uid} className="w-6 h-6 rounded-full border-2 border-bg-primary" style={{
                                    backgroundColor: `hsl(${parseInt(uid.slice(-4), 16) % 360}, 70%, 50%)`,
                                }} />
                            ))
                        ) : (
                            <div className="w-6 h-6 rounded-full border border-dashed border-text-muted flex items-center justify-center text-[10px] text-text-muted">?</div>
                        )}
                    </div>
                    <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 text-text-secondary">
                        {job.status}
                    </div>
                </div>
            </div>
        </div>
    );
};

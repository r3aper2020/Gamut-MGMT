import React, { useState, useEffect, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
    Users,
    Briefcase,
    AlertCircle,
    MoreHorizontal
} from 'lucide-react';
import { useParams } from 'react-router-dom';

import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { type Job } from '../../../types';

// --- Types ---
type LaneId = 'unassigned' | 'in_progress' | 'review' | 'done';

interface Lane {
    id: LaneId;
    title: string;
    colors: string;
}

// --- Components ---

const KanbanCard = ({ job, isOverlay = false }: { job: Job; isOverlay?: boolean }) => {
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
        touchAction: 'none' // Essential for dnd-kit on mobile/touch
    };

    const daysInStage = Math.floor((new Date().getTime() - job.updatedAt?.toMillis()) / (1000 * 3600 * 24)) || 0;
    const isStagnant = daysInStage > 5 && job.status !== 'CLOSEOUT';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="glass"
        >
            <div style={{
                padding: '16px',
                cursor: 'grab',
                borderLeft: isStagnant ? '4px solid #ef4444' : '4px solid transparent',
                borderRadius: '12px', // Match glass border radius
                backgroundColor: isOverlay ? '#1a1a20' : 'transparent',
                boxShadow: isOverlay ? '0 10px 30px rgba(0,0,0,0.5)' : 'none'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <Briefcase size={12} /> {job.insurance.carrier}
                    </div>
                    {isStagnant && (
                        <div style={{ color: '#ef4444', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={12} /> {daysInStage}d
                        </div>
                    )}
                </div>

                <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px', color: '#fff' }}>
                    {job.customer.name}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
                    {job.property.address}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '-8px' }}>
                        {job.assignedUserIds && job.assignedUserIds.length > 0 ? (
                            job.assignedUserIds.map((uid, i) => (
                                <div key={uid} style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: `hsl(${parseInt(uid.slice(-4), 16) % 360}, 70%, 50%)`,
                                    border: '2px solid var(--bg-primary)',
                                    marginLeft: i > 0 ? '-8px' : 0
                                }} />
                            ))
                        ) : (
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                border: '1px dashed var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                color: 'var(--text-muted)'
                            }}>?</div>
                        )}
                    </div>
                    <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '100px',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--text-secondary)'
                    }}>
                        {job.status}
                    </div>
                </div>
            </div>
        </div>
    );
};

const KanbanColumn = ({ lane, jobs }: { lane: Lane; jobs: Job[] }) => {
    const { setNodeRef } = useSortable({ id: lane.id, data: { type: 'Lane', lane } });

    return (
        <div ref={setNodeRef} style={{ display: 'flex', flexDirection: 'column', minWidth: '320px', height: '100%' }}>
            <div style={{
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 8px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: lane.colors }} />
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff' }}>
                        {lane.title}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {jobs.length}
                    </span>
                </div>
                <MoreHorizontal size={16} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
            </div>

            <div style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.02)',
                borderRadius: '16px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
                    {jobs.map(job => (
                        <KanbanCard key={job.id} job={job} />
                    ))}
                    {jobs.length === 0 && (
                        <div style={{
                            height: '100px',
                            border: '1px dashed var(--border-color)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)',
                            fontSize: '0.875rem'
                        }}>
                            Drop Items Here
                        </div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
};

export const OperationsBoard: React.FC = () => {
    const { profile } = useAuth();
    const { officeId } = useParams(); // URL Driven Context
    const { offices, activeDepartmentId, activeDepartment } = useOrganization(); // Fetch offices list
    const [jobs, setJobs] = useState<Job[]>([]);
    const [activeDragItem, setActiveDragItem] = useState<Job | null>(null);

    // Derive active office from URL params
    const activeOffice = officeId ? offices.find(o => o.id === officeId) : null;

    // --- Data Fetching ---
    useEffect(() => {
        if (!profile || !officeId) return;

        let q = query(
            collection(db, 'jobs'),
            where('orgId', '==', profile.orgId),
            where('officeId', '==', officeId)
        );

        if (activeDepartmentId) {
            q = query(q, where('departmentId', '==', activeDepartmentId));
        }

        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                updatedAt: doc.data().updatedAt || { toMillis: () => Date.now() }
            })) as Job[];
            setJobs(list);
        });
        return () => unsub();
    }, [profile, officeId, activeDepartmentId]);

    // --- Lane Logic ---
    const lanes: Lane[] = [
        { id: 'unassigned', title: 'Unassigned / New', colors: 'var(--status-fnol)' },
        { id: 'in_progress', title: 'Field Operations', colors: 'var(--status-mitigation)' },
        { id: 'review', title: 'Manager Review', colors: '#eab308' }, // Yellow
        { id: 'done', title: 'Ready for Billing', colors: 'var(--status-reconstruction)' },
    ];

    const getLaneId = (job: Job): LaneId => {
        if (job.status === 'CLOSEOUT') return 'done';
        if (job.status === 'REVIEW') return 'review';
        if (job.assignedUserIds?.length > 0 && (job.status === 'MITIGATION' || job.status === 'RECONSTRUCTION')) return 'in_progress';
        return 'unassigned';
    };

    const groupedJobs = useMemo(() => {
        const groups: Record<LaneId, Job[]> = { unassigned: [], in_progress: [], review: [], done: [] };
        jobs.forEach(job => {
            const lane = getLaneId(job);
            groups[lane].push(job);
        });
        return groups;
    }, [jobs]);

    // --- DnD Handlers ---
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const job = jobs.find(j => j.id === active.id);
        if (job) setActiveDragItem(job);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        let targetLaneId: LaneId | null = null;

        if (lanes.some(l => l.id === over.id)) {
            targetLaneId = over.id as LaneId;
        } else {
            const overJob = jobs.find(j => j.id === over.id);
            if (overJob) {
                targetLaneId = getLaneId(overJob);
            }
        }

        if (targetLaneId) {
            const draggedJob = jobs.find(j => j.id === active.id);
            if (!draggedJob) return;

            const currentLaneId = getLaneId(draggedJob);
            if (currentLaneId !== targetLaneId) {
                const updates: Partial<Job> = { updatedAt: serverTimestamp() };

                if (targetLaneId === 'unassigned') {
                    updates.assignedUserIds = [];
                } else if (targetLaneId === 'in_progress') {
                    if (draggedJob.status !== 'MITIGATION' && draggedJob.status !== 'RECONSTRUCTION') {
                        updates.status = 'MITIGATION';
                    }
                    if ((draggedJob.assignedUserIds?.length || 0) === 0) {
                        updates.assignedUserIds = [profile?.uid || 'placeholder'];
                    }
                } else if (targetLaneId === 'review') {
                    updates.status = 'REVIEW';
                } else if (targetLaneId === 'done') {
                    updates.status = 'CLOSEOUT';
                }

                try {
                    await updateDoc(doc(db, 'jobs', draggedJob.id), updates);
                } catch (e) {
                    console.error("Failed to update status", e);
                }
            }
        }
    };

    // Disable DnD for Read-Only Members
    const isReadOnly = profile?.role === 'MEMBER';

    if (isReadOnly) {
        return (
            <div style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
                <header style={{ marginBottom: '24px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ color: 'var(--accent-electric)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Users size={14} /> {activeDepartment ? `${activeOffice?.name} - ${activeDepartment.name}` : (activeOffice?.name || 'Operations Board')}
                            </div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Active Claims</h1>
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            {/* Read Only Badge */}
                            <div style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                Read Only
                            </div>
                            <div style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                Active Claims: <strong style={{ color: '#fff' }}>{jobs.length}</strong>
                            </div>
                        </div>
                    </div>
                </header>

                <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '16px', height: '100%' }}>
                    {lanes.map(lane => (
                        <div key={lane.id} style={{ display: 'flex', flexDirection: 'column', minWidth: '320px', height: '100%' }}>
                            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: lane.colors }} />
                                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff' }}>{lane.title}</h3>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{groupedJobs[lane.id].length}</span>
                                </div>
                            </div>
                            <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {groupedJobs[lane.id].map(job => (
                                    <KanbanCard key={job.id} job={job} />
                                ))}
                                {groupedJobs[lane.id].length === 0 && (
                                    <div style={{ height: '100px', border: '1px dashed var(--border-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                        Empty
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
                <header style={{ marginBottom: '24px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{
                                color: 'var(--accent-electric)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                marginBottom: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <Users size={14} /> {activeDepartment ? `${activeOffice?.name} - ${activeDepartment.name}` : (activeOffice?.name || 'Operations Board')}
                            </div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Active Claims</h1>
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                background: 'rgba(255,255,255,0.05)',
                                fontSize: '0.875rem',
                                color: 'var(--text-secondary)'
                            }}>
                                Active Claims: <strong style={{ color: '#fff' }}>{jobs.length}</strong>
                            </div>
                        </div>
                    </div>
                </header>

                <div style={{
                    display: 'flex',
                    gap: '24px',
                    overflowX: 'auto',
                    paddingBottom: '16px',
                    height: '100%'
                }}>
                    {lanes.map(lane => (
                        <KanbanColumn
                            key={lane.id}
                            lane={lane}
                            jobs={groupedJobs[lane.id]}
                        />
                    ))}
                </div>
            </div>

            <DragOverlay>
                {activeDragItem ? <KanbanCard job={activeDragItem} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
};

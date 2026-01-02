import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    DndContext,
    DragOverlay,
    pointerWithin,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
    Users,
} from 'lucide-react';
import { useParams } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { getEffectiveJobStatus } from '@/utils/jobStatusUtils';
import { type Job } from '@/types/jobs';
import { jobService } from '@/pages/jobs/jobService';
import { KanbanCard, KanbanCardView } from '@/pages/jobs/components/kanban/KanbanCard';
import { KanbanColumn, type Lane, type LaneId } from '@/pages/jobs/components/kanban/KanbanColumn';
import { JobDetailsPane } from '@/pages/jobs/components/JobDetailsPane';

export const OperationsBoard: React.FC = () => {
    const { profile } = useAuth();
    const { officeId } = useParams(); // URL Driven Context
    const { offices, activeDepartmentId, activeDepartment } = useOrganization(); // Fetch offices list
    const [jobs, setJobs] = useState<Job[]>([]);
    const [activeDragItem, setActiveDragItem] = useState<Job | null>(null);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

    // Derive active office from URL params
    const activeOffice = officeId ? offices.find(o => o.id === officeId) : null;

    // --- Data Fetching ---
    // Enforce Department Context for Managers, allow Global for Admins
    const effectiveDepartmentId = (profile?.role === 'DEPT_MANAGER' || profile?.role === 'MEMBER')
        ? profile.departmentId
        : activeDepartmentId;

    useEffect(() => {
        if (!profile) return;

        let unsubscribe: any;

        if (officeId) {
            // Office Context
            unsubscribe = jobService.subscribeToOfficeJobs(
                profile.orgId,
                officeId,
                effectiveDepartmentId || null,
                (list: Job[]) => {
                    setJobs(list);
                }
            );
        } else {
            // Global Context (Owner/Admin View)
            unsubscribe = jobService.subscribeToOrganizationJobs(
                profile.orgId,
                (list: Job[]) => {
                    setJobs(list);
                }
            );
        }

        return () => unsubscribe && unsubscribe();
    }, [profile, officeId, effectiveDepartmentId]);

    // --- Lane Logic ---
    const lanes: Lane[] = [
        { id: 'assigned', title: 'Pending', colors: 'var(--status-fnol)' },
        { id: 'in_progress', title: 'Work in Progress', colors: 'var(--status-mitigation)' },
        { id: 'review', title: 'Manager Review', colors: '#eab308' }, // Yellow
        { id: 'done', title: 'Billing / Done', colors: 'var(--status-reconstruction)' },
    ];



    const getLaneId = useCallback((job: Job): LaneId => {
        const { status, isHistorical } = getEffectiveJobStatus(job, effectiveDepartmentId);

        if (status === 'BILLING') return 'done';
        if (status === 'REVIEW') return 'review';
        if (status === 'IN_PROGRESS') return 'in_progress';

        // Safety: If historical but unknown status, default to Review
        if (isHistorical && status === 'ACTIVE') return 'review';

        return 'assigned'; // PENDING
    }, [effectiveDepartmentId]);

    const groupedJobs = useMemo(() => {
        const groups: Record<LaneId, Job[]> = { assigned: [], in_progress: [], review: [], done: [] };

        jobs.forEach(job => {
            const lane = getLaneId(job);
            if (groups[lane]) {
                groups[lane].push(job);
            }
        });
        return groups;
    }, [jobs, getLaneId]);

    // --- DnD Handlers ---
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const job = jobs.find(j => j.id === active.id);
        if (job) setActiveDragItem(job);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        // console.log('Drag End:', { active: active.id, over: over?.id });
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
                const updates: Partial<Job> = {};

                if (targetLaneId === 'assigned') {
                    updates.status = 'PENDING';
                } else if (targetLaneId === 'in_progress') {
                    updates.status = 'IN_PROGRESS';

                    // Auto-assign Lead Tech if missing
                    if (!draggedJob.assignments?.leadTechnicianId && profile?.uid) {
                        updates.assignments = {
                            ...draggedJob.assignments,
                            leadTechnicianId: profile.uid
                        };
                        // Ensure they are in the ids array too
                        const currentIds = draggedJob.assignedUserIds || [];
                        if (!currentIds.includes(profile.uid)) {
                            updates.assignedUserIds = [...currentIds, profile.uid];
                        }
                    }
                } else if (targetLaneId === 'review') {
                    updates.status = 'REVIEW';
                } else if (targetLaneId === 'done') {
                    updates.status = 'BILLING';
                    try {
                        // Check if updating historical phase (Status persistence)
                        if (effectiveDepartmentId && draggedJob.departmentId !== effectiveDepartmentId) {
                            const phaseIndex = draggedJob.phases?.findIndex(p => p.departmentId === effectiveDepartmentId);
                            if (phaseIndex !== undefined && phaseIndex !== -1 && draggedJob.phases) {
                                const newPhases = [...draggedJob.phases];

                                if (targetLaneId === 'done') {
                                    newPhases[phaseIndex] = { ...newPhases[phaseIndex], stage: 'BILLING' };
                                } else if (targetLaneId === 'review') {
                                    newPhases[phaseIndex] = { ...newPhases[phaseIndex], stage: 'REVIEW' };
                                }

                                await jobService.updateJob(draggedJob.id, { phases: newPhases });
                                return; // Exit, do not update main status
                            }
                        }

                        await jobService.updateJob(draggedJob.id, updates);
                    } catch (e) {
                        console.error("Failed to update status", e);
                    }
                }
            }
        };
    };

    // Disable DnD for Read-Only Members
    const isReadOnly = profile?.role === 'MEMBER';

    if (isReadOnly) {
        return (
            <div className="relative flex flex-col h-full overflow-hidden">
                <div className="flex flex-col h-full">
                    <header className="mb-6 shrink-0">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2 text-accent-electric text-xs font-bold uppercase mb-2">
                                    <Users size={14} /> {activeDepartment ? `${activeOffice?.name} - ${activeDepartment.name}` : (activeOffice?.name || 'Operations Board')}
                                </div>
                                <h1 className="text-3xl font-extrabold m-0">Active Claims</h1>
                            </div>
                            <div className="flex gap-4">
                                <div className="px-4 py-2 rounded-lg bg-white/5 text-sm text-text-secondary">
                                    Read Only
                                </div>
                                <div className="px-4 py-2 rounded-lg bg-white/5 text-sm text-text-secondary">
                                    Active Claims: <strong className="text-white">{jobs.length}</strong>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="flex gap-6 overflow-x-auto pb-4 flex-1 min-h-0">
                        {lanes.map(lane => (
                            <div key={lane.id} className="flex flex-col min-w-[320px] h-full">
                                <div className="mb-4 flex items-center justify-between px-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lane.colors }} />
                                        <h3 className="text-sm font-bold uppercase text-white m-0">{lane.title}</h3>
                                        <span className="text-xs text-text-muted font-medium">{groupedJobs[lane.id].length}</span>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white/5 rounded-2xl p-3 flex flex-col gap-3">
                                    {groupedJobs[lane.id].map(job => (
                                        <KanbanCard
                                            key={job.id}
                                            job={job}
                                            onClick={() => setSelectedJobId(job.id)}
                                        />
                                    ))}
                                    {groupedJobs[lane.id].length === 0 && (
                                        <div className="h-24 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-text-muted text-sm">
                                            Empty
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Side Panel Overlay */}
                {selectedJobId && (
                    <JobDetailsPane
                        jobId={selectedJobId}
                        onClose={() => setSelectedJobId(null)}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="relative flex flex-col h-full overflow-hidden">
            <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex flex-col h-full">
                    <header className="mb-6 shrink-0">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2 text-accent-electric text-xs font-bold uppercase mb-2">
                                    <Users size={14} /> {activeDepartment ? `${activeOffice?.name} - ${activeDepartment.name}` : (activeOffice?.name || 'Operations Board')}
                                </div>
                                <h1 className="text-3xl font-extrabold m-0">Active Claims</h1>
                            </div>
                            <div className="flex gap-4">
                                <div className="px-4 py-2 rounded-lg bg-white/5 text-sm text-text-secondary">
                                    Active Claims: <strong className="text-white">{jobs.length}</strong>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="flex gap-6 overflow-x-auto pb-4 flex-1 min-h-0">
                        {lanes.map(lane => (
                            <KanbanColumn
                                key={lane.id}
                                lane={lane}
                                jobs={groupedJobs[lane.id]}
                                onAdd={() => window.location.href = `/office/${officeId}/jobs/new`}
                                onJobClick={(job) => setSelectedJobId(job.id)}
                            />
                        ))}
                    </div>
                </div>

                <DragOverlay dropAnimation={null}>
                    {activeDragItem ? (
                        <div style={{ width: '320px' }}>
                            <KanbanCardView job={activeDragItem} isOverlay />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Side Panel Overlay */}
            {selectedJobId && (
                <JobDetailsPane
                    jobId={selectedJobId}
                    onClose={() => setSelectedJobId(null)}
                />
            )}
        </div>
    );
};

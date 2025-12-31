import React, { useState, useEffect, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
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
import { type Job } from '@/types/jobs';
import { jobService } from '@/pages/jobs/jobService';
import { KanbanCard } from '@/pages/jobs/components/kanban/KanbanCard';
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

        let unsubscribe;

        if (officeId) {
            // Office Context
            unsubscribe = jobService.subscribeToOfficeJobs(
                profile.orgId,
                officeId,
                effectiveDepartmentId || null,
                (list: Job[]) => {
                    // Filter out unassigned jobs for the board view as requested
                    const assignedOnly = list.filter(j => !!j.assignments?.leadTechnicianId);
                    setJobs(assignedOnly);
                }
            );
        } else {
            // Global Context (Owner/Admin View)
            unsubscribe = jobService.subscribeToOrganizationJobs(
                profile.orgId,
                (list: Job[]) => {
                    // Filter out unassigned jobs for the board view as requested
                    const assignedOnly = list.filter(j => !!j.assignments?.leadTechnicianId);
                    setJobs(assignedOnly);
                }
            );
        }

        return () => unsubscribe && unsubscribe();
    }, [profile, officeId, effectiveDepartmentId]);

    // --- Lane Logic ---
    const lanes: Lane[] = [
        { id: 'assigned', title: 'Assigned / Ready', colors: 'var(--status-fnol)' },
        { id: 'in_progress', title: 'Field Operations', colors: 'var(--status-mitigation)' },
        { id: 'review', title: 'Manager Review', colors: '#eab308' }, // Yellow
        { id: 'done', title: 'Ready for Billing', colors: 'var(--status-reconstruction)' },
    ];

    const getLaneId = (job: Job): LaneId => {
        if (job.status === 'CLOSEOUT') return 'done';
        if (job.status === 'REVIEW') return 'review';
        if (job.status === 'MITIGATION' || job.status === 'RECONSTRUCTION') return 'in_progress';
        return 'assigned';
    };

    const groupedJobs = useMemo(() => {
        const groups: Record<LaneId, Job[]> = { assigned: [], in_progress: [], review: [], done: [] };

        jobs.forEach(job => {
            const lane = getLaneId(job);
            groups[lane].push(job);
        });
        return groups;
    }, [jobs]);

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
                    updates.status = 'FNOL';
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
                    await jobService.updateJob(draggedJob.id, updates);
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
                collisionDetection={closestCorners}
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

                    <div className="flex gap-6 overflow-x-auto pb-4 flex-1 min-h-0 pr-[600px]">
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

                <DragOverlay>
                    {activeDragItem ? <KanbanCard job={activeDragItem} isOverlay /> : null}
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

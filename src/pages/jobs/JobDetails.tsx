import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, collection, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

import { getEffectiveAssignments } from '@/utils/jobStatusUtils';

import { type Job } from '@/types/jobs';
import { type UserProfile } from '@/types/team';
import { PlayCircle } from 'lucide-react';

import { JobOverviewTab } from './tabs/JobOverviewTab';
import { JobIntelligenceTab } from './tabs/JobIntelligenceTab';
import { JobSiteModelTab } from './tabs/JobSiteModelTab';
import { JobScopeTab } from './tabs/JobScopeTab';
import { JobPhotosTab } from './tabs/JobPhotosTab';
import { JobCreate } from './JobCreate';

// New Components
import { JobDetailsHeader } from './components/JobDetailsHeader';
import { JobPhaseTimeline, type TabType } from './components/JobPhaseTimeline';
import { JobHandoffModal } from './components/JobHandoffModal';

export const JobDetails: React.FC = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);

    // Full Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);

    // Handoff State
    const [showHandoffModal, setShowHandoffModal] = useState(false);
    const [handoffTargetDeptId, setHandoffTargetDeptId] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);

    // Phase Navigation
    const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
    // Tab Navigation for Content
    const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');

    // Initial Phase Selection
    useEffect(() => {
        if (job?.phases && job.phases.length > 0 && !activePhaseId) {
            const active = job.phases.find(p => p.status === 'ACTIVE');
            setActivePhaseId(active ? active.id : job.phases[job.phases.length - 1].id);
        }
    }, [job?.phases, activePhaseId]);

    // Fetch Departments
    useEffect(() => {
        if (!profile?.orgId) return;
        const qDepts = query(collection(db, 'departments'), where('orgId', '==', profile.orgId));
        const unsub = onSnapshot(qDepts, (snap) => {
            setDepartments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [profile?.orgId]);

    useEffect(() => {
        if (!jobId || !profile?.orgId) return;

        // Fetch Job
        const unsubJob = onSnapshot(doc(db, 'jobs', jobId), (doc) => {
            if (doc.exists()) {
                const jobData = { id: doc.id, ...doc.data() } as Job;
                setJob(jobData);

            } else {
                setJob(null);
            }
            setLoading(false);
        });

        // Fetch Users (for dropdowns)
        const qUsers = query(collection(db, 'users'), where('orgId', '==', profile.orgId));
        const unsubUsers = onSnapshot(qUsers, (snap) => {
            setUsers(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
        });

        return () => {
            unsubJob();
            unsubUsers();
        };
    }, [jobId, profile?.orgId]);


    const handleHandoff = async () => {
        if (!job || !activePhaseId || !handoffTargetDeptId) return;
        setIsTransferring(true);

        try {
            const currentPhaseIndex = job.phases?.findIndex(p => p.id === activePhaseId);
            if (currentPhaseIndex === -1 || currentPhaseIndex === undefined) return;

            const currentPhase = job.phases![currentPhaseIndex];
            const targetDept = departments.find(d => d.id === handoffTargetDeptId);

            // 1. Create New Phase
            const newPhaseId = `phase_${targetDept.name.substring(0, 3).toLowerCase()}_${Date.now()}`;
            const newPhase: any = {
                id: newPhaseId,
                departmentId: handoffTargetDeptId,
                name: targetDept.name,
                status: 'ACTIVE',
                data: { ...currentPhase.data }, // Clone data
                assignments: {
                    supervisorId: targetDept.managerId || null, // Auto-assign dept manager
                    leadTechnicianId: null,
                    teamMemberIds: []
                }
            };

            // 2. Prepare Updates
            const updatedPhases = [...(job.phases || [])];
            // Mark current as completed
            updatedPhases[currentPhaseIndex] = {
                ...currentPhase,
                status: 'COMPLETED',
                stage: 'REVIEW', // Set initial Kanban stage for previous dept
                completedBy: profile?.uid,
                completedAt: serverTimestamp() as any, // Consistent Server Time
                assignments: job.assignments || {} // Snapshot current assignments
            };
            // Add new phase
            updatedPhases.push(newPhase);

            // 3. Calculate updated dept history
            const currentDeptIds = job.departmentIds || [job.departmentId];
            const updatedDepartmentIds = Array.from(new Set([...currentDeptIds, handoffTargetDeptId]));

            // 4. Update Job
            await updateDoc(doc(db, 'jobs', jobId!), {
                phases: updatedPhases,
                departmentId: handoffTargetDeptId, // Transfer job ownership
                departmentIds: updatedDepartmentIds, // Maintain history
                status: 'PENDING', // Start as Pending in new dept
                assignedUserIds: targetDept.managerId ? [targetDept.managerId] : [],
                assignments: {
                    supervisorId: targetDept.managerId || null,
                    leadTechnicianId: null,
                    teamMemberIds: []
                }
            });

            setShowHandoffModal(false);
            setActivePhaseId(newPhaseId); // Switch to new phase
        } catch (error) {
            console.error("Handoff Error:", error);
        } finally {
            setIsTransferring(false);
        }
    };

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        if (!job) return;

        try {
            // Context-Aware Update Logic
            if (profile?.departmentId && job.departmentId !== profile.departmentId) {
                // 1. Updating Historical Phase (e.g. moving from Review to Billing)
                const phaseIndex = job.phases?.findIndex(p => p.departmentId === profile.departmentId);
                if (phaseIndex !== undefined && phaseIndex !== -1 && job.phases) {
                    const newPhases = [...job.phases];

                    // Map all statuses for phases
                    let newStage: 'PENDING' | 'IN_PROGRESS' | 'REVIEW' | 'BILLING' | undefined;
                    if (newStatus === 'BILLING' || newStatus === 'COMPLETED') newStage = 'BILLING';
                    else if (newStatus === 'REVIEW') newStage = 'REVIEW';
                    else if (newStatus === 'IN_PROGRESS') newStage = 'IN_PROGRESS';
                    else if (newStatus === 'PENDING') newStage = 'PENDING';

                    if (newStage) {
                        newPhases[phaseIndex] = { ...newPhases[phaseIndex], stage: newStage };
                        await updateDoc(doc(db, 'jobs', jobId!), {
                            phases: newPhases,
                            updatedAt: serverTimestamp()
                        });
                    } else {
                        console.warn("Invalid status for historical phase");
                    }
                }
            } else {
                // 2. Updating Standard Active Job
                await updateDoc(doc(db, 'jobs', jobId!), {
                    status: newStatus,
                    updatedAt: serverTimestamp()
                });
            }
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    // --- PERMISSIONS & PHASE LOGIC ---
    const isManagerOrAdmin = !!(profile && ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER'].includes(profile.role));

    // Construct Effective Phases (Top Level for Permission Logic)
    const effectivePhases = (job?.phases && job.phases.length > 0)
        ? job.phases
        : (job ? [{
            id: 'current_phase',
            departmentId: job.departmentId,
            name: departments.find(d => d.id === job.departmentId)?.name || 'Current',
            status: 'ACTIVE',
            data: job.claimData || {},
            assignments: job.assignments
        }] : []);

    const activePhase = effectivePhases.find(p => p.id === activePhaseId) || effectivePhases.find(p => p.status === 'ACTIVE') || effectivePhases[effectivePhases.length - 1];
    const isPhaseManager = activePhase?.assignments?.supervisorId === profile?.uid;
    const canTransfer = (isManagerOrAdmin || isPhaseManager) && activePhase?.status === 'ACTIVE';

    if (loading) return <div className="p-10 text-accent-electric animate-pulse">Loading Job Details...</div>;
    if (!job) return <div className="p-10 text-red-500">Job not found.</div>;

    // Days Open Calculation
    let daysOpen = 0;
    if (job.dates?.fnolReceivedDate) {
        const fnol = new Date(job.dates.fnolReceivedDate.seconds * 1000);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - fnol.getTime());
        daysOpen = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }


    return (
        <div className="flex flex-col h-screen overflow-hidden bg-black/40 backdrop-blur-sm -m-6 relative">

            <JobDetailsHeader
                job={job}
                profile={profile}
                navigate={navigate as any}
                daysOpen={daysOpen}
                isManagerOrAdmin={isManagerOrAdmin}
                canTransfer={!!canTransfer}
                onStatusChange={handleStatusChange}
                onEdit={() => setShowEditModal(true)}
                onHandoff={() => setShowHandoffModal(true)}
            />

            {/* 2. MAIN SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">
                <div className="max-w-[1600px] mx-auto p-6 space-y-8">

                    <JobPhaseTimeline
                        effectivePhases={effectivePhases}
                        activePhaseId={activePhaseId}
                        setActivePhaseId={setActivePhaseId}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        activePhase={activePhase}
                    />


                    {/* DYNAMIC CONTENT AREA */}
                    <div className="min-h-[500px] animate-in slide-in-from-bottom-2 fade-in duration-300">
                        {(() => {
                            // Ensure activePhaseId is synced or default to active
                            if (!activePhaseId && activePhase) {
                                try { setActivePhaseId(activePhase.id); } catch (e) { }
                            }

                            const selectedPhase = activePhase || effectivePhases[0];
                            if (!selectedPhase) return <div className="text-text-muted flex items-center gap-2"><PlayCircle className="animate-spin" /> Loading Phase...</div>;

                            const isPhaseReadOnly = selectedPhase.status === 'COMPLETED';

                            const safeData = (selectedPhase.data as any) || {};
                            const claimData: any = {
                                lineItems: safeData.lineItems || [],
                                preScan: safeData.preScan || { images: [], measurements: [], notes: '' },
                                aiAnalysis: safeData.aiAnalysis || { summary: '', recommendedActions: [], referencedStandards: [] },
                                ...safeData
                            };

                            return (
                                <>
                                    {activeTab === 'OVERVIEW' && (
                                        <JobOverviewTab
                                            job={job}
                                            classification={claimData.classification}
                                            leadTech={users.find(u => u.uid === getEffectiveAssignments(job, profile?.departmentId).assignments?.leadTechnicianId)}
                                            supervisor={users.find(u => u.uid === getEffectiveAssignments(job, profile?.departmentId).assignments?.supervisorId)}
                                        />
                                    )}
                                    {activeTab === 'INTELLIGENCE' && (
                                        <JobIntelligenceTab
                                            data={claimData}
                                            departmentType={departments.find(d => d.id === selectedPhase.departmentId)?.type || 'GENERAL'}
                                        />
                                    )}
                                    {activeTab === 'MODEL' && (
                                        <JobSiteModelTab
                                            data={claimData}
                                        />
                                    )}
                                    {activeTab === 'SCOPE' && (
                                        <JobScopeTab
                                            data={claimData}
                                            readOnly={isPhaseReadOnly}
                                        />
                                    )}
                                    {activeTab === 'PHOTOS' && (
                                        <JobPhotosTab
                                            data={claimData}
                                            readOnly={isPhaseReadOnly}
                                        />
                                    )}
                                </>
                            );
                        })()}
                    </div>

                </div>
            </div>


            {/* Edit Modal */}
            {
                showEditModal && job && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="min-h-screen px-4 text-center">
                            <JobCreate
                                onClose={() => setShowEditModal(false)}
                                initialData={job}
                                jobId={job.id}
                            />
                        </div>
                    </div>

                )
            }

            {showHandoffModal && (
                <JobHandoffModal
                    onClose={() => setShowHandoffModal(false)}
                    onConfirm={handleHandoff}
                    activePhase={activePhase}
                    departments={departments}
                    targetDeptId={handoffTargetDeptId}
                    setTargetDeptId={setHandoffTargetDeptId}
                    isTransferring={isTransferring}
                />
            )}
        </div >
    );
};

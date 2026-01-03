import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, collection, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

import { getEffectiveAssignments } from '@/utils/jobStatusUtils';

import { type Job } from '@/types/jobs';
import { type UserProfile } from '@/types/team';
import {
    ArrowLeft,
    Briefcase,
    MapPin,
    Users,
    Pencil,
    BrainCircuit,
    CheckCircle2,
    PlayCircle,
    Send,
    X,
    Ruler
} from 'lucide-react';

import { JobOverviewTab } from './tabs/JobOverviewTab';
import { JobSiteModelTab } from './tabs/JobSiteModelTab';
import { JobScopeTab } from './tabs/JobScopeTab';
import { JobPhotosTab } from './tabs/JobPhotosTab';
import { JobCreate } from './JobCreate';

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
    type TabType = 'OVERVIEW' | 'MODEL' | 'SCOPE' | 'PHOTOS' | 'DOCS';
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

            // 2. Calculate updated dept history
            const currentDeptIds = job.departmentIds || [job.departmentId];
            const updatedDepartmentIds = Array.from(new Set([...currentDeptIds, handoffTargetDeptId]));

            // 3. Update Job
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

    // --- PERMISSIONS & PHASE LOGIC ---
    const isManagerOrAdmin = profile && ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER'].includes(profile.role);

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


    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-20">
            {/* Header Area: Title & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                {/* Left: Nav & Title */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-white/10 text-text-muted hover:text-white transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-white">{job.customer.name}</h1>
                            <span className="hidden">Status</span>
                            <select
                                value={
                                    (profile?.role === 'DEPT_MANAGER' && profile.departmentId && job.departmentId !== profile.departmentId)
                                        ? (job.phases?.find(p => p.departmentId === profile.departmentId)?.stage || 'REVIEW')
                                        : job.status
                                }
                                onChange={async (e) => {
                                    const newStatus = e.target.value;
                                    const isHistorical = profile?.role === 'DEPT_MANAGER' && profile.departmentId && job.departmentId !== profile.departmentId;

                                    if (isHistorical) {
                                        // Update Phase Stage
                                        const phase = job.phases?.find(p => p.departmentId === profile.departmentId);
                                        if (phase && job.phases) {
                                            const updatedPhases = [...job.phases];
                                            const idx = updatedPhases.findIndex(p => p.id === phase.id);
                                            if (idx !== -1) {
                                                updatedPhases[idx] = { ...updatedPhases[idx], stage: newStatus as any };
                                                await updateDoc(doc(db, 'jobs', jobId!), { phases: updatedPhases });
                                            }
                                        }
                                    } else {
                                        await updateDoc(doc(db, 'jobs', jobId!), { status: newStatus });
                                    }
                                }}
                                className="bg-white/10 text-xs font-bold uppercase tracking-wider text-text-secondary border border-white/10 rounded-lg px-2 py-1 outline-none focus:border-accent-electric cursor-pointer hover:bg-white/20 transition-all"
                            >
                                {(profile?.role === 'DEPT_MANAGER' && profile.departmentId && job.departmentId !== profile.departmentId) ? (
                                    <>
                                        <option value="REVIEW">Manager Review</option>
                                        <option value="BILLING">Billing / Done</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="PENDING">Pending</option>
                                        <option value="IN_PROGRESS">Work in Progress</option>
                                        <option value="REVIEW">Manager Review</option>
                                        <option value="BILLING">Billing</option>
                                    </>
                                )}
                            </select>
                        </div>
                        <p className="text-text-muted flex items-center gap-2 mt-1">
                            <MapPin size={14} className="text-accent-primary" />
                            {job.property.address}, {job.property.city}, {job.property.state}
                        </p>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    {/* Push Action */}
                    {canTransfer && (
                        <button
                            onClick={() => setShowHandoffModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-black hover:border-green-500 rounded-lg font-bold transition-all shadow-[0_0_10px_rgba(34,197,94,0.1)] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] text-sm"
                        >
                            <Send size={16} />
                            Push Job
                        </button>
                    )}

                    {isManagerOrAdmin && (
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-white font-bold text-sm"
                        >
                            <Pencil size={16} />
                            Edit Job
                        </button>
                    )}
                </div>

            </div>

            {/* Edit Modal */}
            {
                showEditModal && job && (
                    <JobCreate
                        onClose={() => setShowEditModal(false)}
                        initialData={job}
                        jobId={job.id}
                    />
                )
            }

            {/* Dashboard Grid Layout */}
            <div className="space-y-8">



                {/* AI Claim Analysis - Full Width */}
                {/* Multi-Phase Analysis Section */}
                {/* Content Tabs Navigation */}
                <div className="flex border-b border-white/10">
                    {[
                        { id: 'OVERVIEW', label: 'Overview', icon: Briefcase },
                        { id: 'MODEL', label: 'Site Model', icon: BrainCircuit },
                        { id: 'SCOPE', label: 'Scope', icon: Ruler },
                        { id: 'PHOTOS', label: 'Photos', icon: Users }, // Using generic icon if Camera not imported, but best to stick to consistent icons
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`
                                    px-6 py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2
                                    ${isActive
                                        ? 'border-accent-electric text-white'
                                        : 'border-transparent text-text-muted hover:text-white hover:border-white/20'}
                                `}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                    <button disabled className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-text-muted/30 cursor-not-allowed">
                        Documents
                    </button>
                </div>


                {/* AI Claim Analysis - Full Width */}
                {/* Multi-Phase Analysis Section (Unified) */}
                {(() => {
                    // Use Top-Level Effective Phases
                    // Ensure activePhaseId is synced or default to active
                    if (!activePhaseId && activePhase) {
                        try { setActivePhaseId(activePhase.id); } catch (e) { } // Effect handles this, but safe guard
                    }

                    const selectedPhase = activePhase || effectivePhases[0];
                    if (!selectedPhase) return <div>Loading Phase Data...</div>;

                    const isPhaseReadOnly = selectedPhase.status === 'COMPLETED';

                    // Default empty data to satisfy TS ClaimData type
                    const safeData = (selectedPhase.data as any) || {};
                    const claimData: any = {
                        lineItems: safeData.lineItems || [],
                        preScan: safeData.preScan || { images: [], measurements: [], notes: '' },
                        aiAnalysis: safeData.aiAnalysis || { summary: '', recommendedActions: [], referencedStandards: [] },
                        ...safeData
                    };

                    return (
                        <div className="space-y-6">

                            {/* Phase Tabs Only (Push moved to header) */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 overflow-x-auto pb-2 flex-1 scrollbar-hide">
                                    {effectivePhases.map((phase: any) => { // Typing loose here for synthetic phase
                                        const isActive = selectedPhase.id === phase.id;
                                        const isCompleted = phase.status === 'COMPLETED';

                                        return (
                                            <button
                                                key={phase.id}
                                                // If it's the synthetic ID, we just keep using it. 
                                                // For real phases, we switch.
                                                onClick={() => setActivePhaseId(phase.id)}
                                                className={`
                                                    group flex items-center gap-3 px-5 py-3 rounded-xl border transition-all whitespace-nowrap min-w-fit
                                                    ${isActive
                                                        ? 'bg-accent-electric text-black border-accent-electric shadow-[0_0_15px_rgba(0,242,255,0.3)]'
                                                        : 'bg-white/5 border-white/5 text-text-muted hover:bg-white/10 hover:text-white'
                                                    }
                                                `}
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle2 size={16} className={isActive ? 'text-black' : 'text-green-500'} />
                                                ) : (
                                                    <PlayCircle size={16} className={isActive ? 'text-black' : 'text-accent-electric'} />
                                                )}
                                                <div className="text-left">
                                                    <div className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-black/70' : 'text-text-muted group-hover:text-white'}`}>
                                                        {phase.status}
                                                    </div>
                                                    <div className={`font-bold ${isActive ? 'text-black' : 'text-white'}`}>
                                                        {phase.name}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Push Action - Only if Active & Authorized */}
                                {/* {(canTransfer || (!job.phases?.length)) && ( // Allow push for legacy 'active' jobs too
                                    <button
                                        onClick={() => setShowHandoffModal(true)}
                                        className="shrink-0 flex items-center gap-2 px-5 py-3 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-black hover:border-green-500 rounded-xl font-bold transition-all shadow-[0_0_10px_rgba(34,197,94,0.1)] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                                    >
                                        <Send size={18} />
                                        <span>Push</span>
                                    </button>
                                )} */}
                            </div>

                            {/* Active Phase Content - Tabbed View */}
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {activeTab === 'OVERVIEW' && (
                                    <JobOverviewTab
                                        job={job}
                                        data={claimData}
                                        leadTech={users.find(u => u.uid === getEffectiveAssignments(job, profile?.departmentId).assignments?.leadTechnicianId)}
                                        supervisor={users.find(u => u.uid === getEffectiveAssignments(job, profile?.departmentId).assignments?.supervisorId)}
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
                            </div>

                        </div>
                    );
                })()}



            </div>

            {showHandoffModal && (
                <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Send className="text-green-400" size={20} />
                                Push Job
                            </h2>
                            <button onClick={() => setShowHandoffModal(false)} className="text-text-muted hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <label className="text-[10px] font-bold text-text-muted uppercase mb-2 block">Current Phase</label>
                                <div className="text-white font-bold">{activePhase?.name}</div>
                                <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Will be marked as Completed
                                </div>
                            </div>

                            <div className="flex justify-center text-text-muted">
                                <ArrowLeft size={20} className="-rotate-90" />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-text-muted uppercase mb-2 block">Select Next Department</label>
                                <select
                                    value={handoffTargetDeptId}
                                    onChange={(e) => setHandoffTargetDeptId(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-accent-electric outline-none"
                                >
                                    <option value="">Choose Department...</option>
                                    {departments
                                        .filter(d => d.id !== activePhase?.departmentId)
                                        .map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            <p className="text-xs text-text-muted text-center pt-2">
                                Moving to a new department will reset team assignments (Manager will be auto-assigned).
                            </p>

                            <div className="flex gap-3 pt-4 border-t border-white/10">
                                <button
                                    onClick={() => setShowHandoffModal(false)}
                                    className="flex-1 py-3 rounded-lg font-bold text-sm bg-white/5 text-white hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleHandoff}
                                    disabled={!handoffTargetDeptId || isTransferring}
                                    className="flex-1 py-3 rounded-lg font-bold text-sm bg-green-500 text-black hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isTransferring ? 'Pushing...' : 'Confirm Push'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

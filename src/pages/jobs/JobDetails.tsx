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
    Ruler,
    Building2,
    Calendar,
    Clock,
    Hash,
    Activity
} from 'lucide-react';

import { JobOverviewTab } from './tabs/JobOverviewTab';
import { JobIntelligenceTab } from './tabs/JobIntelligenceTab';
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
    type TabType = 'OVERVIEW' | 'INTELLIGENCE' | 'MODEL' | 'SCOPE' | 'PHOTOS' | 'DOCS';
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

            {/* 1. STICKY COMMAND HEADER */}
            <div className="bg-black/40 backdrop-blur-md border-b border-white/5 shadow-2xl z-50 shrink-0">

                {/* Top Row: Navigation, Title, Status Actions */}
                <div className="px-6 py-4 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-all border border-white/5"
                        >
                            <ArrowLeft size={20} />
                        </button>

                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-white tracking-tight">{job.customer.name}</h1>
                                {/* Status Chip */}
                                <div className="bg-accent-electric/10 border border-accent-electric/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase text-accent-electric tracking-wider flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent-electric animate-pulse"></span>
                                    {job.status.replace('_', ' ')}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-text-muted font-medium">
                                <span className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
                                    <MapPin size={12} className="text-accent-primary" />
                                    {job.property.address}, {job.property.city}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Status Dropdown (Manager/Admin Only) */}
                        {isManagerOrAdmin && (
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <Activity size={14} className="text-accent-electric animate-pulse" />
                                </div>
                                <select
                                    value={job.status}
                                    onChange={async (e) => {
                                        try {
                                            await updateDoc(doc(db, 'jobs', jobId!), {
                                                status: e.target.value,
                                                updatedAt: serverTimestamp()
                                            });
                                        } catch (err) {
                                            console.error("Failed to update status", err);
                                        }
                                    }}
                                    className="appearance-none pl-9 pr-8 py-2 bg-accent-electric/10 border border-accent-electric/50 hover:border-accent-electric text-accent-electric font-black uppercase text-xs rounded-lg cursor-pointer outline-none transition-all shadow-[0_0_10px_rgba(0,242,255,0.1)] hover:shadow-[0_0_20px_rgba(0,242,255,0.2)] tracking-wider"
                                >
                                    <option value="PENDING" className="bg-[#111] text-text-muted font-medium">Pending</option>
                                    <option value="IN_PROGRESS" className="bg-[#111] text-blue-400 font-bold">Work in Progress</option>
                                    <option value="REVIEW" className="bg-[#111] text-yellow-500 font-bold">Manager Review</option>
                                    <option value="BILLING" className="bg-[#111] text-orange-400 font-bold">Billing</option>
                                    <option value="COMPLETED" className="bg-[#111] text-green-500 font-bold">Completed</option>
                                    <option value="CANCELLED" className="bg-[#111] text-red-500 font-bold">Cancelled</option>
                                </select>
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-accent-electric">
                                    <ArrowLeft size={10} className="-rotate-90" />
                                </div>
                            </div>
                        )}

                        {canTransfer && (
                            <button
                                onClick={() => setShowHandoffModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-black hover:border-green-500 rounded-lg font-bold transition-all shadow-[0_0_10px_rgba(34,197,94,0.1)] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] text-xs uppercase tracking-wider"
                            >
                                <Send size={14} />
                                <span className="hidden sm:inline">Push Job</span>
                            </button>
                        )}
                        {isManagerOrAdmin && (
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-white font-bold text-xs uppercase tracking-wider"
                            >
                                <Pencil size={14} />
                                <span className="hidden sm:inline">Edit</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* INFO BAR: Persistent Context */}
                <div className="px-6 py-2 bg-transparent border-t border-white/5 flex items-center gap-8 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-2 shrink-0">
                        <Building2 size={14} className="text-text-muted" />
                        <span className="text-[10px] uppercase font-bold text-text-muted">Carrier</span>
                        <span className="text-sm font-bold text-white truncate max-w-[150px]">{job.insurance.carrier || 'N/A'}</span>
                    </div>
                    <div className="w-px h-4 bg-white/10 shrink-0"></div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Hash size={14} className="text-text-muted" />
                        <span className="text-[10px] uppercase font-bold text-text-muted">Claim #</span>
                        <span className="text-sm font-mono text-accent-electric tracking-wide select-all">{job.insurance.claimNumber || 'N/A'}</span>
                    </div>
                    <div className="w-px h-4 bg-white/10 shrink-0"></div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Users size={14} className="text-text-muted" />
                        <span className="text-[10px] uppercase font-bold text-text-muted">Adjuster</span>
                        <span className="text-sm font-bold text-white truncate">{job.insurance.adjusterName || 'N/A'}</span>
                    </div>
                    <div className="w-px h-4 bg-white/10 shrink-0"></div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Calendar size={14} className="text-text-muted" />
                        <span className="text-[10px] uppercase font-bold text-text-muted">Loss Date</span>
                        <span className="text-sm font-bold text-white">{job.dates?.lossDate ? new Date(job.dates.lossDate.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="w-px h-4 bg-white/10 shrink-0"></div>
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                        <div className="flex flex-col items-end leading-none">
                            <span className="text-[10px] uppercase font-bold text-text-muted">Open</span>
                            <span className="text-sm font-bold text-accent-electric">{daysOpen} Days</span>
                        </div>
                        <Clock size={20} className="text-accent-electric/50" />
                    </div>
                </div>

            </div>


            {/* 2. MAIN SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">
                <div className="max-w-[1600px] mx-auto p-6 space-y-8">

                    {/* Phase & Scope Navigation */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-1">

                        {/* Phase Timeline Refined */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide -mx-6 px-6 lg:mx-0 lg:px-0">
                            {effectivePhases.map((phase: any) => {
                                const isActive = (activePhaseId || activePhase?.id) === phase.id;
                                const isCompleted = phase.status === 'COMPLETED';

                                return (
                                    <button
                                        key={phase.id}
                                        onClick={() => setActivePhaseId(phase.id)}
                                        className={`
                                            group relative flex flex-col items-start min-w-[120px] px-4 py-2 rounded-lg transition-all border
                                            ${isActive
                                                ? 'bg-white/5 border-accent-electric/50 shadow-[0_0_20px_rgba(0,242,255,0.1)]'
                                                : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10 text-text-muted'}
                                        `}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            {isCompleted ? (
                                                <CheckCircle2 size={14} className="text-green-500" />
                                            ) : (
                                                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-accent-electric animate-pulse' : 'bg-white/20'}`}></div>
                                            )}
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-accent-electric' : 'text-text-muted'}`}>
                                                {phase.status}
                                            </span>
                                        </div>
                                        <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-text-muted group-hover:text-white'}`}>
                                            {phase.name}
                                        </span>

                                        {/* Active Indicator Line */}
                                        {isActive && (
                                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-electric shadow-[0_0_10px_#00f2ff]"></div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content Tabs */}
                        <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5 self-start">
                            {[
                                { id: 'OVERVIEW', label: 'Overview', icon: Briefcase },
                                { id: 'INTELLIGENCE', label: 'Intelligence', icon: BrainCircuit },
                                { id: 'MODEL', label: '3D Model', icon: BrainCircuit },
                                { id: 'SCOPE', label: 'Scope', icon: Ruler },
                                { id: 'PHOTOS', label: 'Photos', icon: Users },
                            ].map(tab => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as TabType)}
                                        className={`
                                            px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all
                                            ${isActive
                                                ? 'bg-accent-electric text-black shadow-lg shadow-accent-electric/20'
                                                : 'text-text-muted hover:text-white hover:bg-white/5'}
                                        `}
                                    >
                                        <tab.icon size={14} />
                                        <span className="hidden md:inline">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                    </div>


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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
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

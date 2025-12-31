import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { type Job, type JobAssignments } from '@/types/jobs';
import { type UserProfile } from '@/types/team';
import {
    Briefcase,
    MapPin,
    Calendar,
    Users,
    Pencil,
    X,
    ExternalLink
} from 'lucide-react';
import { JobCreate } from '../JobCreate';
import { useNavigate } from 'react-router-dom';

interface JobDetailsPaneProps {
    jobId: string;
    onClose: () => void;
}

export const JobDetailsPane: React.FC<JobDetailsPaneProps> = ({ jobId, onClose }) => {
    const { profile } = useAuth();
    const navigate = useNavigate();

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserProfile[]>([]);

    // Assignment Editing State
    const [isEditingAssignments, setIsEditingAssignments] = useState(false);
    const [assignments, setAssignments] = useState<JobAssignments>({});
    const [saving, setSaving] = useState(false);

    // Full Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        if (!jobId || !profile?.orgId) return;

        // Fetch Job
        const unsubJob = onSnapshot(doc(db, 'jobs', jobId), (doc) => {
            if (doc.exists()) {
                const jobData = { id: doc.id, ...doc.data() } as Job;
                setJob(jobData);
                // Initialize local assignment state
                setAssignments(jobData.assignments || {});
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

    const handleSaveAssignments = async () => {
        if (!jobId || !job) return;
        setSaving(true);
        try {
            const assignedIds = new Set<string>();
            if (assignments.supervisorId) assignedIds.add(assignments.supervisorId);
            if (assignments.leadTechnicianId) assignedIds.add(assignments.leadTechnicianId);
            assignments.teamMemberIds?.forEach(id => assignedIds.add(id));

            await updateDoc(doc(db, 'jobs', jobId), {
                assignments: assignments,
                assignedUserIds: Array.from(assignedIds)
            });
            setIsEditingAssignments(false);
        } catch (error) {
            console.error("Error updating assignments:", error);
        } finally {
            setSaving(false);
        }
    };

    const isManagerOrAdmin = profile && ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER'].includes(profile.role);

    if (loading) return <div className="h-full flex items-center justify-center text-accent-electric animate-pulse">Loading Details...</div>;
    if (!job) return <div className="h-full flex items-center justify-center text-red-500">Job not found.</div>;

    const leadTech = users.find(u => u.uid === job.assignments?.leadTechnicianId);
    const supervisor = users.find(u => u.uid === job.assignments?.supervisorId);

    return (
        <div className="flex flex-col h-full bg-[#0f172a] shadow-2xl border-l border-white/10 w-full max-w-2xl md:w-[600px] absolute right-0 top-0 bottom-0 z-100 transform transition-transform duration-300">
            {/* Header */}
            <div className="flex-none p-6 border-b border-white/5 flex items-start justify-between bg-black/20">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${job.status === 'MITIGATION' ? 'text-blue-400 border-blue-400/20 bg-blue-400/10' : 'text-text-muted border-white/10'}`}>
                            {job.status}
                        </span>
                        <h2 className="text-xl font-bold text-white leading-tight">{job.customer.name}</h2>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted text-xs">
                        <MapPin size={12} />
                        {job.property.address}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(job.officeId ? `/office/${job.officeId}/department/${job.departmentId || ''}/jobs/${job.id}` : `/jobs/${job.id}`)}
                        className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-white transition-colors"
                        title="Open Full Page"
                    >
                        <ExternalLink size={18} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                {/* Actions Bar */}
                {isManagerOrAdmin && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-white font-bold text-xs flex items-center justify-center gap-2"
                        >
                            <Pencil size={14} /> Edit Details
                        </button>
                        <button className="flex-1 py-2 bg-accent-electric/10 border border-accent-electric/20 rounded-lg hover:bg-accent-electric/20 text-accent-electric font-bold text-xs flex items-center justify-center gap-2">
                            <Users size={14} /> Manage Team
                        </button>
                    </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <label className="text-[10px] font-bold text-text-muted uppercase block mb-1">Carrier</label>
                        <div className="text-white font-bold truncate">{job.insurance.carrier || 'N/A'}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <label className="text-[10px] font-bold text-text-muted uppercase block mb-1">Claim #</label>
                        <div className="text-white font-mono text-sm truncate">{job.insurance.claimNumber || 'N/A'}</div>
                    </div>
                </div>

                {/* Description */}
                {job.details.lossDescription && (
                    <div>
                        <h3 className="text-xs font-bold text-text-muted uppercase mb-3 flex items-center gap-2">
                            <Briefcase size={14} /> Loss Description
                        </h3>
                        <div className="text-sm text-text-secondary leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
                            {job.details.lossDescription}
                        </div>
                    </div>
                )}

                {/* Team Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-text-muted uppercase flex items-center gap-2">
                            <Users size={14} /> Assignments
                        </h3>
                        {!isEditingAssignments && isManagerOrAdmin && (
                            <button
                                onClick={() => setIsEditingAssignments(true)}
                                className="text-[10px] font-bold text-accent-electric hover:underline"
                            >
                                Change
                            </button>
                        )}
                    </div>

                    <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                        {!isEditingAssignments ? (
                            <div className="divide-y divide-white/5">
                                <div className="p-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-accent-electric text-black flex items-center justify-center font-bold text-xs">
                                        {leadTech?.displayName[0] || '?'}
                                    </div>
                                    <div>
                                        <div className="text-white font-bold text-sm">{leadTech?.displayName || 'Unassigned'}</div>
                                        <div className="text-[10px] text-text-muted uppercase font-bold">Lead Technician</div>
                                    </div>
                                </div>
                                <div className="p-4 flex items-center gap-3 bg-black/10">
                                    <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-xs">
                                        {supervisor?.displayName[0] || '?'}
                                    </div>
                                    <div>
                                        <div className="text-white font-bold text-sm">{supervisor?.displayName || 'N/A'}</div>
                                        <div className="text-[10px] text-text-muted uppercase font-bold">Supervisor</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-text-muted uppercase block mb-1">Lead Technician</label>
                                    <select
                                        value={assignments.leadTechnicianId || ''}
                                        onChange={(e) => setAssignments(prev => ({ ...prev, leadTechnicianId: e.target.value }))}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-accent-electric outline-none"
                                    >
                                        <option value="">Select Lead Tech...</option>
                                        {users
                                            .filter(u => !['DEPT_MANAGER', 'OFFICE_ADMIN', 'ORG_ADMIN', 'OWNER'].includes(u.role))
                                            .map(u => (
                                                <option key={u.uid} value={u.uid}>{u.displayName}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSaveAssignments}
                                        disabled={saving}
                                        className="flex-1 bg-accent-electric text-black font-bold py-2 rounded-lg text-xs"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => { setIsEditingAssignments(false); setAssignments(job.assignments || {}); }}
                                        className="px-4 py-2 bg-white/10 rounded-lg text-white font-bold text-xs"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div>
                        <label className="text-[10px] font-bold text-text-muted uppercase block mb-1">Loss Date</label>
                        <div className="text-sm text-white flex items-center gap-2">
                            <Calendar size={12} className="text-text-muted" />
                            {job.dates?.lossDate ? new Date(job.dates.lossDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-text-muted uppercase block mb-1">FNOL</label>
                        <div className="text-sm text-white flex items-center gap-2">
                            <Calendar size={12} className="text-text-muted" />
                            {job.dates?.fnolReceivedDate ? new Date(job.dates.fnolReceivedDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                        </div>
                    </div>
                </div>

            </div>

            {/* Edit Modal */}
            {showEditModal && job && (
                <JobCreate
                    onClose={() => setShowEditModal(false)}
                    initialData={job}
                    jobId={job.id}
                />
            )}
        </div>
    );
};

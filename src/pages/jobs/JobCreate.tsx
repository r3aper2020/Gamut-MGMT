import React, { useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    query,
    where,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { type Office, type Department } from '@/types/org';
import { type JobStatus, type JobAssignments } from '@/types/jobs';
import { type UserProfile } from '@/types/team';
import { ShieldAlert, Info, Users, Building, X, FileText } from 'lucide-react';

export const JobCreate: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { profile } = useAuth();
    const [offices, setOffices] = useState<Office[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [orgUsers, setOrgUsers] = useState<UserProfile[]>([]); // For assignments
    const [loading, setLoading] = useState(false);

    // --- FORM STATE ---
    // Context
    const [officeId, setOfficeId] = useState('');
    const [departmentId, setDepartmentId] = useState('');

    // General (Critical)
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    // Core Data
    const [lossDate, setLossDate] = useState('');
    const [fnolReceivedDate, setFnolReceivedDate] = useState('');
    const [lossCategory, setLossCategory] = useState('');
    const [carrier, setCarrier] = useState('');
    const [claimNumber, setClaimNumber] = useState('');
    const [lossDescription, setLossDescription] = useState('');
    const [notes, setNotes] = useState(''); // Added missing state

    // Address
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zip, setZip] = useState('');
    const [county, setCounty] = useState('');

    // Employee Assignments
    const [assignments, setAssignments] = useState<JobAssignments>({
        supervisorId: '',
        leadTechnicianId: '',
        teamMemberIds: []
    });

    // --- EFFECTS ---
    useEffect(() => {
        if (!profile?.orgId) return;

        // Fetch Offices
        const qOffices = query(collection(db, 'offices'), where('orgId', '==', profile.orgId));
        const unsubOffices = onSnapshot(qOffices, (snap) => {
            setOffices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Office)));
        });

        // Fetch Users
        const qUsers = query(collection(db, 'users'), where('orgId', '==', profile.orgId));
        const unsubUsers = onSnapshot(qUsers, (snap) => {
            setOrgUsers(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
        });

        return () => {
            unsubOffices();
            unsubUsers();
        };
    }, [profile?.orgId]);

    useEffect(() => {
        if (!officeId) {
            setDepartments([]);
            return;
        }
        const qDepts = query(collection(db, 'departments'), where('officeId', '==', officeId));
        const unsubDepts = onSnapshot(qDepts, (snap) => {
            setDepartments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department)));
        });
        return () => unsubDepts();
    }, [officeId]);

    // Pre-fill from Profile
    useEffect(() => {
        if (profile?.officeId) setOfficeId(profile.officeId);
        if (profile?.departmentId) setDepartmentId(profile.departmentId);
    }, [profile]);

    // Auto-set Supervisor when department changes
    useEffect(() => {
        if (departmentId && orgUsers.length > 0) {
            const supervisor = orgUsers.find(u => u.departmentId === departmentId && u.role === 'DEPT_MANAGER');
            if (supervisor) {
                setAssignments(prev => ({ ...prev, supervisorId: supervisor.uid }));
            } else {
                setAssignments(prev => ({ ...prev, supervisorId: '' }));
            }
        }
    }, [departmentId, orgUsers]);


    // --- HANDLERS ---
    const handleAssignmentChange = (field: string, value: any) => {
        setAssignments(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setLoading(true);

        try {
            // Collect all assigned user IDs
            // 1. Supervisor (Auto)
            // 2. Lead Tech
            // 3. Team Members
            const assignedIds = new Set<string>();
            if (assignments.supervisorId) assignedIds.add(assignments.supervisorId);
            if (assignments.leadTechnicianId) assignedIds.add(assignments.leadTechnicianId);
            assignments.teamMemberIds?.forEach(id => assignedIds.add(id));

            // Ensure creator is in list if needed, or just let them stay as owner
            // assignedIds.add(profile.uid); 

            const finalAssignedIds = Array.from(assignedIds);


            // Auto-generate job name
            const jobName = customerName || 'New Job';

            await addDoc(collection(db, 'jobs'), {
                orgId: profile.orgId,
                officeId,
                departmentId,
                status: 'FNOL' as JobStatus,
                jobName,
                isCustomJobName: false,
                customer: {
                    name: customerName,
                    phone: customerPhone,
                    email: ''
                },
                property: {
                    address,
                    city,
                    state,
                    zip,
                    county
                },
                insurance: {
                    carrier,
                    claimNumber
                },
                dates: {
                    lossDate: lossDate ? new Date(lossDate) : null,
                    fnolReceivedDate: fnolReceivedDate ? new Date(fnolReceivedDate) : null
                },
                assignments,
                details: {
                    propertyType: 'Residential', // Defaulting for cleanliness as removed from UI
                    lossCategory,
                    lossDescription,
                    notes // Persist internal notes
                },
                assignedUserIds: finalAssignedIds,
                createdBy: profile.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Helper: Filter users by office (optional, strict) or just show all
    const availableUsers = officeId
        ? orgUsers.filter(u => !u.officeId || u.officeId === officeId) // Include unassigned or matching
        : orgUsers;

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-100 backdrop-blur-md p-4 md:p-8 overflow-y-auto">
            <div className="glass w-full max-w-7xl relative border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-full">

                {/* Header */}
                <header className="flex items-center justify-between p-6 border-b border-white/10 flex-none bg-surface-elevation-1">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent-electric/20 flex items-center justify-center text-accent-electric">
                            <ShieldAlert size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white leading-tight">Create Job</h2>
                            <p className="text-text-secondary text-sm font-medium tracking-wide">Enter FNOL Details</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} className="text-text-muted hover:text-white" />
                    </button>
                </header>

                {/* Scrollable Content Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Top Section: 3 Columns */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                        {/* COL 1: GENERAL INFO (Name, Address, Phone, Dates) */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-accent-electric mb-4">
                                <Info size={18} />
                                <h3 className="text-sm font-black uppercase tracking-widest">General Info</h3>
                            </div>

                            {/* Office Context */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-text-muted uppercase">Office</label>
                                    <select
                                        value={officeId}
                                        onChange={(e) => setOfficeId(e.target.value)}
                                        required
                                        disabled={!!profile?.officeId} // Lock if user is bound to an office
                                        className={`input-field appearance-none ${!!profile?.officeId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <option value="" className="bg-bg-tertiary">Select...</option>
                                        {offices.map(o => <option key={o.id} value={o.id} className="bg-bg-tertiary">{o.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-text-muted uppercase">Department</label>
                                    <select
                                        value={departmentId}
                                        onChange={(e) => setDepartmentId(e.target.value)}
                                        required
                                        disabled={!officeId || !!profile?.departmentId} // Lock if bound to dept (Manager/Member)
                                        className={`input-field appearance-none ${(!officeId || !!profile?.departmentId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <option value="" className="bg-bg-tertiary">Select...</option>
                                        {departments.map(d => <option key={d.id} value={d.id} className="bg-bg-tertiary">{d.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Customer Name */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase">Customer Name</label>
                                <input
                                    placeholder="Full Name"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    required
                                    className="input-field"
                                />
                            </div>

                            {/* Address Block */}
                            <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/5">
                                <label className="text-[10px] font-bold text-text-muted uppercase">Property Address</label>
                                <input
                                    placeholder="Street Address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="input-field mb-2"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="input-field" />
                                    <input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} className="input-field" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input placeholder="ZIP" value={zip} onChange={(e) => setZip(e.target.value)} className="input-field" />
                                    <input placeholder="County" value={county} onChange={(e) => setCounty(e.target.value)} className="input-field" />
                                </div>
                            </div>

                            {/* Phone and Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-text-muted uppercase">Phone Number</label>
                                    <input
                                        placeholder="(555) 555-5555"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        className="input-field"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-text-muted uppercase">FNOL Received (Date & Time)</label>
                                    <input
                                        type="datetime-local"
                                        value={fnolReceivedDate}
                                        onChange={(e) => setFnolReceivedDate(e.target.value)}
                                        className="input-field"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* COL 2: LOSS & INSURANCE (Moved Here) */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-status-mitigation mb-4">
                                <Building size={18} />
                                <h3 className="text-sm font-black uppercase tracking-widest">Loss & Insurance</h3>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase">Date of Loss</label>
                                <input
                                    type="date"
                                    value={lossDate}
                                    onChange={(e) => setLossDate(e.target.value)}
                                    className="input-field"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase">Loss Type</label>
                                <select
                                    value={lossCategory}
                                    onChange={(e) => setLossCategory(e.target.value)}
                                    className="input-field appearance-none"
                                >
                                    <option value="" className="bg-bg-tertiary">Select Category...</option>
                                    <option value="Water" className="bg-bg-tertiary">Water</option>
                                    <option value="Fire" className="bg-bg-tertiary">Fire</option>
                                    <option value="Mold" className="bg-bg-tertiary">Mold</option>
                                    <option value="Storm" className="bg-bg-tertiary">Storm</option>
                                    <option value="Biohazard" className="bg-bg-tertiary">Biohazard</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase">Insurance Carrier</label>
                                <input
                                    value={carrier}
                                    onChange={(e) => setCarrier(e.target.value)}
                                    className="input-field"
                                    placeholder="e.g. State Farm"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase">Claim Number</label>
                                <input
                                    value={claimNumber}
                                    onChange={(e) => setClaimNumber(e.target.value)}
                                    className="input-field"
                                />
                            </div>

                            <div className="space-y-2 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2 text-accent-secondary mb-2">
                                    <FileText size={18} />
                                    <h3 className="text-xs font-black uppercase tracking-widest text-text-muted">General Description of Loss</h3>
                                </div>
                                <textarea
                                    value={lossDescription}
                                    onChange={(e) => setLossDescription(e.target.value)}
                                    className="input-field min-h-[150px] resize-y"
                                    placeholder="Enter the FNOL description here..."
                                />
                            </div>
                        </div>

                        {/* COL 3: EMPLOYEE ASSIGNMENTS (New Hierarchy) */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-accent-primary mb-4">
                                <Users size={18} />
                                <h3 className="text-sm font-black uppercase tracking-widest">Assignments</h3>
                            </div>

                            {/* 1. SUPERVISOR (Auto-Department Manager) */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase">Supervisor (Dept. Manager)</label>
                                <div className="input-field bg-white/5 opacity-75 cursor-not-allowed flex items-center justify-between">
                                    <span>
                                        {(() => {
                                            const supervisor = orgUsers.find(u => u.departmentId === departmentId && u.role === 'DEPT_MANAGER');
                                            return supervisor ? supervisor.displayName : 'No Manager Found';
                                        })()}
                                    </span>
                                    <span className="text-xs italic opacity-50">Auto-assigned</span>
                                </div>
                            </div>

                            {/* 2. LEAD TECHNICIAN */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase">Lead Technician</label>
                                <select
                                    value={assignments.leadTechnicianId || ''}
                                    onChange={(e) => handleAssignmentChange('leadTechnicianId', e.target.value)}
                                    className="input-field appearance-none"
                                >
                                    <option value="" className="bg-bg-tertiary">Select Lead Tech...</option>
                                    {availableUsers
                                        .filter(u => !['DEPT_MANAGER', 'OFFICE_ADMIN', 'ORG_ADMIN', 'OWNER'].includes(u.role)) // Exclude Managers & Above
                                        .map(u => (
                                            <option key={u.uid} value={u.uid} className="bg-bg-tertiary">
                                                {u.displayName}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* 3. ADDITIONAL TEAM MEMBERS */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-muted uppercase">Additional Team Members</label>
                                <div className="space-y-2">
                                    {/* Add Member Dropdown */}
                                    <select
                                        className="input-field appearance-none text-sm"
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                setAssignments(prev => ({
                                                    ...prev,
                                                    teamMemberIds: [...(prev.teamMemberIds || []), e.target.value]
                                                }));
                                            }
                                        }}
                                        value=""
                                    >
                                        <option value="" className="bg-bg-tertiary">+ Add Team Member...</option>
                                        {availableUsers
                                            .filter(u =>
                                                !['DEPT_MANAGER', 'OFFICE_ADMIN', 'ORG_ADMIN', 'OWNER'].includes(u.role) &&
                                                u.uid !== assignments.leadTechnicianId &&
                                                !assignments.teamMemberIds?.includes(u.uid)
                                            )
                                            .map(u => (
                                                <option key={u.uid} value={u.uid} className="bg-bg-tertiary">
                                                    {u.displayName}
                                                </option>
                                            ))}
                                    </select>

                                    {/* Selected Members List */}
                                    <div className="flex flex-wrap gap-2">
                                        {assignments.teamMemberIds?.map(uid => {
                                            const user = orgUsers.find(u => u.uid === uid);
                                            if (!user) return null;
                                            return (
                                                <div key={uid} className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
                                                    <span className="text-sm">{user.displayName}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setAssignments(prev => ({
                                                            ...prev,
                                                            teamMemberIds: prev.teamMemberIds?.filter(id => id !== uid)
                                                        }))}
                                                        className="hover:text-red-400 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* FULL WIDTH BOTTOM: ADDITIONAL NOTES */}
                    <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 text-accent-secondary mb-2">
                            <FileText size={18} />
                            <h3 className="text-sm font-black uppercase tracking-widest">Additional Notes</h3>
                        </div>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="input-field min-h-[80px] resize-y"
                            placeholder="Add any additional internal notes here..."
                        />
                    </div>

                </form>

                {/* Footer Actions */}
                <footer className="p-6 border-t border-white/10 flex justify-end gap-4 flex-none bg-surface-elevation-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl bg-transparent border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-3 rounded-xl bg-accent-electric text-black font-bold shadow-[0_0_20px_rgba(0,242,255,0.2)] hover:shadow-[0_0_30px_rgba(0,242,255,0.4)] hover:bg-white transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none"
                    >
                        {loading ? 'Creating Project...' : 'Create Job Project'}
                    </button>
                </footer>

            </div>

            {/* Styles Injection for clean Input fields within this component */}
            <style>{`
                .input-field {
                    width: 100%;
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    background-color: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                }
                .input-field:focus {
                    border-color: var(--accent-electric);
                    outline: none;
                    background-color: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
};

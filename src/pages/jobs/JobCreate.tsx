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

    // General
    const [customerName, setCustomerName] = useState('');
    const [customerPhone] = useState('');
    const [jobName, setJobName] = useState('');
    const [isCustomJobName, setIsCustomJobName] = useState(false);
    const [claimNumber, setClaimNumber] = useState('');
    const [yearBuilt, setYearBuilt] = useState('');

    // Address
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zip, setZip] = useState('');
    const [county, setCounty] = useState('');

    // Employee Assignments
    const [assignments, setAssignments] = useState({
        supervisorId: '',
        mitigationManagerId: '',
        inspectorId: '',
        marketingRepId: '',
        coordinatorId: '',
        leadTechnicianId: ''
    });

    // Additional Info
    const [propertyType, setPropertyType] = useState('Residential');
    const [deductible, setDeductible] = useState('');
    const [policyNumber, setPolicyNumber] = useState('');
    const [lossCategory, setLossCategory] = useState('');
    const [carrier, setCarrier] = useState('');
    const [billingContact] = useState('');
    const [billingNotes] = useState('');
    const [lockBox, setLockBox] = useState('');
    const [gateCode, setGateCode] = useState('');
    const [mortgageCo, setMortgageCo] = useState('');
    const [loanNumber] = useState('');
    const [notes, setNotes] = useState('');

    // --- EFFECTS ---
    useEffect(() => {
        if (!profile?.orgId) return;

        // Fetch Offices
        const qOffices = query(collection(db, 'offices'), where('orgId', '==', profile.orgId));
        const unsubOffices = onSnapshot(qOffices, (snap) => {
            setOffices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Office)));
        });

        // Fetch Users (Simple fetch all for Org for now)
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

    // Auto-generate Job Name if not custom
    useEffect(() => {
        if (!isCustomJobName) {
            // Default pattern: CustomerLastName (Category) or just CustomerName
            // Simple logic: Customer Name
            setJobName(customerName || 'Auto Generated');
        }
    }, [customerName, isCustomJobName]);

    // --- HANDLERS ---
    const handleAssignmentChange = (field: string, value: string) => {
        setAssignments(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setLoading(true);

        try {
            // Collect all assigned user IDs for strict security queries
            const assignedIds = Object.values(assignments).filter(Boolean);
            if (profile.uid && !assignedIds.includes(profile.uid)) {
                assignedIds.push(profile.uid);
            }

            await addDoc(collection(db, 'jobs'), {
                orgId: profile.orgId,
                officeId,
                departmentId,
                status: 'FNOL' as JobStatus,
                jobName,
                isCustomJobName,
                customer: {
                    name: customerName,
                    phone: customerPhone,
                    email: '' // Todo
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
                assignments,
                details: {
                    propertyType,
                    yearBuilt: yearBuilt ? parseInt(yearBuilt) : undefined,
                    lossCategory,
                    deductible,
                    policyNumber,
                    lockBoxCode: lockBox,
                    gateEntryCode: gateCode,
                    mortgageCompany: mortgageCo,
                    loanNumber,
                    billingContact,
                    billingNotes,
                    notes
                },
                assignedUserIds: assignedIds,
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
                <header className="flex items-center justify-between p-6 border-b border-white/10 flex-none">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent-electric/20 flex items-center justify-center text-accent-electric">
                            <ShieldAlert size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white leading-tight">Create Job</h2>
                            <p className="text-text-secondary text-sm font-medium tracking-wide">Enter Claim & Assignment Details</p>
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

                        {/* COL 1: GENERAL INFO */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-accent-electric mb-4">
                                <Info size={18} />
                                <h3 className="text-sm font-black uppercase tracking-widest">General</h3>
                            </div>

                            {/* Company / Customer */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase">Company / Customer</label>
                                <input
                                    placeholder="Customer Name"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    required
                                    className="input-field"
                                />
                            </div>

                            {/* Context Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-text-muted uppercase">Office</label>
                                    <select
                                        value={officeId}
                                        onChange={(e) => setOfficeId(e.target.value)}
                                        required
                                        className="input-field appearance-none"
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
                                        disabled={!officeId}
                                        className="input-field appearance-none"
                                    >
                                        <option value="" className="bg-bg-tertiary">Select...</option>
                                        {departments.map(d => <option key={d.id} value={d.id} className="bg-bg-tertiary">{d.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Job Name */}
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <label className="text-[10px] font-bold text-text-muted uppercase">Job Name</label>
                                    <label className="flex items-center gap-2 text-[10px] text-text-muted cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isCustomJobName}
                                            onChange={(e) => setIsCustomJobName(e.target.checked)}
                                            className="rounded border-white/20 bg-white/5 text-accent-electric"
                                        />
                                        Custom Name
                                    </label>
                                </div>
                                <input
                                    value={jobName}
                                    onChange={(e) => setJobName(e.target.value)}
                                    disabled={!isCustomJobName}
                                    className={`input-field ${!isCustomJobName ? 'opacity-50' : ''}`}
                                />
                            </div>

                            {/* Claim & Billing */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-text-muted uppercase">Claim #</label>
                                    <input
                                        value={claimNumber}
                                        onChange={(e) => setClaimNumber(e.target.value)}
                                        className="input-field"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-text-muted uppercase">Year Built</label>
                                    <input
                                        type="number"
                                        value={yearBuilt}
                                        onChange={(e) => setYearBuilt(e.target.value)}
                                        className="input-field"
                                    />
                                </div>
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
                        </div>

                        {/* COL 2: EMPLOYEE ASSIGNMENTS */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-accent-primary mb-4">
                                <Users size={18} />
                                <h3 className="text-sm font-black uppercase tracking-widest">Employee Assignments</h3>
                            </div>

                            {[
                                { label: 'Supervisor', key: 'supervisorId' },
                                { label: 'Mitigation Manager', key: 'mitigationManagerId' },
                                { label: 'Inspector', key: 'inspectorId' },
                                { label: 'Marketing Rep', key: 'marketingRepId' },
                                { label: 'Coordinator', key: 'coordinatorId' },
                                { label: 'Lead Technician', key: 'leadTechnicianId' },
                            ].map((field) => (
                                <div key={field.key} className="space-y-1">
                                    <label className="text-[10px] font-bold text-text-muted uppercase">{field.label}</label>
                                    <select
                                        value={assignments[field.key as keyof JobAssignments] || ''}
                                        onChange={(e) => handleAssignmentChange(field.key, e.target.value)}
                                        className="input-field appearance-none"
                                    >
                                        <option value="" className="bg-bg-tertiary">Unassigned</option>
                                        {availableUsers.map(u => (
                                            <option key={u.uid} value={u.uid} className="bg-bg-tertiary">
                                                {u.displayName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>

                        {/* COL 3: ADDITIONAL INFO */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-status-mitigation mb-4">
                                <Building size={18} />
                                <h3 className="text-sm font-black uppercase tracking-widest">Additional Info</h3>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase">Property Type</label>
                                <select
                                    value={propertyType}
                                    onChange={(e) => setPropertyType(e.target.value)}
                                    className="input-field appearance-none"
                                >
                                    <option value="Residential" className="bg-bg-tertiary">Residential</option>
                                    <option value="Commercial" className="bg-bg-tertiary">Commercial</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-text-muted uppercase">Deductible</label>
                                    <input value={deductible} onChange={(e) => setDeductible(e.target.value)} className="input-field" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-text-muted uppercase">Policy #</label>
                                    <input value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} className="input-field" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase">Insurance Carrier</label>
                                <input value={carrier} onChange={(e) => setCarrier(e.target.value)} className="input-field" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase">Loss Category</label>
                                <select
                                    value={lossCategory}
                                    onChange={(e) => setLossCategory(e.target.value)}
                                    className="input-field appearance-none"
                                >
                                    <option value="" className="bg-bg-tertiary">Select Category...</option>
                                    <option value="Cat 1" className="bg-bg-tertiary">Cat 1 (Clean)</option>
                                    <option value="Cat 2" className="bg-bg-tertiary">Cat 2 (Grey)</option>
                                    <option value="Cat 3" className="bg-bg-tertiary">Cat 3 (Black)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-text-muted uppercase">Lock Box Code</label>
                                    <input value={lockBox} onChange={(e) => setLockBox(e.target.value)} className="input-field" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-text-muted uppercase">Gate Code</label>
                                    <input value={gateCode} onChange={(e) => setGateCode(e.target.value)} className="input-field" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase">Mortgage Co</label>
                                <input value={mortgageCo} onChange={(e) => setMortgageCo(e.target.value)} className="input-field" />
                            </div>
                        </div>
                    </div>

                    {/* FULL WIDTH BOTTOM: NOTES */}
                    <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 text-accent-secondary mb-2">
                            <FileText size={18} />
                            <h3 className="text-sm font-black uppercase tracking-widest">Job Notes</h3>
                        </div>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="input-field min-h-[100px] resize-y"
                            placeholder="Enter any important job details, access instructions, or billing notes..."
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

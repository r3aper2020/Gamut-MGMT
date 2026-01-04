import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    collection,
    onSnapshot,
    query,
    where,
    addDoc,
    doc,
    updateDoc,
    serverTimestamp,
    arrayUnion
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { type Office, type Department } from '@/types/org';
import { type JobStatus, type JobAssignments, type Job } from '@/types/jobs';
import { type UserProfile } from '@/types/team';

// Form Sub-Components
import { JobCreateHeader } from './forms/JobCreateHeader';
import { JobGeneralInfo } from './forms/JobGeneralInfo';
import { JobInsuranceInfo } from './forms/JobInsuranceInfo';
import { JobAssignmentsForm } from './forms/JobAssignments';
import { JobNotes } from './forms/JobNotes';

interface JobCreateProps {
    onClose: () => void;
    initialData?: Job;
    jobId?: string;
}

export const JobCreate: React.FC<JobCreateProps> = ({ onClose, initialData, jobId }) => {
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
    const [notes, setNotes] = useState('');

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
            // Only auto-set if not already set (or creation mode)
            if (!assignments.supervisorId && !initialData) {
                const supervisor = orgUsers.find(u => u.departmentId === departmentId && u.role === 'DEPT_MANAGER');
                if (supervisor) {
                    setAssignments(prev => ({ ...prev, supervisorId: supervisor.uid }));
                }
            }
        }
    }, [departmentId, orgUsers, assignments.supervisorId, initialData]);

    // --- Form Population Effect ---
    useEffect(() => {
        if (initialData) {
            setOfficeId(initialData.officeId);
            setDepartmentId(initialData.departmentId);
            setCustomerName(initialData.customer.name);
            setCustomerPhone(initialData.customer.phone);
            setAddress(initialData.property.address);
            setCity(initialData.property.city);
            setState(initialData.property.state);
            setZip(initialData.property.zip);
            setCounty(initialData.property.county || '');
            setCarrier(initialData.insurance?.carrier || '');
            setClaimNumber(initialData.insurance?.claimNumber || '');
            setLossCategory(initialData.details?.lossCategory || '');
            setLossDescription(initialData.details?.lossDescription || '');
            setNotes(initialData.details?.notes || '');
            if (initialData.dates?.lossDate) {
                setLossDate(new Date(initialData.dates.lossDate.seconds * 1000).toISOString().split('T')[0]);
            }
            if (initialData.dates?.fnolReceivedDate) {
                const d = new Date(initialData.dates.fnolReceivedDate.seconds * 1000);
                // Adjust for timezone offset to display correctly in datetime-local
                const offset = d.getTimezoneOffset();
                const localDate = new Date(d.getTime() - (offset * 60 * 1000));
                setFnolReceivedDate(localDate.toISOString().slice(0, 16));
            }
            if (initialData.assignments) {
                setAssignments(initialData.assignments);
            }
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const commonData = {
                // Metadata
                officeId,
                departmentId,
                // departmentIds handled in create/update blocks below

                // Customer
                customer: {
                    name: customerName,
                    phone: customerPhone,
                    email: ''
                },

                // Property
                property: {
                    address,
                    city,
                    state,
                    zip,
                    county
                },

                // Insurance / Loss
                insurance: {
                    carrier,
                    claimNumber,
                    policyNumber: ''
                },

                details: {
                    lossCategory: lossCategory,
                    lossDescription,
                    notes
                },

                dates: {
                    lossDate: lossDate ? new Date(lossDate) : null,
                    fnolReceivedDate: fnolReceivedDate ? new Date(fnolReceivedDate) : null
                },

                // Status
                status: initialData?.status || 'PENDING' as JobStatus,

                // Assignments
                assignments: assignments,
                assignedUserIds: [
                    assignments.supervisorId,
                    assignments.leadTechnicianId,
                    ...(assignments.teamMemberIds || [])
                ].filter(Boolean)
            };

            if (jobId) {
                // UPDATE EXISITING
                await updateDoc(doc(db, 'jobs', jobId), {
                    ...commonData,
                    departmentIds: arrayUnion(departmentId), // Ensure new dept is visible
                    updatedAt: serverTimestamp()
                });
            } else {
                // CREATE NEW
                await addDoc(collection(db, 'jobs'), {
                    ...commonData,
                    departmentIds: [departmentId], // Initialize history
                    orgId: profile?.orgId,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    status: 'PENDING'
                });
            }

            onClose();
        } catch (error) {
            console.error("Error creating/updating job:", error);
        } finally {
            setLoading(false);
        }
    };


    // Helper: Filter users by office (optional, strict) or just show all
    const availableUsers = officeId
        ? orgUsers.filter(u => !u.officeId || u.officeId === officeId) // Include unassigned or matching
        : orgUsers;

    return createPortal(
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-100 backdrop-blur-md p-4 md:p-8 overflow-y-auto">
            <div className="glass w-full max-w-7xl relative border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-full">

                <JobCreateHeader isEditMode={!!jobId} onClose={onClose} />

                {/* Scrollable Content Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Top Section: 3 Columns */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                        {/* COL 1: GENERAL INFO (Name, Address, Phone, Dates) */}
                        <JobGeneralInfo
                            officeId={officeId} setOfficeId={setOfficeId}
                            departmentId={departmentId} setDepartmentId={setDepartmentId}
                            offices={offices} departments={departments} profile={profile}
                            customerName={customerName} setCustomerName={setCustomerName}
                            customerPhone={customerPhone} setCustomerPhone={setCustomerPhone}
                            address={address} setAddress={setAddress}
                            city={city} setCity={setCity}
                            state={state} setState={setState}
                            zip={zip} setZip={setZip}
                            county={county} setCounty={setCounty}
                            fnolReceivedDate={fnolReceivedDate} setFnolReceivedDate={setFnolReceivedDate}
                        />

                        {/* COL 2: LOSS & INSURANCE (Moved Here) */}
                        <JobInsuranceInfo
                            lossDate={lossDate} setLossDate={setLossDate}
                            lossCategory={lossCategory} setLossCategory={setLossCategory}
                            carrier={carrier} setCarrier={setCarrier}
                            claimNumber={claimNumber} setClaimNumber={setClaimNumber}
                            lossDescription={lossDescription} setLossDescription={setLossDescription}
                        />

                        {/* COL 3: EMPLOYEE ASSIGNMENTS (New Hierarchy) */}
                        <JobAssignmentsForm
                            assignments={assignments}
                            setAssignments={setAssignments}
                            orgUsers={orgUsers}
                            availableUsers={availableUsers}
                            departmentId={departmentId}
                        />

                    </div>

                    {/* FULL WIDTH BOTTOM: ADDITIONAL NOTES */}
                    <JobNotes notes={notes} setNotes={setNotes} />

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
                        {loading ? 'Saving...' : (jobId ? 'Save Changes' : 'Create Job Project')}
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
        </div>,
        document.body
    );
};

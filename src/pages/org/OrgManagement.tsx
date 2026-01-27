import React, { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { type Office, type Department } from '@/types/org';
import { Building2, MapPin, Plus, ListTree } from 'lucide-react';
import { hasPermission } from '@/hooks/useRBAC';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useNavigate } from 'react-router-dom';

export const OrgManagement: React.FC = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const { activeOffice } = useOrganization();
    const [offices, setOffices] = useState<Office[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);

    // Form states
    const [showOfficeForm, setShowOfficeForm] = useState(false);
    const [officeName, setOfficeName] = useState('');
    const [officeAddress, setOfficeAddress] = useState('');

    useEffect(() => {
        if (profile?.role === 'MEMBER') {
            navigate('/');
            return;
        }

        if (!profile?.orgId) return;
        let qOffices = query(collection(db, 'organizations', profile.orgId, 'offices'), where('orgId', '==', profile.orgId));
        if (profile.role === 'OFFICE_ADMIN' || profile.role === 'DEPT_MANAGER') {
            if (profile.officeId) {
                qOffices = query(collection(db, 'organizations', profile.orgId, 'offices'), where('orgId', '==', profile.orgId), where('id', '==', profile.officeId));
            }
        }

        const unsubOffices = onSnapshot(qOffices, (snap) => {
            setOffices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Office)));
        });

        // 2. Query Departments based on scope
        let qDepts = query(collection(db, 'organizations', profile.orgId, 'departments'), where('orgId', '==', profile.orgId));
        if (profile.role === 'OFFICE_ADMIN') {
            if (profile.officeId) {
                qDepts = query(qDepts, where('officeId', '==', profile.officeId));
            }
        } else if (profile.role === 'DEPT_MANAGER') {
            if (profile.departmentId) {
                qDepts = query(qDepts, where('id', '==', profile.departmentId));
            }
        }

        const unsubDepts = onSnapshot(qDepts, (snap) => {
            setDepartments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department)));
        });

        return () => {
            unsubOffices();
            unsubDepts();
        };
    }, [profile, navigate]);

    // Department form state
    const [showDeptForm, setShowDeptForm] = useState<string | null>(null); // officeId
    const [deptName, setDeptName] = useState('');

    const handleAddDept = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.orgId || !showDeptForm) return;

        try {
            await addDoc(collection(db, 'organizations', profile.orgId, 'departments'), {
                orgId: profile.orgId,
                officeId: showDeptForm,
                name: deptName,
                managerId: profile.uid,
                createdAt: serverTimestamp()
            });
            setDeptName('');
            setShowDeptForm(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddOffice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.orgId) return;

        try {
            await addDoc(collection(db, 'organizations', profile.orgId, 'offices'), {
                orgId: profile.orgId,
                name: officeName,
                address: officeAddress,
                managerId: profile.uid, // Default to creator for now
                createdAt: serverTimestamp()
            });
            setOfficeName('');
            setOfficeAddress('');
            setShowOfficeForm(false);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <header>
                <h2 className="text-3xl font-extrabold tracking-tight mb-2">
                    {hasPermission(profile, 'VIEW_ORG_SETTINGS') ? 'Organization Management' : 'My Branch Information'}
                </h2>
                <p className="text-text-secondary">
                    {hasPermission(profile, 'VIEW_ORG_SETTINGS')
                        ? 'Manage your offices and departments across the organization.'
                        : `View details for ${activeOffice?.name || 'your assigned branch'}.`}
                </p>
            </header>

            {!hasPermission(profile, 'VIEW_ORG_SETTINGS') ? (
                <div className="glass p-12 text-center">
                    <Building2 size={48} className="text-accent-electric mb-4 opacity-50 mx-auto" />
                    <h3 className="text-xl font-bold mb-2">Restricted Access</h3>
                    <p className="text-text-secondary max-w-md mx-auto">
                        You have limited visibility into organizational settings. Please contact your Office Admin for any changes.
                    </p>
                </div>
            ) : (
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="flex items-center gap-2.5 text-xl font-bold m-0 text-white">
                            <Building2 size={22} className="text-accent-primary" /> Offices
                        </h3>
                        {hasPermission(profile, 'MANAGE_OFFICES') && (
                            <button
                                onClick={() => setShowOfficeForm(true)}
                                className="bg-accent-primary hover:opacity-90 transition-opacity text-white border-none py-2.5 px-5 rounded-xl flex items-center gap-2 font-bold shadow-lg"
                            >
                                <Plus size={18} /> Add Office
                            </button>
                        )}
                    </div>

                    {showOfficeForm && (
                        <form onSubmit={handleAddOffice} className="glass p-8 mb-8 border border-white/10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">Office Name</label>
                                    <input
                                        type="text"
                                        value={officeName}
                                        onChange={(e) => setOfficeName(e.target.value)}
                                        placeholder="e.g. Downtown Branch"
                                        required
                                        className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-accent-electric focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">Address</label>
                                    <input
                                        type="text"
                                        value={officeAddress}
                                        onChange={(e) => setOfficeAddress(e.target.value)}
                                        placeholder="123 Main St..."
                                        required
                                        className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-accent-electric focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" className="bg-accent-electric text-black font-bold border-none py-2.5 px-6 rounded-xl hover:opacity-90 transition-opacity">Save Office</button>
                                <button type="button" onClick={() => setShowOfficeForm(false)} className="bg-transparent text-text-muted border border-white/10 py-2.5 px-6 rounded-xl hover:bg-white/5 transition-colors">Cancel</button>
                            </div>
                        </form>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {offices.map(office => (
                            <div key={office.id} className="glass p-6 border border-white/5 hover:border-accent-electric/20 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="text-xl font-bold m-0 group-hover:text-accent-electric transition-colors">{office.name}</h4>
                                    <MapPin size={18} className="text-text-muted" />
                                </div>
                                <p className="text-text-secondary text-sm mb-6">{office.address}</p>

                                <div className="border-t border-white/10 pt-5">
                                    <h5 className="text-[0.65rem] font-bold uppercase tracking-widest text-text-muted mb-4 flex items-center gap-2">
                                        <ListTree size={14} className="text-accent-primary" /> Departments
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                        {departments.filter(d => d.officeId === office.id).map(dept => (
                                            <span key={dept.id} className="px-3 py-1.5 rounded-lg bg-accent-primary/10 text-accent-primary text-[0.7rem] font-bold border border-accent-primary/20">
                                                {dept.name}
                                            </span>
                                        ))}
                                        <button
                                            onClick={() => setShowDeptForm(office.id)}
                                            className="px-3 py-1.5 rounded-lg border border-dashed border-white/20 bg-transparent text-text-muted text-[0.7rem] font-medium hover:border-white/40 transition-colors"
                                        >
                                            + Add Dept
                                        </button>
                                    </div>
                                </div>

                                {showDeptForm === office.id && (
                                    <div className="mt-5 border-t border-white/10 pt-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <form onSubmit={handleAddDept}>
                                            <input
                                                type="text"
                                                value={deptName}
                                                onChange={(e) => setDeptName(e.target.value)}
                                                placeholder="Dept Name (e.g. Mitigation)"
                                                required
                                                className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-accent-electric focus:outline-none transition-colors mb-3"
                                            />
                                            <div className="flex gap-2">
                                                <button type="submit" className="bg-accent-primary text-white border-none py-1.5 px-4 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity">Save</button>
                                                <button type="button" onClick={() => setShowDeptForm(null)} className="bg-transparent text-text-muted border-none text-xs font-medium hover:text-white transition-colors">Cancel</button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

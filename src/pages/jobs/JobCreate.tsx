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
import { type JobStatus } from '@/types/jobs';
import { ShieldAlert, Send } from 'lucide-react';

export const JobCreate: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { profile } = useAuth();
    const [offices, setOffices] = useState<Office[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [officeId, setOfficeId] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [address, setAddress] = useState('');
    const [carrier, setCarrier] = useState('');
    const [claimNumber, setClaimNumber] = useState('');

    useEffect(() => {
        if (!profile?.orgId) return;

        const qOffices = query(collection(db, 'offices'), where('orgId', '==', profile.orgId));
        const unsubOffices = onSnapshot(qOffices, (snap) => {
            setOffices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Office)));
        });

        return () => unsubOffices();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setLoading(true);

        try {
            await addDoc(collection(db, 'jobs'), {
                orgId: profile.orgId,
                officeId,
                departmentId,
                status: 'FNOL' as JobStatus,
                customer: {
                    name: customerName,
                    phone: customerPhone,
                    email: ''
                },
                property: {
                    address,
                    city: '',
                    state: '',
                    zip: ''
                },
                insurance: {
                    carrier,
                    claimNumber
                },
                assignedUserIds: [profile.uid],
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

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-100 backdrop-blur-md p-6">
            <div className="glass w-full max-w-2xl p-8 relative border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300">
                <header className="mb-8 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent-electric/20 flex items-center justify-center text-accent-electric">
                        <ShieldAlert size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white leading-tight">New FNOL</h2>
                        <p className="text-text-secondary text-sm font-medium tracking-wide">First Notice of Loss Setup</p>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted">Office</label>
                            <select
                                value={officeId}
                                onChange={(e) => setOfficeId(e.target.value)}
                                required
                                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-accent-electric focus:outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-bg-tertiary">Select Office</option>
                                {offices.map(o => <option key={o.id} value={o.id} className="bg-bg-tertiary">{o.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted">Department</label>
                            <select
                                value={departmentId}
                                onChange={(e) => setDepartmentId(e.target.value)}
                                required
                                disabled={!officeId}
                                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-accent-electric focus:outline-none transition-all disabled:opacity-30 disabled:cursor-not-allowed appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-bg-tertiary">Select Department</option>
                                {departments.map(d => <option key={d.id} value={d.id} className="bg-bg-tertiary">{d.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-white/40 mb-2">
                            <div className="h-px flex-1 bg-white/5"></div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Customer & Property</h3>
                            <div className="h-px flex-1 bg-white/5"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                placeholder="Customer Name"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                required
                                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-accent-electric focus:outline-none transition-all placeholder:text-white/20"
                            />
                            <input
                                placeholder="Phone Number"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                required
                                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-accent-electric focus:outline-none transition-all placeholder:text-white/20"
                            />
                        </div>
                        <input
                            placeholder="Full Property Address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            required
                            className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-accent-electric focus:outline-none transition-all placeholder:text-white/20"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-white/40 mb-2">
                            <div className="h-px flex-1 bg-white/5"></div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Insurance Carrier</h3>
                            <div className="h-px flex-1 bg-white/5"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                placeholder="Carrier (e.g. State Farm)"
                                value={carrier}
                                onChange={(e) => setCarrier(e.target.value)}
                                required
                                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-accent-electric focus:outline-none transition-all placeholder:text-white/20"
                            />
                            <input
                                placeholder="Claim #"
                                value={claimNumber}
                                onChange={(e) => setClaimNumber(e.target.value)}
                                required
                                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-accent-electric focus:outline-none transition-all placeholder:text-white/20"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-4 rounded-xl bg-linear-to-br from-accent-primary to-accent-electric text-black font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,255,0.2)] hover:shadow-[0_0_30px_rgba(0,242,255,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
                        >
                            <Send size={18} /> {loading ? 'Processing...' : 'Assign & Create Claim'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 flex-none py-4 rounded-xl bg-transparent border border-white/10 text-text-muted font-bold hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { collection, query, where, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams } from 'react-router-dom';
import { type Department } from '@/types/org';
import { Network, Plus, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';

export const ManageDepartments: React.FC = () => {
    const { officeId } = useParams();
    const { user } = useAuth();
    const { organization } = useOrganization();

    const [depts, setDepts] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    // Create State
    const [showForm, setShowForm] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    useEffect(() => {
        if (!officeId || !organization?.id) return;

        const q = query(collection(db, 'organizations', organization.id, 'departments'), where('officeId', '==', officeId));

        // Use onSnapshot for real-time updates
        const unsubscribe = onSnapshot(q, (snap) => {
            setDepts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Department)));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [officeId, organization?.id]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !officeId || !organization?.id || !newDeptName.trim()) return;

        setCreateLoading(true);
        try {
            await addDoc(collection(db, 'organizations', organization.id, 'departments'), {
                orgId: organization.id,
                officeId: officeId,
                name: newDeptName.trim(),
                managerId: user.uid,
                createdAt: serverTimestamp(),
                createdBy: user.uid
            });
            setNewDeptName('');
            setShowForm(false);
        } catch (error) {
            console.error("Error creating department:", error);
            alert("Failed to create department");
        } finally {
            setCreateLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <header className="flex justify-between items-end">
                <div>
                    <div className="text-accent-electric text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Network size={14} /> Structure
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Departments</h1>
                    <p className="text-text-secondary mt-2">Operational units within this branch.</p>
                </div>

                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-accent-primary hover:bg-accent-primary-hover text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-accent-primary/20 transition-all active:scale-95"
                    >
                        <Plus size={20} /> Add Department
                    </button>
                )}
            </header>

            {showForm && (
                <div className="glass p-6 border border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
                    <h3 className="text-lg font-bold mb-4">New Department</h3>
                    <form onSubmit={handleCreate} className="flex gap-4 items-start">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={newDeptName}
                                onChange={(e) => setNewDeptName(e.target.value)}
                                placeholder="Department Name (e.g. Sales, Mitigation, Reconstruction)"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-electric focus:ring-1 focus:ring-accent-electric outline-none"
                                autoFocus
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={createLoading}
                            className="bg-accent-electric text-black px-6 py-3 rounded-xl font-bold hover:brightness-110 transition-all disabled:opacity-50"
                        >
                            {createLoading ? 'Saving...' : 'Create'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="bg-white/5 text-white px-4 py-3 rounded-xl hover:bg-white/10 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {depts.length === 0 && !loading && (
                    <div className="glass p-12 text-center text-text-muted col-span-full border border-white/5">
                        No departments found. Create one to get started.
                    </div>
                )}

                {depts.map(dept => (
                    <div key={dept.id} className="glass p-6 border border-white/5 hover:border-accent-electric/20 transition-all group">
                        <h4 className="text-xl font-bold mb-4 group-hover:text-accent-electric transition-colors">{dept.name}</h4>
                        <div className="text-xs font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-status-reconstruction animate-pulse" />
                            Active Unit
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

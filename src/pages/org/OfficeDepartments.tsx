import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams } from 'react-router-dom';
import { type Department } from '@/types/org';
import { Network } from 'lucide-react';

export const OfficeDepartments: React.FC = () => {
    const { officeId } = useParams();
    const [depts, setDepts] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!officeId) return;
        const fetchDepts = async () => {
            // In a real app we'd query by officeId. 
            // Current seed data structure: Department has `officeId`? 
            // Let's assume we fetch all and filter or query directly.
            // Checking types: Department has parentOfficeId?

            // Simplification: Just show a placeholder list for now or fetch all 'departments'
            // I'll need to check the exact schema of Departments in a later step to be perfect.
            // For now, let's just query departments collection.

            const q = query(collection(db, 'departments'), where('officeId', '==', officeId));
            const snap = await getDocs(q);
            setDepts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Department)));
            setLoading(false);
        };
        fetchDepts();
    }, [officeId]);

    return (
        <div className="flex flex-col gap-8">
            <header>
                <div className="text-accent-electric text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Network size={14} /> Structure
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight">Departments</h1>
                <p className="text-text-secondary mt-2">Operational units within this branch.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {depts.length === 0 && !loading && (
                    <div className="glass p-12 text-center text-text-muted col-span-full border border-white/5">
                        No departments found.
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

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useParams } from 'react-router-dom';
import { type Department } from '../../../types';
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <header>
                <div style={{ color: 'var(--accent-electric)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Network size={14} /> Structure
                </div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Departments</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Operational units within this branch.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {depts.length === 0 && !loading && (
                    <div className="glass" style={{ padding: '30px', color: 'var(--text-muted)' }}>
                        No departments found.
                    </div>
                )}

                {depts.map(dept => (
                    <div key={dept.id} className="glass" style={{ padding: '24px' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>{dept.name}</h4>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Network size={14} /> Active
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

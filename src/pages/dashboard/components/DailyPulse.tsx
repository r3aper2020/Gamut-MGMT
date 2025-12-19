import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { type Job } from '../../../types';
import {
    ArrowRight,
    Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DailyPulse: React.FC = () => {
    const { profile } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile) return;

        const q = query(
            collection(db, 'jobs'),
            where('orgId', '==', profile.orgId),
            where('assignedUserIds', 'array-contains', profile.uid) // Simple filtering for now
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            setJobs(snap.docs.map(doc => doc.data() as Job));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [profile]);

    if (loading) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <header>
                <div style={{ color: 'var(--accent-electric)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={14} /> My Daily Pulse
                </div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Welcome Back, {profile?.displayName.split(' ')[0]}</h1>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="glass" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px' }}>Current Assignments</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {jobs.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>No active assignments for today.</p>
                        ) : (
                            jobs.map(job => (
                                <div key={job.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{job.customer.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{job.status}</div>
                                    </div>
                                    <Link to={`/jobs/${job.id}`} style={{ color: 'var(--accent-electric)' }}>
                                        <ArrowRight size={18} />
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="glass" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px' }}>Personal Performance</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Great job! You've completed 4 tasks this week.</p>
                </div>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { type Job } from '@/types/jobs';
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
        <div className="flex flex-col gap-8">
            <header>
                <div className="text-accent-electric text-xs font-bold uppercase mb-2 flex items-center gap-2">
                    <Zap size={14} /> My Daily Pulse
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight">Welcome Back, {profile?.displayName.split(' ')[0]}</h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass p-8">
                    <h3 className="text-xl font-semibold mb-5">Current Assignments</h3>
                    <div className="flex flex-col gap-3">
                        {jobs.length === 0 ? (
                            <p className="text-text-muted">No active assignments for today.</p>
                        ) : (
                            jobs.map(job => (
                                <div key={job.id} className="p-4 bg-white/5 rounded-xl flex justify-between items-center transition-colors hover:bg-white/10">
                                    <div>
                                        <div className="font-semibold text-white">{job.customer.name}</div>
                                        <div className="text-xs text-text-muted">{job.status}</div>
                                    </div>
                                    <Link to={`/jobs/${job.id}`} className="text-accent-electric hover:opacity-80 transition-opacity">
                                        <ArrowRight size={18} />
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="glass p-8">
                    <h3 className="text-xl font-semibold mb-5">Personal Performance</h3>
                    <p className="text-text-muted">Great job! You've completed 4 tasks this week.</p>
                </div>
            </div>
        </div>
    );
};

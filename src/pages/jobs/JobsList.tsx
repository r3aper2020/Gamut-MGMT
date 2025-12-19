import React, { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { type Job } from '@/types/jobs';
import { Briefcase, ChevronRight, Clock, MapPin } from 'lucide-react';

import { useParams } from 'react-router-dom';

const JobsList: React.FC = () => {
    const { profile } = useAuth();
    const { activeOfficeId, activeDepartmentId } = useOrganization();
    const { officeId } = useParams(); // URL Precedence
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    const targetOfficeId = officeId || activeOfficeId;

    useEffect(() => {
        if (!profile) return;

        let q = query(collection(db, 'jobs'), where('orgId', '==', profile.orgId));

        // Organizational Immersion Filtering
        if (targetOfficeId) {
            q = query(q, where('officeId', '==', targetOfficeId));

            // Department Context
            if (activeDepartmentId) {
                q = query(q, where('departmentId', '==', activeDepartmentId));
            }
        } else if (profile.role === 'MEMBER') {
            // Members only see assigned jobs (fallback if no officeId)
            q = query(q, where('assignedUserIds', 'array-contains', profile.uid));
        }

        const unsubscribe = onSnapshot(q, (snap) => {
            setJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [profile, targetOfficeId, activeDepartmentId]);

    if (loading) return <div className="p-8 text-accent-electric animate-pulse">Loading jobs...</div>;

    return (
        <div className="flex flex-col gap-6">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Jobs & Claims</h2>
                    <p className="text-text-secondary">Showing active claims in your scope.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {jobs.length === 0 ? (
                    <div className="glass p-12 text-center text-text-muted">
                        No jobs found matching your scope.
                    </div>
                ) : (
                    jobs.map(job => (
                        <div
                            key={job.id}
                            className="glass p-5 flex flex-col md:flex-row items-start md:items-center gap-6 cursor-pointer hover:bg-white/5 transition-all group border border-white/5 hover:border-accent-electric/20"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg`}
                                style={{ backgroundColor: `var(--status-${job.status.toLowerCase()})` }}
                            >
                                <Briefcase size={24} />
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="text-lg font-bold text-white group-hover:text-accent-electric transition-colors">{job.customer.name}</h4>
                                    <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-md bg-white/5 text-text-secondary uppercase tracking-widest border border-white/10">
                                        {job.status}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-text-muted text-sm">
                                    <span className="flex items-center gap-1.5">
                                        <MapPin size={14} className="text-accent-primary" /> {job.property.address}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Briefcase size={14} className="text-accent-primary" /> {job.insurance.carrier}
                                    </span>
                                </div>
                            </div>

                            <div className="text-left md:text-right mt-2 md:mt-0 font-sans">
                                <div className="text-sm font-semibold text-text-secondary mb-1">
                                    Claim: {job.insurance.claimNumber}
                                </div>
                                <div className="text-[0.65rem] text-text-muted flex items-center gap-1.5 md:justify-end font-medium">
                                    <Clock size={12} /> Just now
                                </div>
                            </div>

                            <ChevronRight className="hidden md:block text-text-muted group-hover:text-white transition-colors" />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default JobsList;

import React, { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { type Job } from '../../types';
import { Briefcase, ChevronRight, Clock, MapPin } from 'lucide-react';

import { useParams } from 'react-router-dom';

export const JobsList: React.FC = () => {
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
        // Note: Owners/Admins seeing 'Global' (targetOfficeId === null) 
        // will get all jobs for the org by default from the first query line.

        const unsubscribe = onSnapshot(q, (snap) => {
            setJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [profile, targetOfficeId, activeDepartmentId]);

    if (loading) return <div>Loading jobs...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Jobs & Claims</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Showing active claims in your scope.</p>
                </div>
            </header>

            <div style={{ display: 'grid', gap: '16px' }}>
                {jobs.length === 0 ? (
                    <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No jobs found matching your scope.
                    </div>
                ) : (
                    jobs.map(job => (
                        <div key={job.id} className="glass" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '24px', cursor: 'pointer', transition: 'transform 0.2s' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                backgroundColor: `var(--status-${job.status.toLowerCase()})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff'
                            }}>
                                <Briefcase size={24} />
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{job.customer.name}</h4>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'var(--text-secondary)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>{job.status}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <MapPin size={14} /> {job.property.address}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Briefcase size={14} /> {job.insurance.carrier}
                                    </span>
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '4px' }}>
                                    Claim: {job.insurance.claimNumber}
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                                    <Clock size={12} /> Just now
                                </div>
                            </div>

                            <ChevronRight style={{ color: 'var(--text-muted)' }} />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

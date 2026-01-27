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
// Icons moved to JobRow component

import { type UserProfile } from '@/types/team';
import { JobRow } from './components/JobRow';
import { useParams } from 'react-router-dom';

const JobsList: React.FC = () => {
    const { profile } = useAuth();
    const { activeOfficeId, activeDepartmentId, departments } = useOrganization();
    const { officeId } = useParams(); // URL Precedence
    const [jobs, setJobs] = useState<Job[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const targetOfficeId = officeId || activeOfficeId;

    useEffect(() => {
        if (!profile) return;

        let q = query(collection(db, 'organizations', profile.orgId, 'jobs'), where('orgId', '==', profile.orgId));

        // Organizational Immersion Filtering
        if (targetOfficeId) {
            q = query(q, where('officeId', '==', targetOfficeId));

            // Department Context
            if (activeDepartmentId) {
                q = query(q, where('departmentIds', 'array-contains', activeDepartmentId));
            } else if ((profile.role === 'MEMBER' || profile.role === 'DEPT_MANAGER') && profile.departmentId) {
                // If no active department selected but user is member or manager, lock to their department
                q = query(q, where('departmentIds', 'array-contains', profile.departmentId));
            }
        } else if (profile.role === 'MEMBER') {
            // Members see ALL claims in their department
            if (profile.departmentId) {
                q = query(q, where('departmentIds', 'array-contains', profile.departmentId));
            } else {
                // Fallback only if they somehow don't have a department
                q = query(q, where('assignedUserIds', 'array-contains', profile.uid));
            }
        }

        const unsubscribe = onSnapshot(q, (snap) => {
            const fetchedJobs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
            console.log("Fetched Jobs:", fetchedJobs.map(j => ({
                id: j.id,
                assignedUserIds: j.assignedUserIds,
                assignments: j.assignments
            })));
            setJobs(fetchedJobs);
            setLoading(false);
        });

        // Fetch Users for resolution
        const qUsers = query(collection(db, 'users'), where('orgId', '==', profile.orgId));
        const unsubscribeUsers = onSnapshot(qUsers, (snap) => {
            setUsers(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
        });

        return () => {
            unsubscribe();
            unsubscribeUsers();
        };
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
                        <JobRow
                            key={job.id}
                            job={job}
                            departments={departments}
                            users={users}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default JobsList;

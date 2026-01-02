import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { jobService } from '@/pages/jobs/jobService';
import { type Job } from '@/types/jobs';
import { HubPulseContainer } from './components/HubPulseContainer';
// import { collection, onSnapshot } from 'firebase/firestore';
// import { db } from '@/lib/firebase';

export const DepartmentDashboard: React.FC = () => {
    const { officeId, departmentId } = useParams();
    const { profile } = useAuth();
    const { departments } = useOrganization();
    const navigate = useNavigate();

    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    // const [tasks, setTasks] = useState<any[]>([]);

    useEffect(() => {
        if (!profile || !officeId || !departmentId) return;

        // --- ACCESS CONTROL ---
        const role = profile.role;



        // 2. Dept Managers: STRICT SCOPE
        if (role === 'DEPT_MANAGER') {
            if (profile.departmentId !== departmentId) {
                // Trying to access another department
                navigate('/dashboard', { replace: true });
                return;
            }
        }

        // 3. Office Admin: STRICT SCOPE
        if (role === 'OFFICE_ADMIN') {
            if (profile.officeId !== officeId) {
                navigate('/dashboard', { replace: true });
                return;
            }
        }

        // --- DATA FETCHING ---
        // Fetch jobs for specific department
        const unsubscribe = jobService.subscribeToOfficeJobs(
            profile.orgId,
            officeId,
            departmentId, // Pass departmentId to let service filter by history (array-contains)
            (list) => {
                setJobs(list);
                setLoading(false);
            }
        );

        // Tasks
        // For now, load user tasks. Ideally for Managers we load Dept Tasks.
        // const unsubTasks = onSnapshot(collection(db, 'tasks'), (snap) => {
        //     const userTasks = snap.docs
        //         .map(d => ({ id: d.id, ...d.data() }))
        //         .filter((t: any) => t.userId === profile.uid || t.assignedTo === profile.uid);
        //     setTasks(userTasks);
        // });

        return () => {
            unsubscribe();
            // unsubTasks();
        }
    }, [profile, officeId, departmentId, navigate]);

    if (loading) return <div className="p-8 text-accent-electric animate-pulse">Loading Department...</div>;

    const currentDept = departments.find(d => d.id === departmentId);

    // VIEW CONFIGURATION
    // If Dept Manager -> 'DEPT_MANAGER' role (PulseManager)
    // If Exec -> We might want to see PulseManager view OR PulseExec view scoped?
    // Spec says: "Sees Department drilldown with financials." 
    // PulseManager currently hides Revenue. 
    // We can pass role to Container. If Exec, Container renders Exec view.
    // But PulseExec expects 'entities'. 

    // For now, let's render HubPulseContainer with the user's REAL role.
    // If I am OWNER, Container renders PulseExec -> We need to prep stats/entities.

    const isExecOrGM = profile?.role === 'OWNER' || profile?.role === 'ORG_ADMIN' || profile?.role === 'OFFICE_ADMIN';

    // If Exec, we need 'entities' for bottom grid.
    const jobEntities = isExecOrGM ? jobs.filter(j => j.status !== 'BILLING').map(j => ({
        id: j.id,
        name: j.customer?.name || 'Unknown',
        subtext: j.status,
        activeCount: 1,
        link: `/jobs/${j.id}`, // Detail link
        personnelCount: j.assignedUserIds?.length || 0
    })) : [];

    return (
        <HubPulseContainer
            role={profile?.role || 'MEMBER'}
            jobs={jobs}
            tasks={[]}
            title={currentDept?.name || "Department Hub"}
            subtitle="Division Command"
            username={profile?.displayName}
            entities={jobEntities} // If Exec, shows jobs. If Manager, unused (PulseManager used).
            entityType="DEPARTMENT"
        />
    );
};

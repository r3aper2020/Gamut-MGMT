import React, { useState, useEffect } from 'react';
// import { collection, onSnapshot } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
import { type Job } from '@/types/jobs';

import { jobService } from '@/pages/jobs/jobService';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { HubPulseContainer } from './components/HubPulseContainer';
import { type HubPulseEntity } from './components/PulseExecutive';

export const GlobalDashboard: React.FC = () => {
    const { profile } = useAuth();
    const { departments, offices } = useOrganization();

    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    // ROLES
    const role = profile?.role;
    const isGlobal = role === 'OWNER' || role === 'ORG_ADMIN';
    const isGM = role === 'OFFICE_ADMIN';
    const isManager = role === 'DEPT_MANAGER';
    const isMember = role === 'MEMBER';

    useEffect(() => {
        if (!profile?.orgId) return;

        let unsubscribe: () => void = () => { };

        if (isGlobal) {
            // 1. GLOBAL: Fetch ALL Jobs
            unsubscribe = jobService.subscribeToOrganizationJobs(profile.orgId, (list) => {
                setJobs(list);
                setLoading(false);
            });
        }
        else if (isGM && profile.officeId) {
            // 2. GM: Fetch Office Jobs
            unsubscribe = jobService.subscribeToOfficeJobs(profile.orgId, profile.officeId, null, (list) => {
                setJobs(list);
                setLoading(false);
            });
        }
        else if (isManager && profile.departmentId && profile.officeId) {
            // 3. MANAGER: Fetch Dept Jobs
            unsubscribe = jobService.subscribeToOfficeJobs(profile.orgId, profile.officeId, null, (list) => {
                // Filter to dept
                setJobs(list.filter(j => j.departmentId === profile.departmentId));
                setLoading(false);
            });
        }
        else if (isMember) {
            // 4. MEMBER: Fetch Assigned Jobs
            // Ideally backend query, but filtering client side for now from Office list (optimized)
            // Wait, we need officeId. If Member has logic to context switch, we might need all my jobs?
            // For now assume filtering from Org jobs or Office jobs.
            // Lets fetch ALL Org jobs and filter by assignedTo (safest for "My Workbench" if I work across offices).
            unsubscribe = jobService.subscribeToOrganizationJobs(profile.orgId, (list) => {
                setJobs(list.filter(j => j.assignedUserIds?.includes(profile.uid)));
                setLoading(false);
            });
        }
        else {
            setTimeout(() => setLoading(false), 0); // Fallback - Async to avoid linter warning
        }

        return () => unsubscribe();
    }, [profile, isGlobal, isGM, isManager, isMember]);

    // const [tasks, setTasks] = useState<any[]>([]);

    // useEffect(() => {
    //     if (!profile?.uid) return;
    //     const unsub = onSnapshot(collection(db, 'tasks'), (snap) => {
    //         const userTasks = snap.docs
    //             .map(d => ({ id: d.id, ...d.data() }))
    //             .filter((t: any) => t.userId === profile.uid || t.assignedTo === profile.uid);
    //         setTasks(userTasks);
    //     });
    //     return () => unsub();
    // }, [profile?.uid]);

    // Prepare View Config
    let entities: HubPulseEntity[] = [];
    let entityType: 'OFFICE' | 'DEPARTMENT' = 'OFFICE';
    let title = "Executive Overview";
    let subtitle = "Enterprise Command Center";

    // VIEW LOGIC
    if (isGlobal) {
        // --- ENTERPRISE VIEW ---
        title = "Executive Overview";
        subtitle = "Enterprise Command Center";
        entityType = 'OFFICE';
        entities = offices.map(o => ({
            id: o.id,
            name: o.name,
            subtext: o.address,
            activeCount: jobs.filter(j => j.officeId === o.id && j.status !== 'CLOSEOUT').length,
            link: `/office/${o.id}/dashboard`,
            personnelCount: '--'
        }));
    }
    else if (isGM && profile?.officeId) {
        // --- BRANCH VIEW ---
        const myOffice = offices.find(o => o.id === profile.officeId);
        title = myOffice?.name || "Branch Hub";
        subtitle = "Branch Command Center";
        entityType = 'DEPARTMENT';
        const myDepts = departments.filter(d => d.officeId === profile.officeId);
        entities = myDepts.map(d => ({
            id: d.id,
            name: d.name,
            subtext: `${d.name} Division`,
            activeCount: jobs.filter(j => j.departmentId === d.id && j.status !== 'CLOSEOUT').length,
            link: `/office/${profile.officeId}/department/${d.id}`, // NEW: Drill to Dept Dashboard
            personnelCount: '--'
        }));
    }
    else if (isManager && profile?.departmentId) {
        // --- DEPT VIEW (PulseManager) ---
        // PulseManager handles its own layout, so these props are less critical but good for consistency
        const myDept = departments.find(d => d.id === profile.departmentId);
        title = myDept?.name || "Department Hub";
        subtitle = "Division Command";
    }
    else if (isMember) {
        // --- MEMBER VIEW (PulseMember) ---
        title = "My Workbench";
        subtitle = "Personal Dashboard";
    }

    if (loading) return <div className="p-8 text-accent-electric animate-pulse">Loading Dashboard...</div>;

    return (
        <HubPulseContainer
            role={profile?.role || 'MEMBER'}
            jobs={jobs}
            tasks={[]}
            title={title}
            subtitle={subtitle}
            username={profile?.displayName}
            entities={entities}
            entityType={entityType}
        />
    );
};

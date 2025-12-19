import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { type Office, type Organization, type Department } from '../types';

interface OrganizationContextType {
    organization: Organization | null;
    offices: Office[];
    departments: Department[]; // Added
    activeOfficeId: string | null;
    activeOffice?: Office;
    activeDepartmentId: string | null; // Added
    activeDepartment?: Department;
    setActiveOfficeId: (id: string | null) => void;
    setActiveDepartmentId: (id: string | null) => void; // Added
    loading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { profile } = useAuth();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [offices, setOffices] = useState<Office[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [activeOfficeId, setActiveOfficeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile?.orgId) {
            setLoading(false);
            return;
        }

        // Default active office based on role
        if (profile.role === 'OWNER' || profile.role === 'ORG_ADMIN') {
            setActiveOfficeId(null); // Global by default
        } else {
            setActiveOfficeId(profile.officeId || null);
        }

        // Listen to organization doc
        const unsubscribeOrg = onSnapshot(doc(db, 'organizations', profile.orgId), (snap) => {
            if (snap.exists()) {
                setOrganization({ id: snap.id, ...snap.data() } as Organization);
            }
        });

        // Listen to offices
        const q = query(collection(db, 'offices'), where('orgId', '==', profile.orgId));
        const unsubscribeOffices = onSnapshot(q, (snap) => {
            const officesList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Office));
            setOffices(officesList);
            // Department fetch is nested or parallel? Parallel is fine.
        });

        // Listen to all departments in org (filtered later or filtered query?)
        // For efficiency, let's just grab all depts in org for now since it's small context
        const qDepts = query(collection(db, 'departments'), where('orgId', '==', profile.orgId));
        const unsubscribeDepts = onSnapshot(qDepts, (snap) => {
            const deptsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
            setDepartments(deptsList);
            setLoading(false);
        });

        return () => {
            unsubscribeOrg();
            unsubscribeOffices();
            unsubscribeDepts();
        };
    }, [profile?.orgId, profile?.role, profile?.officeId]);

    const activeOffice = offices.find(o => o.id === activeOfficeId);

    // Explicit Department Switching
    const [manualDepartmentId, setManualDepartmentId] = useState<string | null>(null);
    // Default to NULL (Global Office View) instead of profile.departmentId
    const activeDepartmentId = manualDepartmentId;
    const activeDepartment = departments.find(d => d.id === activeDepartmentId);

    const setActiveDepartmentId = (id: string | null) => {
        setManualDepartmentId(id);
    };

    return (
        <OrganizationContext.Provider value={{
            organization,
            offices,
            departments, // Expose departments list
            activeOfficeId,
            activeOffice,
            activeDepartmentId,
            activeDepartment,
            setActiveOfficeId,
            setActiveDepartmentId,
            loading
        }}>
            {children}
        </OrganizationContext.Provider>
    );
};

export const useOrganization = () => {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        throw new Error('useOrganization must be used within an OrganizationProvider');
    }
    return context;
};

import React, { useState, type ReactNode, useEffect } from 'react';
import {
    LayoutDashboard,
    Briefcase,
    Users,
    Building2,
    Network,
    ClipboardList
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useParams } from 'react-router-dom';
import { JobCreate } from '@/pages/jobs/JobCreate';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export const MainLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { profile, signOut } = useAuth();
    const { organization, offices, departments, activeOfficeId, activeDepartmentId, setActiveOfficeId, setActiveDepartmentId } = useOrganization();
    const params = useParams();
    const [showJobModal, setShowJobModal] = useState(false);

    // Sync URL with Context
    const urlOfficeId = params.officeId || null;

    useEffect(() => {
        if (urlOfficeId) {
            setActiveOfficeId(urlOfficeId);
        } else {
            setActiveOfficeId(null);
        }
    }, [urlOfficeId, setActiveOfficeId]);

    const effectiveOfficeId = urlOfficeId;
    const activeOffice = offices.find(o => o.id === effectiveOfficeId);

    // --- Dynamic Navigation ---
    const navItems = effectiveOfficeId ? [
        { icon: LayoutDashboard, label: 'Hub Pulse', to: `/office/${effectiveOfficeId}/dashboard` },
        { icon: Briefcase, label: 'Claims', to: `/office/${effectiveOfficeId}/jobs` },
        { icon: ClipboardList, label: 'Operations', to: `/office/${effectiveOfficeId}/ops` },
        { icon: Network, label: 'Departments', to: `/office/${effectiveOfficeId}/depts` },
        { icon: Users, label: 'Staff Roster', to: `/office/${effectiveOfficeId}/team` },
    ] : [
        { icon: Building2, label: 'Enterprise Dash', to: '/' },
        { icon: Briefcase, label: 'All Claims', to: '/jobs' },
        { icon: Building2, label: 'Branch Directory', to: '/org' },
        { icon: Users, label: 'Global Staff', to: '/users' },
    ];

    return (
        <div className="flex min-h-screen bg-black text-white font-sans">
            <Sidebar
                profile={profile}
                organization={organization}
                offices={offices}
                departments={departments}
                activeOfficeId={activeOfficeId}
                activeDepartmentId={activeDepartmentId}
                setActiveDepartmentId={setActiveDepartmentId}
                signOut={signOut}
                navItems={navItems}
            />

            {/* Main Content */}
            <main className="ms-72 flex-1 p-8 min-h-screen">
                <Header
                    activeOfficeId={activeOfficeId}
                    activeOffice={activeOffice}
                    activeDepartmentId={activeDepartmentId}
                    departments={departments}
                    profile={profile}
                    onJobCreateClick={() => setShowJobModal(true)}
                />

                {children}

                {showJobModal && <JobCreate onClose={() => setShowJobModal(false)} />}
            </main>
        </div>
    );
};

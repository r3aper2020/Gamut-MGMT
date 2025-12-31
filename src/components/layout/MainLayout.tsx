import React, { useState, type ReactNode, useEffect } from 'react';
// removed unused icons
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useParams } from 'react-router-dom';
import { JobCreate } from '@/pages/jobs/JobCreate';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { getNavItems, groupNavItems } from '@/utils/navigation';
import { type NavContext } from '@/config/navConfig';

export const MainLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { profile, signOut } = useAuth();
    const { organization, offices, departments, activeOfficeId, activeDepartmentId, setActiveOfficeId, setActiveDepartmentId } = useOrganization();
    const params = useParams();
    const [showJobModal, setShowJobModal] = useState(false);

    // Sync URL with Context
    const urlOfficeId = params.officeId || null;
    const urlDepartmentId = params.departmentId || null;

    useEffect(() => {
        // Sync Office
        if (urlOfficeId) {
            setActiveOfficeId(urlOfficeId);
        } else {
            setActiveOfficeId(null);
        }

        // Sync Department
        if (urlDepartmentId) {
            setActiveDepartmentId(urlDepartmentId);
        } else {
            if (urlOfficeId) {
                setActiveDepartmentId(null);
            }
        }
    }, [urlOfficeId, urlDepartmentId, setActiveOfficeId, setActiveDepartmentId]);

    const effectiveOfficeId = urlOfficeId;
    const activeOffice = offices.find(o => o.id === effectiveOfficeId);

    // --- Dynamic Navigation ---
    let context: NavContext = 'global';
    if (urlOfficeId && urlDepartmentId) {
        context = 'department';
    } else if (urlOfficeId) {
        context = 'office';
    }

    const navItems = getNavItems({
        role: profile?.role || 'MEMBER',
        context,
        officeId: urlOfficeId || undefined,
        departmentId: urlDepartmentId || undefined,
        userProfile: profile
    });

    const navGroups = groupNavItems(navItems);

    return (
        <div className="flex bg-bg-primary mesh-gradient h-screen w-screen overflow-hidden text-text-primary font-sans selection:bg-accent-electric/30">
            <Sidebar
                profile={profile}
                organization={organization}
                offices={offices}
                departments={departments}
                activeOfficeId={activeOfficeId}
                activeDepartmentId={activeDepartmentId}
                setActiveDepartmentId={setActiveDepartmentId}
                signOut={signOut}
                navGroups={navGroups}
            />

            {/* Main Content */}
            <main className="ms-72 flex-1 flex flex-col h-full overflow-hidden relative z-10 animate-in">
                <div className="flex-none p-8 pb-0">
                    <Header
                        activeOfficeId={activeOfficeId}
                        activeOffice={activeOffice}
                        activeDepartmentId={activeDepartmentId}
                        departments={departments}
                        profile={profile}
                        onJobCreateClick={() => setShowJobModal(true)}
                    />
                </div>

                <div className="flex-1 overflow-auto p-8 pt-4 custom-scrollbar relative">
                    {children}
                </div>

                {showJobModal && <JobCreate onClose={() => setShowJobModal(false)} />}
            </main>
        </div>
    );
};

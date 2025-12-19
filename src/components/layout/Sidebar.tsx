import React from 'react';
import { LogOut } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { type SidebarItemProps, SidebarItem } from '@/components/layout/SidebarItem';
import { SidebarContextSwitcher } from '@/components/layout/SidebarContextSwitcher';
import { type Office, type Department, type Organization } from '@/types/org';
import { type UserProfile } from '@/types/team';

interface SidebarProps {
    profile: UserProfile | null;
    organization: Organization | null;
    offices: Office[];
    departments: Department[];
    activeOfficeId: string | null;
    activeDepartmentId: string | null;
    setActiveDepartmentId: (id: string | null) => void;
    signOut: () => Promise<void>;
    navItems: Omit<SidebarItemProps, 'active'>[];
}

export const Sidebar: React.FC<SidebarProps> = ({
    profile,
    organization,
    offices,
    departments,
    activeOfficeId,
    activeDepartmentId,
    setActiveDepartmentId,
    signOut,
    navItems
}) => {
    const location = useLocation();

    return (
        <aside className="w-72 border-r border-white/10 p-6 flex flex-col fixed h-screen z-10 bg-[#141414]/60 backdrop-blur-[20px]">
            <div className="mb-8 flex items-center gap-3 px-1">
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-accent-primary to-accent-electric flex items-center justify-center text-white font-bold text-base shadow-[0_0_15px_rgba(0,242,255,0.3)]">G</div>
                <h1 className="text-xl font-extrabold tracking-tight m-0 bg-linear-to-br from-accent-primary to-accent-electric text-transparent bg-clip-text">GAMUT</h1>
            </div>

            <SidebarContextSwitcher
                organization={organization}
                offices={
                    (profile?.role === 'OWNER' || profile?.role === 'ORG_ADMIN')
                        ? offices
                        : offices.filter(o => o.id === profile?.officeId)
                }
                departments={departments}
                activeOfficeId={activeOfficeId}
                activeDepartmentId={activeDepartmentId}
                setActiveDepartmentId={setActiveDepartmentId}
                userRole={profile?.role}
                userProfile={profile}
            />

            <nav className="flex-1">
                {navItems.map((item) => (
                    <SidebarItem
                        key={item.to}
                        {...item}
                        active={location.pathname === item.to}
                    />
                ))}
            </nav>

            <div className="mt-auto border-t border-white/10 pt-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-[10px] bg-bg-tertiary flex items-center justify-center text-sm font-semibold">
                        {profile?.displayName?.[0] || 'U'}
                    </div>
                    <div className="overflow-hidden">
                        <div className="text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                            {profile?.displayName || 'User'}
                        </div>
                        <div className="text-xs text-text-muted capitalize">
                            {profile?.role.replace('_', ' ')}
                        </div>
                        {profile?.departmentId && (
                            <div className="text-[0.7rem] text-accent-electric font-medium mt-0.5">
                                {departments.find(d => d.id === profile.departmentId)?.name}
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={signOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#ff4444] bg-transparent border-none transition-all duration-200 cursor-pointer hover:bg-[rgba(255,68,68,0.1)]"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

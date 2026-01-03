import React from 'react';
import { LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { SidebarItem } from '@/components/layout/SidebarItem';
import { SidebarContextSwitcher } from '@/components/layout/SidebarContextSwitcher';
import { type Office, type Department, type Organization } from '@/types/org';
import { type UserProfile } from '@/types/team';
import { type NavItem } from '@/config/navConfig';
interface SidebarProps {
    profile: UserProfile | null;
    organization: Organization | null;
    offices: Office[];
    departments: Department[];
    activeOfficeId: string | null;
    activeDepartmentId: string | null;
    setActiveDepartmentId: (id: string | null) => void;
    signOut: () => Promise<void>;
    navGroups: {
        primary: NavItem[];
        organize: NavItem[];
        measure: NavItem[];
        configure: NavItem[];
        utilities: NavItem[];
    };
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
    navGroups
}) => {
    const location = useLocation();

    const renderNavSection = (items: NavItem[], title?: string) => {
        if (!items || items.length === 0) return null;
        return (
            <div className="mb-6">
                {title && (
                    <h3 className="px-4 text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                        {title}
                    </h3>
                )}
                <div className="space-y-0.5">
                    {items.map((item) => (
                        <SidebarItem
                            key={item.to}
                            icon={item.icon}
                            label={item.label}
                            to={item.to}
                            isActive={location.pathname === item.to}
                        />
                    ))}
                </div>
            </div>
        );
    };

    let profileLink = '/profile';
    if (activeOfficeId && activeDepartmentId) {
        profileLink = `/office/${activeOfficeId}/department/${activeDepartmentId}/profile`;
    } else if (activeOfficeId) {
        profileLink = `/office/${activeOfficeId}/profile`;
    }

    return (
        <aside className="w-72 border-r border-white/5 p-6 flex flex-col fixed h-screen z-20 bg-black/40 backdrop-blur-xl shadow-2xl transition-transform duration-300 will-change-transform isolate" style={{ transform: 'translate3d(0,0,0)', backfaceVisibility: 'hidden' }}>
            <div className="mb-8 flex items-center gap-3 px-1">
                <img src="/logo.png" alt="Gamut" className="w-8 h-8 object-contain drop-shadow-[0_0_5px_rgba(0,242,255,0.5)]" />
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

            <nav className="flex-1 overflow-y-auto -mx-4 px-4 custom-scrollbar">
                {renderNavSection(navGroups.primary)}
                {renderNavSection(navGroups.organize, "Organize")}
                {renderNavSection(navGroups.measure, "Measure")}
                {renderNavSection(navGroups.configure, "Configure")}

                {/* Utilities at bottom or separate? Let's put them in flow for now */}
                {navGroups.utilities?.length > 0 && <div className="my-4 border-t border-white/5 mx-2" />}
                {renderNavSection(navGroups.utilities, "Utilities")}
            </nav>

            <div className="mt-auto border-t border-white/10 pt-6">
                <Link to={profileLink} className="flex items-center gap-3 mb-5 p-2 -mx-2 rounded-xl transition-colors duration-200 hover:bg-white/5 no-underline group cursor-pointer">
                    <div className="w-10 h-10 rounded-[10px] bg-bg-tertiary flex items-center justify-center text-sm font-semibold text-white group-hover:text-accent-electric transition-colors overflow-hidden">
                        {profile?.photoURL ? (
                            <img src={profile.photoURL} alt={profile.displayName || 'User'} className="w-full h-full object-cover" />
                        ) : (
                            profile?.displayName?.[0] || 'U'
                        )}
                    </div>
                    <div className="overflow-hidden">
                        <div className="text-sm font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis group-hover:text-accent-electric transition-colors">
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
                </Link>
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

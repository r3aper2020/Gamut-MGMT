import React, { useState, type ReactNode, useEffect } from 'react';
import {
    LayoutDashboard,
    Briefcase,
    Users,
    LogOut,
    PlusCircle,
    Building2,
    MapPin,
    ChevronDown,
    Shield,
    Network,
    Globe,
    ClipboardList
} from 'lucide-react';
import { type Department } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { JobCreate } from '../../pages/jobs/JobCreate';

// --- Types ---
interface SidebarItemProps {
    icon: React.ElementType;
    label: string;
    to: string;
    active?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, to, active }) => (
    <Link to={to} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '12px',
        color: active ? 'var(--accent-electric)' : 'var(--text-secondary)',
        backgroundColor: active ? 'rgba(0, 242, 255, 0.05)' : 'transparent',
        transition: 'all 0.2s ease',
        marginBottom: '4px'
    }}>
        <Icon size={20} />
        <span style={{ fontWeight: 500 }}>{label}</span>
        {active && <div style={{
            marginLeft: 'auto',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-electric)',
            boxShadow: '0 0 10px var(--accent-electric)'
        }} />}
    </Link>
);

// --- Context Switcher ---
const SidebarContextSwitcher: React.FC<{
    organization: any;
    offices: any[];
    departments: Department[]; // Added
    activeOfficeId: string | null;
    activeDepartmentId: string | null;
    setActiveDepartmentId: (id: string | null) => void;
    userRole?: string;
}> = ({ organization, offices, departments, activeOfficeId, activeDepartmentId, setActiveDepartmentId, userRole }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const activeOffice = offices.find(o => o.id === activeOfficeId);
    const activeDepartment = departments.find(d => d.id === activeDepartmentId);

    const handleSwitch = (officeId: string | null, departmentId: string | null = null) => {
        if (officeId) {
            setActiveDepartmentId(departmentId);

            // If switching directly to a department, maybe go to Dept page? 
            // For now, stick to Dashboard but with filtered context
            navigate(`/office/${officeId}/dashboard`);
        } else {
            setActiveDepartmentId(null);
            navigate('/');
        }
        setIsOpen(false);
    };

    return (
        <div style={{ position: 'relative', marginBottom: '32px' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '12px',
                    background: isOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: isOpen ? 'var(--accent-electric)' : 'var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    textAlign: 'left'
                }}
            >
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: activeOfficeId ? 'rgba(0, 242, 255, 0.1)' : 'linear-gradient(135deg, var(--accent-primary), var(--accent-electric))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: activeOfficeId ? 'var(--accent-electric)' : '#fff',
                    flexShrink: 0,
                    boxShadow: activeOfficeId ? 'none' : '0 0 15px rgba(0, 242, 255, 0.2)'
                }}>
                    {activeOfficeId ? <MapPin size={18} /> : <Globe size={18} />}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {activeDepartment ? activeDepartment.name : (activeOfficeId ? activeOffice?.name : organization?.name)}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {activeDepartment ? 'Department View' : (activeOfficeId ? 'Branch Hub' : 'Enterprise Global')}
                    </div>
                </div>
                <ChevronDown size={14} style={{
                    color: 'var(--text-muted)',
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.3s ease'
                }} />
            </button>

            {isOpen && (
                <>
                    <div
                        onClick={() => setIsOpen(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    />
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(20, 20, 20, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        padding: '8px',
                        zIndex: 50,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                        animation: 'fadeInScale 0.2s ease-out',
                        maxHeight: '400px',
                        overflowY: 'auto'
                    }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', padding: '8px 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Switch Perspective
                        </div>

                        {/* --- OWNER / MULTI-OFFICE VIEW --- */}
                        {(userRole === 'OWNER' || userRole === 'ORG_ADMIN' || offices.length > 1) ? (
                            <>
                                {(userRole === 'OWNER' || userRole === 'ORG_ADMIN') && (
                                    <button
                                        onClick={() => handleSwitch(null)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            background: !activeOfficeId ? 'rgba(0, 242, 255, 0.1)' : 'transparent',
                                            border: 'none',
                                            borderRadius: '10px',
                                            color: !activeOfficeId ? 'var(--accent-electric)' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Globe size={14} />
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Global Overview</span>
                                    </button>
                                )}
                                <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

                                {offices.map(o => {
                                    const isActiveOffice = activeOfficeId === o.id;
                                    const officeDepts = departments.filter(d => d.officeId === o.id);

                                    return (
                                        <div key={o.id}>
                                            <button
                                                onClick={() => handleSwitch(o.id, null)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    background: (isActiveOffice && !activeDepartmentId) ? 'rgba(0, 242, 255, 0.1)' : 'transparent',
                                                    border: 'none',
                                                    borderRadius: '10px',
                                                    color: (isActiveOffice && !activeDepartmentId) ? 'var(--accent-electric)' : 'var(--text-secondary)',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <MapPin size={14} />
                                                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{o.name}</span>
                                            </button>

                                            {/* Nested Departments for Active Office */}
                                            {isActiveOffice && (
                                                <div style={{ marginTop: '2px', marginBottom: '2px' }}>
                                                    {officeDepts.map(d => (
                                                        <button
                                                            key={d.id}
                                                            onClick={() => handleSwitch(o.id, d.id)}
                                                            style={{
                                                                width: '100%',
                                                                padding: '8px 12px 8px 36px', // Indented for hierarchy
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px',
                                                                background: activeDepartmentId === d.id ? 'rgba(234, 179, 8, 0.1)' : 'transparent',
                                                                border: '1px solid',
                                                                borderColor: activeDepartmentId === d.id ? 'rgba(234, 179, 8, 0.3)' : 'transparent',
                                                                borderRadius: '10px',
                                                                color: activeDepartmentId === d.id ? '#fca5a5' : 'var(--text-secondary)',
                                                                cursor: 'pointer',
                                                                textAlign: 'left',
                                                                transition: 'all 0.2s ease',
                                                                boxShadow: activeDepartmentId === d.id ? '0 0 10px rgba(234, 179, 8, 0.1)' : 'none'
                                                            }}
                                                        >
                                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor', opacity: activeDepartmentId === d.id ? 1 : 0.5 }} />
                                                            <span style={{ fontSize: '0.8125rem', fontWeight: activeDepartmentId === d.id ? 700 : 500 }}>{d.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </>
                        ) : (
                            /* --- SINGLE OFFICE / MANAGER VIEW (FLATTENED) --- */
                            /* This mimics the Owner dropdown but swapping Offices for Departments */
                            (() => {
                                const o = offices[0]; // The single assigned office
                                if (!o) return <div style={{ padding: '12px', color: 'var(--text-muted)' }}>No Assignment</div>;

                                const officeDepts = departments.filter(d => d.officeId === o.id);

                                return (
                                    <>
                                        {/* 1. Office Overview (The "Global" for Managers) */}
                                        <button
                                            onClick={() => handleSwitch(o.id, null)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                background: !activeDepartmentId ? 'rgba(0, 242, 255, 0.1)' : 'transparent',
                                                border: 'none', // Standardized to match Global button
                                                borderRadius: '10px',
                                                color: !activeDepartmentId ? 'var(--accent-electric)' : 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <MapPin size={14} />
                                            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Office Overview</span>
                                        </button>

                                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

                                        {/* 2. List of Departments (The "Branches" for Managers) */}
                                        {officeDepts.map(d => (
                                            <button
                                                key={d.id}
                                                onClick={() => handleSwitch(o.id, d.id)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px', // Match owner layout sizing
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    // Removed marginTop to match Owner view
                                                    background: activeDepartmentId === d.id ? 'rgba(234, 179, 8, 0.1)' : 'transparent',
                                                    border: '1px solid',
                                                    borderColor: activeDepartmentId === d.id ? 'rgba(234, 179, 8, 0.3)' : 'transparent',
                                                    borderRadius: '10px',
                                                    color: activeDepartmentId === d.id ? '#fca5a5' : 'var(--text-secondary)',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: activeDepartmentId === d.id ? '0 0 10px rgba(234, 179, 8, 0.1)' : 'none'
                                                }}
                                            >
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor', opacity: activeDepartmentId === d.id ? 1 : 0.5 }} />
                                                <span style={{ fontSize: '0.8125rem', fontWeight: activeDepartmentId === d.id ? 700 : 500 }}>{d.name}</span>
                                            </button>
                                        ))}
                                    </>
                                );
                            })()
                        )}
                    </div >
                </>
            )}
            <style>{`
                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.95) translateY(-10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
};

export const MainLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { profile, signOut } = useAuth();
    const { organization, offices, departments, activeOfficeId, activeDepartmentId, setActiveOfficeId, setActiveDepartmentId } = useOrganization();
    const location = useLocation();
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
    }, [urlOfficeId]);

    const effectiveOfficeId = urlOfficeId; // Renamed to avoid collision if needed, or just use context variable.
    // Actually, let's just use the context variable 'activeOfficeId' for consistency, 
    // but the previous code used this local var to drive the nav logic.
    // If we rely on context, there might be a split second flicker.
    // Let's rely on the URL param for "current view" logic to be instant.

    const activeOffice = offices.find(o => o.id === effectiveOfficeId);

    // --- Dynamic Navigation ---
    let navItems = [];

    if (effectiveOfficeId) {
        // === BRANCH MODE ===
        navItems = [
            { icon: LayoutDashboard, label: 'Hub Pulse', to: `/office/${effectiveOfficeId}/dashboard` },
            { icon: Briefcase, label: 'Claims', to: `/office/${effectiveOfficeId}/jobs` },
            { icon: ClipboardList, label: 'Operations', to: `/office/${effectiveOfficeId}/ops` },
            { icon: Network, label: 'Departments', to: `/office/${effectiveOfficeId}/depts` },
            { icon: Users, label: 'Staff Roster', to: `/office/${effectiveOfficeId}/team` },
        ];
    } else {
        // === GLOBAL MODE ===
        navItems = [
            { icon: Shield, label: 'Enterprise Dash', to: '/' },
            { icon: Briefcase, label: 'All Claims', to: '/jobs' },
            { icon: Building2, label: 'Branch Directory', to: '/org' },
            { icon: Users, label: 'Global Staff', to: '/users' },
        ];
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#000' }}>
            <aside style={{
                width: '280px',
                borderRight: '1px solid var(--border-color)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                height: '100vh',
                zIndex: 10
            }} className="glass">
                <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 4px' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-electric))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        boxShadow: '0 0 15px rgba(0, 242, 255, 0.3)'
                    }}>G</div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }} className="gradient-text">GAMUT</h1>
                </div>

                <SidebarContextSwitcher
                    organization={organization}
                    offices={
                        (profile?.role === 'OWNER' || profile?.role === 'ORG_ADMIN')
                            ? offices
                            : offices.filter(o => o.id === profile?.officeId)
                    }
                    departments={departments} // Pass props
                    activeOfficeId={activeOfficeId}
                    activeDepartmentId={activeDepartmentId} // Pass props
                    setActiveDepartmentId={setActiveDepartmentId} // Pass props
                    userRole={profile?.role}
                />

                <nav style={{ flex: 1 }}>
                    {navItems.map((item) => (
                        <SidebarItem
                            key={item.to}
                            {...item}
                            active={location.pathname === item.to}
                        />
                    ))}
                </nav>

                <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            backgroundColor: 'var(--bg-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 600
                        }}>
                            {profile?.displayName?.[0] || 'U'}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {profile?.displayName || 'User'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {profile?.role.replace('_', ' ')}
                            </div>
                            {/* Show Assigned Department (Identity) */}
                            {profile?.departmentId && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--accent-electric)', fontWeight: 500, marginTop: '2px' }}>
                                    {departments.find(d => d.id === profile.departmentId)?.name}
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={signOut}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            color: '#ff4444',
                            backgroundColor: 'transparent',
                            border: 'none',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <LogOut size={20} />
                        <span style={{ fontWeight: 500 }}>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
                <header style={{
                    marginBottom: '32px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', transition: 'all 0.3s ease' }}>
                        <div style={{ marginRight: '24px' }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 800,
                                letterSpacing: '-0.03em',
                                margin: 0,
                                color: '#fff'
                            }}>
                                {activeOfficeId ? (activeOffice?.name || 'Branch Hub') : 'Enterprise Command Center'}
                            </h2>
                        </div>

                        {/* Context Badge */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 14px',
                            background: activeDepartmentId ? 'rgba(234, 179, 8, 0.1)' : 'rgba(0, 242, 255, 0.05)', // Yellow tint for deep department dive
                            border: '1px solid',
                            borderColor: activeDepartmentId ? 'rgba(234, 179, 8, 0.2)' : 'rgba(0, 242, 255, 0.15)',
                            borderRadius: '100px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: activeDepartmentId ? '#fca5a5' : 'var(--accent-electric)', // Different text color for emphasis
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 0 15px rgba(0, 242, 255, 0.05)'
                        }}>
                            {activeOfficeId ? <MapPin size={12} /> : <Shield size={12} />}
                            {activeOfficeId
                                ? (activeDepartmentId
                                    ? `${departments.find(d => d.id === activeDepartmentId)?.name || 'Department'} View`
                                    : 'Office Overview')
                                : 'Global Scope'}
                        </div>
                    </div>

                    {activeOfficeId && profile?.role !== 'MEMBER' && (
                        <button
                            onClick={() => setShowJobModal(true)}
                            className="glass"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <PlusCircle size={18} />
                            <span>Create Job</span>
                        </button>
                    )}
                </header>
                {children}

                {showJobModal && <JobCreate onClose={() => setShowJobModal(false)} />}
            </main>
        </div>
    );
};

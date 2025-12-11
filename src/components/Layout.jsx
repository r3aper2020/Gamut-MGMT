import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, FileText, Users, Building2, LogOut, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { useState } from 'react';

export default function Layout({ children }) {
    const { user, logout, loading, isOrgOwner, isAdmin, isManager } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // RBAC Navigation Logic
    const navItems = [
        {
            to: '/dashboard',
            icon: LayoutDashboard,
            label: 'Dashboard',
            allowed: true // Everyone accesses dashboard
        },
        {
            to: '/claims',
            icon: FileText,
            label: 'Claims',
            allowed: true // Everyone accesses claims
        },
        {
            to: '/users',
            icon: Users,
            label: 'Users',
            allowed: isOrgOwner || isAdmin || isManager
        },
        {
            to: '/teams',
            icon: Users,
            label: 'Teams',
            allowed: isOrgOwner || isAdmin || isManager || user?.role === 'team_member'
        },
        {
            to: '/organization',
            icon: Building2,
            label: 'Organization',
            allowed: isOrgOwner || isAdmin
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    // Redirect Org Owner to Onboarding if no organizationId
    if (user.role === 'org_owner' && !user.organizationId) {
        return <Navigate to="/onboarding" />;
    }

    // Redirect Pending users
    if (user.role === 'pending') {
        return <Navigate to="/pending" />;
    }

    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out flex flex-col
                    ${isSidebarOpen ? 'w-64' : 'w-20'}
                `}
            >
                {/* Logo Section */}
                <div className="h-16 flex items-center px-4 border-b border-slate-800">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 min-w-[2.5rem] bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/30">
                            <span className="text-xl font-bold text-white">G</span>
                        </div>
                        <div className={`transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400 whitespace-nowrap">Gamut</h1>
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
                    {navItems.filter(item => item.allowed).map((item) => {
                        const isActive = location.pathname.startsWith(item.to);
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`
                                    flex items-center gap-3 px-3 py-3 rounded-lg transition-all group relative
                                    ${isActive
                                        ? 'bg-primary-500/10 text-primary-400'
                                        : 'text-gray-400 hover:bg-slate-800 hover:text-gray-200'}
                                `}
                                title={!isSidebarOpen ? item.label : ''}
                            >
                                <item.icon size={20} className={isActive ? 'text-primary-400' : 'text-gray-400 group-hover:text-gray-200'} />
                                <span className={`font-medium whitespace-nowrap transition-all duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                                    {item.label}
                                </span>
                                {/* Tooltip for collapsed state */}
                                {!isSidebarOpen && (
                                    <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[60]">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-slate-800">
                    <Link to="/profile" className={`flex items-center gap-3 mb-4 transition-all duration-200 hover:bg-slate-800 p-2 rounded-lg -mx-2 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-primary-400 font-bold">
                            {user.name?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-100 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 capitalize truncate">{user.role?.replace('_', ' ')}</p>
                        </div>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className={`
                            btn btn-secondary w-full flex items-center justify-center gap-2 hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/30 transition-all
                            ${!isSidebarOpen && 'px-0'}
                        `}
                        title="Logout"
                    >
                        <LogOut size={20} />
                        <span className={`${isSidebarOpen ? 'inline' : 'hidden'}`}>Logout</span>
                    </button>

                    {/* Toggle Button */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="absolute -right-3 top-20 bg-slate-800 border border-slate-700 text-gray-400 rounded-full p-1 hover:text-white hover:bg-slate-700 transition-colors hidden md:block"
                    >
                        {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main
                className={`
                    flex-1 transition-all duration-300 ease-in-out p-4 md:p-8
                    ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}
                    ml-20
                `}
            >
                {children}
            </main>
        </div>
    );
}

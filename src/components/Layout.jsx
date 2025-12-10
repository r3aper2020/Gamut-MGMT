import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, FileText, Users, Building2, LogOut } from 'lucide-react';

export default function Layout({ children }) {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/claims', icon: FileText, label: 'Claims' },
        { to: '/teams', icon: Users, label: 'Teams' },
        { to: '/organization', icon: Building2, label: 'Organization' },
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
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/30">
                                <span className="text-xl font-bold text-white">G</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">Gamut</h1>
                                <p className="text-xs text-gray-500">AI Claims Management</p>
                            </div>
                        </div>

                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:bg-slate-800 hover:text-primary-400 transition-all"
                                >
                                    <item.icon size={18} />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            ))}
                        </nav>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-gray-100">{user?.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="btn btn-secondary flex items-center gap-2"
                            >
                                <LogOut size={18} />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}

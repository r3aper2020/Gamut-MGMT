import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles, requiredPermission }) {
    const { isAuthenticated, loading, user, hasPermission } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Role-based check (Legacy/Course grain)
    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    // Permission-based check (Fine grain)
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

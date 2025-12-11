import { createContext, useContext } from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const { user, loading, login, logout, refreshUser } = useFirebaseAuth();

    const value = {
        user,
        login,
        logout,
        refreshUser,
        loading,
        isAuthenticated: !!user,
        organizationId: user?.organizationId,
        userTeamId: user?.teamId, // Important for managers
        role: user?.role,

        // Role Checks
        isOrgOwner: user?.role === 'org_owner',
        isAdmin: user?.role === 'manager_admin',
        isManager: user?.role === 'manager',
        isTeamMember: user?.role === 'team_member',

        // Permission Derived State
        canManageAllUsers: user?.role === 'org_owner' || user?.role === 'manager_admin',
        canManageTeamUsers: user?.role === 'manager', // Managers can only manage their own team's users
        canViewOrganizationSettings: user?.role === 'org_owner' || user?.role === 'manager_admin',

        // Legacy/Compat flags (review usage later)
        hasAdminRights: user?.hasAdminRights || user?.role === 'org_owner' || user?.role === 'manager_admin',
        canViewAllTeams: user?.role === 'org_owner' || user?.role === 'manager_admin',
        canApprove: user?.role === 'org_owner' || user?.role === 'manager' || user?.role === 'manager_admin',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

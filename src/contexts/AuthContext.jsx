import { createContext, useContext } from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { ROLES, PERMISSIONS, hasPermission, ROLE_PERMISSIONS } from '../config/permissions';

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

    // Helper for direct usage
    const checkPermission = (permission) => {
        return user?.role ? hasPermission(user.role, permission) : false;
    };

    const value = {
        user,
        login,
        logout,
        refreshUser,
        loading,
        isAuthenticated: !!user,
        organizationId: user?.organizationId,
        userTeamId: user?.teamId,
        role: user?.role,

        // Permission Helper
        hasPermission: checkPermission,
        permissions: user?.role ? ROLE_PERMISSIONS[user.role] : [],

        // Role Checks (Legacy support / Quick checks)
        isOwner: user?.role === ROLES.OWNER,
        isAdmin: user?.role === ROLES.ADMIN,
        isManager: user?.role === ROLES.MANAGER,
        isMember: user?.role === ROLES.MEMBER,

        // Mapped Permissions (for easy destructuring)
        canManageAllUsers: checkPermission(PERMISSIONS.MANAGE_ALL_USERS),
        canManageTeamUsers: checkPermission(PERMISSIONS.MANAGE_TEAM_USERS),
        canViewOrganizationSettings: checkPermission(PERMISSIONS.VIEW_ORG_SETTINGS),
        canViewAllTeams: checkPermission(PERMISSIONS.VIEW_ALL_TEAMS),
        canApprove: checkPermission(PERMISSIONS.APPROVE_CLAIMS),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

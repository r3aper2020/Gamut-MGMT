/**
 * RBAC Configuration
 * 
 * This file defines the Roles and Permissions for the application.
 * Ideally, these should mirror the backend configuration in `backend/rbac.py`.
 */

export const ROLES = {
    OWNER: 'owner',
    ADMIN: 'admin',
    MANAGER: 'manager',
    LEAD: 'lead',
    MEMBER: 'member',
};

export const PERMISSIONS = {
    // User Management
    MANAGE_ALL_USERS: 'manage_all_users',      // Create/Edit any user
    MANAGE_TEAM_USERS: 'manage_team_users',    // Create/Edit users in own team
    VIEW_ALL_USERS: 'view_all_users',          // List all users in org
    VIEW_TEAM_USERS: 'view_team_users',        // List users in own team

    // Team Management
    MANAGE_TEAMS: 'manage_teams',              // Create/Edit/Delete teams
    VIEW_ALL_TEAMS: 'view_all_teams',          // View all teams
    VIEW_OWN_TEAM: 'view_own_team',            // View own team details

    // Claim Management
    APPROVE_CLAIMS: 'approve_claims',          // Approve/Reject claims
    VIEW_ALL_CLAIMS: 'view_all_claims',        // View claims across all teams
    VIEW_TEAM_CLAIMS: 'view_team_claims',      // View claims in own team
    CREATE_CLAIMS: 'create_claims',            // Submit new claims
    DELETE_OWN_CLAIMS: 'delete_own_claims',    // Delete own claims

    // Organization
    VIEW_ORG_SETTINGS: 'view_org_settings',    // View org settings
    MANAGE_ORG_SETTINGS: 'manage_org_settings',// Edit org settings
};

// Map Roles to Permissions
export const ROLE_PERMISSIONS = {
    [ROLES.OWNER]: [
        // Owner has everything
        PERMISSIONS.MANAGE_ALL_USERS,
        PERMISSIONS.VIEW_ALL_USERS,
        PERMISSIONS.MANAGE_TEAMS,
        PERMISSIONS.VIEW_ALL_TEAMS,
        PERMISSIONS.APPROVE_CLAIMS,
        PERMISSIONS.VIEW_ALL_CLAIMS,
        PERMISSIONS.CREATE_CLAIMS, // Usually doesn't need to, but can
        PERMISSIONS.VIEW_ORG_SETTINGS,
        PERMISSIONS.MANAGE_ORG_SETTINGS,
    ],
    [ROLES.ADMIN]: [
        // Admin is like Owner but usually can't delete the Owner
        PERMISSIONS.MANAGE_ALL_USERS,
        PERMISSIONS.VIEW_ALL_USERS,
        PERMISSIONS.MANAGE_TEAMS,
        PERMISSIONS.VIEW_ALL_TEAMS,
        PERMISSIONS.APPROVE_CLAIMS,
        PERMISSIONS.VIEW_ALL_CLAIMS,
        PERMISSIONS.VIEW_ORG_SETTINGS,
        // Cannot manage org settings (financials etc)? Let's say yes for now or no depending on business logic. 
        // Based on existing code, admin had less than owner. Let's give them view org but not manage.
        PERMISSIONS.VIEW_ORG_SETTINGS,
    ],
    [ROLES.MANAGER]: [
        PERMISSIONS.MANAGE_TEAM_USERS,
        PERMISSIONS.VIEW_TEAM_USERS,
        PERMISSIONS.VIEW_OWN_TEAM,
        PERMISSIONS.APPROVE_CLAIMS,       // Can approve for own team
        PERMISSIONS.VIEW_TEAM_CLAIMS,
        PERMISSIONS.CREATE_CLAIMS,
    ],
    [ROLES.LEAD]: [
        PERMISSIONS.VIEW_TEAM_USERS,
        PERMISSIONS.VIEW_OWN_TEAM,
        PERMISSIONS.VIEW_TEAM_CLAIMS,     // Leads usually see their team's work
        PERMISSIONS.CREATE_CLAIMS,
    ],
    [ROLES.MEMBER]: [
        PERMISSIONS.VIEW_TEAM_USERS,      // Can see logic in list_users backend
        PERMISSIONS.VIEW_OWN_TEAM,
        PERMISSIONS.VIEW_TEAM_CLAIMS,     // Can see claims in team? Or just own? Existing code: "isMember && hasTeamAccess" for list.
        PERMISSIONS.CREATE_CLAIMS,
        PERMISSIONS.DELETE_OWN_CLAIMS,
    ],
};

/**
 * Check if a role has a specific permission.
 * @param {string} role - The user's role string.
 * @param {string} permission - The permission to check.
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
    if (!role) return false;
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
};

/**
 * Check if a role has ANY of the provided permissions.
 * @param {string} role 
 * @param {string[]} permissionsList 
 */
export const hasAnyPermission = (role, permissionsList) => {
    if (!role) return false;
    const userPermissions = ROLE_PERMISSIONS[role] || [];
    return permissionsList.some(p => userPermissions.includes(p));
};

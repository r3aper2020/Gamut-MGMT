"""
RBAC Configuration (Backend)

This module defines the Roles and Permissions for the application.
It should be kept in sync with `src/config/permissions.js`.
"""

class ROLES:
    OWNER = 'owner'
    ADMIN = 'admin'
    MANAGER = 'manager'
    LEAD = 'lead'
    MEMBER = 'member'

class PERMISSIONS:
    # User Management
    MANAGE_ALL_USERS = 'manage_all_users'      # Create/Edit any user
    MANAGE_TEAM_USERS = 'manage_team_users'    # Create/Edit users in own team
    VIEW_ALL_USERS = 'view_all_users'          # List all users in org
    VIEW_TEAM_USERS = 'view_team_users'        # List users in own team

    # Team Management
    MANAGE_TEAMS = 'manage_teams'              # Create/Edit/Delete teams
    VIEW_ALL_TEAMS = 'view_all_teams'          # View all teams
    VIEW_OWN_TEAM = 'view_own_team'            # View own team details

    # Claim Management
    APPROVE_CLAIMS = 'approve_claims'          # Approve/Reject claims
    VIEW_ALL_CLAIMS = 'view_all_claims'        # View claims across all teams
    VIEW_TEAM_CLAIMS = 'view_team_claims'      # View claims in own team
    CREATE_CLAIMS = 'create_claims'            # Submit new claims
    DELETE_OWN_CLAIMS = 'delete_own_claims'    # Delete own claims

    # Organization
    VIEW_ORG_SETTINGS = 'view_org_settings'    # View org settings
    MANAGE_ORG_SETTINGS = 'manage_org_settings'# Edit org settings

# Map Roles to Permissions
ROLE_PERMISSIONS = {
    ROLES.OWNER: [
        PERMISSIONS.MANAGE_ALL_USERS,
        PERMISSIONS.VIEW_ALL_USERS,
        PERMISSIONS.MANAGE_TEAMS,
        PERMISSIONS.VIEW_ALL_TEAMS,
        PERMISSIONS.APPROVE_CLAIMS,
        PERMISSIONS.VIEW_ALL_CLAIMS,
        PERMISSIONS.CREATE_CLAIMS,
        PERMISSIONS.VIEW_ORG_SETTINGS,
        PERMISSIONS.MANAGE_ORG_SETTINGS,
    ],
    ROLES.ADMIN: [
        PERMISSIONS.MANAGE_ALL_USERS,
        PERMISSIONS.VIEW_ALL_USERS,
        PERMISSIONS.MANAGE_TEAMS,
        PERMISSIONS.VIEW_ALL_TEAMS,
        PERMISSIONS.APPROVE_CLAIMS,
        PERMISSIONS.VIEW_ALL_CLAIMS,
        PERMISSIONS.VIEW_ORG_SETTINGS,
    ],
    ROLES.MANAGER: [
        PERMISSIONS.MANAGE_TEAM_USERS,
        PERMISSIONS.VIEW_TEAM_USERS,
        PERMISSIONS.VIEW_OWN_TEAM,
        PERMISSIONS.APPROVE_CLAIMS,
        PERMISSIONS.VIEW_TEAM_CLAIMS,
        PERMISSIONS.CREATE_CLAIMS,
    ],
    ROLES.LEAD: [
        PERMISSIONS.VIEW_TEAM_USERS,
        PERMISSIONS.VIEW_OWN_TEAM,
        PERMISSIONS.VIEW_TEAM_CLAIMS,
        PERMISSIONS.CREATE_CLAIMS,
    ],
    ROLES.MEMBER: [
        PERMISSIONS.VIEW_TEAM_USERS,
        PERMISSIONS.VIEW_OWN_TEAM,
        PERMISSIONS.VIEW_TEAM_CLAIMS,
        PERMISSIONS.CREATE_CLAIMS,
        PERMISSIONS.DELETE_OWN_CLAIMS,
    ],
}

def has_permission(role: str, permission: str) -> bool:
    """
    Check if a role has a specific permission.
    """
    if not role:
        return False
    permissions = ROLE_PERMISSIONS.get(role, [])
    return permission in permissions

# Hierarchy for User Creation (Who can create Whom)
# This logic is a bit specific to "MANAGE_USERS" but good to centralize.
# Maps Creator Role -> List of Roles they can assign
ROLE_CREATION_HIERARCHY = {
    ROLES.OWNER: [ROLES.ADMIN, ROLES.MANAGER, ROLES.LEAD, ROLES.MEMBER], 
    ROLES.ADMIN: [ROLES.MANAGER, ROLES.LEAD, ROLES.MEMBER],
    ROLES.MANAGER: [ROLES.LEAD, ROLES.MEMBER], # Manager can make leads? Assuming yes.
    ROLES.LEAD: [],
    ROLES.MEMBER: []
}

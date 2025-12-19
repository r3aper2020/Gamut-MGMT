import { type UserProfile, type UserRole } from '@/types/team';

export const PERMISSIONS = {
    // Org Management
    MANAGE_ORG: ['OWNER'],
    MANAGE_OFFICES: ['OWNER', 'ORG_ADMIN'],
    MANAGE_USERS: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER'],

    // View Permissions
    VIEW_ORG_SETTINGS: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN'],
    VIEW_ALL_USERS: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER'],
    VIEW_FULL_TEAM_OPS: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER'],

    // Job Management
    CREATE_JOB: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER'],
    ASSIGN_JOB: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER'],
    DELETE_JOB: ['OWNER', 'ORG_ADMIN'],

    // Content
    ADD_NOTES: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER', 'MEMBER'],
    UPLOAD_PHOTOS: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER', 'MEMBER'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const hasPermission = (profile: UserProfile | null, permission: Permission): boolean => {
    if (!profile) return false;
    const roles = PERMISSIONS[permission] as readonly UserRole[];
    return roles.includes(profile.role);
};

export const canViewJob = (profile: UserProfile | null, job: {
    orgId: string;
    officeId: string;
    departmentId: string;
    assignedUserIds: string[];
    createdBy: string;
}): boolean => {
    if (!profile) return false;

    // OWNER/ORG_ADMIN see everything in the org
    if (profile.role === 'OWNER' || profile.role === 'ORG_ADMIN') {
        return profile.orgId === job.orgId;
    }

    // OFFICE_ADMIN sees everything in their office
    if (profile.role === 'OFFICE_ADMIN') {
        return profile.orgId === job.orgId && profile.officeId === job.officeId;
    }

    // DEPT_MANAGER sees everything in their department
    if (profile.role === 'DEPT_MANAGER') {
        return profile.orgId === job.orgId &&
            profile.officeId === job.officeId &&
            profile.departmentId === job.departmentId;
    }

    // MEMBER sees only assigned or created jobs
    if (profile.role === 'MEMBER') {
        return job.assignedUserIds.includes(profile.uid) || job.createdBy === profile.uid;
    }

    return false;
};

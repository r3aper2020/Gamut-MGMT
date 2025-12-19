/* eslint-disable @typescript-eslint/no-explicit-any */

export type UserRole = 'OWNER' | 'ORG_ADMIN' | 'OFFICE_ADMIN' | 'DEPT_MANAGER' | 'MEMBER';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    orgId: string;
    officeId?: string; // Null for OWNER/ORG_ADMIN if not scoped
    departmentId?: string; // Null if not scoped
    createdAt: any; // Using any for broad compatibility with FieldValue and Timestamp
    updatedAt: any;
}

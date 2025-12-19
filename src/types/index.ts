export type UserRole = 'OWNER' | 'ORG_ADMIN' | 'OFFICE_ADMIN' | 'DEPT_MANAGER' | 'MEMBER';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    orgId: string;
    officeId?: string; // Null for OWNER/ORG_ADMIN if not scoped
    departmentId?: string; // Null if not scoped
    createdAt: any; // Firestore Timestamp
    updatedAt: any;
}

export interface Organization {
    id: string;
    name: string;
    ownerId: string;
    createdAt: any;
    settings: {
        theme: 'light' | 'dark';
        logoUrl?: string;
    };
}

export interface Office {
    id: string;
    orgId: string;
    name: string;
    address: string;
    managerId: string;
    createdAt: any;
}

export interface Department {
    id: string;
    orgId: string;
    officeId: string;
    name: string; // Mitigation, Reconstruction, etc.
    managerId: string;
    createdAt: any;
}

export type JobStatus = 'FNOL' | 'MITIGATION' | 'RECONSTRUCTION' | 'REVIEW' | 'CLOSEOUT';

export interface Job {
    id: string;
    orgId: string;
    officeId: string;
    departmentId: string;
    status: JobStatus;

    // Customer Info
    customer: {
        name: string;
        phone: string;
        email: string;
    };

    // Property Info
    property: {
        address: string;
        city: string;
        state: string;
        zip: string;
    };

    // Insurance Info
    insurance: {
        carrier: string;
        claimNumber: string;
        adjusterName?: string;
        adjusterPhone?: string;
    };

    assignedUserIds: string[];
    createdBy: string;
    createdAt: any;
    updatedAt: any;
}

export interface Note {
    id: string;
    jobId: string;
    userId: string;
    userName: string;
    content: string;
    createdAt: any;
}

export interface Task {
    id: string;
    jobId: string;
    title: string;
    description?: string;
    completed: boolean;
    dueDate?: any;
    assignedTo?: string;
    createdAt: any;
}

export interface ActivityLog {
    id: string;
    jobId: string;
    userId: string;
    userName: string;
    action: string; // e.g., "Status changed to Reconstruction"
    timestamp: any;
}

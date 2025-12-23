/* eslint-disable @typescript-eslint/no-explicit-any */

export type JobStatus = 'FNOL' | 'MITIGATION' | 'RECONSTRUCTION' | 'REVIEW' | 'CLOSEOUT';


export interface JobAssignments {
    supervisorId?: string;
    mitigationManagerId?: string;
    inspectorId?: string;
    marketingRepId?: string;
    coordinatorId?: string;
    leadTechnicianId?: string;
}

export interface JobDetails {
    propertyType: string;
    yearBuilt?: number;
    lossCategory: string;
    deductible?: string;
    policyNumber?: string;
    lockBoxCode?: string;
    gateEntryCode?: string;
    mortgageCompany?: string;
    loanNumber?: string;
    billingContact?: string;
    billingNotes?: string;
    notes?: string;
}

export interface Job {
    id: string;
    orgId: string;
    officeId: string;
    departmentId: string;
    status: JobStatus;

    // Core Identifiers
    jobName: string;
    isCustomJobName: boolean;

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
        county?: string;
    };

    // Insurance Info
    insurance: {
        carrier: string;
        claimNumber: string;
        adjusterName?: string;
        adjusterPhone?: string;
    };

    // New Blocks
    assignments: JobAssignments;
    details: JobDetails;

    // Financials (Optional for now)
    financials?: {
        revenue: number;
        [key: string]: any;
    };

    assignedUserIds: string[]; // Keep for compatibility/queries (union of all assignments)
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

/* eslint-disable @typescript-eslint/no-explicit-any */

export type JobStatus = 'PENDING' | 'IN_PROGRESS' | 'REVIEW' | 'BILLING' | 'CLOSEOUT' | 'MITIGATION';


export interface JobAssignments {
    supervisorId?: string;
    leadTechnicianId?: string;
    teamMemberIds?: string[]; // Additional team members
    // Deprecated/Legacy fields (kept optional for backward compat if needed, but removing from UI)
    mitigationManagerId?: string;
    inspectorId?: string;
    marketingRepId?: string;
    coordinatorId?: string;
}

export type PhaseStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED';

export interface JobPhase {
    id: string; // e.g. "phase_mitigation"
    departmentId: string; // "dept_mitigation"
    name: string; // "Mitigation"
    status: PhaseStatus;
    stage?: 'REVIEW' | 'BILLING'; // For Kanban persistence after handoff
    data: ClaimData; // Re-use the existing ClaimData structure for each phase
    assignments: JobAssignments;
    completedBy?: string;
    completedAt?: any; // Timestamp
}

export interface JobDetails {
    propertyType: string;
    yearBuilt?: number;
    lossCategory: string;
    lossDescription?: string; // Added description
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
    departmentIds: string[]; // History of all depts involved
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

    dates?: {
        lossDate?: any;
        fnolReceivedDate?: any;
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

    // AI / Field Tech Claim Data
    phases?: JobPhase[];
    claimData?: ClaimData; // @deprecated - Use phases[].data instead
}

export interface ClaimItem {
    id: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
    category: string;
    notes?: string;
}

export interface ClaimPreScan {
    measurements: {
        room: string;
        area: string;
        perimeter: string;
        height: string;
    }[];
    images: {
        url: string;
        caption?: string;
        timestamp?: any;
        room?: string;
    }[];
    notes: string;
    sketchUrl?: string;
    model3dUrl?: string; // .usda (iOS AR)

}

export interface AIAnalysis {
    summary: string;
    recommendedActions: string[];
    referencedStandards: {
        code: string; // e.g., "S500"
        description: string;
        url?: string;
    }[];
}

export interface ClaimData {
    preScan: ClaimPreScan;
    aiAnalysis: AIAnalysis;
    lineItems: ClaimItem[];
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

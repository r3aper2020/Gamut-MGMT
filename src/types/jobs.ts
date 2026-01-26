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
    stage?: 'PENDING' | 'IN_PROGRESS' | 'REVIEW' | 'BILLING'; // For Kanban persistence after handoff
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
        adjusterEmail?: string;
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
    roomScans?: RoomScan[];
}

export interface ClaimItemRevision {
    id: string;
    timestamp: any;
    editedBy: {
        uid: string;
        displayName: string;
        photoURL?: string | null;
    };
    changes: {
        field: keyof ClaimItem;
        oldValue: any;
        newValue: any;
    }[];
    previousState: Omit<ClaimItem, 'revisions'> | { [K in keyof Omit<ClaimItem, 'revisions'>]: Omit<ClaimItem, 'revisions'>[K] | null };
}

export interface ClaimItem {
    id: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
    category: string;
    itemCode?: string; // e.g. "WTR EXT"
    notes?: string;
    aiRationale?: string; // Reasoning for this line item
    standardRef?: string; // e.g. "IICRC S500 12.3.4"
    revisions?: ClaimItemRevision[];
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
        category?: string; // e.g. "Pre-Demo", "In-Progress"
    }[];
    notes: string;
    sketchUrl?: string;
    model3dUrl?: string; // .usda (iOS AR)
    roomScans?: RoomScan[];
}

export interface RoomScan {
    id: string;
    roomName: string;
    createdAt: any;
    usdzUrl?: string; // Raw mesh
    texturedModelUrl?: string; // Photogrammetry
    floorPlanUrl?: string; // 2D Sketch
}

export interface AIAnalysis {
    summary: string;
    confidence: number; // Added
    recommendedActions: string[];
    referencedStandards: {
        code: string; // e.g., "S500"
        description: string;
        url?: string;
    }[];
}

export interface LossClassification {
    category: number;
    categoryDescription: string;
    class: number;
    classDescription: string;
    riskLevel: string;
}


export interface FindingPhoto {
    url: string;
    caption?: string;
    aiAnalysis?: string;
    humanNote?: string;
    timestamp?: string;
}

export interface Finding {
    id: number;
    phase: 'Mitigation' | 'Restoration';
    iconName: string;
    color: string;
    bg: string;
    border: string;
    text: string;
    user: string;
    time: string;
    aiReasoning?: string;
    photos: FindingPhoto[];
    lineItems: ClaimItem[];
}

export interface ClaimData {
    preScan: ClaimPreScan;
    aiAnalysis: AIAnalysis;
    classification: LossClassification; // Added
    lineItems: ClaimItem[];
    findings?: Finding[];
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

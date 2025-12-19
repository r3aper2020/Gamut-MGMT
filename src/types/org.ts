/* eslint-disable @typescript-eslint/no-explicit-any */

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

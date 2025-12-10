// Mock users for authentication
export const mockUsers = [
    {
        id: '1',
        email: 'owner@gamut.com',
        password: 'owner123',
        name: 'Sarah Johnson',
        role: 'org_owner',
        organizationId: 'org1',
        teamId: null,
        hasAdminRights: true, // Org owner always has admin rights
    },
    {
        id: '2',
        email: 'manager1@gamut.com',
        password: 'manager123',
        name: 'Mike Chen',
        role: 'manager',
        organizationId: 'org1',
        teamId: 'team1', // Water Damage Team
        hasAdminRights: false, // Can be granted by org owner
    },
    {
        id: '3',
        email: 'manager2@gamut.com',
        password: 'manager123',
        name: 'Lisa Rodriguez',
        role: 'manager',
        organizationId: 'org1',
        teamId: 'team2', // Fire Restoration Team
        hasAdminRights: true, // Granted admin rights by org owner
    },
    {
        id: '4',
        email: 'member@gamut.com',
        password: 'member123',
        name: 'Alex Rivera',
        role: 'team_member',
        organizationId: 'org1',
        teamId: 'team1',
        hasAdminRights: false,
    },
];

// Mock organization
export const mockOrganization = {
    id: 'org1',
    name: 'Restoration Pro Services',
    settings: {
        timezone: 'America/New_York',
        currency: 'USD',
    },
    createdAt: '2024-01-15T10:00:00Z',
};

// Mock teams
export const mockTeams = [
    {
        id: 'team1',
        name: 'Water Damage Team',
        organizationId: 'org1',
        specialty: 'Water Damage',
        memberCount: 8,
        createdAt: '2024-02-01T10:00:00Z',
    },
    {
        id: 'team2',
        name: 'Fire Restoration Team',
        organizationId: 'org1',
        specialty: 'Fire Damage',
        memberCount: 6,
        createdAt: '2024-02-01T10:00:00Z',
    },
    {
        id: 'team3',
        name: 'Mold Remediation Team',
        organizationId: 'org1',
        specialty: 'Mold Remediation',
        memberCount: 5,
        createdAt: '2024-02-15T10:00:00Z',
    },
    {
        id: 'team4',
        name: 'Storm Damage Team',
        organizationId: 'org1',
        specialty: 'Storm Damage',
        memberCount: 10,
        createdAt: '2024-03-01T10:00:00Z',
    },
    {
        id: 'team5',
        name: 'General Restoration',
        organizationId: 'org1',
        specialty: 'General',
        memberCount: 7,
        createdAt: '2024-03-10T10:00:00Z',
    },
];

// Mock claims with various statuses
export const mockClaims = [
    {
        id: 'claim1',
        claimNumber: 'CLM-2024-001',
        title: 'Basement Flood - 123 Main St',
        description: 'Severe water damage in basement due to burst pipe. Approximately 800 sq ft affected.',
        status: 'pending_review',
        amount: 15750.00,
        teamId: 'team1',
        createdBy: '3',
        assignedTo: '2',
        submittedAt: '2024-12-01T14:30:00Z',
        attachments: [
            { id: 'att1', type: 'image', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800', caption: 'Basement overview' },
            { id: 'att2', type: 'image', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', caption: 'Water damage detail' },
            { id: 'att3', type: 'image', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', caption: 'Affected area' },
        ],
        metadata: {
            propertyType: 'Residential',
            urgency: 'high',
        },
        createdAt: '2024-11-28T10:00:00Z',
        updatedAt: '2024-12-01T14:30:00Z',
    },
    {
        id: 'claim2',
        claimNumber: 'CLM-2024-002',
        title: 'Kitchen Fire Damage - 456 Oak Ave',
        description: 'Fire damage to kitchen and adjacent dining room. Smoke damage throughout first floor.',
        status: 'approved',
        amount: 28500.00,
        teamId: 'team2',
        createdBy: '3',
        assignedTo: '2',
        approvedBy: '1',
        submittedAt: '2024-11-25T09:15:00Z',
        approvedAt: '2024-11-27T16:45:00Z',
        attachments: [
            { id: 'att4', type: 'image', url: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800', caption: 'Kitchen damage' },
            { id: 'att5', type: 'image', url: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800', caption: 'Smoke damage' },
        ],
        metadata: {
            propertyType: 'Residential',
            urgency: 'high',
        },
        createdAt: '2024-11-20T10:00:00Z',
        updatedAt: '2024-11-27T16:45:00Z',
    },
    {
        id: 'claim3',
        claimNumber: 'CLM-2024-003',
        title: 'Mold Remediation - 789 Pine Rd',
        description: 'Extensive mold growth in attic and upper floor walls. Requires full remediation.',
        status: 'sent_to_insurance',
        amount: 12300.00,
        teamId: 'team3',
        createdBy: '3',
        assignedTo: '2',
        approvedBy: '1',
        submittedAt: '2024-11-20T11:00:00Z',
        approvedAt: '2024-11-22T10:30:00Z',
        insuranceSubmittedAt: '2024-11-23T09:00:00Z',
        attachments: [
            { id: 'att6', type: 'image', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800', caption: 'Attic mold' },
        ],
        metadata: {
            propertyType: 'Residential',
            urgency: 'medium',
        },
        createdAt: '2024-11-15T10:00:00Z',
        updatedAt: '2024-11-23T09:00:00Z',
    },
    {
        id: 'claim4',
        claimNumber: 'CLM-2024-004',
        title: 'Storm Roof Damage - 321 Elm St',
        description: 'Roof damage from recent storm. Multiple shingles missing, potential water intrusion.',
        status: 'pending_review',
        amount: 18900.00,
        teamId: 'team4',
        createdBy: '3',
        assignedTo: '2',
        submittedAt: '2024-12-02T08:00:00Z',
        attachments: [
            { id: 'att7', type: 'image', url: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800', caption: 'Roof damage' },
            { id: 'att8', type: 'image', url: 'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=800', caption: 'Missing shingles' },
        ],
        metadata: {
            propertyType: 'Residential',
            urgency: 'high',
        },
        createdAt: '2024-12-01T10:00:00Z',
        updatedAt: '2024-12-02T08:00:00Z',
    },
    {
        id: 'claim5',
        claimNumber: 'CLM-2024-005',
        title: 'Commercial Water Damage - Office Building',
        description: 'Water damage on 3rd floor office space. Ceiling tiles damaged, carpet needs replacement.',
        status: 'under_review',
        amount: 22100.00,
        teamId: 'team1',
        createdBy: '3',
        assignedTo: '2',
        submittedAt: '2024-11-30T13:20:00Z',
        attachments: [
            { id: 'att9', type: 'image', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', caption: 'Office damage' },
        ],
        metadata: {
            propertyType: 'Commercial',
            urgency: 'medium',
        },
        createdAt: '2024-11-28T10:00:00Z',
        updatedAt: '2024-11-30T13:20:00Z',
    },
    {
        id: 'claim6',
        claimNumber: 'CLM-2024-006',
        title: 'Sewage Backup - 555 Maple Dr',
        description: 'Sewage backup in basement. Requires sanitization and restoration.',
        status: 'rejected',
        amount: 9800.00,
        teamId: 'team5',
        createdBy: '3',
        assignedTo: '2',
        approvedBy: '1',
        submittedAt: '2024-11-18T10:00:00Z',
        rejectedAt: '2024-11-19T14:00:00Z',
        rejectionReason: 'Insufficient documentation. Please provide additional photos and detailed assessment.',
        attachments: [
            { id: 'att10', type: 'image', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800', caption: 'Basement' },
        ],
        metadata: {
            propertyType: 'Residential',
            urgency: 'high',
        },
        createdAt: '2024-11-15T10:00:00Z',
        updatedAt: '2024-11-19T14:00:00Z',
    },
];

// Mock comments
export const mockComments = {
    claim1: [
        {
            id: 'comment1',
            claimId: 'claim1',
            userId: '2',
            userName: 'Mike Chen',
            content: 'Initial assessment completed. Recommend immediate water extraction.',
            createdAt: '2024-11-28T14:00:00Z',
        },
        {
            id: 'comment2',
            claimId: 'claim1',
            userId: '1',
            userName: 'Sarah Johnson',
            content: 'Please provide additional photos of the HVAC system.',
            createdAt: '2024-12-01T10:00:00Z',
        },
    ],
    claim2: [
        {
            id: 'comment3',
            claimId: 'claim2',
            userId: '1',
            userName: 'Sarah Johnson',
            content: 'Approved. Documentation looks complete.',
            createdAt: '2024-11-27T16:45:00Z',
        },
    ],
    claim4: [
        {
            id: 'comment4',
            claimId: 'claim4',
            userId: '2',
            userName: 'Mike Chen',
            content: 'Storm damage assessment in progress. Will update with final estimate.',
            createdAt: '2024-12-02T09:00:00Z',
        },
    ],
};

// Status configuration
export const claimStatuses = {
    draft: { label: 'Draft', color: 'gray' },
    submitted: { label: 'Submitted', color: 'blue' },
    pending_review: { label: 'Pending Review', color: 'yellow' },
    under_review: { label: 'Under Review', color: 'purple' },
    approved: { label: 'Approved', color: 'green' },
    rejected: { label: 'Rejected', color: 'red' },
    revision_requested: { label: 'Revision Requested', color: 'yellow' }, // Using yellow/orange for revision
    sent_to_insurance: { label: 'Submitted', color: 'indigo' },
};

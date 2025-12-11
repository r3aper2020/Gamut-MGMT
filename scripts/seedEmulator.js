#!/usr/bin/env node

/**
 * Seed script for Firebase Emulator
 * Uses Admin SDK to bypass security rules during seeding
 */

import admin from 'firebase-admin';

// Connect to emulators BEFORE initializing
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9100';

// Initialize Firebase Admin SDK for emulator
admin.initializeApp({
    projectId: 'demo-gamut-claims',
});

const auth = admin.auth();
const db = admin.firestore();

console.log('🔥 Connected to Firebase Emulators (Admin SDK)');

// Mock data
const organization = {
    id: 'org1',
    name: 'Restoration Pro Services',
    address: '456 Restore Way, Springfield, IL',
    industry: 'Restoration',
    size: '11-50',
    createdAt: admin.firestore.Timestamp.now(),
    settings: {
        currency: 'USD',
        timezone: 'America/New_York',
    }
};

const teams = [
    { id: 'team1', name: 'Water Damage Team', organizationId: 'org1', specialty: 'Water Damage', memberCount: 8, description: 'Specializes in rapid response for water damage mitigation.' },
    { id: 'team2', name: 'Fire Restoration Team', organizationId: 'org1', specialty: 'Fire Restoration', memberCount: 6, description: 'Experts in fire and smoke damage restoration.' },
    { id: 'team3', name: 'Mold Remediation Team', organizationId: 'org1', specialty: 'Mold Remediation', memberCount: 5, description: 'Certified mold remediation specialists.' },
    { id: 'team4', name: 'Storm Damage Team', organizationId: 'org1', specialty: 'Storm Damage', memberCount: 7, description: 'First responders for severe storm impacts.' },
    { id: 'team5', name: 'General Restoration', organizationId: 'org1', specialty: 'General Restoration', memberCount: 10, description: 'Handling general repairs and reconstruction.' },
];

const users = [
    {
        id: 'user1',
        email: 'owner@gamut.com',
        password: 'owner123',
        displayName: 'Sarah Johnson',
        role: 'org_owner',
        organizationId: 'org1',
        jobTitle: 'CEO',
        phoneNumber: '555-0101',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
    },
    {
        id: 'user2',
        email: 'manager1@gamut.com',
        password: 'manager123',
        displayName: 'Mike Chen',
        role: 'manager',
        organizationId: 'org1',
        teamId: 'team1',
        jobTitle: 'Operations Manager',
        phoneNumber: '555-0102',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
    },
    {
        id: 'user3',
        email: 'manager2@gamut.com',
        password: 'manager123',
        displayName: 'Lisa Rodriguez',
        role: 'manager',
        organizationId: 'org1',
        teamId: 'team2',
        jobTitle: 'Branch Manager',
        phoneNumber: '555-0103',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
    },
    {
        id: 'user4',
        email: 'member@gamut.com',
        password: 'member123',
        displayName: 'Alex Rivera',
        role: 'team_member',
        organizationId: 'org1',
        teamId: 'team1',
        jobTitle: 'Technician',
        phoneNumber: '555-0104',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
    },
];

const claims = [
    {
        id: 'claim1',
        claimNumber: 'CLM-2024-001',
        title: 'Water Damage - Kitchen Flood',
        description: 'Extensive water damage in kitchen due to burst pipe. Requires immediate attention.',
        amount: 15750,
        status: 'pending_review',
        teamId: 'team1',
        submittedBy: 'user4',
        submittedAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-15')),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-15')),
        propertyType: 'Residential',
        attachments: [
            { id: 'att1', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800', type: 'image', room: 'Kitchen' },
            { id: 'att2', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', type: 'image', room: 'Kitchen' },
            { id: 'att3', url: 'https://images.unsplash.com/photo-1621905251189-08b95ddd71a9?w=800', type: 'image', room: 'Living Room' },
            { id: 'att4', url: 'https://images.unsplash.com/photo-1527011046414-4781f1f94f8c?w=800', type: 'image', room: 'Master Bedroom' },
            { id: 'att5', url: 'https://images.unsplash.com/photo-1574739596952-b4306c4b277b?w=800', type: 'image', room: 'Kitchen' },
            { id: 'att6', url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800', type: 'image', room: 'Living Room' },
            { id: 'att7', url: 'https://images.unsplash.com/photo-1621905252870-983f4b6a9876?w=800', type: 'image', room: 'Master Bedroom' },
            { id: 'att8', url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800', type: 'image', room: 'Guest Bedroom' },
            { id: 'att9', url: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=800', type: 'image', room: 'Exterior' },
        ],
        metadata: {
            address: '123 Main St, Springfield',
            incidentDate: '2024-01-10',
        },
        aiAnalysis: {
            summary: 'Severe water damage detected affecting cabinetry and flooring. High probability of subfloor saturation.',
            restorationInstructions: [
                'Shut off main water supply immediately.',
                'Extract standing water from kitchen floor.',
                'Remove baseboards and drill ventilation holes in drywall.',
                'Dehumidify area for 48-72 hours.',
                'Inspect subfloor for structural integrity.'
            ],
            confidenceScore: 0.92
        },
        lineItems: [
            {
                category: 'Mitigation',
                description: 'Water Extraction (Cat 1)',
                quantity: 250,
                unit: 'SF',
                unitPrice: 1.25,
                total: 312.50,
                aiReasoning: 'Standing water detected in kitchen area affecting approx 250 sqft.',
                linkedPhotoIds: ['att1', 'att2', 'att3', 'att4', 'att5', 'att6', 'att7', 'att8', 'att9'],
                referenceSource: { code: 'IICRC S500', standard: 'Category 1 Water', description: 'Clean water source' },
                room: 'Kitchen'
            },
            {
                category: 'Mitigation',
                description: 'Dehumidifier Rental (Large)',
                quantity: 3,
                unit: 'Day',
                unitPrice: 85.00,
                total: 255.00,
                aiReasoning: 'Required for 3-day drying cycle based on saturation levels > 40%.',
                linkedPhotoIds: ['att1', 'att2'],
                referenceSource: { code: 'IICRC S500', standard: 'Class 2 Loss', description: 'Significant water absorption' },
                room: 'Kitchen'
            },
            {
                category: 'Demolition',
                description: 'Remove Baseboard',
                quantity: 45,
                unit: 'LF',
                unitPrice: 0.75,
                total: 33.75,
                aiReasoning: 'Baseboards swollen and detached due to water wicking.',
                linkedPhotoIds: ['att2'],
                referenceSource: { code: 'IICRC S500', standard: 'Structural Drying', description: 'Remove base to access wall cavity' },
                room: 'Living Room'
            },
            {
                category: 'Demolition',
                description: 'Remove Lower Cabinetry',
                quantity: 12,
                unit: 'LF',
                unitPrice: 25.00,
                total: 300.00,
                aiReasoning: 'Moisture detected behind toe kicks; removal required for drying.',
                linkedPhotoIds: ['att1'],
                needsClarification: true,
                userFullfilled: true,
                clarificationNote: 'AI requested cabinet type. User selected: Standard Grade.',
                room: 'Kitchen'
            },
            { category: 'Repairs', description: 'Replace Drywall (4ft flood cut)', quantity: 180, unit: 'SF', unitPrice: 2.50, total: 450.00, aiReasoning: 'Standard 4ft flood cut required to access wet insulation.', room: 'Living Room' },
            { category: 'Repairs', description: 'Paint - Walls', quantity: 350, unit: 'SF', unitPrice: 1.10, total: 385.00, aiReasoning: 'Painting required for new and existing drywall to match.', room: 'Living Room' },
            { category: 'Repairs', description: 'Replace Laminate Flooring', quantity: 250, unit: 'SF', unitPrice: 4.50, total: 1125.00, aiReasoning: 'Laminate flooring is non-salvageable (Category 1 water).', room: 'Master Bedroom' },
            { category: 'General', description: 'Dumpster Rental', quantity: 1, unit: 'EA', unitPrice: 450.00, total: 450.00, aiReasoning: 'Disposal of wet drywall, flooring, and cabinetry.', room: 'Exterior' }
        ]
    },
    {
        id: 'claim2',
        claimNumber: 'CLM-2024-002',
        title: 'Fire Damage - Living Room',
        description: 'Fire damage from electrical fault. Smoke damage throughout first floor.',
        amount: 28500,
        status: 'approved',
        teamId: 'team2',
        submittedBy: 'user3',
        submittedAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-12')),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-14')),
        propertyType: 'Residential',
        attachments: [
            { id: 'att3', url: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800', type: 'image' },
        ],
        metadata: {
            address: '456 Oak Ave, Springfield',
            incidentDate: '2024-01-08',
            approvedBy: 'user1',
            approvedAt: '2024-01-14',
        },
        aiAnalysis: {
            summary: 'Localized fire damage near electrical outlet. Heavy soot deposition on ceiling and upper walls.',
            restorationInstructions: [
                'Isolate affected circuit.',
                'HEPA vacuum all surfaces to remove loose soot.',
                'Chem sponge walls and ceiling.',
                'Thermal fog for odor control.',
                'Seal and paint affected surfaces.'
            ],
            confidenceScore: 0.88
        },
        lineItems: [
            {
                category: 'Cleaning',
                description: 'HEPA Vacuuming - Heavy',
                quantity: 450,
                unit: 'SF',
                unitPrice: 0.45,
                total: 202.50,
                aiReasoning: 'Heavy soot deposition visible on all horizontal surfaces.',
                linkedPhotoIds: ['att3'],
                referenceSource: { code: 'IICRC S520', standard: 'Soot Removal', description: 'HEPA sandwich method' }
            },
            { category: 'Cleaning', description: 'Chem Sponge Walls', quantity: 600, unit: 'SF', unitPrice: 0.55, total: 330.00, aiReasoning: 'Dry sponge cleaning required for non-oily soot residue.' },
            {
                category: 'Deodorization',
                description: 'Thermal Fogging',
                quantity: 1500,
                unit: 'CF',
                unitPrice: 0.15,
                total: 225.00,
                aiReasoning: 'Recommended for smoke odor neutralization in porous materials.',
                linkedPhotoIds: ['att3'],
                needsClarification: true,
                userFullfilled: true,
                clarificationNote: 'AI Prompt: Confirm area volume. User Confirmed: 1500 CF.'
            },
            { category: 'Repairs', description: 'Replace Electrical Outlet & Wiring', quantity: 1, unit: 'EA', unitPrice: 250.00, total: 250.00, aiReasoning: 'Source of fire; complete replacement required for safety.' },
            { category: 'Repairs', description: 'Seal & Paint', quantity: 600, unit: 'SF', unitPrice: 1.85, total: 1110.00, aiReasoning: 'Encapsulation of smoke stains followed by finish coat.' }
        ]
    },
    {
        id: 'claim3',
        claimNumber: 'CLM-2024-003',
        title: 'Mold Remediation - Basement',
        description: 'Extensive mold growth in basement. Requires professional remediation.',
        amount: 12300,
        status: 'under_review',
        teamId: 'team3',
        submittedBy: 'user2',
        submittedAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-18')),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-19')),
        propertyType: 'Commercial',
        attachments: [
            'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=800',
            'https://images.unsplash.com/photo-1628744876497-eb30460be9f6?w=800',
        ],
        metadata: {
            address: '789 Pine Rd, Springfield',
            incidentDate: '2024-01-05',
        },
        aiAnalysis: {
            summary: 'Visible mold growth (approx 50sf) on basement drywall. High humidity levels detected.',
            restorationInstructions: [
                'Establish negative pressure containment.',
                'Remove affected drywall (2ft past visible mold).',
                'HEPA vacuum and wire brush stud framing.',
                'Apply antimicrobial sealant.',
                'Run scrubber for 72 hours.'
            ],
            confidenceScore: 0.95
        },
        lineItems: [
            { category: 'Mitigation', description: 'Containment Barrier', quantity: 45, unit: 'LF', unitPrice: 12.50, total: 562.50, aiReasoning: 'Isolation of mold-affected area to prevent cross-contamination.' },
            { category: 'Mitigation', description: 'Air Scrubber Rental', quantity: 3, unit: 'Day', unitPrice: 125.00, total: 375.00, aiReasoning: 'HEPA filtration required during remediation activities.' },
            { category: 'Remediation', description: 'Remove Moldy Drywall (Bagged)', quantity: 200, unit: 'SF', unitPrice: 3.50, total: 700.00, aiReasoning: 'Visible fungal growth > 10sf requires controlled demolition.' },
            { category: 'Remediation', description: 'HEPA Vacuum / Wire Brush Wood', quantity: 200, unit: 'SF', unitPrice: 2.75, total: 550.00, aiReasoning: 'Cleaning of structural framing after drywall removal.' },
            { category: 'Remediation', description: 'Apply Antimicrobial Agent', quantity: 350, unit: 'SF', unitPrice: 0.85, total: 297.50, aiReasoning: 'Post-remediation treatment to inhibit future growth.' },
            { category: 'Repairs', description: 'Install Drywall & Texture', quantity: 200, unit: 'SF', unitPrice: 3.25, total: 650.00, aiReasoning: 'Restoration of wall surfaces after clearance testing.' },
            { category: 'Repairs', description: 'Paint Walls', quantity: 500, unit: 'SF', unitPrice: 1.10, total: 550.00, aiReasoning: 'Painting of new and existing walls for uniform appearance.' }
        ]
    },
    {
        id: 'claim4',
        claimNumber: 'CLM-2024-004',
        title: 'Storm Damage - Roof Repair',
        description: 'Roof damage from recent storm. Multiple shingles missing, water intrusion.',
        amount: 19800,
        status: 'sent_to_insurance',
        teamId: 'team4',
        submittedBy: 'user2',
        submittedAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-10')),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-16')),
        propertyType: 'Residential',
        attachments: [
            'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800',
        ],
        metadata: {
            address: '321 Elm St, Springfield',
            incidentDate: '2024-01-07',
            approvedBy: 'user1',
            approvedAt: '2024-01-14',
            sentToInsurance: '2024-01-16',
        },
        aiAnalysis: {
            summary: 'Wind damage to asphalt shingles (approx 10-15% of roof area). Minor water intrusion in attic insulation.',
            restorationInstructions: [
                'Tarp roof immediately to prevent further ingress.',
                'Remove damaged shingles and felt paper.',
                'Inspect decking for rot.',
                'Install new ice/water shield and matching shingles.',
                'Replace wet attic insulation.'
            ],
            confidenceScore: 0.87
        },
        lineItems: [
            { category: 'Emergency', description: 'Emergency Tarping', quantity: 1, unit: 'EA', unitPrice: 450.00, total: 450.00, aiReasoning: 'Immediate mitigation to prevent interior water damage.' },
            { category: 'Roofing', description: 'Remove 3-Tab Shingles', quantity: 4, unit: 'SQ', unitPrice: 65.00, total: 260.00, aiReasoning: 'Removal of wind-damaged shingles.' },
            { category: 'Roofing', description: 'Install 3-Tab Shingles', quantity: 4, unit: 'SQ', unitPrice: 210.00, total: 840.00, aiReasoning: 'Replacement with matching 3-tab shingles.' },
            { category: 'Roofing', description: 'Ice & Water Shield', quantity: 150, unit: 'SF', unitPrice: 1.50, total: 225.00, aiReasoning: 'Code upgrade / best practice for valley protection.' },
            { category: 'Interior', description: 'Remove Wet Insulation', quantity: 100, unit: 'SF', unitPrice: 1.25, total: 125.00, aiReasoning: 'Thermal imaging detected wet insulation in attic.' },
            { category: 'Interior', description: 'Blown-in Insulation (R-30)', quantity: 100, unit: 'SF', unitPrice: 2.00, total: 200.00, aiReasoning: 'Restore R-value to current code.' },
            { category: 'Interior', description: 'Spot Paint Ceiling', quantity: 1, unit: 'EA', unitPrice: 150.00, total: 150.00, aiReasoning: 'Cover water stain on bedroom ceiling.' }
        ]
    },
    {
        id: 'claim5',
        claimNumber: 'CLM-2024-005',
        title: 'Water Damage - Bathroom',
        description: 'Bathroom flood from toilet overflow. Tile and drywall damage.',
        amount: 9800,
        status: 'rejected',
        teamId: 'team1',
        submittedBy: 'user4',
        submittedAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-20')),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-21')),
        propertyType: 'Residential',
        attachments: [],
        metadata: {
            address: '555 Maple Dr, Springfield',
            incidentDate: '2024-01-18',
            rejectedBy: 'user2',
            rejectedAt: '2024-01-21',
            rejectionReason: 'Insufficient documentation provided. Please resubmit with detailed photos and cost breakdown.',
        },
        aiAnalysis: {
            summary: 'Active leak from toilet supply line. Category 2 water affecting tile floor and adjacent dywall.',
            restorationInstructions: [
                'Extract standing water.',
                'Detach and reset toilet.',
                'Remove affected ceramic tile if subfloor is wet.',
                'Dry-out with fans and dehumidifier.'
            ],
            confidenceScore: 0.85
        },
        lineItems: [
            { category: 'Mitigation', description: 'Water Extraction (Cat 2)', quantity: 80, unit: 'SF', unitPrice: 1.45, total: 116.00, aiReasoning: 'Extraction of toilet supply water (Category 2).' },
            { category: 'Plumbing', description: 'Detach & Reset Toilet', quantity: 1, unit: 'EA', unitPrice: 185.00, total: 185.00, aiReasoning: 'Required to access damaged flooring and baseboards.' },
            { category: 'Demolition', description: 'Remove Ceramic Tile', quantity: 60, unit: 'SF', unitPrice: 3.50, total: 210.00, aiReasoning: 'Tiles delaminating due to subfloor saturation.' },
            { category: 'Repairs', description: 'Install Ceramic Tile', quantity: 60, unit: 'SF', unitPrice: 12.00, total: 720.00, aiReasoning: 'Replace with like-kind quality tile.' },
            { category: 'Repairs', description: 'Replace Baseboard', quantity: 25, unit: 'LF', unitPrice: 2.50, total: 62.50, aiReasoning: 'Swollen MDF baseboards require replacement.' }
        ]
    },
    {
        id: 'claim6',
        claimNumber: 'CLM-2024-006',
        title: 'General Restoration - Office',
        description: 'Complete office restoration after water and smoke damage.',
        amount: 45000,
        status: 'pending_review',
        teamId: 'team5',
        submittedBy: 'user2',
        submittedAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-22')),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-22')),
        propertyType: 'Commercial',
        attachments: [
            'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
            'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
        ],
        metadata: {
            address: '100 Business Blvd, Springfield',
            incidentDate: '2024-01-15',
        },
        aiAnalysis: {
            summary: 'Large commercial loss. Fire suppression system activation caused water damage throughout open office area.',
            restorationInstructions: [
                'Commercial water extraction.',
                'Remove glue-down carpet.',
                'Hydroxyl generator for odor.',
                'Cleaning of all office furniture.',
                'Commercial painting.'
            ],
            confidenceScore: 0.91
        },
        lineItems: [
            { category: 'Mitigation', description: 'Commercial Water Extraction', quantity: 2500, unit: 'SF', unitPrice: 0.85, total: 2125.00, aiReasoning: 'Large scale extraction for open office area.' },
            { category: 'Demolition', description: 'Remove Glue-Down Carpet', quantity: 2500, unit: 'SF', unitPrice: 0.95, total: 2375.00, aiReasoning: 'Glue-down carpet saturated; adhesive failure likely.' },
            { category: 'Cleaning', description: 'Content Manipulation (Hourly)', quantity: 50, unit: 'HR', unitPrice: 45.00, total: 2250.00, aiReasoning: 'Moving of cubiclesand desks to access flooring.' },
            { category: 'Cleaning', description: 'Clean Office Cubicles', quantity: 45, unit: 'EA', unitPrice: 35.00, total: 1575.00, aiReasoning: 'Hygienic cleaning of partition walls detected with moisture.' },
            { category: 'Repairs', description: 'Commercial Carpet Tiles (Install)', quantity: 2500, unit: 'SF', unitPrice: 4.50, total: 11250.00, aiReasoning: 'Install new modular carpet tiles.' },
            { category: 'Repairs', description: 'commercial Painting - Walls', quantity: 5000, unit: 'SF', unitPrice: 0.85, total: 4250.00, aiReasoning: 'Repaint affected walls corner-to-corner.' }
        ]
    },
];

const comments = [
    {
        id: 'comment1',
        claimId: 'claim1',
        userId: 'user2',
        text: 'Reviewed the photos. This looks like a significant claim. Scheduling site visit for tomorrow.',
        createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-16')),
    },
    {
        id: 'comment2',
        claimId: 'claim1',
        userId: 'user4',
        text: 'Site visit completed. Damage is more extensive than initially reported. Updating estimate.',
        createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-17')),
    },
    {
        id: 'comment3',
        claimId: 'claim2',
        userId: 'user1',
        text: 'Approved for immediate processing. High priority due to safety concerns.',
        createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-14')),
    },
];

async function seedData() {
    try {
        console.log('📝 Starting seed process...\n');

        // Map to store old user IDs to Firebase UIDs
        const userIdMap = {};

        // Create users in Auth and Firestore
        console.log('\n👥 Creating users...');
        for (const user of users) {
            let firebaseUid;
            try {
                // Create auth user with Admin SDK
                const userRecord = await auth.createUser({
                    email: user.email,
                    password: user.password,
                    displayName: user.displayName,
                });
                firebaseUid = userRecord.uid;
                console.log(`  ✓ Created auth user: ${user.email}`);

                // Set user role to ensure custom claims are consistent
                if (user.role) {
                    await auth.setCustomUserClaims(firebaseUid, { role: user.role, organizationId: user.organizationId, teamId: user.teamId });
                    console.log(`    ✓ Set custom claims for ${user.email}`);
                }

            } catch (error) {
                if (error.code === 'auth/email-already-exists') {
                    console.log(`  ⚠ User already exists: ${user.email}`);
                    // Fetch existing user to get UID
                    try {
                        const existingUser = await auth.getUserByEmail(user.email);
                        firebaseUid = existingUser.uid;
                        console.log(`    ✓ Found UID for ${user.email}: ${firebaseUid}`);

                        // Update claims even if user exists
                        if (user.role) {
                            await auth.setCustomUserClaims(firebaseUid, { role: user.role, organizationId: user.organizationId, teamId: user.teamId });
                        }

                    } catch (fetchError) {
                        console.error(`  ✗ Error fetching existing user ${user.email}:`, fetchError.message);
                        continue; // Skip this user if we can't find them
                    }

                } else {
                    console.error(`  ✗ Error creating user ${user.email}:`, error.message);
                    continue; // Skip if creation failed for other reasons
                }
            }

            if (firebaseUid) {
                // Store mapping from old ID to Firebase UID
                userIdMap[user.id] = firebaseUid;

                // Create or Update user document (without password)
                const { password, id, ...userData } = user;
                await db.collection('users').doc(firebaseUid).set({
                    ...userData,
                }, { merge: true });
                console.log(`  ✓ Updated user document: ${user.displayName}`);
            }
        }

        // Create organization
        console.log('\n🏢 Creating organization...');
        const { id, ...orgFields } = organization;
        const orgData = {
            ...orgFields,
            ownerId: userIdMap['user1'] || 'user1', // Use mapped UID for owner
            updatedAt: admin.firestore.Timestamp.now(),
        };
        await db.collection('organizations').doc(id).set(orgData);
        console.log(`  ✓ Created: ${organization.name}`);

        // Create teams
        console.log('\n👥 Creating teams...');
        for (const team of teams) {
            // Backend schema does not store 'id' inside the doc, only as key.
            // Also adds timestamps.
            const { id, ...teamData } = team;
            const dataToSave = {
                ...teamData,
                createdAt: admin.firestore.Timestamp.now(),
                updatedAt: admin.firestore.Timestamp.now()
            };
            await db.collection('teams').doc(id).set(dataToSave);
            console.log(`  ✓ Created: ${team.name}`);
        }

        // Create claims with mapped user IDs
        console.log('\n📋 Creating claims...');
        for (const claim of claims) {
            const claimData = {
                ...claim,
                organizationId: 'org1', // Explicitly set organizationId for isolation
                submittedBy: userIdMap[claim.submittedBy] || claim.submittedBy,
            };
            // Also update metadata if it has user references
            if (claimData.metadata?.approvedBy) {
                claimData.metadata.approvedBy = userIdMap[claimData.metadata.approvedBy] || claimData.metadata.approvedBy;
            }
            if (claimData.metadata?.rejectedBy) {
                claimData.metadata.rejectedBy = userIdMap[claimData.metadata.rejectedBy] || claimData.metadata.rejectedBy;
            }

            await db.collection('claims').doc(claim.id).set(claimData);
            console.log(`  ✓ Created: ${claim.claimNumber} - ${claim.title}`);
        }

        // Create comments with mapped user IDs
        console.log('\n💬 Creating comments...');
        for (const comment of comments) {
            const commentData = {
                ...comment,
                userId: userIdMap[comment.userId] || comment.userId,
            };
            await db.collection('comments').doc(comment.id).set(commentData);
            console.log(`  ✓ Created comment on ${comment.claimId}`);
        }

        console.log('\n✅ Seed completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`  - ${users.length} users created`);
        console.log(`  - ${teams.length} teams created`);
        console.log(`  - ${claims.length} claims created`);
        console.log(`  - ${comments.length} comments created`);
        console.log('\n🔥 Firebase Emulator UI: http://localhost:4000');
        console.log('\n📝 User ID Mapping:');
        Object.entries(userIdMap).forEach(([oldId, newId]) => {
            console.log(`  ${oldId} -> ${newId} `);
        });

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
}

// Run seed
seedData();

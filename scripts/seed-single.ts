import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as fs from 'fs';
import * as path from 'path';

// Force use of emulators - Must be set BEFORE initializeApp
const PROJECT_ID = 'gamut-demo';
process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8007';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9007';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9107';

console.log('🔧 Emulator Environment Configured (Single Office):');
console.log(`- Project: ${PROJECT_ID}`);

const app = initializeApp({ projectId: PROJECT_ID, storageBucket: `${PROJECT_ID}.appspot.com` });
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Helper to upload file to Storage Emulator
async function uploadAsset(filename: string, destination: string): Promise<string | null> {
    try {
        const localPath = path.resolve('scripts/demo-assets', filename);
        if (!fs.existsSync(localPath)) {
            console.warn(`⚠️ Asset not found: ${localPath}`);
            return null;
        }

        const bucket = storage.bucket();
        console.log(`📤 Uploading ${filename} to ${bucket.name}/${destination}...`);

        await bucket.upload(localPath, {
            destination: destination,
            public: true,
            metadata: {
                contentType: filename.endsWith('.usdz') ? 'model/vnd.usdz+zip' : 'image/jpeg',
                contentDisposition: 'inline'
            }
        });

        // Construct Emulator-compatible Public URL
        return `http://localhost:9107/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media`;

    } catch (e) {
        console.error(`❌ Failed to upload ${filename}:`, e);
        return null;
    }
}

// --- SCENARIO BUILDER ---

interface ScenarioFinding {
    id: number;
    phase: 'Mitigation' | 'Restoration';
    iconName: 'Droplets' | 'AlertTriangle' | 'Hammer' | 'Wind'; // Map to icons in UI
    color: string;
    bg: string;
    border: string;
    text: string;
    user: string;
    time: string;
    aiReasoning: string;
    photos: {
        url: string;
        caption?: string;
        aiAnalysis?: string;
        humanNote?: string;
        timestamp?: string;
    }[];
    lineItems: { id: string; category: string; description: string; quantity: number; unit: string; unitPrice: number; total: number }[];
}

function generateBurstPipeScenario() {
    console.log('🎬 Generating "Burst Pipe in Kitchen" Scenario...');

    // Shared Assets (Placeholders for now, real assets would be better)
    const photos = {
        standingWater: "https://placehold.co/600x400/png?text=Standing+Water+Kitchen",
        moistureMap: "https://placehold.co/600x400/png?text=Moisture+Map+Floor",
        mold: "https://placehold.co/600x400/png?text=Microbial+Growth+Baseboard",
        cabinets: "https://placehold.co/600x400/png?text=Swollen+Cabinets",
        drywall: "https://placehold.co/600x400/png?text=Wet+Drywall+Cut",
        floor: "https://placehold.co/600x400/png?text=Cupped+Hardwood"
    };

    const findings: ScenarioFinding[] = [];
    let lineItemCounter = 1;

    // --- MITIGATION FINDINGS ---

    // 1. Standing Water
    findings.push({
        id: 1,
        phase: 'Mitigation',
        iconName: 'Droplets',
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        border: 'border-blue-400/20',
        text: "Class 3 Water Loss confirmed. Standing water (~1 inch) present in Kitchen and Hallway.",
        user: "Field App (Auto)",
        time: "10:30 AM",
        aiReasoning: "Visual analysis confirms standing water depth >0.5 inches across >50% of floor area. High saturation risk.",
        photos: [
            {
                url: photos.standingWater,
                aiAnalysis: "Surface Reflection Analysis: Consistent glare pattern indicates continuous water film >1mm depth. Colorimetric analysis suggests Cat 1 (Clear) water initially.",
                humanNote: "Water is pooled near the island. Source appears to be the dishwasher supply line.",
                timestamp: "10:28 AM"
            },
            {
                url: photos.moistureMap,
                aiAnalysis: "Thermal Gradient: Dark blue zones indicate <10% surface temperature variance from mean, consistent with evaporation cooling of saturated materials.",
                humanNote: "Mapped the boundary. Water has migrated 15ft into the hallway.",
                timestamp: "10:32 AM"
            }
        ],
        lineItems: [
            { id: `li_${lineItemCounter++}`, category: "Water Extraction", description: "Water Extraction (Cat 3)", quantity: 350, unit: "SF", unitPrice: 1.25, total: 437.50 },
            { id: `li_${lineItemCounter++}`, category: "Water Extraction", description: "Apply Antimicrobial Agent", quantity: 350, unit: "SF", unitPrice: 0.35, total: 122.50 }
        ]
    });

    // 2. Microbial Growth (Mold)
    findings.push({
        id: 2,
        phase: 'Mitigation',
        iconName: 'AlertTriangle',
        color: 'text-orange-400',
        bg: 'bg-orange-400/10',
        border: 'border-orange-400/20',
        text: "Microbial growth detected behind baseboards. Immediate containment required.",
        user: "AI Vision",
        time: "10:35 AM",
        aiReasoning: "Pattern matching identified Stachybotrys-like discoloration with 94% confidence. Risk of spore aerosolization.",
        photos: [
            {
                url: photos.mold,
                aiAnalysis: "Object Detection: Black spot colonies identified. Density >50% on substrates. High probability of Stachybotrys Chartarum.",
                humanNote: "Visible growth found when removing toe kick. Setting up containment immediately.",
                timestamp: "10:34 AM"
            }
        ],
        lineItems: [
            { id: `li_${lineItemCounter++}`, category: "Containment", description: "Containment Barrier (Poly)", quantity: 45, unit: "LF", unitPrice: 2.50, total: 112.50 },
            { id: `li_${lineItemCounter++}`, category: "Equipment", description: "HEPA Air Scrubber (Large)", quantity: 2, unit: "DA", unitPrice: 125.00, total: 250.00 },
            { id: `li_${lineItemCounter++}`, category: "Equipment", description: "Negative Air Fan", quantity: 2, unit: "DA", unitPrice: 85.00, total: 170.00 }
        ]
    });

    // 3. Wet Drywall
    findings.push({
        id: 3,
        phase: 'Mitigation',
        iconName: 'Droplets',
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        border: 'border-blue-400/20',
        text: "Drywall saturation >80% up to 2ft height. Flood cut recommended.",
        user: "Field Tech",
        time: "10:45 AM",
        aiReasoning: "Thermal imaging shows wicking up to 22 inches. Standard requires 24 inch flood cut.",
        photos: [
            {
                url: photos.drywall,
                aiAnalysis: "Thermal Anomaly: Cool vertical gradient indicates capillary action wicking water up the gypsum core. Height ~22 inches.",
                humanNote: "Walls are soft to the touch up to 18 inches. Cutting at 24 inches to be safe.",
                timestamp: "10:42 AM"
            }
        ],
        lineItems: [
            { id: `li_${lineItemCounter++}`, category: "Demolition", description: "Tear Out Wet Drywall (Flood Cut)", quantity: 120, unit: "SF", unitPrice: 1.80, total: 216.00 },
            { id: `li_${lineItemCounter++}`, category: "Demolition", description: "Tear Out Wet Insulation", quantity: 120, unit: "SF", unitPrice: 0.95, total: 114.00 }
        ]
    });


    /*
    // --- RESTORATION FINDINGS ---

    // 4. Cabinets Ruined
    findings.push({
        id: 4,
        phase: 'Restoration',
        iconName: 'Hammer',
        color: 'text-green-400',
        bg: 'bg-green-400/10',
        border: 'border-green-400/20',
        text: "Kitchen lower cabinets non-salvageable (swollen MDF). Full replacement required.",
        user: "Field Tech",
        time: "11:10 AM",
        aiReasoning: "Material analysis: Particle board saturation causing irreversible swelling >15%.",
        photos: [
            { url: photos.cabinets, caption: "Swollen cabinet toe kick" }
        ],
        lineItems: [
            { id: `li_${lineItemCounter++}`, category: "Cabinetry", description: "R&R Lower Cabinetry (Standard)", quantity: 18, unit: "LF", unitPrice: 210.00, total: 3780.00 },
            { id: `li_${lineItemCounter++}`, category: "Cabinetry", description: "Countertop Detach & Reset", quantity: 18, unit: "LF", unitPrice: 45.00, total: 810.00 },
            { id: `li_${lineItemCounter++}`, category: "Plumbing", description: "Plumbing Disconnect/Reconnect (Sink)", quantity: 1, unit: "EA", unitPrice: 250.00, total: 250.00 }
        ]
    });

    // 5. Hardwood Cupping
    findings.push({
        id: 5,
        phase: 'Restoration',
        iconName: 'Hammer',
        color: 'text-green-400',
        bg: 'bg-green-400/10',
        border: 'border-green-400/20',
        text: "Hardwood flooring in Hallway shows cupping. Sand & Refinish required.",
        user: "Field Tech",
        time: "11:30 AM",
        aiReasoning: "Surface topography scan detects 3mm cupping deviation. Subfloor drying verified.",
        photos: [
            { url: photos.floor, caption: "Cupped hardwood in hallway" }
        ],
        lineItems: [
            { id: `li_${lineItemCounter++}`, category: "Flooring", description: "Sand & Refinish Hardwood Floor", quantity: 180, unit: "SF", unitPrice: 4.50, total: 810.00 },
            { id: `li_${lineItemCounter++}`, category: "Flooring", description: "Apply Polyurethane Finish (3 coats)", quantity: 180, unit: "SF", unitPrice: 1.20, total: 216.00 }
        ]
    });
    */

    // Consolidate all line items from findings for the main list
    const allLineItems = findings.flatMap(f => f.lineItems);

    return { findings, allLineItems, photos };
}

function generateRestorationScenario() {
    console.log('🎬 Generating "Kitchen Put-Back" Scenario...');

    // Shared Assets
    const photos = {
        cabinets: "https://placehold.co/600x400/png?text=Swollen+Cabinets",
        floor: "https://placehold.co/600x400/png?text=Cupped+Hardwood",
        paint: "https://placehold.co/600x400/png?text=Wall+Prep+Paint",
    };

    const findings: ScenarioFinding[] = [];
    let lineItemCounter = 1;

    // --- RESTORATION FINDINGS ---

    // 1. Cabinets Ruined
    findings.push({
        id: 1, // Reset ID for clarity in this phase's context
        phase: 'Restoration',
        iconName: 'Hammer',
        color: 'text-green-400',
        bg: 'bg-green-400/10',
        border: 'border-green-400/20',
        text: "Kitchen lower cabinets non-salvageable (swollen MDF). Full replacement required.",
        user: "Field Tech",
        time: "11:10 AM",
        aiReasoning: "Material analysis: Particle board saturation causing irreversible swelling >15%.",
        photos: [
            {
                url: photos.cabinets,
                caption: "Swollen cabinet toe kick",
                aiAnalysis: "Surface Defect: Expansion of MDF core visible at joints. Non-recoverable moisture damage.",
                humanNote: "Matching uppers is impossible due to age. Quoting full replacement for lowers, check if uppers need to go too.",
                timestamp: "11:05 AM"
            }
        ],
        lineItems: [
            { id: `li_r_${lineItemCounter++}`, category: "Cabinetry", description: "R&R Lower Cabinetry (Standard)", quantity: 18, unit: "LF", unitPrice: 210.00, total: 3780.00 },
            { id: `li_r_${lineItemCounter++}`, category: "Cabinetry", description: "Countertop Detach & Reset", quantity: 18, unit: "LF", unitPrice: 45.00, total: 810.00 },
            { id: `li_r_${lineItemCounter++}`, category: "Plumbing", description: "Plumbing Disconnect/Reconnect (Sink)", quantity: 1, unit: "EA", unitPrice: 250.00, total: 250.00 }
        ]
    });

    // 2. Hardwood Cupping
    findings.push({
        id: 2,
        phase: 'Restoration',
        iconName: 'Hammer',
        color: 'text-green-400',
        bg: 'bg-green-400/10',
        border: 'border-green-400/20',
        text: "Hardwood flooring in Hallway shows cupping. Sand & Refinish required.",
        user: "Field Tech",
        time: "11:30 AM",
        aiReasoning: "Surface topography scan detects 3mm cupping deviation. Subfloor drying verified.",
        photos: [
            {
                url: photos.floor,
                caption: "Cupped hardwood in hallway",
                aiAnalysis: "Topography Analysis: Periodic undulation detected consistent with moisture-induced cupping. Amplitude: 3.2mm.",
                humanNote: "Homeowner wants to try refinishing before replacing. Added line items for sanding.",
                timestamp: "11:28 AM"
            }
        ],
        lineItems: [
            { id: `li_r_${lineItemCounter++}`, category: "Flooring", description: "Sand & Refinish Hardwood Floor", quantity: 180, unit: "SF", unitPrice: 4.50, total: 810.00 },
            { id: `li_r_${lineItemCounter++}`, category: "Flooring", description: "Apply Polyurethane Finish (3 coats)", quantity: 180, unit: "SF", unitPrice: 1.20, total: 216.00 }
        ]
    });

    // 3. Drywall & Paint (Kitchen Walls)
    findings.push({
        id: 3,
        phase: 'Restoration',
        iconName: 'Hammer',
        color: 'text-green-400',
        bg: 'bg-green-400/10',
        border: 'border-green-400/20',
        text: "Kitchen walls require insulation replacement, drywall installation, and painting.",
        user: "Field Tech",
        time: "11:45 AM",
        aiReasoning: "Structural integrity verified. Studs dry. Ready for close-in.",
        photos: [
            {
                url: photos.paint,
                caption: "Kitchen wall ready for paint",
                aiAnalysis: "Surface Analysis: Level 4 finish detected on new drywall. Primer coat absent.",
                humanNote: "Insulation and drywall are up. Need to tape, texture, and paint.",
                timestamp: "11:40 AM"
            }
        ],
        lineItems: [
            { id: `li_r_${lineItemCounter++}`, category: "Insulation", description: "Install R-13 Kraft Face Insulation", quantity: 380, unit: "SF", unitPrice: 1.10, total: 418.00 },
            { id: `li_r_${lineItemCounter++}`, category: "Drywall", description: "Hang, Tape, Float Drywall (5/8\")", quantity: 380, unit: "SF", unitPrice: 2.85, total: 1083.00 },
            { id: `li_r_${lineItemCounter++}`, category: "Painting", description: "Seal/Prime Drywall", quantity: 380, unit: "SF", unitPrice: 0.65, total: 247.00 },
            { id: `li_r_${lineItemCounter++}`, category: "Painting", description: "Paint Walls (2 coats, Latex)", quantity: 380, unit: "SF", unitPrice: 1.25, total: 475.00 },
            { id: `li_r_${lineItemCounter++}`, category: "Painting", description: "Paint Baseboards/Trim", quantity: 65, unit: "LF", unitPrice: 1.50, total: 97.50 }
        ]
    });

    const allLineItems = findings.flatMap(f => f.lineItems);
    return { findings, allLineItems };
}


async function seed() {
    try {
        console.log('🌱 Starting GAMUT Single-Office Seeding...');

        const orgId = 'org_demo_single';
        const officeMainId = 'office_main_single';
        const deptMainMit = 'dept_main_mit_s';
        const deptMainRecon = 'dept_main_rec_s';

        // 1. Organization
        console.log('📝 Creating Organization...');
        await db.collection('organizations').doc(orgId).set({
            id: orgId,
            name: 'Single Branch Restorations',
            ownerId: 'owner_single',
            createdAt: FieldValue.serverTimestamp(),
            settings: { theme: 'dark' }
        });

        // 2. Office
        console.log('🏢 Creating 1 Office...');
        await db.collection('offices').doc(officeMainId).set({
            id: officeMainId,
            orgId,
            name: 'Headquarters',
            address: '1 HQ Blvd, Metro City',
            managerId: 'gm_single',
            createdAt: FieldValue.serverTimestamp()
        });

        // 3. Departments
        console.log('📂 Creating Departments...');
        const departments = [
            { id: deptMainMit, orgId, officeId: officeMainId, name: 'Mitigation', type: 'MITIGATION' },
            { id: deptMainRecon, orgId, officeId: officeMainId, name: 'Reconstruction', type: 'RECONSTRUCTION' }
        ];
        for (const d of departments) {
            let managerId = 'owner_single';
            if (d.name === 'Mitigation') managerId = 'mgr_mit_s';
            if (d.name === 'Reconstruction') managerId = 'mgr_rec_s';

            await db.collection('departments').doc(d.id).set({ ...d, managerId, createdAt: FieldValue.serverTimestamp() });
        }

        // 4. Users
        console.log('👤 Creating Users...');
        const users = [
            { uid: 'owner_single', email: 'owner@single.com', role: 'OWNER', name: 'Oscar Owner', officeId: officeMainId },
            { uid: 'gm_single', email: 'gm@single.com', role: 'OFFICE_ADMIN', name: 'Gary GM', officeId: officeMainId },
            { uid: 'mgr_mit_s', email: 'mgr.mit@single.com', role: 'DEPT_MANAGER', name: 'Mary Mitigation', officeId: officeMainId, departmentId: deptMainMit },
            { uid: 'mem_mit_s', email: 'tech.mit@single.com', role: 'MEMBER', name: 'Mike Member', officeId: officeMainId, departmentId: deptMainMit },
            { uid: 'mgr_rec_s', email: 'mgr.rec@single.com', role: 'DEPT_MANAGER', name: 'Rick Reconstruction', officeId: officeMainId, departmentId: deptMainRecon },
            { uid: 'mem_rec_s', email: 'tech.rec@single.com', role: 'MEMBER', name: 'Bob Builder', officeId: officeMainId, departmentId: deptMainRecon },
        ];

        for (const u of users) {
            try {
                try { await auth.deleteUser(u.uid); } catch { /* ignore */ }
                await auth.createUser({
                    uid: u.uid,
                    email: u.email,
                    password: 'password123',
                    displayName: u.name
                });
            } catch (e: unknown) {
                const error = e as { code: string; message: string };
                if (error.code === 'auth/uid-already-exists') {
                    await auth.updateUser(u.uid, { email: u.email, displayName: u.name, password: 'password123' });
                }
            }
            await db.collection('users').doc(u.uid).set({
                uid: u.uid,
                email: u.email,
                displayName: u.name,
                role: u.role,
                orgId: orgId,
                officeId: u.officeId || null,
                departmentId: u.departmentId || null,
                onboardingCompleted: true,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            });
        }


        // 5. Jobs & Scenario
        console.log('💼 Creating Demo Jobs with SCENARIOS...');

        const scenario = generateBurstPipeScenario();

        // Upload assets to Storage
        console.log('📦 Uploading Assets to Storage Emulator...');
        const sketchUrl = await uploadAsset('sketch.jpg', 'jobs/demo/sketch.jpg');
        const modelUrl = await uploadAsset('scan.usdz', 'jobs/demo/scan.usdz');

        console.log('✅ Assets Uploaded:');
        console.log('   - Sketch:', sketchUrl);
        console.log('   - Model:', modelUrl);

        const demoClaimData = {
            preScan: {
                sketchUrl: sketchUrl,
                model3dUrl: modelUrl,
                measurements: [
                    { room: 'Living Room', area: '350 sqft', perimeter: '75 ft', height: '9 ft' },
                    { room: 'Kitchen', area: '200 sqft', perimeter: '50 ft', height: '9 ft' }
                ],
                // Photos: Mapped from findings (mostly Kitchen) + Manual Living Room photo
                images: [
                    ...scenario.findings.flatMap(f => f.photos.map(p => ({
                        url: p.url,
                        caption: p.humanNote,
                        timestamp: new Date(),
                        room: "Kitchen"
                    }))),
                    // Manually added to match 3D Model "Living Room" zone
                    {
                        url: scenario.photos.room_living || scenario.photos.floor, // Use exposed photos
                        caption: 'Living room overview showing unaffected areas.',
                        timestamp: new Date(),
                        room: 'Living Room'
                    }
                ],
                notes: 'LARGE LOSS: Initial scan indicates Class 3 water loss affecting >60% of the structure. Source: Main line rupture in slab. Extensive mitigation required.'
            },
            aiAnalysis: {
                summary: 'CRITICAL ALERT: Class 3 Water Loss detected. High risk of secondary damage. Immediate stabilization required.',
                recommendedActions: [
                    'Emergency Water Extraction',
                    'Remove all floating flooring',
                    'Flood cut drywall'
                ],
                referencedStandards: [
                    { code: 'IICRC S500', description: 'Standard for Professional Water Damage Restoration' },
                    { code: 'ANSI/IICRC S520', description: 'Standard for Professional Mold Remediation' }
                ],
                confidence: 94
            },
            lineItems: scenario.allLineItems,
            findings: scenario.findings, // <--- NEW LINKED FIELD
            classification: {
                category: 3,
                categoryDescription: "Black Water / Grossly Unsanitary",
                class: 2,
                classDescription: "Fast Evaporation Rate",
                riskLevel: "High"
            }
        };
        demoClaimData.aiAnalysis.confidence = 94; // Explicit assignment since interface changed

        const reconScenario = generateRestorationScenario();
        const demoReconData = {
            preScan: { ...demoClaimData.preScan, notes: "RESTORATION PHASE: Mitigation complete. Containment removed. Drying goals met." }, // Reuse assets for now
            aiAnalysis: {
                summary: 'Reconstruction Scope Generated: Cabinetry replacement and flooring refinishing approved.',
                recommendedActions: ['Order Cabinetry', 'Schedule Sanding', 'Final Paint Touch-up'],
                referencedStandards: [{ code: 'AWI 100', description: 'Architectural Woodwork Standards' }],
                confidence: 98
            },
            lineItems: reconScenario.allLineItems,
            findings: reconScenario.findings,
            classification: {
                category: 3,
                categoryDescription: "Black Water / Grossly Unsanitary",
                class: 2,
                classDescription: "Fast Evaporation Rate",
                riskLevel: "High"
            }
        };

        const jobs = [
            // AI Demo Job (Multi-Phase)
            {
                id: 'job_demo_ai_single',
                officeId: officeMainId,
                deptId: deptMainMit, // Start in Mitigation
                cust: 'Sarah Connor (Burst Pipe)',
                status: 'PENDING',
                assignedTo: ['mgr_mit_s', 'mem_mit_s'],
                phases: [
                    {
                        id: 'phase_mit_01',
                        departmentId: deptMainMit,
                        name: 'Mitigation',
                        status: 'ACTIVE',
                        data: demoClaimData,
                        assignments: {
                            supervisorId: 'mgr_mit_s',
                            leadTechnicianId: 'mem_mit_s',
                            teamMemberIds: []
                        }
                    }
                ]
            },
            // Reformation Job (Mitigation Done -> Restoration Active)
            {
                id: 'job_demo_rec_single',
                officeId: officeMainId,
                deptId: deptMainRecon, // Active Dept
                cust: 'John Wick (Kitchen Fire)',
                status: 'IN_PROGRESS',
                assignedTo: ['mgr_rec_s', 'mem_rec_s'],
                phases: [
                    {
                        id: 'phase_mit_02',
                        departmentId: deptMainMit,
                        name: 'Mitigation',
                        status: 'COMPLETED',
                        data: demoClaimData, // Has the water findings
                        assignments: {
                            supervisorId: 'mgr_mit_s',
                            leadTechnicianId: 'mem_mit_s',
                            teamMemberIds: []
                        }
                    },
                    {
                        id: 'phase_rec_01',
                        departmentId: deptMainRecon,
                        name: 'Restoration',
                        status: 'ACTIVE',
                        data: demoReconData, // Has the cabinet findings
                        assignments: {
                            supervisorId: 'mgr_rec_s',
                            leadTechnicianId: 'mem_rec_s',
                            teamMemberIds: []
                        }
                    }
                ]
            }
        ];

        for (const j of jobs) {
            await db.collection('jobs').doc(j.id).set({
                id: j.id,
                orgId,
                officeId: j.officeId,
                departmentId: j.deptId,
                departmentIds: [...new Set(j.phases.map(p => p.departmentId))],
                status: j.status,
                customer: { name: j.cust, phone: '555-0100', email: 'cust@example.com' },
                property: { address: '742 Evergreen Tce', city: 'Metro City', state: 'NY', zip: '10001' },
                insurance: { carrier: 'State Farm', claimNumber: `CLM-${j.id}` },
                assignedUserIds: j.assignedTo,
                financials: {
                    // Sum active phase line items
                    revenue: (j.phases.find(p => p.status === 'ACTIVE')?.data?.lineItems || []).reduce((acc: any, i: any) => acc + i.total, 0),
                    paid: 0,
                    balance: 0
                },
                details: {
                    propertyType: 'Residential',
                    lossCategory: 'Fire',
                    lossDescription: 'Kitchen fire with suppression damage.'
                },
                // @ts-ignore
                phases: j.phases || [],
                // @ts-ignore
                claimData: j.phases ? j.phases.find(p => p.status === 'ACTIVE')?.data : null, // Backwards compat
                createdBy: 'owner_single',
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            });
        }


        process.exit(0);
    } catch (error) {
        console.error('\n❌ Fatal Seeding Error:', error);
        process.exit(1);
    }
}

seed();

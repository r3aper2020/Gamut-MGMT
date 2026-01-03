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
            { id: deptMainMit, orgId, officeId: officeMainId, name: 'Mitigation' },
            { id: deptMainRecon, orgId, officeId: officeMainId, name: 'Reconstruction' }
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


        // 5. Jobs
        console.log('💼 Creating Demo Jobs...');

        // Generate massive line items
        const generatedLineItems = [];
        const categories = ['Mitigation', 'Contents', 'Structural-Demolition', 'Structural-Framing', 'Drywall', 'Painting', 'Flooring', 'Electrical', 'Plumbing', 'HVAC'];

        for (let i = 1; i <= 75; i++) {
            const cat = categories[Math.floor(Math.random() * categories.length)];
            generatedLineItems.push({
                id: `li_gen_${i}`,
                category: cat,
                description: `Standard line item description for ${cat} work step #${i} - Remove and replace per industry standard`,
                quantity: Math.floor(Math.random() * 500) + 10,
                unit: 'SF',
                unitPrice: parseFloat((Math.random() * 5 + 0.5).toFixed(2)),
                total: 0 // Will recalc below
            });
        }
        // Calc totals
        generatedLineItems.forEach(i => i.total = parseFloat((i.quantity * i.unitPrice).toFixed(2)));

        // Generate multiple images (using placehold.co so no need to upload these particular ones)
        const generatedImages = [];
        const rooms = ['Living Room', 'Kitchen', 'Master Bath', 'Guest Bed', 'Hallway', 'Basement'];
        for (let i = 1; i <= 24; i++) {
            const room = rooms[i % rooms.length];
            generatedImages.push({
                url: `https://placehold.co/600x400/png?text=${room.replace(' ', '+')}+Photo+${i}`,
                caption: `Photo ${i} of ${room}: Documenting pre-existing conditions and initial water damage extent. Timestamp verified.`,
                timestamp: new Date(),
                room: room
            });
        }

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
                    { room: 'Kitchen', area: '200 sqft', perimeter: '50 ft', height: '9 ft' },
                    { room: 'Master Bedroom', area: '280 sqft', perimeter: '68 ft', height: '10 ft' },
                    { room: 'Master Bath', area: '120 sqft', perimeter: '42 ft', height: '10 ft' },
                    { room: 'Hallway', area: '85 sqft', perimeter: '30 ft', height: '9 ft' },
                    { room: 'Guest Bedroom', area: '180 sqft', perimeter: '54 ft', height: '9 ft' }
                ],
                images: generatedImages,
                notes: 'LARGE LOSS: Initial scan indicates Class 3 water loss affecting >60% of the structure. Source: Main line rupture in slab. Extensive mitigation required.'
            },
            aiAnalysis: {
                summary: 'CRITICAL ALERT: Class 3 Water Loss detected across multiple zones. High risk of secondary damage to structural components. Immediate stabilization required.',
                recommendedActions: [
                    'Emergency Water Extraction (Truck Mount)',
                    'Remove all floating flooring (1200 SF)',
                    'Flood cut drywall 2ft/4ft in affected zones',
                    'Deploy 12+ Axial Air Movers',
                    'Deploy 4 XL LGR Dehumidifiers',
                    'Containment barriers for Master Suite'
                ],
                referencedStandards: [
                    'IICRC S500 - Standard and Reference Guide for Professional Water Damage Restoration',
                    'ANSI/IICRC S520 - Standard for Professional Mold Remediation',
                    'OSHA 1910 - Occupational Safety and Health Standards'
                ].map(s => {
                    const parts = s.split(' - ');
                    return { code: parts[0], description: parts[1] };
                })
            },
            lineItems: generatedLineItems
        };

        const jobs = [
            // AI Demo Job (Multi-Phase)
            {
                id: 'job_demo_ai_single',
                officeId: officeMainId,
                deptId: deptMainMit, // Fix: Must be in Mitigation Dept
                cust: 'Sarah Connor (AI Demo - Large)',
                status: 'PENDING',
                assignedTo: ['mgr_mit_s', 'mem_mit_s'], // Include Manager in assignments
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
            }
        ];

        for (const j of jobs) {
            await db.collection('jobs').doc(j.id).set({
                id: j.id,
                orgId,
                officeId: j.officeId,
                departmentId: j.deptId,
                departmentIds: [deptMainMit], // Only starts in Mitigation
                status: j.status,
                customer: { name: j.cust, phone: '555-0100', email: 'cust@example.com' },
                property: { address: '742 Evergreen Tce', city: 'Metro City', state: 'NY', zip: '10001' },
                insurance: { carrier: 'State Farm', claimNumber: `CLM-${j.id}` },
                assignedUserIds: j.assignedTo,
                financials: {
                    revenue: 15000,
                    paid: 0,
                    balance: 15000
                },
                details: {
                    propertyType: 'Residential',
                    lossCategory: 'Water',
                    lossDescription: 'Water damage from burst pipe in kitchen.'
                },
                // @ts-ignore
                phases: j.phases || [],
                // @ts-ignore
                claimData: j.phases ? j.phases.find(p => p.status === 'ACTIVE')?.data : null, // Backwards compat for now
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

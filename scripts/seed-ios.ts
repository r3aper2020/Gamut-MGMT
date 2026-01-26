import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const PROJECT_ID = 'gamut-demo';
process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8007';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9007';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9107';

console.log('🔧 Emulator Environment Configured (iOS Seed):');

const app = initializeApp({ projectId: PROJECT_ID });
const db = getFirestore(app);
const auth = getAuth(app);

async function seed() {
    try {
        console.log('🌱 Starting GAMUT iOS Seeding...');

        // Use the ID expected by the iOS App (AppConfig.swift)
        const orgId = 'org_test123';

        const office1 = 'office_multi_1';
        const office2 = 'office_multi_2';

        const dept1_mit = 'dept_m1_mit';
        const dept2_mit = 'dept_m2_mit';

        // 1. Organization
        await db.collection('organizations').doc(orgId).set({
            id: orgId,
            name: 'Gamut iOS Demo Corp',
            ownerId: 'owner_multi',
            createdAt: FieldValue.serverTimestamp(),
            settings: { theme: 'dark' }
        });

        // 2. Offices
        console.log('🏢 Creating 2 Offices...');
        await db.collection('offices').doc(office1).set({ id: office1, orgId, name: 'East Coast HQ', address: 'NY', managerId: 'gm_multi_1', createdAt: FieldValue.serverTimestamp() });
        await db.collection('offices').doc(office2).set({ id: office2, orgId, name: 'West Coast Branch', address: 'LA', managerId: 'gm_multi_2', createdAt: FieldValue.serverTimestamp() });

        // 3. Departments
        await db.collection('departments').doc(dept1_mit).set({ id: dept1_mit, orgId, officeId: office1, name: 'Mitigation (East)', createdAt: FieldValue.serverTimestamp() });
        await db.collection('departments').doc(dept2_mit).set({ id: dept2_mit, orgId, officeId: office2, name: 'Mitigation (West)', createdAt: FieldValue.serverTimestamp() });

        // 4. Users
        console.log('👤 Creating Users...');
        const users = [
            { uid: 'owner_multi', email: 'owner@multi.com', role: 'OWNER', name: 'Oliver Owner', officeId: office1 },
            { uid: 'gm_multi_1', email: 'gm1@multi.com', role: 'OFFICE_ADMIN', name: 'Gina GM (East)', officeId: office1 },
            { uid: 'gm_multi_2', email: 'gm2@multi.com', role: 'OFFICE_ADMIN', name: 'Gary GM (West)', officeId: office2 },
            { uid: 'mgr_multi_1', email: 'mgr1@multi.com', role: 'DEPT_MANAGER', name: 'Manny Manager (East)', officeId: office1, departmentId: dept1_mit },
            { uid: 'mgr_multi_2', email: 'mgr2@multi.com', role: 'DEPT_MANAGER', name: 'Molly Manager (West)', officeId: office2, departmentId: dept2_mit },
            // Add a specific user for testing if needed, or use existing generic ones
            { uid: 'ios_user', email: 'ios@gamut.com', role: 'MEMBER', name: 'iOS Tester', officeId: office1, departmentId: dept1_mit }
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

        // 5. Minimal Jobs (No Claim Data)
        console.log('💼 Creating Basic Jobs (No Claim Data)...');
        const jobs = [
            { id: 'job_ios_01', officeId: office1, deptId: dept1_mit, cust: 'Alice Apple', status: 'MITIGATION', location: '1 Infinite Loop' },
            { id: 'job_ios_02', officeId: office1, deptId: dept1_mit, cust: 'Bob Beta', status: 'FNOL', location: '123 Test St' },
            { id: 'job_ios_03', officeId: office2, deptId: dept2_mit, cust: 'Charlie Charlie', status: 'RECONSTRUCTION', location: '456 Hollywood Blvd' }
        ];

        for (const j of jobs) {
            await db.collection('jobs').doc(j.id).set({
                id: j.id,
                orgId,
                officeId: j.officeId,
                departmentId: j.deptId,
                status: j.status,
                clientName: j.cust, // iOS app uses 'clientName' in some places, 'customer.name' in others? DB usually has customer.name. 
                // ProjectView.swift uses `job.clientName`.
                // Let's check JobModel decoding. Usually it maps customer.name -> clientName or similar.
                // seed.ts uses `customer: { name: ... }`.
                customer: { name: j.cust },
                location: j.location,
                assignedUserIds: ['ios_user', 'mgr_multi_1'], // Assign to our test users
                claimData: null, // EXPLICITLY NULL as requested
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            });
        }

        console.log('\n✅ iOS Seeding Complete!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Fatal Seeding Error:', error);
        process.exit(1);
    }
}

seed();


import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkJobs() {
    console.log("Fetching jobs...");
    const snap = await getDocs(collection(db, 'jobs'));
    console.log(`Found ${snap.size} jobs.`);

    snap.forEach(doc => {
        const data = doc.data();
        console.log("---------------------------------------------------");
        console.log(`Job ID: ${doc.id}`);
        console.log(`Client: ${data.clientName}`);
        console.log(`Org ID: ${data.orgId}`);
        console.log(`Assigned User IDs:`, data.assignedUserIds);
        console.log(`Assignments Object:`, JSON.stringify(data.assignments));
    });
}

checkJobs().catch(console.error);

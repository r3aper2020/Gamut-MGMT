
import admin from 'firebase-admin';

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

admin.initializeApp({
    projectId: 'demo-gamut-claims',
});

const db = admin.firestore();

async function checkClaims() {
    console.log('Checking claims in emulator...');
    const snapshot = await db.collection('claims').get();

    if (snapshot.empty) {
        console.log('No claims found.');
        return;
    }

    snapshot.forEach(doc => {
        const data = doc.data();
        const hasLineItems = data.lineItems && data.lineItems.length > 0;
        const hasAiAnalysis = !!data.aiAnalysis;
        console.log(`Claim ${doc.id}: LineItems=${hasLineItems}, AI=${hasAiAnalysis}`);
    });
}

checkClaims().catch(console.error);

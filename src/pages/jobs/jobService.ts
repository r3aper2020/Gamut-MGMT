import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Job } from '@/types/jobs';

export const jobService = {
    subscribeToOrganizationJobs: (orgId: string, callback: (jobs: Job[]) => void) => {
        const q = query(
            collection(db, 'jobs'),
            where('orgId', '==', orgId)
        );

        return onSnapshot(q, (snap) => {
            const list = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                updatedAt: doc.data().updatedAt || { toMillis: () => Date.now() }
            })) as Job[];
            callback(list);
        });
    },

    subscribeToOfficeJobs: (orgId: string, officeId: string, departmentId: string | null, callback: (jobs: Job[]) => void) => {
        let q = query(
            collection(db, 'jobs'),
            where('orgId', '==', orgId),
            where('officeId', '==', officeId)
        );

        if (departmentId) {
            q = query(q, where('departmentId', '==', departmentId));
        }

        return onSnapshot(q, (snap) => {
            const list = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                updatedAt: doc.data().updatedAt || { toMillis: () => Date.now() }
            })) as Job[];
            callback(list);
        });
    },

    updateJob: async (jobId: string, updates: Partial<Job>) => {
        const docRef = doc(db, 'jobs', jobId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    }
};

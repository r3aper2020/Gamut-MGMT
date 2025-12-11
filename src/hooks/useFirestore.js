import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

export function useFirestoreClaims(user) {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setClaims([]);
            setLoading(false);
            return;
        }

        let q;

        // Filter claims based on user role and permissions
        if (user.role === 'org_owner' || user.hasAdminRights) {
            // Org owner or admin can see all claims
            q = query(
                collection(db, 'claims'),
                where('organizationId', '==', user.organizationId),
                orderBy('updatedAt', 'desc')
            );
        } else if (user.role === 'manager') {
            // Manager sees only their team's claims
            q = query(
                collection(db, 'claims'),
                where('teamId', '==', user.teamId),
                orderBy('updatedAt', 'desc')
            );
        } else if (user.role === 'team_member') {
            // Team member sees all claims in their team
            q = query(
                collection(db, 'claims'),
                where('teamId', '==', user.teamId),
                orderBy('updatedAt', 'desc')
            );
        } else {
            setClaims([]);
            setLoading(false);
            return;
        }

        // Real-time listener
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const claimsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert Firestore Timestamps to Date objects
                submittedAt: doc.data().submittedAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            }));
            setClaims(claimsData);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching claims:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return { claims, loading };
}

export function useFirestoreTeams(user) {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setTeams([]);
            setLoading(false);
            return;
        }

        let q;

        // Filter teams based on user permissions
        if (user.role === 'org_owner' || user.hasAdminRights) {
            // Can see all teams in their organization
            q = query(
                collection(db, 'teams'),
                where('organizationId', '==', user.organizationId)
            );
        } else if (user.teamId) {
            // Can only see their own team
            q = query(
                collection(db, 'teams'),
                where('__name__', '==', user.teamId)
            );
        } else {
            setTeams([]);
            setLoading(false);
            return;
        }

        // Real-time listener
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const teamsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setTeams(teamsData);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching teams:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return { teams, loading };
}

export function useFirestoreComments(claimId) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!claimId) {
            setComments([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'comments'),
            where('claimId', '==', claimId),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const commentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
            }));
            setComments(commentsData);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching comments:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [claimId]);

    return { comments, loading };
}

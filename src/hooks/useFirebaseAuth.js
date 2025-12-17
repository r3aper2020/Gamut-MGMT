import { useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export function useFirebaseAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUserData = async (firebaseUser) => {
        try {
            // Force token refresh to get latest claims if needed (optional here, but safe)
            const idTokenResult = await firebaseUser.getIdTokenResult(true);
            const claims = idTokenResult.claims;
            console.log('DEBUG: Auth Claims:', claims); // Debug logging
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

            if (userDoc.exists()) {
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    role: claims.role,
                    organizationId: claims.organizationId,
                    ...userDoc.data(),
                });
            } else {
                console.warn('User document not found for:', firebaseUser.uid);
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    role: claims.role,
                    organizationId: claims.organizationId,
                });
            }
        } catch (error) {
            console.error('Error fetching user data or claims:', error);
            setUser(null);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    await fetchUserData(firebaseUser);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('AuthStateChanged error:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const refreshUser = async () => {
        if (auth.currentUser) {
            // Force token refresh first to ensure we get new claims from backend changes
            await auth.currentUser.getIdToken(true);
            await fetchUserData(auth.currentUser);
        }
    };

    const login = async (email, password) => {
        setLoading(true); // Start loading immediately to prevent race conditions
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // The onAuthStateChanged listener will handle state update & setting loading to false
            return {
                success: true,
                user: userCredential.user
            };
        } catch (error) {
            console.error('Login error:', error);
            setLoading(false); // Only reset loading on error (success handled by auth listener)
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return {
        user,
        loading,
        login,
        logout,
        refreshUser
    };
}

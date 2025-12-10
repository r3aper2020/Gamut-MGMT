import { useState, useEffect } from 'react';
import { getOrganization } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export function useOrganization() {
    const { user } = useAuth();
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchOrg() {
            if (!user?.organizationId) {
                setLoading(false);
                return;
            }
            try {
                const data = await getOrganization();
                setOrganization(data);
            } catch (err) {
                console.error("Failed to fetch organization:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchOrg();
        }
    }, [user]);

    return { organization, loading, error };
}

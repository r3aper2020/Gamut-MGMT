import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { OwnerCommandCenter } from './components/OwnerCommandCenter';

import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();

    // Redirection Logic for Role-Based Home
    useEffect(() => {
        if (!profile) return;

        // If Manager/Admin/Member logs in at root '/', send them to their Office Hub
        if ((profile.role === 'DEPT_MANAGER' || profile.role === 'OFFICE_ADMIN' || profile.role === 'MEMBER') && profile.officeId) {
            navigate(`/office/${profile.officeId}/dashboard`);
        }
    }, [profile, navigate]);

    if (!profile) return null;

    // Owners stay at Global Root
    if (profile.role === 'OWNER' || profile.role === 'ORG_ADMIN') {
        return <OwnerCommandCenter />;
    }



    // Fallback while redirecting
    return <div style={{ color: '#fff' }}>Redirecting to Workspace...</div>;
};

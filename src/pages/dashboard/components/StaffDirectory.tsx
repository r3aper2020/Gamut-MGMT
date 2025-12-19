import React from 'react';
import { Users } from 'lucide-react';

export const StaffDirectory: React.FC = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <header>
                <div style={{ color: 'var(--accent-electric)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={14} /> Team Management
                </div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Staff Roster</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage your office personnel and assignments.</p>
            </header>

            <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Roster Table Coming Soon...
            </div>
        </div>
    );
};

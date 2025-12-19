import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { type Job, type Office } from '../../../types';
import {
    LayoutDashboard,
    Building2,
    Briefcase,
    TrendingUp,
    Shield,
    ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const OwnerCommandCenter: React.FC = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [offices, setOffices] = useState<Office[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch All Jobs Org-wide
        const unsubJobs = onSnapshot(collection(db, 'jobs'), (snap) => {
            setJobs(snap.docs.map(doc => doc.data() as Job));
        });

        // Fetch All Offices
        const unsubOffices = onSnapshot(collection(db, 'offices'), (snap) => {
            setOffices(snap.docs.map(doc => doc.data() as Office));
            setLoading(false);
        });

        return () => {
            unsubJobs();
            unsubOffices();
        };
    }, []);

    const stats = {
        total: jobs.length,
        offices: offices.length,
        active: jobs.filter(j => j.status !== 'CLOSEOUT').length,
        revenue: '$1.2M' // Placeholder
    };

    if (loading) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--accent-primary)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '8px'
                    }}>
                        <Shield size={14} /> Enterprise Command Center
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                        Executive Overview
                    </h1>
                </div>
            </header>

            {/* Global Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                {[
                    { label: 'Total Enterprise Jobs', value: stats.total, icon: Briefcase, color: 'var(--accent-electric)' },
                    { label: 'Active Locations', value: stats.offices, icon: Building2, color: 'var(--accent-primary)' },
                    { label: 'Active Volume', value: stats.active, icon: TrendingUp, color: 'var(--status-mitigation)' },
                    { label: 'Est. Revenue', value: stats.revenue, icon: LayoutDashboard, color: '#fff' },
                ].map((stat, i) => (
                    <div key={i} className="glass" style={{ padding: '24px' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <stat.icon size={14} /> {stat.label}
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={20} className="text-secondary" /> Branch Performance
            </h3>

            {/* Office Hublets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                {offices.map(office => {
                    const officeJobs = jobs.filter(j => j.officeId === office.id);
                    const officeActive = officeJobs.filter(j => j.status !== 'CLOSEOUT').length;

                    return (
                        <div key={office.id} className="glass" style={{ padding: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                <div>
                                    <h4 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '4px' }}>{office.name}</h4>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{office.address}</div>
                                </div>
                                <div style={{
                                    padding: '4px 12px',
                                    background: 'rgba(0, 242, 255, 0.1)',
                                    color: 'var(--accent-electric)',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                }}>
                                    Active
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Active Claims</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{officeActive}</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Personnel</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>--</div>
                                </div>
                            </div>

                            <Link to={`/org?office=${office.id}`} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--accent-electric)',
                                textDecoration: 'none',
                                fontSize: '0.875rem'
                            }}>
                                Inspect Branch Operations <ChevronRight size={16} />
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Job } from '@/types/jobs';
import { type Office } from '@/types/org';
import { jobService } from '@/pages/jobs/jobService';
import {
    LayoutDashboard,
    Building2,
    Briefcase,
    TrendingUp,
    Shield,
    ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '@/components/ui/StatCard';
import { useAuth } from '@/contexts/AuthContext';

export const Dashboard: React.FC = () => {
    const { profile } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [offices, setOffices] = useState<Office[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile?.orgId) return;

        // Fetch All Jobs Org-wide using jobService
        const unsubJobs = jobService.subscribeToOrganizationJobs(profile.orgId, (jobsList: Job[]) => {
            setJobs(jobsList);
        });

        // Fetch All Offices
        const unsubOffices = onSnapshot(collection(db, 'offices'), (snap) => {
            setOffices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Office)));
            setLoading(false);
        });

        return () => {
            unsubJobs();
            unsubOffices();
        };
    }, [profile?.orgId]);

    const stats = {
        total: jobs.length,
        offices: offices.length,
        active: jobs.filter(j => j.status !== 'CLOSEOUT').length,
        revenue: '$1.2M' // Placeholder
    };

    if (loading) return null;

    return (
        <div className="flex flex-col gap-8">
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-accent-primary text-xs font-bold uppercase tracking-widest mb-2">
                        <Shield size={14} /> Enterprise Command Center
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight m-0">
                        Executive Overview
                    </h1>
                </div>
            </header>

            {/* Global Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {[
                    { label: 'Total Enterprise Jobs', value: stats.total, icon: Briefcase, color: 'var(--accent-electric)' },
                    { label: 'Active Locations', value: stats.offices, icon: Building2, color: 'var(--accent-primary)' },
                    { label: 'Active Volume', value: stats.active, icon: TrendingUp, color: 'var(--status-mitigation)' },
                    { label: 'Estimated Revenue', value: stats.revenue, icon: LayoutDashboard, color: '#fff' },
                ].map((stat, i) => (
                    <StatCard key={i} {...stat} />
                ))}
            </div>

            <h3 className="text-xl font-semibold flex items-center gap-2.5 m-0">
                <Building2 size={20} className="text-text-secondary" /> Branch Performance
            </h3>

            {/* Office Hublets */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6">
                {offices.map(office => {
                    const officeJobs = jobs.filter(j => j.officeId === office.id);
                    const officeActive = officeJobs.filter(j => j.status !== 'CLOSEOUT').length;

                    return (
                        <div key={office.id} className="glass p-8 border border-white/5">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="text-xl font-semibold mb-1 m-0">{office.name}</h4>
                                    <div className="text-sm text-text-muted">{office.address}</div>
                                </div>
                                <div className="px-3 py-1 bg-[rgba(0,242,255,0.1)] text-accent-electric rounded-full text-xs font-semibold">
                                    Active
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white/5 p-4 rounded-xl">
                                    <div className="text-xs text-text-muted mb-1">Active Claims</div>
                                    <div className="text-xl font-bold">{officeActive}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl">
                                    <div className="text-xs text-text-muted mb-1">Personnel</div>
                                    <div className="text-xl font-bold">--</div>
                                </div>
                            </div>

                            <Link to={`/org?office=${office.id}`} className="flex items-center gap-2 text-accent-electric no-underline text-sm font-medium hover:opacity-80 transition-opacity">
                                Inspect Branch Operations <ChevronRight size={16} />
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

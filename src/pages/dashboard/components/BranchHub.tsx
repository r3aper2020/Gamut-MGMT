import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { type Department } from '@/types/org';
import { type Job } from '@/types/jobs';
import {
    Briefcase,
    Clock,
    TrendingUp,
    CheckCircle2,
    MapPin,
    ArrowRight,
    Building2,
    ListTree
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const BranchHub: React.FC = () => {
    const { profile } = useAuth();
    const { activeOfficeId, offices } = useOrganization();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [depts, setDepts] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    const activeOffice = offices.find(o => o.id === activeOfficeId);
    const targetOfficeId = activeOfficeId || profile?.officeId;

    useEffect(() => {
        if (!targetOfficeId) return;

        // Fetch Office Jobs
        const qJobs = query(
            collection(db, 'jobs'),
            where('orgId', '==', profile?.orgId),
            where('officeId', '==', targetOfficeId)
        );
        const unsubJobs = onSnapshot(qJobs, (snap) => {
            setJobs(snap.docs.map(doc => doc.data() as Job));
        });

        // Fetch Office Departments
        const qDepts = query(
            collection(db, 'departments'),
            where('officeId', '==', targetOfficeId)
        );
        const unsubDepts = onSnapshot(qDepts, (snap) => {
            setDepts(snap.docs.map(doc => doc.data() as Department));
            setLoading(false);
        });

        return () => {
            unsubJobs();
            unsubDepts();
        };
    }, [profile?.orgId, targetOfficeId]);

    const stats = {
        total: jobs.length,
        fnol: jobs.filter(j => j.status === 'FNOL').length,
        active: jobs.filter(j => j.status === 'MITIGATION' || j.status === 'RECONSTRUCTION').length,
        completed: jobs.filter(j => j.status === 'CLOSEOUT').length
    };

    if (loading) return null;

    return (
        <div className="flex flex-col gap-8">
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-accent-electric text-xs font-bold uppercase tracking-widest mb-2">
                        <Building2 size={14} /> Branch Operations Center
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tighter m-0">
                        Branch Hub
                    </h1>
                </div>
                <div className="text-right">
                    <div className="text-text-muted text-sm">Active Personnel</div>
                    <div className="text-xl font-semibold text-white">12 Online</div>
                </div>
            </header>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { label: 'Total Claims', value: stats.total, icon: Briefcase, color: 'var(--accent-electric)' },
                    { label: 'New FNOLs', value: stats.fnol, icon: Clock, color: 'var(--status-fnol)' },
                    { label: 'In Production', value: stats.active, icon: TrendingUp, color: 'var(--accent-primary)' },
                    { label: 'Recent Closeouts', value: stats.completed, icon: CheckCircle2, color: 'var(--status-closeout)' },
                ].map((stat, i) => (
                    <div key={i} className="glass p-6 relative overflow-hidden group">
                        <div className="absolute -top-2 -right-2 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity rotate-[-15deg]">
                            <stat.icon size={80} />
                        </div>
                        <div className="text-text-muted text-sm mb-2 flex items-center gap-1.5">
                            <stat.icon size={14} /> {stat.label}
                        </div>
                        <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
                {/* Department Grids */}
                <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold flex items-center gap-2.5 m-0">
                            <ListTree size={20} className="text-accent-primary" /> Department Distribution
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {depts.map(dept => {
                            const deptJobs = jobs.filter(j => j.departmentId === dept.id);
                            return (
                                <div key={dept.id} className="glass p-5 border border-accent-electric/10 hover:border-accent-electric/30 transition-colors">
                                    <div className="font-semibold mb-1 text-white">{dept.name}</div>
                                    <div className="text-[0.7rem] text-text-muted mb-4 uppercase tracking-wider font-bold">
                                        {deptJobs.length} Active Claims
                                    </div>
                                    <div className="h-1 bg-white/5 rounded-full mb-3 overflow-hidden">
                                        <div className="h-full bg-accent-electric shadow-[0_0_8px_var(--accent-electric)] transition-all duration-1000" style={{
                                            width: `${(deptJobs.length / (stats.total || 1)) * 100}%`,
                                        }} />
                                    </div>
                                    <Link to={`/jobs?dept=${dept.id}`} className="text-[0.7rem] text-accent-electric font-bold flex items-center gap-1 hover:opacity-80 transition-opacity uppercase tracking-widest">
                                        Manage Queue <ArrowRight size={12} />
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Office Pulse */}
                <div className="flex flex-col gap-6">
                    <div className="glass p-6 border border-white/5">
                        <h3 className="text-base font-semibold mb-5 flex items-center gap-2 m-0 text-white">
                            <MapPin size={18} className="text-accent-primary" /> Office Information
                        </h3>
                        <div className="flex flex-col gap-4">
                            <div>
                                <div className="text-[0.7rem] text-text-muted uppercase tracking-wider font-bold mb-1">Location</div>
                                <div className="text-sm font-medium">{activeOffice?.name || 'Unknown Office'}</div>
                            </div>
                            <div>
                                <div className="text-[0.7rem] text-text-muted uppercase tracking-wider font-bold mb-1">Office Manager</div>
                                <div className="text-sm font-medium">View Personnel List</div>
                            </div>
                            <div className="mt-2">
                                <Link to="/org" className="block p-3 bg-white/5 hover:bg-white/10 rounded-xl text-center text-sm font-semibold text-white transition-colors border border-white/10 no-underline">
                                    Office Settings
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="glass p-6">
                        <h3 className="text-base font-semibold mb-4 m-0 text-white">Performance</h3>
                        <div className="text-text-muted text-sm text-center py-5">
                            Branch metrics will appear here as more data is collected.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

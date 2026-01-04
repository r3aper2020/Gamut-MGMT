import React from 'react';
import { type Job, type LossClassification } from '@/types/jobs';
import { AlertCircle } from 'lucide-react';
import { JobMap } from '@/components/map/JobMap';

// Sub-components
import { JobActivityFeed } from './components/JobActivityFeed';
import { JobTeamCard } from './components/JobTeamCard';
import { JobLossCard } from './components/JobLossCard';

interface JobOverviewTabProps {
    job: Job;
    classification?: LossClassification;
    leadTech?: { displayName: string; photoURL?: string };
    supervisor?: { displayName: string; photoURL?: string };
}

export const JobOverviewTab: React.FC<JobOverviewTabProps> = ({ job, classification, leadTech, supervisor }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 fade-in duration-500">

            {/* CARD 1: MAP (Top Left - 2 cols) */}
            <div className="md:col-span-2 lg:col-span-2 xl:col-span-2 row-span-2 rounded-3xl border border-white/5 flex flex-col relative group overflow-hidden shadow-2xl min-h-[320px]">
                <JobMap
                    address={job.property.address}
                    city={job.property.city}
                    state={job.property.state}
                    zip={job.property.zip}
                />
            </div>

            {/* CARD 2: ACTIVITY FEED (Top Right - 2 cols) */}
            <JobActivityFeed job={job} />

            {/* CARD 3: CRITICAL NOTES (Bottom Left - 1 col) */}
            <div className="xl:col-span-1 bg-[#1A1A1A] rounded-3xl p-6 border border-white/5 flex flex-col gap-4">
                <div className="flex items-center justify-between text-accent-secondary mb-2">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={18} />
                        <h3 className="text-xs font-black uppercase tracking-widest">Critical Notes</h3>
                    </div>
                    <button className="text-[10px] font-bold bg-white/5 px-2 py-1 rounded hover:bg-white/10 transition-colors">+ Add</button>
                </div>

                <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/5 text-sm text-text-secondary italic">
                    {job.details.notes ? (
                        <span className="not-italic text-white">{job.details.notes}</span>
                    ) : "No critical notes pinned."}
                </div>
            </div>

            {/* CARD 3b: LOSS CLASSIFICATION (New - 1 col) */}
            <JobLossCard job={job} classification={classification} />

            {/* CARD 4: TEAM ROSTER (Bottom Right - 2 cols) */}
            <JobTeamCard leadTech={leadTech} supervisor={supervisor} />

        </div>
    );
};

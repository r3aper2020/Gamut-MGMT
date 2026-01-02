import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Briefcase, ChevronRight, Clock, MapPin, Building, User, FileText } from 'lucide-react';
import { type Job } from '@/types/jobs';
import { type Department } from '@/types/org';
import { type UserProfile } from '@/types/team';

interface JobRowProps {
    job: Job;
    departments: Department[];
    users: UserProfile[];
}

import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { getEffectiveJobStatus } from '@/utils/jobStatusUtils';

export const JobRow: React.FC<JobRowProps> = ({ job, departments, users }) => {
    const navigate = useNavigate();
    const params = useParams();
    const { profile } = useAuth();
    const { activeDepartmentId } = useOrganization();

    // Determine Effective Status for Display
    const effectiveDepartmentId = (profile?.role === 'DEPT_MANAGER' || profile?.role === 'MEMBER')
        ? profile.departmentId
        : activeDepartmentId;

    const { status: displayStatus, isHistorical } = getEffectiveJobStatus(job, effectiveDepartmentId);

    // Context-Aware Navigation
    const handleNavigation = () => {
        const { officeId, departmentId } = params;
        if (officeId && departmentId) {
            navigate(`/office/${officeId}/department/${departmentId}/jobs/${job.id}`);
        } else if (officeId) {
            navigate(`/office/${officeId}/jobs/${job.id}`);
        } else {
            navigate(`/jobs/${job.id}`);
        }
    };

    // Resolve Helpers
    const departmentName = departments.find(d => d.id === job.departmentId)?.name || 'Unknown Dept';
    const leadTech = users.find(u => u.uid === job.assignments?.leadTechnicianId);

    // Color logic
    const statusColorVar = isHistorical
        ? (displayStatus === 'BILLING' ? 'reconstruction' : 'review')
        : displayStatus.toLowerCase();

    return (
        <div
            onClick={handleNavigation}
            className="glass p-5 flex flex-col md:flex-row items-start md:items-center gap-6 cursor-pointer hover:bg-white/5 transition-all group border border-white/5 hover:border-accent-electric/20 relative overflow-hidden"
        >
            {/* Status Indicator Bar (Left Border effect) */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5"
                style={{ backgroundColor: isHistorical ? (displayStatus === 'BILLING' ? 'var(--status-reconstruction)' : '#eab308') : `var(--status-${statusColorVar})` }}
            />

            {/* Icon Box */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg ml-1`}
                style={{ backgroundColor: isHistorical ? (displayStatus === 'BILLING' ? 'var(--status-reconstruction)' : '#eab308') : `var(--status-${statusColorVar})` }}
            >
                <Briefcase size={24} />
            </div>

            {/* Main Content */}
            <div className="flex-1 w-full">
                {/* Header Row: Name & Status */}
                <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-bold text-white group-hover:text-accent-electric transition-colors truncate">
                        {job.customer.name}
                    </h4>
                    <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-md bg-white/5 text-text-secondary uppercase tracking-widest border border-white/10">
                        {displayStatus === 'REVIEW' ? 'Manager Review' : displayStatus.replace('_', ' ')}
                    </span>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-2 gap-x-6 text-sm">

                    {/* Address */}
                    <div className="flex items-center gap-2 text-text-muted">
                        <MapPin size={14} className="text-accent-primary shrink-0" />
                        <span className="truncate">{job.property.address}</span>
                    </div>

                    {/* Department */}
                    <div className="flex items-center gap-2 text-text-muted">
                        <Building size={14} className="text-accent-secondary shrink-0" />
                        <span className="truncate">{departmentName}</span>
                    </div>

                    {/* Lead Tech */}
                    <div className="flex items-center gap-2 text-text-muted">
                        <User size={14} className={`${!leadTech ? 'text-red-500' : 'text-status-mitigation'} shrink-0`} />
                        <span className={`truncate ${leadTech ? 'text-white' : 'text-red-400 font-bold'}`}>
                            {leadTech ? leadTech.displayName : 'Unassigned'}
                        </span>
                    </div>

                    {/* Carrier */}
                    <div className="flex items-center gap-2 text-text-muted">
                        <FileText size={14} className="text-text-secondary shrink-0" />
                        <span className="truncate">{job.insurance.carrier || 'No Carrier'}</span>
                    </div>

                </div>
            </div>

            {/* Right Side / Footer (Mobile) */}
            <div className="text-left md:text-right mt-2 md:mt-0 font-sans min-w-[120px] flex flex-row md:flex-col justify-between items-center md:items-end w-full md:w-auto border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                <div className="text-sm font-semibold text-text-secondary mb-0 md:mb-1">
                    {job.insurance.claimNumber ? `#${job.insurance.claimNumber}` : <span className="italic text-xs opacity-50">No Claim #</span>}
                </div>
                <div className="text-[0.65rem] text-text-muted flex items-center gap-1.5 font-medium">
                    <Clock size={12} />
                    {job.createdAt?.seconds
                        ? new Date(job.createdAt.seconds * 1000).toLocaleDateString()
                        : 'Just now'}
                </div>
            </div>

            <ChevronRight className="hidden md:block text-text-muted group-hover:text-white transition-colors" />
        </div>
    );
};

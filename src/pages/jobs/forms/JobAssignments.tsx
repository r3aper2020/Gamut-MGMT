import React from 'react';
import { Users, X } from 'lucide-react';
import { type JobAssignments } from '@/types/jobs';
import { type UserProfile } from '@/types/team';

interface JobAssignmentsFormProps {
    assignments: JobAssignments;
    setAssignments: React.Dispatch<React.SetStateAction<JobAssignments>>;
    orgUsers: UserProfile[];
    availableUsers: UserProfile[];
}

export const JobAssignmentsForm: React.FC<JobAssignmentsFormProps> = ({
    assignments, setAssignments,
    orgUsers, availableUsers
}) => {
    const handleAssignmentChange = (field: keyof JobAssignments, value: string | string[]) => {
        setAssignments(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-accent-primary mb-4">
                <Users size={18} />
                <h3 className="text-sm font-black uppercase tracking-widest">Assignments</h3>
            </div>

            {/* 1. SUPERVISOR */}
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">Supervisor / Dept. Manager</label>
                <select
                    value={assignments.supervisorId || ''}
                    onChange={(e) => handleAssignmentChange('supervisorId', e.target.value)}
                    className="input-field appearance-none"
                >
                    <option value="" className="bg-bg-tertiary">Select Supervisor...</option>
                    {availableUsers.map(u => (
                        <option key={u.uid} value={u.uid} className="bg-bg-tertiary">
                            {u.displayName} {u.role === 'DEPT_MANAGER' ? '(Manager)' : ''}
                        </option>
                    ))}
                </select>
            </div>

            {/* 2. LEAD TECHNICIAN */}
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">Lead Technician</label>
                <select
                    value={assignments.leadTechnicianId || ''}
                    onChange={(e) => handleAssignmentChange('leadTechnicianId', e.target.value)}
                    className="input-field appearance-none"
                >
                    <option value="" className="bg-bg-tertiary">Select Lead Tech...</option>
                    {availableUsers.map(u => (
                        <option key={u.uid} value={u.uid} className="bg-bg-tertiary">
                            {u.displayName}
                        </option>
                    ))}
                </select>
            </div>

            {/* 3. ADDITIONAL TEAM MEMBERS */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase">Additional Team Members</label>
                <div className="space-y-2">
                    {/* Add Member Dropdown */}
                    <select
                        className="input-field appearance-none text-sm"
                        onChange={(e) => {
                            if (e.target.value) {
                                setAssignments(prev => ({
                                    ...prev,
                                    teamMemberIds: [...(prev.teamMemberIds || []), e.target.value]
                                }));
                            }
                        }}
                        value=""
                    >
                        <option value="" className="bg-bg-tertiary">+ Add Team Member...</option>
                        {availableUsers
                            .filter(u =>
                                u.uid !== assignments.leadTechnicianId &&
                                !assignments.teamMemberIds?.includes(u.uid)
                            )
                            .map(u => (
                                <option key={u.uid} value={u.uid} className="bg-bg-tertiary">
                                    {u.displayName}
                                </option>
                            ))}
                    </select>

                    {/* Selected Members List */}
                    <div className="flex flex-wrap gap-2">
                        {assignments.teamMemberIds?.map(uid => {
                            const user = orgUsers.find(u => u.uid === uid);
                            if (!user) return null;
                            return (
                                <div key={uid} className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
                                    <span className="text-sm">{user.displayName}</span>
                                    <button
                                        type="button"
                                        onClick={() => setAssignments(prev => ({
                                            ...prev,
                                            teamMemberIds: prev.teamMemberIds?.filter(id => id !== uid)
                                        }))}
                                        className="hover:text-red-400 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

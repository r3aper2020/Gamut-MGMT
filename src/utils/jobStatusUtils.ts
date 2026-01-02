import { type Job } from '@/types/jobs';

/**
 * Determines the effective status of a job based on the user's department context.
 * If the user is viewing a job that has been transferred OUT of their department,
 * this returns the historical stage (Manager Review / Billing).
 * Otherwise, it returns the job's active status.
 */
export const getEffectiveJobStatus = (
    job: Job,
    contextDepartmentId?: string | null
): { status: string; isHistorical: boolean } => {
    if (!contextDepartmentId) {
        return { status: job.status, isHistorical: false };
    }

    // specific check: Only treat as historical if the job is NOT in the context department
    // ensuring we don't show "Manager Review" for jobs that have been returned to us.
    if (job.departmentId !== contextDepartmentId) {
        const phase = job.phases?.find(p => p.departmentId === contextDepartmentId);
        // If we found a phase for our department, return its stage
        if (phase) {
            return {
                status: phase.stage || 'REVIEW',
                isHistorical: true
            };
        }
    }

    return { status: job.status, isHistorical: false };
};

/**
 * Determines the effective team assignments based on the user's department context.
 * If historical, returns the assignments from that phase.
 * If active, returns the job's current assignments.
 */
export const getEffectiveAssignments = (
    job: Job,
    contextDepartmentId?: string | null
) => {
    if (!contextDepartmentId || job.departmentId === contextDepartmentId) {
        return {
            assignments: job.assignments,
            isHistorical: false
        };
    }

    const phase = job.phases?.find(p => p.departmentId === contextDepartmentId);
    if (phase?.assignments) {
        return {
            assignments: phase.assignments,
            isHistorical: true
        };
    }

    // Fallback if no phase assignments found (shouldn't happen for valid historical jobs)
    return {
        assignments: job.assignments,
        isHistorical: false
    };
};

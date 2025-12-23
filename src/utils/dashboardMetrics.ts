import { type Job } from '@/types/jobs';
import { Timestamp } from 'firebase/firestore';

export interface DashboardMetrics {
    totalRevenue: number;
    avgJobValue: number;
    activeCount: number;
    stuckCount: number; // No update in 7+ days
    pipeline: Record<string, number>; // Status -> Count
    aging: {
        '0-3': number;
        '4-7': number;
        '8-14': number;
        '15+': number;
    };
    revenueByDept: Record<string, number>;
}

// Helper to safely get Date object
const getDate = (dateField: any): Date => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!dateField) return new Date();
    if (dateField instanceof Timestamp) return dateField.toDate();
    if (dateField.seconds) return new Date(dateField.seconds * 1000); // Handle object-like timestamp
    return new Date(dateField);
};

const getDaysDiff = (date: Date): number => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const calculateMetrics = (jobs: Job[]): DashboardMetrics => {
    const metrics: DashboardMetrics = {
        totalRevenue: 0,
        avgJobValue: 0,
        activeCount: 0,
        stuckCount: 0,
        pipeline: {
            'FNOL': 0,
            'MITIGATION': 0,
            'RECONSTRUCTION': 0,
            'REVIEW': 0,
            'CLOSEOUT': 0
        },
        aging: {
            '0-3': 0,
            '4-7': 0,
            '8-14': 0,
            '15+': 0
        },
        revenueByDept: {}
    };

    if (jobs.length === 0) return metrics;

    let totalActiveRevenue = 0;

    jobs.forEach(job => {
        // Pipeline & Active Count
        if (metrics.pipeline[job.status] !== undefined) {
            metrics.pipeline[job.status]++;
        }

        if (job.status !== 'CLOSEOUT') {
            metrics.activeCount++;

            // Financials (simulated if missing)
            // Ideally strictly typed, but casting for now as per previous implementation patterns
            const rev = job.financials?.revenue || 0;
            totalActiveRevenue += rev;
            metrics.totalRevenue += rev;

            // Revenue By Dept
            if (job.departmentId) {
                metrics.revenueByDept[job.departmentId] = (metrics.revenueByDept[job.departmentId] || 0) + rev;
            }

            // Stuck Jobs (Updated > 7 days ago)
            const daysSinceUpdate = getDaysDiff(getDate(job.updatedAt));
            if (daysSinceUpdate > 7) {
                metrics.stuckCount++;
            }

            // Aging Buckets (Created date)
            const daysAge = getDaysDiff(getDate(job.createdAt));
            if (daysAge <= 3) metrics.aging['0-3']++;
            else if (daysAge <= 7) metrics.aging['4-7']++;
            else if (daysAge <= 14) metrics.aging['8-14']++;
            else metrics.aging['15+']++;
        }
    });

    metrics.avgJobValue = metrics.activeCount > 0 ? totalActiveRevenue / metrics.activeCount : 0;

    return metrics;
};

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(amount);
};

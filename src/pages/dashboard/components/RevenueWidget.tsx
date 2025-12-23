import React from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';
import { type Job } from '@/types/jobs';

interface RevenueWidgetProps {
    jobs: Job[];
}

export const RevenueWidget: React.FC<RevenueWidgetProps> = ({ jobs }) => {
    // Calculate total revenue
    // Calculate total revenue
    // Fix: access financials which might be undefined in older jobs if we didn't wipe DB completely
    const totalRevenue = jobs.reduce((sum, job) => sum + (job.financials?.revenue || 0), 0);

    // Mock monthly trend for visualization (last 6 months)
    const trends = [40, 65, 55, 80, 70, 95]; // Percentages relative to max

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="glass border border-white/10 rounded-2xl p-6 flex flex-col h-full bg-linear-to-br from-surface-elevation-1 to-surface-elevation-2">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
                        <DollarSign size={20} className="text-status-success" />
                        Revenue Projection
                    </h3>
                    <div className="text-xs text-text-muted">Estimated from active jobs</div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-text-secondary">
                        {formatCurrency(totalRevenue)}
                    </div>
                    <div className="flex items-center justify-end gap-1 text-xs text-status-success font-medium">
                        <TrendingUp size={12} /> +12% vs last month
                    </div>
                </div>
            </div>

            {/* Visual Chart */}
            <div className="flex-1 flex items-end justify-between gap-2 mt-2 px-2">
                {trends.map((height, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1 group cursor-pointer">
                        <div className="relative w-full rounded-t-lg bg-white/5 overflow-hidden h-32 flex items-end group-hover:bg-white/10 transition-colors">
                            <div
                                className="w-full bg-accent-electric/20 border-t border-accent-electric/50 transition-all duration-500 group-hover:bg-accent-electric/40"
                                style={{ height: `${height}%` }}
                            />
                        </div>
                        <div className="text-[10px] text-text-muted">M{i + 1}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

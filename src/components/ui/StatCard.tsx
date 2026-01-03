import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color }) => (
    <div className="glass p-6">
        <div className="text-text-muted text-sm mb-2 flex items-center gap-1.5 uppercase font-bold tracking-widest text-[0.65rem]">
            <Icon size={14} className="opacity-70" /> {label}
        </div>
        <div className="text-3xl font-bold font-mono tracking-tight" style={{ color: color || '#fff' }}>
            {value}
        </div>
    </div>
);

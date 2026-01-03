import React from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

export interface SidebarItemProps {
    icon: LucideIcon;
    label: string;
    to: string;
    isActive?: boolean;
    context?: string; // e.g. "Department", "Office"
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, to, isActive }) => (
    <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 mb-1 no-underline group ${isActive
            ? 'text-accent-electric bg-accent-electric/5 shadow-[inset_0_0_15px_rgba(0,242,255,0.03)]'
            : 'text-text-secondary hover:bg-white/5 hover:text-white'
            }`}
    >
        <div className={`transition-all duration-300 ${isActive ? 'text-accent-electric drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]' : 'group-hover:text-white'}`}>
            <Icon size={20} />
        </div>
        <span className="font-semibold tracking-wide text-sm">{label}</span>
        {isActive && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-electric shadow-[0_0_12px_#00f2ff,0_0_20px_rgba(0,242,255,0.4)]" />
        )}
    </Link>
);

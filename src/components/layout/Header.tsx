import React from 'react';
import { MapPin, Shield, PlusCircle } from 'lucide-react';
import { type Office, type Department } from '@/types/org';
import { type UserProfile } from '@/types/team';

interface HeaderProps {
    activeOfficeId: string | null;
    activeOffice: Office | undefined;
    activeDepartmentId: string | null;
    departments: Department[];
    profile: UserProfile | null;
    onJobCreateClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    activeOfficeId,
    activeOffice,
    activeDepartmentId,
    departments,
    profile,
    onJobCreateClick
}) => {
    return (
        <header className="mb-8 flex justify-between items-center gap-6">
            <div className="flex items-center gap-6">
                <div className="shrink-0">
                    <h2 className="text-2xl font-extrabold tracking-tight m-0 text-white whitespace-nowrap">
                        {activeOfficeId ? (activeOffice?.name || 'Branch Hub') : 'Enterprise Command Center'}
                    </h2>
                </div>

                <div
                    className={`flex items-center gap-2 px-3.5 py-1.5 border rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md ${activeDepartmentId
                        ? 'bg-accent-electric/10 border-accent-electric/30 text-accent-electric shadow-[0_0_15px_rgba(0,242,255,0.05)]'
                        : 'bg-purple-500/10 border-purple-500/30 text-[#c084fc]'
                        }`}
                >
                    {activeOfficeId ? <MapPin size={12} /> : <Shield size={12} />}
                    {activeOfficeId
                        ? (activeDepartmentId
                            ? `${departments.find(d => d.id === activeDepartmentId)?.name || 'Department'} View`
                            : 'Office Overview')
                        : 'Global Scope'}
                </div>
            </div>

            {activeOfficeId && profile?.role !== 'MEMBER' && (
                <button
                    onClick={onJobCreateClick}
                    className="glass flex items-center gap-2 px-4 py-2 text-white border-none cursor-pointer"
                >
                    <PlusCircle size={18} />
                    <span>Create Job</span>
                </button>
            )}
        </header>
    );
};

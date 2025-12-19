import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Globe, ChevronDown } from 'lucide-react';
import { type Office, type Department, type Organization } from '@/types/org';
import { type UserProfile } from '@/types/team';

interface SidebarContextSwitcherProps {
    organization: Organization | null;
    offices: Office[];
    departments: Department[];
    activeOfficeId: string | null;
    activeDepartmentId: string | null;
    setActiveDepartmentId: (id: string | null) => void;
    userRole?: string;
    userProfile?: UserProfile | null;
}

export const SidebarContextSwitcher: React.FC<SidebarContextSwitcherProps> = ({
    organization,
    offices,
    departments,
    activeOfficeId,
    activeDepartmentId,
    setActiveDepartmentId,
    userRole,
    userProfile
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedOfficeId, setExpandedOfficeId] = useState<string | null>(null);
    const navigate = useNavigate();
    const activeOffice = offices.find(o => o.id === activeOfficeId);
    const activeDepartment = departments.find(d => d.id === activeDepartmentId);

    // Track the last seen activeOfficeId to know when to auto-expand
    const [lastActiveOfficeId, setLastActiveOfficeId] = useState<string | null>(null);

    if (activeOfficeId !== lastActiveOfficeId) {
        setLastActiveOfficeId(activeOfficeId);
        if (activeOfficeId) {
            setExpandedOfficeId(activeOfficeId);
        }
    }

    const handleSwitch = (officeId: string | null, departmentId: string | null = null) => {
        if (officeId) {
            setActiveDepartmentId(departmentId);
            navigate(`/office/${officeId}/dashboard`);
        } else {
            setActiveDepartmentId(null);
            navigate('/');
        }
        setIsOpen(false);
    };

    const toggleExpansion = (officeId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedOfficeId(prev => prev === officeId ? null : officeId);
    };

    const renderOfficeContent = (o: Office) => {
        let officeDepts = departments.filter(d => d.officeId === o.id);

        if (userRole === 'MEMBER' && userProfile?.departmentId) {
            officeDepts = officeDepts.filter(d => d.id === userProfile.departmentId);
        }

        const isActiveOffice = activeOfficeId === o.id;
        const isOverviewActive = isActiveOffice && !activeDepartmentId;

        return (
            <div className="pl-3 mt-1 mb-2">
                <button
                    onClick={() => handleSwitch(o.id, null)}
                    className={`w-full p-2.5 flex items-center gap-2.5 bg-transparent border-none rounded-lg text-text-secondary cursor-pointer text-left transition-all duration-200 hover:bg-[rgba(255,255,255,0.05)] hover:text-white mb-1 ${isOverviewActive ? 'bg-[rgba(192,132,252,0.1)] text-[#c084fc]' : ''
                        }`}
                >
                    <MapPin size={14} />
                    <span className="text-xs font-semibold">Office Overview</span>
                </button>
                <div className="h-px bg-white/10 my-1 opacity-50" />
                {officeDepts.map(d => (
                    <button
                        key={d.id}
                        onClick={() => handleSwitch(o.id, d.id)}
                        className={`w-full p-2.5 flex items-center gap-2.5 rounded-lg cursor-pointer text-left transition-all duration-200 border ${activeDepartmentId === d.id
                            ? 'bg-accent-electric/10 border-accent-electric/30 text-accent-electric shadow-[0_0_10px_rgba(0,242,255,0.1)]'
                            : 'bg-transparent border-transparent text-text-secondary'
                            }`}
                    >
                        <div
                            className={`w-1.5 h-1.5 rounded-full bg-current ${activeDepartmentId === d.id ? 'opacity-100' : 'opacity-50'}`}
                        />
                        <span className={`text-xs ${activeDepartmentId === d.id ? 'font-bold' : 'font-medium'}`}>{d.name}</span>
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="relative mb-8">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-3 bg-[rgba(255,255,255,0.03)] rounded-2xl border border-white/10 flex items-center gap-3 cursor-pointer transition-all duration-200 text-left ${isOpen ? 'bg-[rgba(255,255,255,0.08)] border-accent-electric' : ''
                    }`}
            >
                <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${activeDepartmentId
                        ? 'bg-accent-electric/10 text-accent-electric shadow-[0_0_15px_rgba(0,242,255,0.2)]'
                        : 'bg-purple-500/10 text-[#c084fc]'
                        }`}
                >
                    {activeOfficeId ? <MapPin size={18} /> : <Globe size={18} />}
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="text-[0.8125rem] font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">
                        {activeDepartment ? activeDepartment.name : (activeOfficeId ? activeOffice?.name : organization?.name)}
                    </div>
                    <div className="text-[0.6875rem] text-text-muted font-medium">
                        {activeDepartment ? 'Department View' : (activeOfficeId ? 'Branch Hub' : 'Enterprise Global')}
                    </div>
                </div>
                <ChevronDown size={14} className={`text-text-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-40"
                    />
                    <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#141414]/95 backdrop-blur-xl rounded-2xl border border-white/10 p-2 z-50 shadow-2xl animate-[fadeInScale_0.2s_ease-out] max-h-[400px] overflow-y-auto">
                        <div className="text-[0.65rem] font-bold text-text-muted py-2 px-3 uppercase tracking-wider">
                            Switch Perspective
                        </div>

                        {(userRole === 'OWNER' || userRole === 'ORG_ADMIN' || offices.length > 1) ? (
                            <>
                                {(userRole === 'OWNER' || userRole === 'ORG_ADMIN') && (
                                    <button
                                        onClick={() => handleSwitch(null)}
                                        className={`w-full p-2.5 flex items-center gap-2.5 bg-transparent border-none rounded-lg text-text-secondary cursor-pointer text-left transition-all duration-200 hover:bg-[rgba(255,255,255,0.05)] hover:text-white ${!activeOfficeId ? 'bg-[rgba(192,132,252,0.1)] text-[#c084fc]' : ''
                                            }`}
                                    >
                                        <Globe size={14} />
                                        <span className="text-[0.8125rem] font-semibold">Global Overview</span>
                                    </button>
                                )}
                                <div className="h-px bg-white/10 my-1" />

                                {offices.map(o => {
                                    const isExpanded = expandedOfficeId === o.id;
                                    const isActiveOffice = activeOfficeId === o.id;

                                    return (
                                        <div key={o.id}>
                                            <div
                                                className={`w-full p-2.5 flex items-center justify-between bg-transparent border-none rounded-lg text-text-secondary cursor-pointer text-left transition-all duration-200 hover:bg-[rgba(255,255,255,0.05)] hover:text-white ${isActiveOffice ? 'bg-[rgba(192,132,252,0.1)] text-[#c084fc]' : ''
                                                    }`}
                                                onClick={() => handleSwitch(o.id, null)}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <MapPin size={14} />
                                                    <span className="text-[0.8125rem] font-semibold">{o.name}</span>
                                                </div>

                                                <div
                                                    onClick={(e) => toggleExpansion(o.id, e)}
                                                    className="p-1 -m-1 flex items-center justify-center rounded"
                                                >
                                                    <ChevronDown size={12} className={`opacity-70 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                                </div>
                                            </div>
                                            {isExpanded && renderOfficeContent(o)}
                                        </div>
                                    );
                                })}
                            </>
                        ) : (
                            activeOffice && renderOfficeContent(activeOffice)
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

import React from 'react';
import { Plus, Users, FileText, Settings, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuickActionProps {
    label: string;
    icon: React.ElementType;
    to: string;
    color: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ label, icon: Icon, to, color }) => (
    <Link
        to={to}
        className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 border border-white/5 hover:border-accent-electric/30 hover:bg-white/10 transition-all duration-300 gap-3 group no-underline"
    >
        <div
            className="p-3 rounded-full bg-white/5 group-hover:bg-accent-electric/10 transition-colors"
            style={{ color: color }}
        >
            <Icon size={24} />
        </div>
        <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors text-center">
            {label}
        </span>
    </Link>
);

interface QuickActionsContainerProps {
    role?: string;
}

export const QuickActions: React.FC<QuickActionsContainerProps> = ({ role }) => {
    const isMember = role === 'MEMBER';
    const isAdmin = role === 'OWNER' || role === 'ORG_ADMIN' || role === 'OFFICE_ADMIN';

    return (
        <div className="glass p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings size={20} className="text-accent-electric" />
                Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* MEMBER ACTIONS */}
                {isMember && (
                    <>
                        <QuickAction
                            label="Clock In"
                            icon={Clock}
                            to="#"
                            color="var(--accent-electric)"
                        />
                        <QuickAction
                            label="Availability"
                            icon={Calendar}
                            to="#"
                            color="var(--accent-primary)"
                        />
                    </>
                )}

                {/* ADMIN / MANAGER ACTIONS */}
                {!isMember && (
                    <QuickAction
                        label="New Claim"
                        icon={Plus}
                        to="/jobs/new"
                        color="var(--accent-electric)"
                    />
                )}

                {isAdmin && (
                    <QuickAction
                        label="Add Staff"
                        icon={Users}
                        to="/settings/team/new"
                        color="var(--accent-primary)"
                    />
                )}

                {!isMember && (
                    <QuickAction
                        label="Reports"
                        icon={FileText}
                        to="/reports"
                        color="var(--status-mitigation)"
                    />
                )}

                {isAdmin && (
                    <QuickAction
                        label="Settings"
                        icon={Settings}
                        to="/settings"
                        color="#fff"
                    />
                )}
            </div>
        </div>
    );
};

import {
    LayoutDashboard,
    Briefcase,
    ClipboardList,
    // CheckSquare,
    Activity,
    Upload,
    HelpCircle,
    Users,
    FileText,
    Settings,
    Building2,
    Network,
    // Truck,
    CreditCard,
    type LucideIcon
} from 'lucide-react';
import { type UserRole } from '@/types/team';

export type NavContext = 'global' | 'office' | 'department';

export interface NavItem {
    id: string;
    label: string;
    icon: LucideIcon;
    to: string; // Dynamic paths will be replaced at runtime (e.g., :officeId)
    rolesAllowed: UserRole[];
    context: NavContext[]; // Where this item appears
    requiresScope?: 'my' | 'department' | 'office' | 'org'; // Query param scope hint
    featureFlag?: string;
    section?: 'primary' | 'utilities' | 'organize' | 'measure' | 'configure'; // For visual grouping
}

// Master Navigation Configuration
export const navConfig: NavItem[] = [
    // --- GLOBAL CONTEXT (Enterprise) ---
    {
        id: 'global-dashboard',
        label: 'Hub Pulse',
        icon: LayoutDashboard,
        to: '/',
        rolesAllowed: ['OWNER', 'ORG_ADMIN'], // Restricted: Lower roles use Dept/Office items
        context: ['global'],
        section: 'primary'
    },
    {
        id: 'global-kanban',
        label: 'Operations Board',
        icon: ClipboardList,
        to: '/kanban',
        rolesAllowed: ['OWNER', 'ORG_ADMIN'],
        context: ['global'],
        section: 'primary'
    },
    {
        id: 'global-jobs',
        label: 'Jobs / Claims',
        icon: Briefcase,
        to: '/jobs',
        rolesAllowed: ['OWNER', 'ORG_ADMIN'],
        context: ['global'],
        section: 'primary'
    },
    /* REMOVED FOR NOW
    {
        id: 'global-dispatch',
        label: 'Dispatch',
        icon: Truck,
        to: '/dispatch',
        rolesAllowed: ['OWNER', 'ORG_ADMIN'],
        context: ['global'],
        section: 'primary'
    },
    */

    // Organize (Global)
    {
        id: 'global-offices',
        label: 'Offices',
        icon: Building2,
        to: '/offices',
        rolesAllowed: ['OWNER', 'ORG_ADMIN'],
        context: ['global'],
        section: 'organize'
    },
    {
        id: 'global-departments',
        label: 'Departments',
        icon: Network,
        to: '/departments',
        rolesAllowed: ['OWNER', 'ORG_ADMIN'],
        context: ['global'],
        section: 'organize'
    },
    {
        id: 'global-users',
        label: 'Team',
        icon: Users,
        to: '/users',
        rolesAllowed: ['OWNER', 'ORG_ADMIN'],
        context: ['global'],
        section: 'organize'
    },

    // Reports (Global)
    {
        id: 'global-reports-ops',
        label: 'Operational Reports',
        icon: Activity,
        to: '/reports/ops',
        rolesAllowed: ['OWNER', 'ORG_ADMIN'],
        context: ['global'],
        section: 'measure'
    },
    {
        id: 'global-reports-fin',
        label: 'Financial Reports',
        icon: FileText,
        to: '/reports/financial',
        rolesAllowed: ['OWNER', 'ORG_ADMIN'],
        context: ['global'],
        section: 'measure'
    },

    // Configure (Global)
    {
        id: 'global-settings',
        label: 'Org Settings',
        icon: Settings,
        to: '/settings/org',
        rolesAllowed: ['OWNER', 'ORG_ADMIN'],
        context: ['global'],
        section: 'configure'
    },
    {
        id: 'global-billing',
        label: 'Billing & Plan',
        icon: CreditCard,
        to: '/billing',
        rolesAllowed: ['OWNER'],
        context: ['global'],
        section: 'configure'
    },

    // --- OFFICE CONTEXT ---
    {
        id: 'office-dashboard',
        label: 'Hub Pulse',
        icon: LayoutDashboard,
        to: '/office/:officeId/dashboard',
        rolesAllowed: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN'],
        context: ['office'],
        section: 'primary'
    },
    {
        id: 'office-kanban',
        label: 'Operations Board',
        icon: ClipboardList,
        to: '/office/:officeId/kanban',
        rolesAllowed: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN'],
        context: ['office'],
        section: 'primary'
    },
    {
        id: 'office-jobs',
        label: 'Jobs / Claims',
        icon: Briefcase,
        to: '/office/:officeId/jobs',
        rolesAllowed: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN'],
        context: ['office'],
        section: 'primary'
    },
    /* REMOVED FOR NOW
    {
        id: 'office-dispatch',
        label: 'Dispatch',
        icon: Truck,
        to: '/office/:officeId/dispatch',
        rolesAllowed: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN'],
        context: ['office'],
        section: 'primary'
    },
    */
    {
        id: 'office-departments',
        label: 'Departments',
        icon: Network,
        to: '/office/:officeId/depts',
        rolesAllowed: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN'],
        context: ['office'],
        section: 'organize'
    },
    {
        id: 'office-team',
        label: 'Team',
        icon: Users,
        to: '/office/:officeId/team',
        rolesAllowed: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN'],
        context: ['office'],
        section: 'organize'
    },
    {
        id: 'office-settings',
        label: 'Office Settings',
        icon: Settings,
        to: '/office/:officeId/settings',
        rolesAllowed: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN'],
        context: ['office'],
        section: 'configure'
    },

    // --- DEPARTMENT CONTEXT (Unified) ---
    {
        id: 'dept-dashboard',
        label: 'Hub Pulse',
        icon: LayoutDashboard,
        to: '/office/:officeId/department/:departmentId',
        rolesAllowed: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER', 'MEMBER'],
        context: ['department'], // Visible ONLY in Department context
        section: 'primary'
    },
    {
        id: 'dept-kanban',
        label: 'Operations Board',
        icon: ClipboardList,
        to: '/office/:officeId/department/:departmentId/kanban',
        rolesAllowed: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER', 'MEMBER'],
        context: ['department'],
        section: 'primary'
    },
    {
        id: 'dept-jobs',
        label: 'Jobs / Claims',
        icon: Briefcase,
        to: '/office/:officeId/department/:departmentId/jobs',
        rolesAllowed: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER', 'MEMBER'],
        context: ['department'],
        section: 'primary'
    },
    /* REMOVED FOR NOW
    {
        id: 'dept-dispatch',
        label: 'Dispatch',
        icon: Truck,
        to: '/office/:officeId/department/:departmentId/dispatch',
        rolesAllowed: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER'],
        context: ['global', 'department'],
        section: 'primary'
    },
    {
        id: 'dept-tasks',
        label: 'Tasks',
        icon: CheckSquare,
        to: '/office/:officeId/department/:departmentId/tasks',
        rolesAllowed: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER', 'MEMBER'],
        context: ['global', 'department'],
        section: 'primary'
    },
    */
    {
        id: 'dept-team',
        label: 'Team',
        icon: Users,
        to: '/office/:officeId/department/:departmentId/team',
        rolesAllowed: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER', 'MEMBER'],
        context: ['department'],
        section: 'organize'
    },

    // Utilities
    // Utilities (Global)
    {
        id: 'global-uploads',
        label: 'Quick Upload',
        icon: Upload,
        to: '/uploads',
        rolesAllowed: ['OWNER', 'ORG_ADMIN'],
        context: ['global'],
        section: 'utilities'
    },
    {
        id: 'global-help',
        label: 'Help',
        icon: HelpCircle,
        to: '/help',
        rolesAllowed: ['OWNER', 'ORG_ADMIN'],
        context: ['global'],
        section: 'utilities'
    },

    // Utilities (Office)
    {
        id: 'office-uploads',
        label: 'Quick Upload',
        icon: Upload,
        to: '/office/:officeId/uploads',
        rolesAllowed: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN'],
        context: ['office'],
        section: 'utilities'
    },
    {
        id: 'office-help',
        label: 'Help',
        icon: HelpCircle,
        to: '/office/:officeId/help',
        rolesAllowed: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN'],
        context: ['office'],
        section: 'utilities'
    },

    // Utilities (Department)
    {
        id: 'dept-uploads',
        label: 'Quick Upload',
        icon: Upload,
        to: '/office/:officeId/department/:departmentId/uploads',
        rolesAllowed: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER', 'MEMBER'],
        context: ['department'],
        section: 'utilities'
    },
    {
        id: 'dept-help',
        label: 'Help',
        icon: HelpCircle,
        to: '/office/:officeId/department/:departmentId/help',
        rolesAllowed: ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER', 'MEMBER'],
        context: ['department'],
        section: 'utilities'
    }
];

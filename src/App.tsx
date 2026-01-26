import React, { type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { GlobalDashboard } from '@/pages/dashboard/GlobalDashboard';
import JobsList from '@/pages/jobs/JobsList';
import { JobDetails } from '@/pages/jobs/JobDetails';
import { OrgManagement } from '@/pages/org/OrgManagement';

// New Components
import { OperationsBoard } from '@/pages/jobs/OperationsBoard';
import { OfficeTeam } from '@/pages/team/OfficeTeam'; // Was StaffDirectory
import { ManageDepartments } from '@/pages/org/ManageDepartments'; // Was OfficeDepartments
import { GlobalTeam } from '@/pages/team/GlobalTeam'; // Was GlobalUserTable
import { OfficeDashboard } from '@/pages/dashboard/OfficeDashboard'; // Was BranchDashboard
import { DepartmentDashboard } from '@/pages/dashboard/DepartmentDashboard';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { OnboardingWizard } from '@/pages/onboarding/OnboardingWizard';
import { PlaceholderPage } from '@/pages/PlaceholderPage';


import { type UserRole } from '@/types/team';

const ProtectedRoute: React.FC<{
  children: ReactNode;
  useMainLayout?: boolean;
  requireOnboarding?: boolean;
  allowedRoles?: UserRole[];
}> = ({
  children,
  useMainLayout = true,
  requireOnboarding = true,
  allowedRoles
}) => {
    const { user, profile, loading, signOut } = useAuth();
    const location = useLocation();

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-accent-electric font-bold tracking-tighter text-2xl animate-pulse">GAMUT</div>;
    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

    // Special case: If we are in the onboarding flow, we shouldn't redirect loop
    // But this component logic handles "If I am here, am I allowed?"

    // If the route REQUIRES onboarding (default), and the user hasn't done it
    if (requireOnboarding && profile && !profile.onboardingCompleted) {
      return <Navigate to="/onboarding" replace />;
    }

    // Role Based Access Control
    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
      // Prevent infinite loop if redirected to root but root is restricted

      // 1. Members / Dept Managers -> Go to Department Dashboard
      if (['MEMBER', 'DEPT_MANAGER'].includes(profile.role) && profile.officeId && profile.departmentId) {
        return <Navigate to={`/office/${profile.officeId}/department/${profile.departmentId}`} replace />;
      }

      // 2. Office Admins -> Go to Office Dashboard
      if (profile.role === 'OFFICE_ADMIN' && profile.officeId) {
        return <Navigate to={`/office/${profile.officeId}/dashboard`} replace />;
      }

      // 3. Fallback (Owners/Admins or missing IDs)
      // If we are already at root (or redirected here) and still denied, show Access Denied to prevent loop
      if (location.pathname === '/') {
        return (
          <div className="h-screen flex items-center justify-center bg-black text-white flex-col gap-4">
            <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
            <p className="text-text-muted">You are logged in but do not have an assigned Office or Department.</p>
            <p className="text-sm">Please contact your administrator.</p>
            <button
              onClick={async () => {
                await signOut();
                window.location.href = '/login';
              }}
              className="text-accent-electric hover:underline"
            >
              Return to Login
            </button>
          </div>
        );
      }
      return <Navigate to="/" replace />;
    }

    return useMainLayout ? <MainLayout>{children}</MainLayout> : <>{children}</>;
  };

function App() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* User Onboarding */}
            <Route path="/onboarding" element={
              <ProtectedRoute useMainLayout={false} requireOnboarding={false}>
                <OnboardingWizard />
              </ProtectedRoute>
            } />

            {/* --- Global & Enterprise Context --- */}
            <Route path="/" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN']}><GlobalDashboard /></ProtectedRoute>} />
            <Route path="/kanban" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN']}><OperationsBoard /></ProtectedRoute>} />
            <Route path="/jobs" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER', 'MEMBER']}><JobsList /></ProtectedRoute>} />
            <Route path="/jobs/:jobId" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER', 'MEMBER']}><JobDetails /></ProtectedRoute>} />

            {/* <Route path="/dispatch" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN']}><PlaceholderPage title="Dispatch Command" /></ProtectedRoute>} /> */}

            <Route path="/offices" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN']}><PlaceholderPage title="Offices Management" /></ProtectedRoute>} />
            <Route path="/departments" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN']}><PlaceholderPage title="Departments Management" /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN']}><GlobalTeam /></ProtectedRoute>} />

            <Route path="/reports/ops" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN']}><PlaceholderPage title="Operational Reports" /></ProtectedRoute>} />
            <Route path="/reports/financial" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN']}><PlaceholderPage title="Financial Reports" /></ProtectedRoute>} />

            <Route path="/settings/org" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN']}><OrgManagement /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute allowedRoles={['OWNER']}><PlaceholderPage title="Billing & Plans" /></ProtectedRoute>} />
            <Route path="/integrations" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN']}><PlaceholderPage title="Integrations" /></ProtectedRoute>} />

            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/uploads" element={<ProtectedRoute><PlaceholderPage title="Quick Uploads" /></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><PlaceholderPage title="Help & Support" /></ProtectedRoute>} />
            {/* <Route path="/tasks" element={<ProtectedRoute><PlaceholderPage title="My Tasks" /></ProtectedRoute>} /> */}

            {/* --- Office Context --- */}
            <Route path="/office/:officeId/dashboard" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN']}><OfficeDashboard /></ProtectedRoute>} />
            <Route path="/office/:officeId/kanban" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN']}><OperationsBoard /></ProtectedRoute>} />
            <Route path="/office/:officeId/ops" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN']}><OperationsBoard /></ProtectedRoute>} /> {/* Legacy/Alias */}
            <Route path="/office/:officeId/jobs" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN']}><JobsList /></ProtectedRoute>} />
            <Route path="/office/:officeId/jobs/:jobId" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN']}><JobDetails /></ProtectedRoute>} />

            {/* <Route path="/office/:officeId/dispatch" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN']}><PlaceholderPage title="Office Dispatch" /></ProtectedRoute>} /> */}

            <Route path="/office/:officeId/depts" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN']}><ManageDepartments /></ProtectedRoute>} />
            <Route path="/office/:officeId/departments" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN']}><ManageDepartments /></ProtectedRoute>} /> {/* Alias */}
            <Route path="/office/:officeId/team" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN']}><OfficeTeam /></ProtectedRoute>} />

            <Route path="/office/:officeId/settings" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN']}><PlaceholderPage title="Office Settings" /></ProtectedRoute>} />

            {/* Context-Aware Utilities (to prevent sidebar context loss) */}
            <Route path="/office/:officeId/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/office/:officeId/uploads" element={<ProtectedRoute><PlaceholderPage title="Quick Uploads" /></ProtectedRoute>} />
            <Route path="/office/:officeId/help" element={<ProtectedRoute><PlaceholderPage title="Help & Support" /></ProtectedRoute>} />

            {/* --- Department Context --- */}
            <Route path="/office/:officeId/department/:departmentId" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER', 'MEMBER']}><DepartmentDashboard /></ProtectedRoute>} />
            <Route path="/office/:officeId/department/:departmentId/kanban" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER', 'MEMBER']}><OperationsBoard /></ProtectedRoute>} />
            <Route path="/office/:officeId/department/:departmentId/jobs" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER', 'MEMBER']}><JobsList /></ProtectedRoute>} />
            <Route path="/office/:officeId/department/:departmentId/jobs/:jobId" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER', 'MEMBER']}><JobDetails /></ProtectedRoute>} />
            {/* <Route path="/office/:officeId/department/:departmentId/dispatch" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER']}><PlaceholderPage title="Department Assignment" /></ProtectedRoute>} /> */}
            {/* <Route path="/office/:officeId/department/:departmentId/tasks" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER', 'MEMBER']}><PlaceholderPage title="Department Tasks" /></ProtectedRoute>} /> */}
            <Route path="/office/:officeId/department/:departmentId/team" element={<ProtectedRoute allowedRoles={['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER', 'MEMBER']}><OfficeTeam /></ProtectedRoute>} />

            {/* Context-Aware Utilities (Department) */}
            <Route path="/office/:officeId/department/:departmentId/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/office/:officeId/department/:departmentId/uploads" element={<ProtectedRoute><PlaceholderPage title="Quick Uploads" /></ProtectedRoute>} />
            <Route path="/office/:officeId/department/:departmentId/help" element={<ProtectedRoute><PlaceholderPage title="Help & Support" /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </OrganizationProvider>
    </AuthProvider>
  );
}

export default App;

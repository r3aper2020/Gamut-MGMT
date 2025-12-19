import React, { type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import JobsList from '@/pages/jobs/JobsList';
import { OrgManagement } from '@/pages/org/OrgManagement';

// New Components
import { OperationsBoard } from '@/pages/jobs/OperationsBoard';
import { StaffDirectory } from '@/pages/team/StaffDirectory';
import { OfficeDepartments } from '@/pages/org/OfficeDepartments';
import { GlobalUserTable } from '@/pages/team/GlobalUserTable';
import { BranchDashboard } from '@/pages/dashboard/BranchDashboard';


const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-accent-electric font-bold tracking-tighter text-2xl animate-pulse">GAMUT</div>;
  if (!user) return <Navigate to="/login" />;
  return <MainLayout>{children}</MainLayout>;
};

function App() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* --- Global Context Routes --- */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/jobs" element={<ProtectedRoute><JobsList /></ProtectedRoute>} />
            <Route path="/org" element={<ProtectedRoute><OrgManagement /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><GlobalUserTable /></ProtectedRoute>} />

            {/* --- Branch Context Routes --- */}
            <Route path="/office/:officeId/dashboard" element={<ProtectedRoute><BranchDashboard /></ProtectedRoute>} />
            <Route path="/office/:officeId/jobs" element={<ProtectedRoute><JobsList /></ProtectedRoute>} />
            <Route path="/office/:officeId/ops" element={<ProtectedRoute><OperationsBoard /></ProtectedRoute>} />
            <Route path="/office/:officeId/depts" element={<ProtectedRoute><OfficeDepartments /></ProtectedRoute>} />
            <Route path="/office/:officeId/team" element={<ProtectedRoute><StaffDirectory /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </OrganizationProvider>
    </AuthProvider>
  );
}

export default App;


import React from 'react';
import AdminUserManagement from '../components/AdminUserManagement';

export default function UsersPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-100">Users</h1>
                <p className="text-gray-500 mt-1">Manage system access and roles</p>
            </div>

            <AdminUserManagement />
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall, adminCreateUser } from '../services/api';
import Modal from './Modal';
import { UserPlus, Shield, User } from 'lucide-react';

export default function AdminUserManagement() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
        role: 'team_member',
        jobTitle: '',
        phoneNumber: '',
        teamId: ''
    });

    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        if (user?.role) {
            setUserRole(user.role);
        }
    }, [user]);

    const fetchUsers = async () => {
        try {
            const data = await apiCall('/users', 'GET');
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await adminCreateUser(formData);
            setIsModalOpen(false);
            setFormData({ email: '', password: '', displayName: '', role: 'team_member', jobTitle: '', phoneNumber: '', teamId: '' });
            fetchUsers();
            alert("User created successfully");
        } catch (error) {
            alert("Failed to create user: " + error.message);
        }
    };

    if (loading) return <div>Loading users...</div>;

    const canCreateManagers = userRole === 'org_owner';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-100">User Management</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <UserPlus size={20} />
                    Add User
                </button>
            </div>

            <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-slate-900/50 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">UID</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {users.map((u) => (
                            <tr key={u.uid} className="hover:bg-slate-700/30">
                                <td className="px-6 py-4 font-medium text-gray-200">{u.displayName || 'N/A'}</td>
                                <td className="px-6 py-4">{u.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${u.role === 'org_owner' ? 'bg-purple-500/20 text-purple-400' :
                                        u.role === 'manager_admin' ? 'bg-blue-500/20 text-blue-400' :
                                            u.role === 'team_lead' ? 'bg-green-500/20 text-green-400' :
                                                'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {u.role || 'member'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-gray-500">{u.uid}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New User">
                <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Display Name</label>
                        <input
                            type="text"
                            className="input w-full"
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Email</label>
                        <input
                            type="email"
                            className="input w-full"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Password</label>
                        <input
                            type="password"
                            className="input w-full"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Job Title</label>
                            <input
                                type="text"
                                className="input w-full"
                                value={formData.jobTitle || ''}
                                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                placeholder="e.g. Technician"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Phone Number</label>
                            <input
                                type="text"
                                className="input w-full"
                                value={formData.phoneNumber || ''}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                placeholder="e.g. 555-0100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300">Role</label>
                        <select
                            className="input w-full bg-slate-800"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="team_member">Team Member</option>
                            <option value="team_lead">Team Lead</option>
                            <option value="manager">Manager</option>
                            {canCreateManagers && <option value="manager_admin">Manager Admin</option>}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300">Team ID (Optional)</label>
                        <input
                            type="text"
                            className="input w-full"
                            value={formData.teamId || ''}
                            onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                            placeholder="e.g. team1"
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Cancel</button>
                        <button type="submit" className="btn btn-primary">Create User</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

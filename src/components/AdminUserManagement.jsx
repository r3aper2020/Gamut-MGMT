import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall, adminCreateUser, adminUpdateUser, adminDeleteUser, getTeams } from '../services/api';
import Modal from './Modal';
import { UserPlus, Shield, User, Edit2, Trash2, Search, Filter, MoreVertical, Mail, Phone, Briefcase } from 'lucide-react';

export default function AdminUserManagement() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [teams, setTeams] = useState([]);

    // Form Data
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
    // RBAC Helpers
    const { isManager, userTeamId, canManageAllUsers } = useAuth();

    useEffect(() => {
        if (user?.role) {
            setUserRole(user.role);
        }
    }, [user]);

    // Data Fetching
    const fetchUsers = async () => {
        try {
            const data = await apiCall('/users', 'GET');
            // Filter for managers and members locally
            if ((isManager || user?.role === 'team_member') && userTeamId) {
                setUsers(data.filter(u => u.teamId === userTeamId));
            } else {
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeams = async () => {
        try {
            const data = await getTeams();
            setTeams(data);
        } catch (error) {
            console.error("Failed to fetch teams:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchTeams();
    }, []);

    // Filter Logic
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch =
                u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesRole = roleFilter === 'all' || u.role === roleFilter;

            return matchesSearch && matchesRole;
        });
    }, [users, searchTerm, roleFilter]);


    // Handlers
    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await adminCreateUser(formData);
            setIsCreateModalOpen(false);
            const defaultTeamId = teams.find(t => t.name === 'General')?.id || teams[0]?.id || '';
            setFormData({ email: '', password: '', displayName: '', role: 'team_member', jobTitle: '', phoneNumber: '', teamId: defaultTeamId });
            fetchUsers();
        } catch (error) {
            alert("Failed to create user: " + error.message);
        }
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        try {
            const updates = {
                role: formData.role,
                jobTitle: formData.jobTitle,
                phoneNumber: formData.phoneNumber,
                teamId: formData.teamId
            };
            await adminUpdateUser(selectedUser.uid, updates);
            setIsEditModalOpen(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (error) {
            alert("Failed to update user: " + error.message);
        }
    };

    const handleDeleteUser = async (uid) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        try {
            await adminDeleteUser(uid);
            fetchUsers();
        } catch (error) {
            alert("Failed to delete user: " + error.message);
        }
    };

    const openEditModal = (u) => {
        setSelectedUser(u);
        setFormData({
            email: u.email,
            displayName: u.displayName,
            role: u.role || 'team_member',
            jobTitle: u.jobTitle || '',
            phoneNumber: u.phoneNumber || '',
            teamId: u.teamId || teams.find(t => t.name === 'General')?.id || teams[0]?.id || ''
        });
        setIsEditModalOpen(true);
    };

    // Auto-set teamId for new users
    useEffect(() => {
        if ((isCreateModalOpen || isEditModalOpen) && !formData.teamId) {
            if (isManager && userTeamId) {
                setFormData(prev => ({ ...prev, teamId: userTeamId }));
            } else if (teams.length > 0) {
                const defaultTeamId = teams.find(t => t.name === 'General')?.id || teams[0]?.id;
                setFormData(prev => ({ ...prev, teamId: defaultTeamId }));
            }
        }
    }, [isCreateModalOpen, isEditModalOpen, teams, isManager, userTeamId]);

    const canCreateManagers = userRole === 'org_owner';
    const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

    const FolderRoleBadge = ({ role }) => {
        const config = {
            org_owner: { color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', label: 'Owner' },
            manager_admin: { color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', label: 'Admin' },
            manager: { color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20', label: 'Manager' },
            team_lead: { color: 'text-green-400 bg-green-400/10 border-green-400/20', label: 'Lead' },
            team_member: { color: 'text-slate-400 bg-slate-400/10 border-slate-400/20', label: 'Member' },
        };
        const style = config[role] || config['team_member'];
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.color}`}>{style.label}</span>;
    };



    if (loading) return (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>
    );

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <div className="flex flex-1 w-full sm:w-auto gap-4">
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="input w-full pl-10 bg-slate-900/50 border-slate-700 focus:border-primary-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="input bg-slate-900/50 border-slate-700 min-w-[140px]"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        <option value="team_lead">Team Leads</option>
                        <option value="team_member">Members</option>
                        <option value="manager">Managers</option>
                    </select>
                </div>
                {/* Only show Add User if allowed (Managers/Owners/Admins) - Hide for Members */}
                {user?.role !== 'team_member' && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="btn btn-primary flex items-center gap-2 whitespace-nowrap"
                    >
                        <UserPlus size={18} />
                        Add User
                    </button>
                )}
            </div>

            {/* Users List */}
            <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900/50 text-gray-400 font-medium border-b border-slate-700">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4 hidden md:table-cell">Contact</th>
                            <th className="px-6 py-4">Team</th>
                            {user?.role !== 'team_member' && <th className="px-6 py-4 text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                    No users found matching your filters.
                                </td>
                            </tr>
                        ) : filteredUsers.map((u) => {
                            const userTeam = teams.find(t => t.id === u.teamId);
                            return (
                                <tr key={u.uid} className="group hover:bg-slate-700/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-white font-bold text-sm shadow-inner border border-slate-600">
                                                {getInitials(u.displayName)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-200">{u.displayName || 'Unknown User'}</div>
                                                <div className="text-xs text-gray-500">{u.jobTitle || 'No Job Title'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <FolderRoleBadge role={u.role} />
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell">
                                        <div className="flex flex-col gap-1 text-xs text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <Mail size={12} /> {u.email}
                                            </div>
                                            {u.phoneNumber && (
                                                <div className="flex items-center gap-2">
                                                    <Phone size={12} /> {u.phoneNumber}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {userTeam ? (
                                            <div className="flex items-center gap-2 text-gray-300">
                                                <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                                                {userTeam.name}
                                            </div>
                                        ) : (
                                            <span className="text-gray-600 italic text-xs">Unassigned</span>
                                        )}
                                    </td>
                                    {user?.role !== 'team_member' && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEditModal(u)}
                                                    className="p-2 hover:bg-slate-600 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                    title="Edit User"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                {u.role !== 'org_owner' && (
                                                    <button
                                                        onClick={() => adminDeleteUser(u.uid).then(fetchUsers)}
                                                        className="p-2 hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            < Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)
            } title="Invite New User" >
                <form onSubmit={handleCreateUser} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="label">Display Name</label>
                            <input
                                type="text"
                                className="input w-full"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                required
                                placeholder="Jane Doe"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="label">Email Address</label>
                            <input
                                type="email"
                                className="input w-full"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                placeholder="jane@example.com"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="label">Temporary Password</label>
                            <input
                                type="password"
                                className="input w-full"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label className="label">Job Title</label>
                            <input
                                type="text"
                                className="input w-full"
                                value={formData.jobTitle || ''}
                                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                placeholder="Technician"
                            />
                        </div>
                        <div>
                            <label className="label">Phone Number</label>
                            <input
                                type="text"
                                className="input w-full"
                                value={formData.phoneNumber || ''}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                placeholder="(555) 123-4567"
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-700 pt-4">
                        <label className="label mb-3">Role & Access</label>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { val: 'team_member', label: 'Member', desc: 'Standard access to assigned tasks.' },
                                { val: 'team_lead', label: 'Team Lead', desc: 'Manage claims and view team members.' },
                                { val: 'manager', label: 'Manager', desc: 'Full view of multiple teams and reports.' },
                            ].filter(r => {
                                // Managers can only create members or team leads, not other managers
                                if (isManager) return r.val === 'team_member' || r.val === 'team_lead';
                                return r.val !== 'manager' || canCreateManagers;
                            }).map(opt => (
                                <div key={opt.val}
                                    onClick={() => setFormData({ ...formData, role: opt.val })}
                                    className={`
                                        cursor-pointer p-3 rounded-lg border transition-all flex items-center gap-3
                                        ${formData.role === opt.val
                                            ? 'bg-primary-500/10 border-primary-500/50 ring-1 ring-primary-500'
                                            : 'bg-slate-800 border-slate-700 hover:border-slate-500'}
                                    `}
                                >
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.role === opt.val ? 'border-primary-400' : 'border-slate-600'}`}>
                                        {formData.role === opt.val && <div className="w-2 h-2 rounded-full bg-primary-400" />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm text-gray-200">{opt.label}</div>
                                        <div className="text-xs text-gray-500">{opt.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="label">Assign to Team</label>
                        <select
                            className="input w-full bg-slate-800"
                            value={formData.teamId}
                            onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                            disabled={isManager} // Managers cannot change team from their own
                        >
                            {!isManager && <option value="">No Team (Unassigned)</option>}
                            {teams
                                .filter(t => !isManager || t.id === userTeamId) // Only show own team for manager
                                .map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-ghost">Cancel</button>
                        <button type="submit" className="btn btn-primary">Create User</button>
                    </div>
                </form>
            </Modal >

            {/* Edit Modal - Simplier version of create */}
            < Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)
            } title="Edit User" >
                <form onSubmit={handleEditUser} className="space-y-4">
                    <div className="p-4 bg-slate-900/50 rounded-lg flex items-center gap-4 border border-slate-700">
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-lg font-bold text-gray-400">
                            {getInitials(formData.displayName)}
                        </div>
                        <div>
                            <div className="font-bold text-gray-200">{formData.displayName}</div>
                            <div className="text-sm text-gray-500">{formData.email}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Job Title</label>
                            <input
                                type="text"
                                className="input w-full"
                                value={formData.jobTitle || ''}
                                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="label">Phone Number</label>
                            <input
                                type="text"
                                className="input w-full"
                                value={formData.phoneNumber || ''}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label mb-2">Role Assignment</label>
                        <select
                            className="input w-full"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            disabled={selectedUser?.role === 'org_owner'}
                        >
                            <option value="team_member">Team Member</option>
                            <option value="team_lead">Team Lead</option>
                            <option value="manager">Manager</option>
                            <option value="manager_admin">Admin</option>
                        </select>
                        {selectedUser?.role === 'org_owner' && <p className="text-xs text-yellow-500 mt-1">Owner role cannot be changed</p>}
                    </div>

                    <div>
                        <label className="label">Team</label>
                        <select
                            className="input w-full"
                            value={formData.teamId}
                            onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                        >
                            <option value="">No Team</option>
                            {teams.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-ghost">Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            </Modal >
        </div >
    );
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, Users, Briefcase, TrendingUp, DollarSign, Clock, CheckCircle,
    AlertCircle, Edit2, Trash2, Plus, X, UserMinus, Shield, LayoutDashboard,
    List, Settings as SettingsIcon, FileText, ChevronRight
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { getTeam, deleteTeam, updateTeam, adminUpdateUser, apiCall } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useFirestoreClaims, useFirestoreTeams } from '../hooks/useFirestore';
import Modal from '../components/Modal';
import ClaimStatusBadge from '../components/ClaimStatusBadge';

export default function TeamDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isManager, isAdmin, isOwner } = useAuth();

    // Hooks
    const { claims } = useFirestoreClaims(user);

    // Local State
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview'); // overview, roster, workload, settings

    // Modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

    // Forms
    const [formData, setFormData] = useState({ name: '', specialty: '', description: '' });
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedUserToAdd, setSelectedUserToAdd] = useState('');

    // Derived Data
    const teamClaims = claims.filter(c => String(c.teamId) === String(id));
    const pendingClaims = teamClaims.filter(c => c.status === 'pending_review' || c.status === 'under_review');
    const closedClaims = teamClaims.filter(c => c.status === 'approved' || c.status === 'sent_to_insurance' || c.status === 'rejected');
    const totalRevenue = teamClaims.reduce((sum, c) => sum + (Number(c.totalAmount) || Number(c.amount) || 0), 0);

    const hasManagePermission = (!isManager || isAdmin || isOwner) && user?.role !== 'member';

    const fetchTeam = async () => {
        try {
            setLoading(true);
            const data = await getTeam(id);
            setTeam(data);
            setFormData({
                name: data.name,
                specialty: data.specialty,
                description: data.description || ''
            });
        } catch (err) {
            console.error("Failed to fetch team:", err);
            setError("Failed to load team details.");
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableUsers = async () => {
        try {
            const users = await apiCall('/users', 'GET');
            const currentMemberIds = team?.roster?.map(m => m.uid) || [];
            const available = users.filter(u => !currentMemberIds.includes(u.uid));
            setAvailableUsers(available);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    };

    useEffect(() => {
        if (id) fetchTeam();
    }, [id]);

    useEffect(() => {
        if (isAddMemberModalOpen) fetchAvailableUsers();
    }, [isAddMemberModalOpen, team]);

    // Actions
    const handleUpdateTeam = async (e) => {
        e.preventDefault();
        try {
            await updateTeam(id, formData);
            setTeam({ ...team, ...formData });
            setIsEditModalOpen(false);
        } catch (error) {
            alert("Failed to update team: " + error.message);
        }
    };

    const handleDeleteTeam = async () => {
        if (!window.confirm("Are you sure you want to delete this team? This action cannot be undone.")) return;
        try {
            await deleteTeam(id);
            navigate('/teams');
        } catch (error) {
            alert("Failed to delete team: " + error.message);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!selectedUserToAdd) return;
        try {
            await adminUpdateUser(selectedUserToAdd, { teamId: id });
            setIsAddMemberModalOpen(false);
            fetchTeam();
            setSelectedUserToAdd('');
        } catch (error) {
            alert("Failed to add member: " + error.message);
        }
    };

    const handleRemoveMember = async (uid) => {
        if (!window.confirm("Are you sure you want to remove this user from the team?")) return;
        try {
            await adminUpdateUser(uid, { teamId: null });
            fetchTeam();
        } catch (error) {
            alert("Failed to remove member: " + error.message);
        }
    };

    const handleChangeRole = async (uid, newRole) => {
        try {
            await adminUpdateUser(uid, { role: newRole });
            fetchTeam();
        } catch (error) {
            alert("Failed to change role: " + error.message);
        }
    };

    // Visualization Data
    const statusData = [
        { name: 'Pending', value: teamClaims.filter(c => c.status === 'pending_review' || c.status === 'under_review').length, color: '#eab308' },
        { name: 'Approved', value: teamClaims.filter(c => c.status === 'approved' || c.status === 'sent_to_insurance').length, color: '#22c55e' },
        { name: 'Rejected', value: teamClaims.filter(c => c.status === 'rejected').length, color: '#ef4444' },
    ].filter(i => i.value > 0);

    const memberInitiatedClaims = (team?.roster || []).map(member => ({
        name: member.displayName.split(' ')[0],
        claims: teamClaims.filter(c => c.createdById === member.uid || c.authorId === member.uid).length // Adjust depending on claim schema
    })).filter(i => i.claims >= 0); // Include 0

    const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

    if (loading) return (
        <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
    );

    if (error || !team) return (
        <div className="p-8 text-center">
            <h3 className="text-xl font-bold text-gray-300 mb-2">Error</h3>
            <p className="text-gray-500">{error || "Team not found"}</p>
            <button onClick={() => navigate('/teams')} className="btn btn-ghost mt-4">Back to Teams</button>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Top Navigation / Breadcrumbs */}
            <div className="flex items-center gap-4 text-sm text-gray-400">
                <Link to="/teams" className="hover:text-gray-200 flex items-center gap-1">
                    <ArrowLeft size={14} /> Back to Teams
                </Link>
                <span>/</span>
                <span className="text-gray-200 font-medium">{team.name} Manager</span>
            </div>

            {/* Header Card */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-100">{team.name}</h1>
                            <span className="px-2 py-1 bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs rounded uppercase tracking-wider font-semibold">
                                {team.specialty}
                            </span>
                        </div>
                        <p className="text-gray-400 mt-2 max-w-3xl">{team.description}</p>
                    </div>
                </div>

                {/* KPI Stripes */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-700/50">
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Revenue</p>
                        <p className="text-2xl font-bold text-white mt-1">${totalRevenue.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Active Claims</p>
                        <p className="text-2xl font-bold text-white mt-1">{teamClaims.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Pending Review</p>
                        <p className="text-2xl font-bold text-yellow-400 mt-1">{pendingClaims.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Team Size</p>
                        <p className="text-2xl font-bold text-white mt-1">{team.roster?.length || 0} Member{team.roster?.length !== 1 && 's'}</p>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-slate-700">
                <div className="flex gap-6 overflow-x-auto">
                    {[
                        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                        { id: 'roster', label: 'Roster', icon: Users },
                        { id: 'workload', label: 'Workload', icon: FileText },
                        { id: 'settings', label: 'Settings', icon: SettingsIcon },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-4 px-2 flex items-center gap-2 text-sm font-medium transition-colors relative
                                ${activeTab === tab.id ? 'text-primary-400' : 'text-gray-400 hover:text-gray-200'}
                            `}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Status Distribution Chart */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                                <TrendingUp className="text-primary-400" size={20} />
                                Claims Status Distribution
                            </h3>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%" cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap justify-center gap-4 mt-2">
                                {statusData.map(stat => (
                                    <div key={stat.name} className="flex items-center gap-2 text-xs text-gray-400">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }}></div>
                                        {stat.name}: {stat.value}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Member Performance Estimated */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                                <Users className="text-blue-400" size={20} />
                                Claims per Member
                            </h3>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={memberInitiatedClaims}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="name" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" />
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                                            cursor={{ fill: '#1e293b' }}
                                        />
                                        <Bar dataKey="claims" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* ROSTER TAB */}
                {activeTab === 'roster' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Team Members</h2>
                            {hasManagePermission && (
                                <button
                                    onClick={() => setIsAddMemberModalOpen(true)}
                                    className="btn btn-primary flex items-center gap-2"
                                >
                                    <Plus size={16} /> Add Member
                                </button>
                            )}
                        </div>

                        <div className="bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-800/50 text-xs uppercase text-gray-400 border-b border-slate-700">
                                        <th className="px-6 py-4 font-semibold">User</th>
                                        <th className="px-6 py-4 font-semibold">Role</th>
                                        <th className="px-6 py-4 font-semibold">Job Title</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {(team.roster || []).map((member) => (
                                        <tr key={member.uid} className="hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                                                        {getInitials(member.displayName)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-200">{member.displayName}</p>
                                                        <p className="text-xs text-gray-500">{member.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {hasManagePermission ? (
                                                    <select
                                                        value={member.role}
                                                        onChange={(e) => handleChangeRole(member.uid, e.target.value)}
                                                        className="bg-slate-800 border border-slate-700 text-xs rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-primary-500"
                                                    >
                                                        <option value="member">Member</option>
                                                        <option value="lead">Lead</option>
                                                        <option value="manager">Manager</option>
                                                    </select>
                                                ) : (
                                                    <span className="text-sm text-gray-300 capitalize">{member.role?.replace('_', ' ')}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400">
                                                {member.jobTitle || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {hasManagePermission && (
                                                    <button
                                                        onClick={() => handleRemoveMember(member.uid)}
                                                        className="text-gray-500 hover:text-red-400 transition-colors p-2 rounded hover:bg-slate-800"
                                                        title="Remove from Team"
                                                    >
                                                        <UserMinus size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!team.roster || team.roster.length === 0) && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                                No members found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* WORKLOAD TAB */}
                {activeTab === 'workload' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Active Workload</h2>
                            {/* Future: Add Filters */}
                        </div>

                        <div className="space-y-3">
                            {teamClaims.map((claim) => (
                                <div key={claim.id} className="bg-slate-800/40 border border-slate-700 p-4 rounded-xl hover:border-slate-600 transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${claim.status.includes('approved') ? 'bg-green-500/10 text-green-400' :
                                                claim.status.includes('reject') ? 'bg-red-500/10 text-red-400' :
                                                    'bg-blue-500/10 text-blue-400'
                                            }`}>
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <Link to={`/claims/${claim.id}`} className="font-semibold text-gray-200 hover:text-primary-400 transition-colors">
                                                {claim.title || `Claim #${claim.claimNumber}`}
                                            </Link>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                <span>{new Date(claim.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span>${(Number(claim.totalAmount) || Number(claim.amount) || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <ClaimStatusBadge status={claim.status} />
                                        <Link to={`/claims/${claim.id}`} className="btn btn-sm btn-ghost opacity-0 group-hover:opacity-100 transition-opacity">
                                            View <ChevronRight size={16} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                            {teamClaims.length === 0 && (
                                <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                                    <p className="text-gray-500">No active claims found for this team.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === 'settings' && (
                    <div className="max-w-2xl">
                        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 space-y-6">
                            <h3 className="text-lg font-bold text-white mb-4">Team Settings</h3>

                            <form onSubmit={(e) => {
                                handleUpdateTeam(e);
                                alert("Settings saved."); // Simple feedback
                            }} className="space-y-4">
                                <div>
                                    <label className="label">Team Name</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        disabled={!hasManagePermission}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Specialty</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={formData.specialty}
                                        onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                        disabled={!hasManagePermission}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Description</label>
                                    <textarea
                                        className="input w-full min-h-[100px]"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        disabled={!hasManagePermission}
                                    />
                                </div>
                                {hasManagePermission && (
                                    <div className="flex justify-end pt-4">
                                        <button type="submit" className="btn btn-primary">Save Changes</button>
                                    </div>
                                )}
                            </form>
                        </div>

                        {hasManagePermission && (
                            <div className="mt-8 bg-red-950/20 border border-red-500/20 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-red-500 mb-2">Danger Zone</h3>
                                <p className="text-sm text-gray-400 mb-6">Deleting a team will unassign all members and claims. This action cannot be undone.</p>
                                <button
                                    onClick={handleDeleteTeam}
                                    className="btn bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20"
                                >
                                    <Trash2 size={16} className="mr-2" />
                                    Delete Team
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Member Modal (Reused) */}
            <Modal isOpen={isAddMemberModalOpen} onClose={() => setIsAddMemberModalOpen(false)} title="Add Team Member">
                <form onSubmit={handleAddMember} className="space-y-4">
                    <div>
                        <label className="label">Select User</label>
                        <select
                            className="input w-full"
                            value={selectedUserToAdd}
                            onChange={(e) => setSelectedUserToAdd(e.target.value)}
                            required
                        >
                            <option value="">-- Select a user --</option>
                            {availableUsers.map(u => (
                                <option key={u.uid} value={u.uid}>
                                    {u.displayName} ({u.email})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-2">
                            Only users not currently assigned to this team are shown.
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsAddMemberModalOpen(false)} className="btn btn-ghost">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={!selectedUserToAdd}>Add Member</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

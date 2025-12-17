
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Users, Edit2, Briefcase, TrendingUp } from 'lucide-react';
import { getTeams, createTeam, deleteTeam, updateTeam, apiCall } from '../services/api';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useFirestoreClaims, useFirestoreTeams } from '../hooks/useFirestore';

export default function TeamsPage() {
    const navigate = useNavigate();
    const { user, isManager, userTeamId, isAdmin } = useAuth();

    // Stats Data
    const { teams: visibleTeams, loading: statsLoading } = useFirestoreTeams(user);
    const { claims, loading: claimsLoading } = useFirestoreClaims(user);

    // Management State
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]); // Store all users to derive rosters
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isRosterModalOpen, setIsRosterModalOpen] = useState(false); // New Roster Modal
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        specialty: '',
        description: ''
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [teamsData, usersData] = await Promise.all([
                getTeams(),
                apiCall('/users', 'GET')
            ]);

            console.log('DEBUG: Fetch Data', { teamsData, userTeamId, role: user?.role, isManager });

            // Filter Teams
            // Show only own team if Manager/Member AND NOT Admin/Owner
            const hasFullAccess = user?.role === 'owner' || user?.role === 'admin';

            if (!hasFullAccess && (isManager || user?.role === 'member') && userTeamId) {
                const filtered = teamsData.filter(t => String(t.id) === String(userTeamId));
                console.log('DEBUG: Filtered Teams', { filtered, matchId: userTeamId });
                setTeams(filtered);
            } else {
                console.log('DEBUG: Showing All Teams');
                setTeams(teamsData);
            }

            // Store Users (Client-side scoping for now is fine since we filter display)
            setUsers(usersData);

        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Merge Stats into the fetched teams list for display
    const teamsWithStats = teams.map(team => {
        // Find stats matching this team ID from the firestore hook data
        const teamClaims = claims.filter(c => c.teamId === team.id);
        const pendingClaims = teamClaims.filter(c => c.status === 'pending_review' || c.status === 'under_review').length;
        const completedClaims = teamClaims.filter(c => c.status === 'sent_to_insurance').length;
        const totalAmount = teamClaims.reduce((sum, c) => sum + c.amount, 0);

        // Derive Roster and Lead
        const roster = users.filter(u => u.teamId === team.id);
        const teamLead = roster.find(u => u.role === 'lead' || u.role === 'manager' || u.role === 'admin');

        return {
            ...team,
            totalClaims: teamClaims.length,
            pendingClaims,
            completedClaims,
            totalAmount,
            roster,
            teamLead
        };
    });

    const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';


    const handleCreateTeam = async (e) => {
        e.preventDefault();
        try {
            await createTeam(formData);
            setIsCreateModalOpen(false);
            setFormData({ name: '', specialty: '', description: '' });
            fetchData();
        } catch (error) {
            alert("Failed to create team: " + error.message);
        }
    };

    const handleEditClick = (team) => {
        setSelectedTeam(team);
        setFormData({
            name: team.name,
            specialty: team.specialty,
            description: team.description || ''
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateTeam = async (e) => {
        e.preventDefault();
        try {
            await updateTeam(selectedTeam.id, formData);
            setIsEditModalOpen(false);
            setSelectedTeam(null);
            setFormData({ name: '', specialty: '', description: '' });
            fetchData();
        } catch (error) {
            alert("Failed to update team: " + error.message);
        }
    };

    const handleDeleteTeam = async (teamId) => {
        if (!window.confirm("Are you sure you want to delete this team? Users will be unassigned.")) return;
        try {
            await deleteTeam(teamId);
            fetchTeams();
        } catch (error) {
            alert("Failed to delete team: " + error.message);
        }
    };

    if (loading) return (
        <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-100">Teams</h1>
                    <p className="text-gray-500 mt-1">Manage teams and track performance</p>
                </div>
                {/* Hide Create for Managers who are NOT Admins AND Members */}
                {(!isManager || isAdmin) && user?.role !== 'member' && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Create New Team
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Create Team Card - Shortcut - Hide for Managers (non-admin) AND Members */}
                {(!isManager || isAdmin) && user?.role !== 'member' && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="group border border-dashed border-slate-700 bg-slate-900/30 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-slate-800/50 hover:border-primary-500/50 transition-all cursor-pointer min-h-[220px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-primary-500/20 flex items-center justify-center transition-colors">
                            <Plus size={24} className="text-gray-500 group-hover:text-primary-400" />
                        </div>
                        <span className="font-medium text-gray-400 group-hover:text-primary-400">Add Team</span>
                    </button>
                )}

                {teamsWithStats.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-gray-500 border border-dashed border-slate-700 rounded-xl">
                        <Users size={48} className="mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-gray-300">No Teams Found</h3>
                        <p className="max-w-xs text-center mt-2">
                            {user?.role === 'member' ? "You are not currently assigned to any team." : "No teams available."}
                        </p>
                    </div>
                )}

                {teamsWithStats.map((team) => (
                    <div key={team.id} className="relative group bg-slate-800/40 rounded-xl border border-slate-700 p-6 hover:shadow-xl hover:border-primary-500/30 transition-all flex flex-col">
                        {/* Actions Menu - Hide completely for members */}
                        {user?.role !== 'member' && (
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                    onClick={() => handleEditClick(team)}
                                    className="p-2 hover:bg-slate-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                                    title="Edit Team"
                                >
                                    <Edit2 size={14} />
                                </button>
                                {/* Hide delete for managers who are NOT Admins */}
                                {(!isManager || isAdmin) && (
                                    <button
                                        onClick={() => handleDeleteTeam(team.id)}
                                        className="p-2 hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                                        title="Delete Team"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="mb-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-primary-500/10 rounded-lg">
                                    <Briefcase size={20} className="text-primary-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-100">{team.name}</h3>
                            </div>
                            <p className="text-sm font-medium text-primary-400/80 uppercase tracking-wider">{team.specialty}</p>
                        </div>

                        {team.description && (
                            <p className="text-gray-400 text-sm mb-6 line-clamp-2">{team.description}</p>
                        )}

                        <div className="mt-auto space-y-3 pt-4 border-t border-slate-700/50">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400 flex items-center gap-2"><Users size={14} /> Members</span>
                                <span className="text-gray-200 font-medium">{team.memberCount || 0}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Pending Claims</span>
                                <span className="text-yellow-400 font-medium">{team.pendingClaims || 0}</span>
                            </div>
                            {user?.role !== 'member' && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Revenue</span>
                                    <span className="text-green-400 font-medium">${(team.totalAmount || 0).toLocaleString()}</span>
                                </div>
                            )}

                            {/* Team Lead & Roster Button */}
                            <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold border border-slate-600">
                                        {getInitials(team.teamLead?.displayName || 'Unknown')}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Team Lead</span>
                                        <span className="text-xs text-gray-300 font-medium truncate max-w-[100px]">{team.teamLead?.displayName || 'Unassigned'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/teams/${team.id}`)}
                                    className="text-xs text-primary-400 hover:text-primary-300 hover:underline"
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Team">
                <form onSubmit={handleCreateTeam} className="space-y-4">
                    <div>
                        <label className="label">Team Name</label>
                        <input
                            type="text"
                            className="input w-full"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="e.g. Alpha Squad"
                        />
                    </div>
                    <div>
                        <label className="label">Specialty</label>
                        <input
                            type="text"
                            className="input w-full"
                            value={formData.specialty}
                            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                            required
                            placeholder="e.g. Water Restoration"
                        />
                    </div>
                    <div>
                        <label className="label">Description</label>
                        <textarea
                            className="input w-full min-h-[100px]"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of the team's responsibilities..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-ghost">Cancel</button>
                        <button type="submit" className="btn btn-primary">Create Team</button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Team">
                <form onSubmit={handleUpdateTeam} className="space-y-4">
                    <div>
                        <label className="label">Team Name</label>
                        <input
                            type="text"
                            className="input w-full"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                            required
                        />
                    </div>
                    <div>
                        <label className="label">Description</label>
                        <textarea
                            className="input w-full min-h-[100px]"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-ghost">Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            </Modal>


            {/* Roster Modal */}
            <Modal isOpen={isRosterModalOpen} onClose={() => setIsRosterModalOpen(false)} title={`${selectedTeam?.name} Roster`}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Total Members</span>
                        <span className="badge badge-primary">{selectedTeam?.roster?.length || 0}</span>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2">
                        {selectedTeam?.roster?.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No members assigned to this team.</p>
                        ) : (
                            selectedTeam?.roster?.map(member => (
                                <div key={member.uid} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white font-bold border border-slate-600">
                                            {getInitials(member.displayName)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-200">{member.displayName}</div>
                                            <div className="text-xs text-gray-500">{member.email}</div>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border 
                                        ${(member.role === 'lead' || member.role === 'manager')
                                            ? 'text-green-400 border-green-400/20 bg-green-400/10'
                                            : 'text-slate-400 border-slate-400/20 bg-slate-400/10'}`}>
                                        {(member.role || 'Member').replace('_', ' ')}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-700">
                        <button onClick={() => setIsRosterModalOpen(false)} className="btn btn-ghost">Close</button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}

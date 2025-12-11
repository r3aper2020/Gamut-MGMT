import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Edit2, Briefcase, TrendingUp } from 'lucide-react';
import { getTeams, createTeam, deleteTeam, updateTeam } from '../services/api';
import Modal from './Modal';

export default function TeamManagement() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        specialty: '',
        description: ''
    });

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const data = await getTeams();
            setTeams(data);
        } catch (error) {
            console.error("Failed to fetch teams:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        try {
            await createTeam(formData);
            setIsCreateModalOpen(false);
            setFormData({ name: '', specialty: '', description: '' });
            fetchTeams();
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
            fetchTeams();
        } catch (error) {
            alert("Failed to update team: " + error.message);
        }
    };

    const handleDeleteTeam = async (teamId) => {
        if (!window.confirm("Are you sure you want to delete this team? Users in this team will be unassiged.")) return;
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
                    {/* Header text can go here if distinct from page header, otherwise keep simple */}
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    Create New Team
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Create Team Card - Shortcut */}
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="group border border-dashed border-slate-700 bg-slate-900/30 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-slate-800/50 hover:border-primary-500/50 transition-all cursor-pointer min-h-[200px]"
                >
                    <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-primary-500/20 flex items-center justify-center transition-colors">
                        <Plus size={24} className="text-gray-500 group-hover:text-primary-400" />
                    </div>
                    <span className="font-medium text-gray-400 group-hover:text-primary-400">Add Team</span>
                </button>

                {teams.map((team) => (
                    <div key={team.id} className="relative group bg-slate-800/40 rounded-xl border border-slate-700 p-6 hover:shadow-xl hover:border-primary-500/30 transition-all">
                        {/* Actions Menu */}
                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEditClick(team)}
                                className="p-2 hover:bg-slate-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                                title="Edit Team"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={() => handleDeleteTeam(team.id)}
                                className="p-2 hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                                title="Delete Team"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        <div className="flex flex-col h-full">
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
                                <p className="text-gray-400 text-sm mb-6 line-clamp-2 flex-grow">{team.description}</p>
                            )}

                            <div className="pt-4 mt-auto border-t border-slate-700/50 flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Users size={16} />
                                    <span>{team.memberCount || 0} Members</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500">
                                    {/* Placeholder for future activity metric */}
                                    <TrendingUp size={16} />
                                    <span>Active</span>
                                </div>
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
        </div>
    );
}

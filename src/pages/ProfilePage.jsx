import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, Save, Lock } from 'lucide-react';
import { updateProfile, updatePassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getTeams } from '../services/api';

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [formData, setFormData] = useState({
        displayName: user?.name || '',
        newPassword: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    // Fetch Team Name
    React.useEffect(() => {
        const fetchTeamName = async () => {
            if (user?.teamId) {
                try {
                    const teams = await getTeams();
                    const team = teams.find(t => t.id === user.teamId);
                    if (team) setTeamName(team.name);
                } catch (err) {
                    console.error("Failed to fetch team name", err);
                }
            }
        };
        fetchTeamName();
    }, [user?.teamId]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const firebaseUser = auth.currentUser;
            const updates = [];

            if (formData.displayName !== user.name) {
                updates.push(updateProfile(firebaseUser, { displayName: formData.displayName }));
            }

            if (formData.newPassword) {
                if (formData.newPassword !== formData.confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                updates.push(updatePassword(firebaseUser, formData.newPassword));
            }

            if (updates.length > 0) {
                await Promise.all(updates);
                await refreshUser(); // Reload user context
                setMessage({ type: 'success', text: 'Profile updated successfully' });
                setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
            } else {
                setMessage({ type: 'info', text: 'No changes to save' });
            }

        } catch (error) {
            console.error("Update failed:", error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-100">My Profile</h1>
                <p className="text-gray-500 mt-1">Manage your account settings and preferences</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="card md:col-span-2 space-y-6">
                    <div className="flex items-center gap-4 pb-6 border-b border-slate-700">
                        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-3xl font-bold text-primary-500 shadow-lg">
                            {user?.name?.[0] || <User size={32} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-100">{user?.name}</h2>
                            <div className="flex items-center gap-2 text-gray-500 mt-1">
                                <Shield size={14} />
                                <span className="capitalize">{user?.role?.replace('_', ' ')}</span>
                            </div>
                        </div>
                    </div>

                    {message.text && (
                        <div className={`p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                            message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Full Name</label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        className="input w-full pl-10"
                                        value={formData.displayName}
                                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="label">Email Address</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="email"
                                        className="input w-full pl-10 opacity-50 cursor-not-allowed"
                                        value={user?.email || ''}
                                        disabled
                                        title="Email is managed by administrator"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-700">
                            <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                                <Lock size={18} className="text-primary-400" />
                                Security
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">New Password</label>
                                    <input
                                        type="password"
                                        className="input w-full"
                                        placeholder="Leave blank to keep current"
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="label">Confirm New Password</label>
                                    <input
                                        type="password"
                                        className="input w-full"
                                        placeholder="Confirm new password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary flex items-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <Save size={18} />
                                )}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>

                {/* Team Info Card */}
                <div className="space-y-6">
                    <div className="card bg-slate-800/50 border-slate-700">
                        <h3 className="text-lg font-semibold text-gray-200 mb-4">Account Details</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                                <span className="text-gray-500">User ID</span>
                                <span className="text-gray-300 font-mono text-xs">{user?.uid?.slice(0, 8)}...</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                                <span className="text-gray-500">Organization</span>
                                <span className="text-gray-300">{user?.organizationId || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                                <span className="text-gray-500">Team</span>
                                <span className="text-primary-400 font-medium">{teamName || (user?.teamId ? 'Assigned' : 'Unassigned')}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-500">Joined</span>
                                <span className="text-gray-300">
                                    {new Date(auth.currentUser?.metadata?.creationTime).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

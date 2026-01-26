import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { updateProfile, sendPasswordResetEmail, updateEmail } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import {
    User,
    Mail,
    Building2,
    MapPin,
    Shield,
    Save,
    Check,
    AlertCircle,
    Camera,
    Loader2,
    Briefcase,
    LayoutGrid,
    Lock
} from 'lucide-react';

type Section = 'general' | 'contact' | 'system' | 'security';

export const ProfilePage: React.FC = () => {
    const { profile, signOut } = useAuth();
    const { organization, offices, departments } = useOrganization();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Navigation State
    const [activeSection, setActiveSection] = useState<Section>('general');

    // UI State
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Form State
    const [displayName, setDisplayName] = useState(profile?.displayName || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [email, setEmail] = useState(profile?.email || '');
    const [phone, setPhone] = useState(profile?.phoneNumber || '');
    const [address, setAddress] = useState(profile?.address || '');

    // Helpers
    const getOfficeName = (id?: string) => offices.find(o => o.id === id)?.name || 'N/A';
    const getDeptName = (id?: string) => departments.find(d => d.id === id)?.name || 'N/A';
    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // --- Handlers ---

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !auth.currentUser) return;

        if (file.size > 2 * 1024 * 1024) {
            setErrorMsg('Image size must be less than 2MB');
            return;
        }

        try {
            setUploading(true);
            setErrorMsg('');
            const storageRef = ref(storage, `profile-pictures/${auth.currentUser.uid}`);
            await uploadBytes(storageRef, file);
            const photoURL = await getDownloadURL(storageRef);
            await updateProfile(auth.currentUser, { photoURL });
            await updateDoc(doc(db, 'users', auth.currentUser.uid), { photoURL, updatedAt: new Date() });
            setSuccessMsg('Profile picture updated!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error(err);
            setErrorMsg('Failed to upload image.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleUpdateGeneral = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName });
                await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                    displayName,
                    bio,
                    updatedAt: new Date()
                });
                setSuccessMsg('Profile details updated successfully');
                setTimeout(() => setSuccessMsg(''), 3000);
            }
        } catch (err) {
            console.error(err);
            setErrorMsg('Failed to update details');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateContact = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            if (auth.currentUser) {
                if (email !== profile?.email) {
                    await updateEmail(auth.currentUser, email);
                }
                await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                    email,
                    phoneNumber: phone,
                    address,
                    updatedAt: new Date()
                });
                setSuccessMsg('Contact information updated successfully');
                setTimeout(() => setSuccessMsg(''), 3000);
            }
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/requires-recent-login') {
                setErrorMsg('Please re-login to change email address.');
            } else {
                setErrorMsg('Failed to update contact info');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!profile?.email) return;
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, profile.email);
            setSuccessMsg(`Reset email sent to ${profile.email}`);
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (err) {
            console.error(err);
            setErrorMsg('Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    if (!profile) return null;

    // --- Renderers ---

    const NavItem = ({ section, label, icon: Icon }: { section: Section; label: string; icon: any }) => (
        <button
            onClick={() => setActiveSection(section)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeSection === section
                ? 'bg-accent-electric text-black shadow-lg shadow-accent-electric/20 font-bold'
                : 'text-text-muted hover:bg-white/5 hover:text-white'
                }`}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    return (
        <div className="max-w-7xl mx-auto pb-20">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight">Account Settings</h1>
                <p className="text-text-muted mt-1">Manage your personal information and system preferences.</p>
            </div>

            {/* Notification Toasts */}
            {successMsg && (
                <div className="fixed bottom-6 right-6 z-50 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
                    <Check size={20} /> {successMsg}
                </div>
            )}
            {errorMsg && (
                <div className="fixed bottom-6 right-6 z-50 bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
                    <AlertCircle size={20} /> {errorMsg}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* --- Left Column: Sidebar --- */}
                <div className="space-y-6">
                    {/* Profile Card */}
                    <div className="glass p-6 rounded-3xl flex flex-col items-center text-center border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 w-full h-32 bg-linear-to-b from-white/5 to-transparent pointer-events-none" />

                        <div className="relative group mb-4">
                            <div className="w-24 h-24 rounded-full bg-bg-tertiary ring-4 ring-bg-secondary flex items-center justify-center text-3xl font-bold text-white overflow-hidden shadow-2xl">
                                {profile.photoURL ? (
                                    <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                                ) : (
                                    profile.displayName?.[0] || 'U'
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute bottom-0 right-0 p-2 rounded-full bg-accent-electric text-black shadow-lg hover:brightness-110 transition-all transform hover:scale-105"
                            >
                                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </div>

                        <h2 className="text-xl font-bold text-white mb-1">{profile.displayName}</h2>
                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase font-bold tracking-wider text-text-muted mb-4">
                            {profile.role.replace('_', ' ')}
                        </div>

                        <div className="w-full pt-4 border-t border-white/5 flex flex-col gap-2 text-xs text-text-muted">
                            <div className="flex justify-between">
                                <span>Joined</span>
                                <span className="text-white">{formatDate(profile.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-2">
                        <NavItem section="general" label="General Information" icon={User} />
                        <NavItem section="contact" label="Contact Details" icon={Mail} />
                        <NavItem section="system" label="System Context" icon={LayoutGrid} />
                        <NavItem section="security" label="Security" icon={Lock} />
                    </nav>
                </div>

                {/* --- Right Column: Content --- */}
                <div className="lg:col-span-3 space-y-6">

                    {/* GENERAL SECTION */}
                    {activeSection === 'general' && (
                        <div className="glass p-8 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <User size={20} className="text-accent-electric" /> General Information
                            </h2>
                            <div className="grid grid-cols-1 gap-6 max-w-2xl">
                                <div>
                                    <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-2 block">Display Name</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={e => setDisplayName(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-electric focus:ring-1 focus:ring-accent-electric outline-none"
                                        placeholder="Your full name"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-2 block">Bio</label>
                                    <textarea
                                        value={bio}
                                        onChange={e => setBio(e.target.value)}
                                        rows={4}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-electric focus:ring-1 focus:ring-accent-electric outline-none resize-none"
                                        placeholder="Tell us a bit about yourself..."
                                    />
                                    <p className="text-xs text-text-muted mt-2">Brief description for your team profile.</p>
                                </div>
                                <div className="pt-4">
                                    <button
                                        onClick={handleUpdateGeneral}
                                        disabled={loading}
                                        className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-accent-electric transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CONTACT SECTION */}
                    {activeSection === 'contact' && (
                        <div className="glass p-8 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Mail size={20} className="text-accent-electric" /> Contact Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-2 block">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-electric focus:ring-1 focus:ring-accent-electric outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-2 block">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-electric focus:ring-1 focus:ring-accent-electric outline-none"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-2 block">Location / Address</label>
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={e => setAddress(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-electric focus:ring-1 focus:ring-accent-electric outline-none"
                                        placeholder="City, State"
                                    />
                                </div>
                                <div className="md:col-span-2 pt-4">
                                    <button
                                        onClick={handleUpdateContact}
                                        disabled={loading}
                                        className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-accent-electric transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SYSTEM SECTION */}
                    {activeSection === 'system' && (
                        <div className="glass p-8 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <LayoutGrid size={20} className="text-accent-electric" /> System Context
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-3 mb-3 text-text-muted">
                                        <Building2 size={18} />
                                        <span className="text-xs uppercase font-bold tracking-wider">Organization</span>
                                    </div>
                                    <div className="text-lg font-bold text-white">{organization?.name || 'N/A'}</div>
                                </div>
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-3 mb-3 text-text-muted">
                                        <MapPin size={18} />
                                        <span className="text-xs uppercase font-bold tracking-wider">Office</span>
                                    </div>
                                    <div className="text-lg font-bold text-white">
                                        {profile.officeId ? getOfficeName(profile.officeId) : <span className="text-accent-electric">Global</span>}
                                    </div>
                                </div>
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-3 mb-3 text-text-muted">
                                        <Briefcase size={18} />
                                        <span className="text-xs uppercase font-bold tracking-wider">Department</span>
                                    </div>
                                    <div className="text-lg font-bold text-white">
                                        {profile.departmentId ? getDeptName(profile.departmentId) : <span className="text-accent-electric">Global</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex items-center gap-4 p-4 bg-accent-electric/5 border border-accent-electric/20 rounded-xl text-sm text-text-muted">
                                <Shield size={16} className="text-accent-electric" />
                                <span>
                                    Your Role: <strong className="text-white uppercase">{profile.role.replace('_', ' ')}</strong>.
                                    System access is determined by your role and assigned context.
                                </span>
                            </div>
                        </div>
                    )}

                    {/* SECURITY SECTION */}
                    {activeSection === 'security' && (
                        <div className="glass p-8 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Lock size={20} className="text-red-400" /> Security
                            </h2>
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
                                    <div>
                                        <h3 className="font-bold text-white">Password Reset</h3>
                                        <p className="text-sm text-text-muted mt-1">Receive an email to reset your password.</p>
                                    </div>
                                    <button
                                        onClick={handlePasswordReset}
                                        disabled={loading}
                                        className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all font-medium text-sm"
                                    >
                                        Send Reset Email
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
                                    <div>
                                        <h3 className="font-bold text-white">Sign Out</h3>
                                        <p className="text-sm text-text-muted mt-1">Securely log out of your current session.</p>
                                    </div>
                                    <button
                                        onClick={() => signOut()}
                                        className="px-4 py-2 bg-red-500 text-white border border-red-600 rounded-lg hover:bg-red-600 transition-all font-medium text-sm shadow-red-500/20 shadow-lg"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5 opacity-60">
                                    <div>
                                        <h3 className="font-bold text-white">Two-Factor Authentication</h3>
                                        <p className="text-sm text-text-muted mt-1">Add an extra layer of security to your account.</p>
                                    </div>
                                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-text-muted uppercase">Coming Soon</span>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

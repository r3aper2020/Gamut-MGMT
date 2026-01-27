
import React, { useState, useEffect } from 'react';
import {
    X,
    UserPlus,
    UserCog, // Added for edit mode icon
    Mail,
    Shield,
    Building,
    Briefcase,
    CheckCircle,
    Loader2,
    Copy,
    KeyRound
} from 'lucide-react';
import { collection, updateDoc, setDoc, doc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, firebaseConfig } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { UserRole, UserProfile } from '@/types/team'; // Added UserProfile type

interface ManageUserModalProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: UserProfile; // If present, Edit Mode
}

export const ManageUserModal: React.FC<ManageUserModalProps> = ({ onClose, onSuccess, initialData }) => {
    const { profile } = useAuth();
    const { offices, departments } = useOrganization();

    const isEditMode = !!initialData;

    // Form State
    const [step, setStep] = useState<1 | 2 | 3>(initialData ? 2 : 1); // Skip to step 2 if editing
    const [loading, setLoading] = useState(false);

    // Step 1: Identity
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');

    // Step 2: Role & Scope
    const [role, setRole] = useState<UserRole>('MEMBER');
    const [selectedOfficeId, setSelectedOfficeId] = useState('');
    const [selectedDepartmentId, setSelectedDepartmentId] = useState('');

    // Step 3: Success Data
    const [tempPassword, setTempPassword] = useState('');
    // const [createdUid, setCreatedUid] = useState('');

    // Dynamic Lists (for scope selection)
    const [availableDepartments, setAvailableDepartments] = useState(departments);

    // Initialize Data
    useEffect(() => {
        if (initialData) {
            setDisplayName(initialData.displayName);
            setEmail(initialData.email);
            setRole(initialData.role);
            setSelectedOfficeId(initialData.officeId || '');
            setSelectedDepartmentId(initialData.departmentId || '');
        } else if (profile) {
            // Defaults for ADD mode
            if (profile.role === 'OFFICE_ADMIN' || profile.role === 'DEPT_MANAGER') {
                if (profile.officeId) setSelectedOfficeId(profile.officeId);
            }
            if (profile.role === 'DEPT_MANAGER') {
                if (profile.departmentId) setSelectedDepartmentId(profile.departmentId);
                setRole('MEMBER');
            }
        }
    }, [initialData, profile]);

    // Fetch Departments when Office Changes
    useEffect(() => {
        if (!selectedOfficeId || !profile?.orgId) {
            setAvailableDepartments([]);
            return;
        }

        // If editing and locked to a department, logic might just show current

        const fetchDepts = async () => {
            const q = query(collection(db, 'organizations', profile.orgId, 'departments'), where('officeId', '==', selectedOfficeId));
            const snap = await getDocs(q);
            setAvailableDepartments(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
        };
        fetchDepts();
    }, [selectedOfficeId, profile?.orgId]);

    const generateTempPassword = () => {
        return `Gamut${Math.floor(1000 + Math.random() * 9000)} !`;
    };

    const handleCreateAuthUser = async (pass: string) => {
        // "Secondary App" pattern to create user without logging out admin
        const tempAppName = `tempApp - ${Date.now()} `;
        let tempApp: FirebaseApp | null = null;

        try {
            tempApp = initializeApp(firebaseConfig, tempAppName);
            const tempAuth = getAuth(tempApp);

            // if (import.meta.env.DEV) {
            //     // IMPORTANT: Must point to same emulator if in dev
            //     connectAuthEmulator(tempAuth, "http://localhost:9007");
            // }

            const cred = await createUserWithEmailAndPassword(tempAuth, email, pass);
            await signOut(tempAuth); // Sign out immediately just in case
            return cred.user.uid;

        } catch (error: any) {
            console.error("Auth creation failed:", error);
            if (error.code === 'auth/email-already-in-use') {
                alert("This email is already registered.");
            }
            throw error;
        } finally {
            if (tempApp) await deleteApp(tempApp);
        }
    };

    // Password Mode State
    const [passwordMode, setPasswordMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
    const [manualPassword, setManualPassword] = useState('');

    const handleSubmit = async () => {
        if (!profile?.orgId) return;
        setLoading(true);

        try {
            const commonData = {
                displayName,
                email,
                role,
                officeId: selectedOfficeId || null,
                departmentId: selectedDepartmentId || null,
                updatedAt: serverTimestamp()
            };

            if (isEditMode && initialData) {
                // Update Existing
                await updateDoc(doc(db, 'users', initialData.uid), commonData);
                onSuccess();
                onClose();

            } else {
                // Determine Password
                const pass = passwordMode === 'AUTO' ? generateTempPassword() : manualPassword;
                if (!pass) throw new Error("Password required");

                // Create New User
                const uid = await handleCreateAuthUser(pass); // This throws if email taken

                // Create Firestore Profile with MATCHING UID
                await setDoc(doc(db, 'users', uid), {
                    ...commonData,
                    uid, // redundancy useful for indexing sometimes
                    orgId: profile.orgId,
                    photoURL: '',
                    onboardingCompleted: false,
                    createdAt: serverTimestamp()
                });

                // Success! Show Password.
                setTempPassword(pass);
                // setCreatedUid(uid);
                setStep(3);
                onSuccess(); // Trigger list refresh behind modal
            }

        } catch (error) {
            console.error("Error saving user:", error);
            // Ideally show error toast
        } finally {
            setLoading(false);
        }
    };

    // --- Role Options ---
    const getRoleOptions = () => {
        if (!profile) return ['MEMBER'];

        const myRole = profile.role;
        const roles: UserRole[] = ['OWNER', 'ORG_ADMIN', 'OFFICE_ADMIN', 'DEPT_MANAGER', 'MEMBER'];

        // Define hierarchy indices (0 is highest)
        const hierarchy: Record<UserRole, number> = {
            'OWNER': 0,
            'ORG_ADMIN': 1,
            'OFFICE_ADMIN': 2,
            'DEPT_MANAGER': 3,
            'MEMBER': 4
        };

        const myLevel = hierarchy[myRole];

        // Return only roles that are strictly lower (higher index) than my level
        // Exception: OWNER can assign anything except maybe another OWNER? 
        // Actually, for now let's adhere strictly to "can't make a role at that level or above"
        // which implies strictly > myLevel.

        // However, usually one needs at least one person to be able to create same-level (e.g. Owner creates Owner).
        // If I am OWNER (0), strictly lower is 1..4. So I can't make another Owner. 
        // Let's assume OWNER is special exception, OR just implement the strict rule as requested.
        // User asked "is it done in a way...", implying they WANT that restriction.

        return roles.filter(r => hierarchy[r] > myLevel);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(`Email: ${email} \nPassword: ${tempPassword} `);
        // Could show toast here
    };

    const isFormValid = () => {
        if (!displayName || !email || !selectedOfficeId || !role) return false;
        if (!isEditMode && passwordMode === 'MANUAL' && manualPassword.length < 6) return false;
        return true;
    };


    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-100 p-4">
            <div className="glass w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="p-8 pb-0 flex justify-between items-start">
                    <div>
                        <div className="w-12 h-12 rounded-2xl bg-accent-electric/20 flex items-center justify-center text-accent-electric mb-4">
                            {step === 3 ? <CheckCircle size={24} /> : (isEditMode ? <UserCog size={24} /> : <UserPlus size={24} />)}
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                            {step === 3 ? 'Account Created!' : (isEditMode ? 'Edit Team Member' : 'Add Team Member')}
                        </h2>
                        <p className="text-text-secondary text-sm">
                            {step === 3 ? 'Share these credentials with your team member.' : (isEditMode ? 'Update role and assignments.' : 'Expand your organization capacity.')}
                        </p>
                    </div>
                    {step !== 3 && (
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-white">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">

                    {/* Input Form (Steps 1 & 2 Combined) */}
                    {step !== 3 && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-300">

                            {/* Identity Section */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Full Name</label>
                                    <div className="relative">
                                        <input
                                            value={displayName}
                                            onChange={e => setDisplayName(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-accent-electric focus:ring-1 focus:ring-accent-electric transition-all outline-none"
                                            placeholder="e.g. Sarah Connor"
                                            autoFocus
                                        />
                                        <UserPlus size={18} className="absolute left-3 top-3.5 text-text-muted" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Email Address</label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-accent-electric focus:ring-1 focus:ring-accent-electric transition-all outline-none"
                                            placeholder="sarah@skynet.com"
                                        />
                                        <Mail size={18} className="absolute left-3 top-3.5 text-text-muted" />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/5 my-2"></div>

                            {/* Assignments Section */}
                            <div className="space-y-4">
                                {/* Role Selection */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Role</label>
                                    <div className="relative">
                                        <select
                                            value={role}
                                            onChange={e => setRole(e.target.value as UserRole)}
                                            disabled={profile?.role === 'DEPT_MANAGER'}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-accent-electric focus:ring-1 focus:ring-accent-electric transition-all outline-none appearance-none"
                                        >
                                            {getRoleOptions().map(r => (
                                                <option key={r} value={r} className="bg-bg-tertiary">{r.replace('_', ' ')}</option>
                                            ))}
                                        </select>
                                        <Shield size={18} className="absolute left-3 top-3.5 text-text-muted" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Scope: Office */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Office</label>
                                        <div className="relative">
                                            <select
                                                value={selectedOfficeId}
                                                onChange={e => setSelectedOfficeId(e.target.value)}
                                                disabled={['OFFICE_ADMIN', 'DEPT_MANAGER'].includes(profile?.role || '')}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-accent-electric focus:ring-1 focus:ring-accent-electric transition-all outline-none appearance-none"
                                            >
                                                <option value="" className="bg-bg-tertiary">Select Office...</option>
                                                {offices.map(o => (
                                                    <option key={o.id} value={o.id} className="bg-bg-tertiary">{o.name}</option>
                                                ))}
                                            </select>
                                            <Building size={18} className="absolute left-3 top-3.5 text-text-muted" />
                                        </div>
                                    </div>

                                    {/* Scope: Department */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Department</label>
                                        <div className="relative">
                                            <select
                                                value={selectedDepartmentId}
                                                onChange={e => setSelectedDepartmentId(e.target.value)}
                                                disabled={profile?.role === 'DEPT_MANAGER' || !selectedOfficeId}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-accent-electric focus:ring-1 focus:ring-accent-electric transition-all outline-none appearance-none disabled:opacity-50"
                                            >
                                                <option value="" className="bg-bg-tertiary">Select Department...</option>
                                                {availableDepartments.map(d => (
                                                    <option key={d.id} value={d.id} className="bg-bg-tertiary">{d.name}</option>
                                                ))}
                                            </select>
                                            <Briefcase size={18} className="absolute left-3 top-3.5 text-text-muted" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Password Mode Section (Only New Users) */}
                            {!isEditMode && (
                                <div className="bg-white/5 rounded-xl p-4 space-y-3">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">Login Password</label>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setPasswordMode('AUTO')}
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${passwordMode === 'AUTO' ? 'bg-accent-electric text-black border-accent-electric' : 'bg-transparent border-white/20 text-text-muted hover:border-white/40'}`}
                                        >
                                            Auto-Generate
                                        </button>
                                        <button
                                            onClick={() => setPasswordMode('MANUAL')}
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${passwordMode === 'MANUAL' ? 'bg-accent-electric text-black border-accent-electric' : 'bg-transparent border-white/20 text-text-muted hover:border-white/40'}`}
                                        >
                                            Set Manually
                                        </button>
                                    </div>

                                    {passwordMode === 'MANUAL' && (
                                        <div className="relative animate-in slide-in-from-top-2 duration-200">
                                            <input
                                                type="text" // Visible so they can see what they type for the user
                                                value={manualPassword}
                                                onChange={e => setManualPassword(e.target.value)}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-accent-electric focus:ring-1 focus:ring-accent-electric transition-all outline-none"
                                                placeholder="Enter temporary password..."
                                            />
                                            <KeyRound size={18} className="absolute left-3 top-3.5 text-text-muted" />
                                            {manualPassword.length > 0 && manualPassword.length < 6 && (
                                                <p className="text-red-400 text-xs mt-1 pl-1">Must be at least 6 characters</p>
                                            )}
                                        </div>
                                    )}
                                    {passwordMode === 'AUTO' && (
                                        <p className="text-xs text-text-secondary pl-1">
                                            A secure random password will be generated for you to share.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !isFormValid()}
                                    className={`w-full bg-accent-electric text-black font-bold py-3 rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)] hover:shadow-[0_0_30px_rgba(0,242,255,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : (isEditMode ? 'Save Changes' : 'Create Account')}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-300">

                            <div className="bg-accent-electric/10 border border-accent-electric/20 p-6 rounded-2xl space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Username</label>
                                    <div className="text-white font-mono text-lg">{email}</div>
                                </div>
                                <div className="border-t border-white/10 my-2"></div>
                                <div>
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                        <KeyRound size={14} /> Temporary Password
                                    </label>
                                    <div className="text-accent-electric font-mono text-2xl tracking-wider font-bold">{tempPassword}</div>
                                </div>
                            </div>

                            <div className="text-sm text-text-secondary">
                                Please copy these credentials safely. The password will not be shown again.
                            </div>

                            <button
                                onClick={copyToClipboard}
                                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Copy size={18} /> Copy to Clipboard
                            </button>

                            <button
                                onClick={onClose}
                                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-accent-electric transition-colors flex items-center justify-center gap-2 mt-2"
                            >
                                Done
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};


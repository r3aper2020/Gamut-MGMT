import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'; // Updated import

import type { UserRole } from '@/types/team';


const DemoBtn = ({ label, email, setCreds }: { label: string; email: string; setCreds: (e: string) => void }) => (
    <button
        type="button"
        onClick={() => setCreds(email)}
        className="p-2.5 text-[0.7rem] bg-white/5 border border-white/10 rounded-lg text-text-secondary hover:border-accent-electric hover:text-white transition-all text-center truncate font-medium hover:bg-white/10"
        title={email}
    >
        {label}
    </button>
);

export const LoginPage: React.FC = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [demoTab, setDemoTab] = useState<'single' | 'multi'>('single');
    const navigate = useNavigate();

    const setCreds = (email: string) => {
        setEmail(email);
        setPassword('password123');
    };

    React.useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Fetch user profile to determine redirect
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data() as { role?: string; officeId?: string };
                        if ((userData.role === 'MEMBER' || userData.role === 'DEPT_MANAGER' || userData.role === 'OFFICE_ADMIN') && userData.officeId) {
                            navigate(`/office/${userData.officeId}/dashboard`);
                            return;
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user profile for redirect:", error);
                }

                // Default fallback
                navigate('/');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isRegister) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const { user } = userCredential;

                // For demo purposes, the first user is an OWNER of a new org
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    email: user.email,
                    displayName: name,
                    role: 'OWNER' as UserRole,
                    orgId: `org_${user.uid.slice(0, 5)}`,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });

                // Initialize Org
                await setDoc(doc(db, 'organizations', `org_${user.uid.slice(0, 5)}`), {
                    id: `org_${user.uid.slice(0, 5)}`,
                    name: `${name}'s Restoration`,
                    ownerId: user.uid,
                    createdAt: serverTimestamp(),
                    settings: { theme: 'dark' }
                });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                // Navigation handled by onAuthStateChanged
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex items-center justify-center bg-[radial-gradient(circle_at_center,#1a1a2e_0%,#0a0a0c_100%)] p-6">
            <div className="glass p-10 w-full max-w-md border border-white/10 shadow-2xl">
                <img src="/logo.png" alt="Gamut Logo" className="mx-auto mb-8 h-24 object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                <p className="text-center text-text-secondary mb-10 text-sm font-medium tracking-wide">
                    Restoration Management Reimagined
                </p>

                {error && <div className="text-red-500 mb-4 text-xs font-bold uppercase tracking-wider bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {isRegister && (
                        <div>
                            <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-text-muted">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                autoComplete="name"
                                className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-accent-electric focus:outline-none transition-all placeholder:text-white/20"
                                placeholder="Enter your full name"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-text-muted">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-accent-electric focus:outline-none transition-all placeholder:text-white/20"
                            placeholder="name@company.com"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-text-muted">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete={isRegister ? "new-password" : "current-password"}
                            className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-accent-electric focus:outline-none transition-all placeholder:text-white/20"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-xl bg-linear-to-br from-accent-primary to-accent-secondary text-white font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 mt-4 cursor-pointer"
                    >
                        {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-sm text-text-muted mt-8">
                    {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <span
                        onClick={() => setIsRegister(!isRegister)}
                        className="text-accent-electric cursor-pointer font-bold hover:underline"
                    >
                        {isRegister ? 'Sign In' : 'Create One'}
                    </span>
                </p>

                {!isRegister && (
                    <div className="mt-10 border-t border-white/5 pt-8">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[0.65rem] text-text-muted uppercase tracking-[0.2em] font-bold">
                                Demo Environments
                            </p>
                            <div className="flex bg-white/5 rounded-lg p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setDemoTab('single')}
                                    className={`text-[0.65rem] px-2 py-1 rounded-md font-bold transition-all ${demoTab === 'single' ? 'bg-accent-electric text-black shadow-lg shadow-accent-electric/20' : 'text-text-muted hover:text-white'}`}
                                >
                                    SINGLE
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDemoTab('multi')}
                                    className={`text-[0.65rem] px-2 py-1 rounded-md font-bold transition-all ${demoTab === 'multi' ? 'bg-accent-electric text-black shadow-lg shadow-accent-electric/20' : 'text-text-muted hover:text-white'}`}
                                >
                                    MULTI
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {/* Single Office Demos */}
                            {demoTab === 'single' && (
                                <>
                                    <DemoBtn label="Owner (Oscar)" email="owner@single.com" setCreds={setCreds} />
                                    <DemoBtn label="GM (Gary)" email="gm@single.com" setCreds={setCreds} />
                                    <DemoBtn label="Mgr (Mary Mit)" email="mgr.mit@single.com" setCreds={setCreds} />
                                    <DemoBtn label="Member (Mike)" email="tech.mit@single.com" setCreds={setCreds} />
                                    <DemoBtn label="Mgr (Rick Rec)" email="mgr.rec@single.com" setCreds={setCreds} />
                                    <DemoBtn label="Member (Bob)" email="tech.rec@single.com" setCreds={setCreds} />
                                </>
                            )}

                            {/* Multi Office Demos */}
                            {demoTab === 'multi' && (
                                <>
                                    <DemoBtn label="Global Owner" email="owner@multi.com" setCreds={setCreds} />
                                    <DemoBtn label="GM East" email="gm1@multi.com" setCreds={setCreds} />
                                    <DemoBtn label="GM West" email="gm2@multi.com" setCreds={setCreds} />
                                    <DemoBtn label="Mgr East" email="mgr1@multi.com" setCreds={setCreds} />
                                    <DemoBtn label="Mgr West" email="mgr2@multi.com" setCreds={setCreds} />
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

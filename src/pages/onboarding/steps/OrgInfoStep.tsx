import React, { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, collection, addDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Props {
    onNext: () => void;
}

export const OrgInfoStep: React.FC<Props> = ({ onNext }) => {
    const { user } = useAuth();
    const { organization: org } = useOrganization();
    const [orgName, setOrgName] = useState(org?.name || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return; // Should be authenticated

        setLoading(true);
        setError(null);
        try {
            if (org?.id) {
                // Try Update existing
                const orgRef = doc(db, 'organizations', org.id);
                try {
                    await updateDoc(orgRef, {
                        name: orgName,
                        updatedAt: new Date()
                    });
                } catch (updateError: any) {
                    // If document doesn't exist (e.g. switched DBs), create it instead
                    if (updateError.code === 'not-found' || updateError.message.includes('No document to update')) {
                        // Create new Organization
                        const orgRef = await addDoc(collection(db, 'organizations'), {
                            name: orgName,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            createdBy: user.uid
                        });

                        // Link User to Organization
                        await setDoc(doc(db, 'users', user.uid), {
                            orgId: orgRef.id,
                            role: 'OWNER' // Ensure they are owner
                        }, { merge: true });
                    } else {
                        throw updateError;
                    }
                }
            } else {
                // Create new Organization
                const orgRef = await addDoc(collection(db, 'organizations'), {
                    name: orgName,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    createdBy: user.uid
                });

                // Link User to Organization
                await setDoc(doc(db, 'users', user.uid), {
                    orgId: orgRef.id,
                    role: 'OWNER' // Ensure they are owner
                }, { merge: true });
            }
            onNext();
        } catch (err: any) {
            console.error("Error saving org:", err);
            setError(err.message || "Failed to save organization. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-right duration-500">
            <h2 className="text-3xl font-bold mb-2">Welcome to Gamut</h2>
            <p className="text-gray-400 mb-8">Let's set up your organization profile.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Organization Name</label>
                    <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-accent-electric transition-colors"
                        placeholder="e.g. Acme Solar"
                        required
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-accent-electric hover:bg-accent-electric-hover text-black font-bold py-3 rounded-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Saving...' : 'Continue'}
                </button>
            </form>
        </div>
    );
};

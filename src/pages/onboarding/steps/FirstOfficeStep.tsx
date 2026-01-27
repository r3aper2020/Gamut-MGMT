import React, { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
    onNext: () => void;
}

export const FirstOfficeStep: React.FC<Props> = ({ onNext }) => {
    const { organization: org } = useOrganization();
    const { user } = useAuth();
    const [officeName, setOfficeName] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!org?.id || !user) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'organizations', org.id, 'offices'), {
                name: officeName,
                orgId: org.id,
                city,
                state,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: user.uid
            });
            onNext();
        } catch (error) {
            console.error("Error creating office:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-right duration-500">
            <h2 className="text-3xl font-bold mb-2">Create Your First Office</h2>
            <p className="text-gray-400 mb-8">Where is your primary location?</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Office Name</label>
                    <input
                        type="text"
                        value={officeName}
                        onChange={(e) => setOfficeName(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-accent-electric transition-colors"
                        placeholder="e.g. Headquarters"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">City</label>
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-accent-electric transition-colors"
                            placeholder="e.g. Austin"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">State</label>
                        <input
                            type="text"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-accent-electric transition-colors"
                            placeholder="e.g. TX"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-accent-electric hover:bg-accent-electric-hover text-black font-bold py-3 rounded-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creating...' : 'Continue'}
                </button>
            </form>
        </div>
    );
};

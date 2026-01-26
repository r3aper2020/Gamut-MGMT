
import React, { useState } from 'react';
import { Camera, Phone, User, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Props {
    onNext: () => void;
}

export const PersonalDetailsStep: React.FC<Props> = ({ onNext }) => {
    const { user, profile } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
    const [photoURL] = useState(profile?.photoURL || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            // Update user profile
            await setDoc(doc(db, 'users', user.uid), {
                phoneNumber,
                photoURL, // Ideally this would be an uploaded file URL, keeping it simple for text input or we can skip
                updatedAt: new Date()
            }, { merge: true });
            onNext();
        } catch (error) {
            console.error("Error updating profile:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-right duration-500">
            <h2 className="text-3xl font-bold mb-2">Let's set up your profile</h2>
            <p className="text-gray-400 mb-8">Confirm your details so the team can reach you.</p>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-md">

                {/* Visual Identity Img Placeholder */}
                <div className="flex justify-center mb-8">
                    <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center border-2 border-dashed border-white/20 hover:border-accent-electric transition-colors cursor-pointer group">
                        {photoURL ? (
                            <img src={photoURL} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <Camera className="text-text-muted group-hover:text-accent-electric transition-colors" />
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 uppercase tracking-wide">Display Name</label>
                    <div className="relative opacity-50 cursor-not-allowed" title="Contact admin to change">
                        <input
                            value={profile?.displayName || user?.displayName || ''}
                            disabled
                            className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-3 pl-10 text-white"
                        />
                        <User size={18} className="absolute left-3 top-3.5 text-text-muted" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 uppercase tracking-wide">Phone Number</label>
                    <div className="relative">
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-accent-electric transition-colors"
                            placeholder="(555) 123-4567"
                            required
                        />
                        <Phone size={18} className="absolute left-3 top-3.5 text-text-muted" />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-accent-electric hover:bg-accent-electric-hover text-black font-bold py-3 rounded-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Saving...' : 'Continue'} <CheckCircle size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
};

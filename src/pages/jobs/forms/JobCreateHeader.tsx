import React from 'react';
import { Pencil, ShieldAlert, X } from 'lucide-react';

interface JobCreateHeaderProps {
    isEditMode: boolean;
    onClose: () => void;
}

export const JobCreateHeader: React.FC<JobCreateHeaderProps> = ({ isEditMode, onClose }) => {
    return (
        <header className="flex items-center justify-between p-6 border-b border-white/10 flex-none bg-surface-elevation-1">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-electric/20 flex items-center justify-center text-accent-electric">
                    {isEditMode ? <Pencil size={24} /> : <ShieldAlert size={28} />}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white leading-tight">{isEditMode ? 'Edit Job' : 'Create Job'}</h2>
                    <p className="text-text-secondary text-sm font-medium tracking-wide">{isEditMode ? 'Update Job Details' : 'Enter Job Details'}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} className="text-text-muted hover:text-white" />
            </button>
        </header>
    );
};

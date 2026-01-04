import React from 'react';
import { FileText } from 'lucide-react';

interface JobNotesProps {
    notes: string;
    setNotes: (val: string) => void;
}

export const JobNotes: React.FC<JobNotesProps> = ({ notes, setNotes }) => {
    return (
        <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 text-accent-secondary mb-2">
                <FileText size={18} />
                <h3 className="text-sm font-black uppercase tracking-widest">Additional Notes</h3>
            </div>
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field min-h-[80px] resize-y"
                placeholder="Add any additional internal notes here..."
            />
        </div>
    );
};

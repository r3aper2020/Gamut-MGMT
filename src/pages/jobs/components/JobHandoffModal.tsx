import React from 'react';
import { Send, X, CheckCircle2, ArrowLeft } from 'lucide-react';
import { type Department } from '@/types/org';

interface JobHandoffModalProps {
    onClose: () => void;
    onConfirm: () => void;
    activePhase: any;
    departments: Department[];
    targetDeptId: string;
    setTargetDeptId: (id: string) => void;
    isTransferring: boolean;
}

export const JobHandoffModal: React.FC<JobHandoffModalProps> = ({
    onClose,
    onConfirm,
    activePhase,
    departments,
    targetDeptId,
    setTargetDeptId,
    isTransferring
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Send className="text-green-400" size={20} />
                        Push Job
                    </h2>
                    <button onClick={onClose} className="text-text-muted hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <label className="text-[10px] font-bold text-text-muted uppercase mb-2 block">Current Phase</label>
                        <div className="text-white font-bold">{activePhase?.name}</div>
                        <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                            <CheckCircle2 size={12} /> Will be marked as Completed
                        </div>
                    </div>

                    <div className="flex justify-center text-text-muted">
                        <ArrowLeft size={20} className="-rotate-90" />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-text-muted uppercase mb-2 block">Select Next Department</label>
                        <select
                            value={targetDeptId}
                            onChange={(e) => setTargetDeptId(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-accent-electric outline-none"
                        >
                            <option value="">Choose Department...</option>
                            {departments
                                .filter(d => d.id !== activePhase?.departmentId)
                                .map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))
                            }
                        </select>
                    </div>

                    <p className="text-xs text-text-muted text-center pt-2">
                        Moving to a new department will reset team assignments (Manager will be auto-assigned).
                    </p>

                    <div className="flex gap-3 pt-4 border-t border-white/10">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-lg font-bold text-sm bg-white/5 text-white hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={!targetDeptId || isTransferring}
                            className="flex-1 py-3 rounded-lg font-bold text-sm bg-green-500 text-black hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isTransferring ? 'Pushing...' : 'Confirm Push'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

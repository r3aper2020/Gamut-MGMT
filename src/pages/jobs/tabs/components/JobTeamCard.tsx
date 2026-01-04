import React from 'react';
import { Users } from 'lucide-react';

interface JobTeamCardProps {
    leadTech?: { displayName: string; photoURL?: string };
    supervisor?: { displayName: string; photoURL?: string };
}

export const JobTeamCard: React.FC<JobTeamCardProps> = ({ leadTech, supervisor }) => {
    return (
        <div className="xl:col-span-2 rounded-3xl bg-[#111] border border-white/5 p-6 flex flex-col hover:border-white/10 transition-colors">
            <div className="flex items-center gap-2 text-text-muted mb-6">
                <Users size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest">Assigned Team</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Supervisor */}
                <div className="bg-white/5 p-3 rounded-xl flex items-center gap-3 border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm border border-white/10 overflow-hidden shrink-0">
                        {supervisor?.photoURL ?
                            <img src={supervisor.photoURL} alt="Sup" className="w-full h-full object-cover" /> :
                            (supervisor?.displayName?.[0] || '?')
                        }
                    </div>
                    <div className="overflow-hidden">
                        <div className="text-[10px] font-bold text-text-muted uppercase truncate">Supervisor</div>
                        <div className="text-sm font-bold text-white truncate">{supervisor?.displayName || 'Unassigned'}</div>
                    </div>
                </div>

                {/* Lead Tech */}
                <div className="bg-accent-electric/5 p-3 rounded-xl flex items-center gap-3 border border-accent-electric/10">
                    <div className="w-10 h-10 rounded-full bg-accent-electric text-black flex items-center justify-center font-bold text-sm shadow-lg shadow-accent-electric/20 overflow-hidden shrink-0">
                        {leadTech?.photoURL ?
                            <img src={leadTech.photoURL} alt="Tech" className="w-full h-full object-cover" /> :
                            (leadTech?.displayName?.[0] || '?')
                        }
                    </div>
                    <div className="overflow-hidden">
                        <div className="text-[10px] font-bold text-accent-electric uppercase truncate">Lead Tech</div>
                        <div className="text-sm font-bold text-white truncate">{leadTech?.displayName || 'Unassigned'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

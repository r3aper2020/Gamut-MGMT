import React from 'react';
import { useNavigate } from 'react-router-dom';

import ClaimStatusBadge from './ClaimStatusBadge';
import { User, DollarSign, Clock } from 'lucide-react';

const COLUMNS = [
    { id: 'draft', title: 'Drafts', color: 'border-slate-500/50', statuses: ['draft'] },
    { id: 'needs_review', title: 'Needs Review', color: 'border-yellow-500/50', statuses: ['submitted', 'pending_review', 'under_review'] },
    { id: 'needs_revision', title: 'Needs Revision', color: 'border-orange-500/50', statuses: ['revision_requested'] },
    { id: 'approved', title: 'Approved', color: 'border-green-500/50', statuses: ['approved'] },
    { id: 'sent_to_insurance', title: 'Sent to Carrier', color: 'border-indigo-500/50', statuses: ['sent_to_insurance'] },
    { id: 'rejected', title: 'Rejected', color: 'border-red-500/50', statuses: ['rejected'] }
];

export default function KanbanBoard({ claims }) {
    const navigate = useNavigate();

    const getColumnClaims = (statusList) => {
        return claims.filter(c => statusList.includes(c.status));
    };

    return (
        <div className="flex gap-4 overflow-x-auto w-full h-full pb-4 px-1">
            {COLUMNS.map(column => {
                const columnClaims = getColumnClaims(column.statuses);

                return (
                    <div
                        key={column.id}
                        className={`flex-shrink-0 w-80 bg-slate-900/50 rounded-xl border ${column.color} flex flex-col`}
                    >
                        {/* Column Header */}
                        <div className="p-3 border-b border-slate-700/50 bg-slate-800/30 rounded-t-xl sticky top-0 backdrop-blur-sm z-10">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-200">{column.title}</h3>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-700 text-gray-400">
                                    {columnClaims.length}

                                </span>
                            </div>
                        </div>

                        {/* Column Content */}
                        <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] scrollbar-thin scrollbar-thumb-slate-700">
                            {columnClaims.map(claim => (
                                <div
                                    key={claim.id}
                                    onClick={() => navigate(`/claims/${claim.id}`)}
                                    className="bg-slate-800 p-3 rounded-lg border border-slate-700 shadow-sm hover:shadow-md hover:border-primary-500/50 transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs text-gray-500 font-mono">{claim.claimNumber}</span>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(claim.updatedAt || claim.submittedAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <h4 className="font-medium text-gray-200 text-sm mb-3 line-clamp-2 group-hover:text-primary-400 transition-colors">
                                        {claim.title}
                                    </h4>

                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <DollarSign size={12} className="text-green-500" />
                                            <span className="text-gray-300 font-medium">
                                                {claim.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </span>
                                        </div>
                                        {/* You would need to look up team name from an id usually, 
                                            but if we don't have it easily here we can skip or pass teams prop
                                        */}
                                    </div>
                                </div>
                            ))}

                            {columnClaims.length === 0 && (
                                <div className="text-center py-8 opacity-30">
                                    <div className="w-12 h-12 border-2 border-dashed border-gray-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                                        <span className="text-2xl text-gray-500">+</span>
                                    </div>
                                    <p className="text-xs text-gray-500">No claims</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

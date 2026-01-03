import React, { useState } from 'react';
import { type ClaimData } from '@/types/jobs';
import { FileText, Search, BookOpen } from 'lucide-react';

interface JobScopeTabProps {
    data: ClaimData;
    readOnly?: boolean; // Kept for interface consistency but unused
}

export const JobScopeTab: React.FC<JobScopeTabProps> = ({ data }) => {
    const [lineItemFilter, setLineItemFilter] = useState('');

    const filteredLineItems = data.lineItems.filter(item =>
        item.description.toLowerCase().includes(lineItemFilter.toLowerCase()) ||
        item.category.toLowerCase().includes(lineItemFilter.toLowerCase())
    );

    const totalValue = filteredLineItems.reduce((acc, item) => acc + item.total, 0);
    const standards = data?.aiAnalysis?.referencedStandards || [];

    return (
        <div className="glass rounded-2xl border border-white/5 flex flex-col h-[calc(100vh-300px)] min-h-[500px] animate-in slide-in-from-bottom-4 fade-in duration-500 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 flex items-center justify-between shrink-0 border-b border-white/5">
                <div className="flex items-center gap-2 text-accent-primary">
                    <FileText size={20} />
                    <h3 className="text-sm font-black uppercase tracking-widest">Scope of Work</h3>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-xs font-mono text-text-muted">
                        Total Est: <span className="text-accent-electric font-bold text-sm ml-1">${totalValue.toFixed(2)}</span>
                    </div>
                    <div className="h-6 w-px bg-white/10 mx-2"></div>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Filter items..."
                            value={lineItemFilter}
                            onChange={(e) => setLineItemFilter(e.target.value)}
                            className="bg-black/30 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:border-accent-electric outline-none w-64 transition-all focus:w-72"
                        />
                    </div>
                </div>
            </div>

            {/* Main Split View */}
            <div className="flex-1 flex min-h-0">
                {/* Left: Line Items Table */}
                <div className="flex-1 overflow-hidden relative bg-black/20">
                    <div className="absolute inset-0 overflow-auto custom-scrollbar">
                        <table className="w-full text-sm text-left">
                            <thead className="sticky top-0 bg-[#151515] z-10 shadow-lg shadow-black/50">
                                <tr className="text-text-muted border-b border-white/10">
                                    <th className="py-3 pl-4 font-bold uppercase text-[10px] tracking-wider w-32">Category</th>
                                    <th className="py-3 font-bold uppercase text-[10px] tracking-wider">Description</th>
                                    <th className="py-3 text-right font-bold uppercase text-[10px] tracking-wider w-20">Qty</th>
                                    <th className="py-3 text-right font-bold uppercase text-[10px] tracking-wider w-16">Unit</th>
                                    <th className="py-3 text-right font-bold uppercase text-[10px] tracking-wider w-24">Price</th>
                                    <th className="py-3 pr-4 text-right font-bold uppercase text-[10px] tracking-wider w-24">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredLineItems.map((item) => (
                                    <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="py-2 pl-4 text-text-muted text-xs font-mono">{item.category}</td>
                                        <td className="py-2 font-medium text-white">{item.description}</td>
                                        <td className="py-2 text-right font-mono text-text-secondary">{item.quantity}</td>
                                        <td className="py-2 text-right text-xs text-text-muted">{item.unit}</td>
                                        <td className="py-2 text-right font-mono text-text-secondary">${item.unitPrice.toFixed(2)}</td>
                                        <td className="py-2 pr-4 text-right font-mono font-bold text-accent-electric">${item.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                                {filteredLineItems.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-text-muted italic">
                                            No line items found matching "{lineItemFilter}"
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Applied Standards Sidebar */}
                <div className="w-80 border-l border-white/5 bg-surface-elevation-1 flex flex-col shrink-0">
                    <div className="p-4 border-b border-white/5 flex items-center gap-2 text-accent-primary bg-[#151515]">
                        <BookOpen size={16} />
                        <h3 className="text-xs font-black uppercase tracking-widest">Applied Standards</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                        {standards.length > 0 ? (
                            standards.map((std, idx) => (
                                <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5 group hover:border-accent-electric/30 transition-colors">
                                    <div className="font-bold text-accent-electric text-xs mb-1 font-mono">{std.code}</div>
                                    <div className="text-xs text-text-secondary leading-relaxed">{std.description}</div>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center text-text-muted italic flex flex-col items-center gap-2">
                                <BookOpen size={24} className="opacity-20" />
                                <span className="text-xs">No standards referenced</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

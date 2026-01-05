import React, { useState } from 'react';
import { type ClaimData, type ClaimItem } from '@/types/jobs';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Search, BookOpen, Edit2, Check, X, History } from 'lucide-react';

interface JobScopeTabProps {
    data: ClaimData;
    readOnly?: boolean;
    onUpdate?: (items: ClaimItem[]) => void;
}

const UNITS = ['sf', 'lf', 'ea', 'hr', 'day', 'wk', 'mo', 'bag', 'box', 'roll'];

export const JobScopeTab: React.FC<JobScopeTabProps> = ({ data, readOnly, onUpdate }) => {
    const { profile } = useAuth();
    const [lineItemFilter, setLineItemFilter] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<ClaimItem>>({});
    const [showHistoryId, setShowHistoryId] = useState<string | null>(null);

    // Group items by category
    const groupedItems = React.useMemo(() => {
        const filtered = data.lineItems.filter(item =>
            item.description.toLowerCase().includes(lineItemFilter.toLowerCase()) ||
            item.category.toLowerCase().includes(lineItemFilter.toLowerCase())
        );

        const groups: Record<string, ClaimItem[]> = {};
        filtered.forEach(item => {
            const cat = item.category || 'Uncategorized';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        });
        return groups;
    }, [data.lineItems, lineItemFilter]);

    const totalValue = data.lineItems.reduce((acc, item) => acc + item.total, 0);

    const handleEditStart = (item: ClaimItem) => {
        if (readOnly) return;
        setEditingId(item.id);
        setEditValues({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            description: item.description,
            category: item.category,
            itemCode: item.itemCode,
            unit: item.unit,
            aiRationale: item.aiRationale,
            standardRef: item.standardRef
        });
        setShowHistoryId(null);
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditValues({});
    };

    const handleEditSave = async (originalItem: ClaimItem) => {
        if (!onUpdate || !profile) return;

        const changes: { field: keyof ClaimItem; oldValue: any; newValue: any }[] = [];
        const updates: Partial<ClaimItem> = {};

        // Helper to check and add changes
        const checkChange = (field: keyof ClaimItem, val: any) => {
            if (val !== undefined && val !== originalItem[field]) {
                changes.push({ field, oldValue: originalItem[field], newValue: val });
                updates[field] = val as any;
            }
        };

        checkChange('quantity', editValues.quantity);
        checkChange('unitPrice', editValues.unitPrice);
        checkChange('description', editValues.description);
        checkChange('category', editValues.category);
        checkChange('unit', editValues.unit);
        checkChange('itemCode', editValues.itemCode);
        // We probably don't edit AI rationale/standard manually often, but let's allow it if needed or just display? 
        // User asked to "see" them, maybe editing is rare. Let's include description edits though.

        if (changes.length === 0) {
            handleEditCancel();
            return;
        }

        // Calculate new total
        const newQty = updates.quantity ?? originalItem.quantity;
        const newPrice = updates.unitPrice ?? originalItem.unitPrice;
        updates.total = newQty * newPrice;

        const revision = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            editedBy: {
                uid: profile.uid,
                displayName: profile.displayName || 'Unknown User',
                photoURL: profile.photoURL || null
            },
            changes,
            previousState: {
                ...originalItem, // We can just spread originalItem since we handle nulls in type now? 
                // Wait, previousState needs explicitly handled optional fields if we want to be safe, but Omit types help.
                // Let's being explicit for safety.
                id: originalItem.id,
                description: originalItem.description,
                quantity: originalItem.quantity,
                unit: originalItem.unit,
                unitPrice: originalItem.unitPrice,
                total: originalItem.total,
                category: originalItem.category,
                notes: originalItem.notes || null,
                aiRationale: originalItem.aiRationale || null,
                standardRef: originalItem.standardRef || null
            }
        };

        const updatedItem = {
            ...originalItem,
            ...updates,
            revisions: [revision, ...(originalItem.revisions || [])]
        };

        const newItems = data.lineItems.map(item => item.id === originalItem.id ? updatedItem : item);
        onUpdate(newItems);
        handleEditCancel();
    };

    return (
        <div className="glass rounded-2xl border border-white/5 flex flex-col h-[calc(100vh-300px)] min-h-[500px] animate-in slide-in-from-bottom-4 fade-in duration-500 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 flex items-center justify-between shrink-0 border-b border-white/5 bg-[#151515]">
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

            {/* Main Content - Grouped Grid */}
            <div className="flex-1 overflow-auto custom-scrollbar bg-black/20">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="sticky top-0 bg-[#1A1A1A] z-20 shadow-lg shadow-black/50">
                        <tr className="text-text-muted border-b border-white/10">
                            {/* <th className="py-2 pl-4 w-10"></th> Checkbox? */}
                            <th className="py-2 pl-4 font-bold uppercase text-[10px] tracking-wider w-20 text-text-muted/50">Selector</th>
                            <th className="py-2 pl-2 font-bold uppercase text-[10px] tracking-wider w-[40%]">Description</th>
                            <th className="py-2 text-center font-bold uppercase text-[10px] tracking-wider w-20">Qty</th>
                            <th className="py-2 text-center font-bold uppercase text-[10px] tracking-wider w-16">Unit</th>
                            <th className="py-2 text-right font-bold uppercase text-[10px] tracking-wider w-24">Price</th>
                            <th className="py-2 text-right font-bold uppercase text-[10px] tracking-wider w-24">Total</th>
                            <th className="py-2 pl-4 font-bold uppercase text-[10px] tracking-wider w-[20%] text-accent-primary">AI Rationale & Standards</th>
                            {!readOnly && <th className="py-2 w-16 text-center">Action</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {Object.entries(groupedItems).map(([category, items]) => (
                            <React.Fragment key={category}>
                                {/* Category Header */}
                                <tr className="bg-white/5">
                                    <td colSpan={8} className="py-2 pl-4 font-bold text-accent-electric text-xs uppercase tracking-wider">
                                        {category} <span className="text-text-muted text-[10px] ml-2 font-normal">({items.length} items)</span>
                                    </td>
                                </tr>
                                {/* Items */}
                                {items.map(item => {
                                    const isEditing = editingId === item.id;
                                    const hasRevisions = item.revisions && item.revisions.length > 0;

                                    return (
                                        <React.Fragment key={item.id}>
                                            <tr className={`group hover:bg-white/2 transition-colors border-b border-white/5 ${isEditing ? 'bg-white/5' : ''}`}>

                                                {/* Selector Code */}
                                                <td className="py-2 pl-4 font-mono text-[10px] font-bold text-accent-primary align-top tracking-tight text-opacity-80">
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={editValues.itemCode || ''}
                                                            onChange={e => setEditValues(prev => ({ ...prev, itemCode: e.target.value.toUpperCase() }))}
                                                            className="w-full bg-black/30 text-white rounded p-1 outline-none focus:ring-1 focus:ring-accent-electric border border-white/10 uppercase"
                                                            placeholder="CODE"
                                                        />
                                                    ) : (
                                                        item.itemCode || '-'
                                                    )}
                                                </td>

                                                {/* Description */}
                                                <td className="py-2 pl-2 pr-2 font-medium text-white align-top">
                                                    {isEditing ? (
                                                        <textarea
                                                            value={editValues.description}
                                                            onChange={e => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                                                            className="w-full bg-black/30 text-white rounded p-1 outline-none focus:ring-1 focus:ring-accent-electric border border-white/10 text-xs resize-y min-h-[40px]"
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col gap-1">
                                                            <span>{item.description}</span>
                                                            <div className="flex items-center gap-2">
                                                                {hasRevisions && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setShowHistoryId(showHistoryId === item.id ? null : item.id); }}
                                                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] transition-all ${showHistoryId === item.id ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400' : 'bg-yellow-400/10 border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/20 hover:border-yellow-400 animate-pulse'}`}
                                                                    >
                                                                        <History size={8} />
                                                                        <span className="font-mono">Rev:{item.revisions?.length}</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Qty */}
                                                <td className="py-2 px-1 text-center align-top">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            value={editValues.quantity}
                                                            onChange={e => setEditValues(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
                                                            className="w-16 text-center bg-black/30 text-white rounded px-1 py-1 outline-none focus:ring-1 focus:ring-accent-electric border border-white/10 text-xs"
                                                        />
                                                    ) : (
                                                        <span className="font-mono text-text-secondary">{item.quantity}</span>
                                                    )}
                                                </td>

                                                {/* Unit */}
                                                <td className="py-2 px-1 text-center align-top">
                                                    {isEditing ? (
                                                        <select
                                                            value={editValues.unit}
                                                            onChange={e => setEditValues(prev => ({ ...prev, unit: e.target.value }))}
                                                            className="w-12 bg-black/30 text-white rounded px-0 py-1 outline-none focus:ring-1 focus:ring-accent-electric border border-white/10 text-[10px] text-center appearance-none"
                                                        >
                                                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                                        </select>
                                                    ) : (
                                                        <span className="text-text-muted text-xs">{item.unit}</span>
                                                    )}
                                                </td>

                                                {/* Price */}
                                                <td className="py-2 px-1 text-right align-top">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            value={editValues.unitPrice}
                                                            onChange={e => setEditValues(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) }))}
                                                            className="w-20 text-right bg-black/30 text-white rounded px-1 py-1 outline-none focus:ring-1 focus:ring-accent-electric border border-white/10 text-xs"
                                                        />
                                                    ) : (
                                                        <span className="font-mono text-text-secondary text-xs">${item.unitPrice.toFixed(2)}</span>
                                                    )}
                                                </td>

                                                {/* Total */}
                                                <td className="py-2 pr-4 text-right align-top font-bold text-accent-electric font-mono text-xs">
                                                    ${(isEditing ? ((editValues.quantity || 0) * (editValues.unitPrice || 0)) : item.total).toFixed(2)}
                                                </td>

                                                {/* AI Context */}
                                                <td className="py-2 pl-4 pr-2 align-top text-xs">
                                                    <div className="flex flex-col gap-2">
                                                        {item.aiRationale && (
                                                            <div className="flex items-start gap-1.5 text-text-muted/80">
                                                                <div className="mt-0.5 min-w-[14px]"><BookOpen size={10} className="text-accent-primary" /></div>
                                                                <span className="text-[10px] leading-tight italic">{item.aiRationale}</span>
                                                            </div>
                                                        )}
                                                        {item.standardRef && (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-accent-electric whitespace-nowrap">
                                                                    {item.standardRef}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {!item.aiRationale && !item.standardRef && (
                                                            <span className="text-[10px] text-text-muted/30 italic">-</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                {!readOnly && (
                                                    <td className="py-2 text-center align-top">
                                                        {isEditing ? (
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button onClick={() => handleEditSave(item)} className="p-1 text-green-400 hover:bg-green-400/10 rounded"><Check size={14} /></button>
                                                                <button onClick={handleEditCancel} className="p-1 text-red-400 hover:bg-red-400/10 rounded"><X size={14} /></button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleEditStart(item)}
                                                                className="p-1 text-text-muted hover:text-white transition-colors"
                                                            >
                                                                <Edit2 size={13} />
                                                            </button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>

                                            {/* Revision History Row */}
                                            {showHistoryId === item.id && hasRevisions && (
                                                <tr>
                                                    <td colSpan={8} className="bg-[#0A0A0A] border-b border-white/5 p-0">
                                                        <div className="px-12 py-3 space-y-2 border-l-2 border-accent-electric/30 ml-8 my-2">
                                                            <h4 className="text-[10px] font-bold uppercase text-text-muted">Revision Log</h4>
                                                            {item.revisions?.map((rev, idx) => (
                                                                <div key={rev.id || idx} className="text-xs flex items-center gap-4 text-text-secondary">
                                                                    <div className="w-24 text-[10px] text-text-muted">{new Date(rev.timestamp).toLocaleString()}</div>
                                                                    <div className="font-bold text-white w-24 truncate">{rev.editedBy.displayName}</div>
                                                                    <div className="flex-1 flex gap-2 flex-wrap">
                                                                        {rev.changes.map((change, cIdx) => (
                                                                            <span key={cIdx} className="bg-white/5 px-1.5 py-0.5 rounded text-[10px] font-mono border border-white/5">
                                                                                <span className="text-text-muted">{change.field}:</span>{' '}
                                                                                <span className="line-through text-red-400/70">{String(change.oldValue)}</span>
                                                                                <span className="text-text-muted mx-1">→</span>
                                                                                <span className="text-green-400">{String(change.newValue)}</span>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </React.Fragment>
                        ))}

                        {Object.keys(groupedItems).length === 0 && (
                            <tr>
                                <td colSpan={8} className="py-20 text-center text-text-muted italic">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-3 rounded-full bg-white/5"><Search size={24} opacity={0.5} /></div>
                                        <span>No items found matching "{lineItemFilter}"</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

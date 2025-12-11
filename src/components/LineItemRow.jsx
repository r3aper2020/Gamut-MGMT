import React, { useState } from 'react';
import { Check, X, Pencil, Trash2, Edit2, BookOpen, AlertCircle } from 'lucide-react';

const ExpandableText = ({ text, className = "" }) => {
    const [expanded, setExpanded] = useState(false);
    if (!text) return null;
    const isLong = text.length > 120;

    return (
        <div className={className}>
            <div className={`text-gray-200 font-medium ${expanded ? '' : 'line-clamp-2'}`}>
                {text}
            </div>
            {isLong && (
                <button
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    className="text-xs text-blue-400 hover:text-blue-300 mt-1 focus:outline-none hover:underline"
                >
                    {expanded ? 'Show Less' : 'Show More'}
                </button>
            )}
        </div>
    );
};

const LineItemRow = ({
    item,
    idx,
    editingItemIndex,
    editedItemData,
    setEditedItemData,
    handleEditItem,
    handleDeleteItem,
    handleSaveItem,
    handleCancelEdit,
    setSelectedImage,
    claim,
    groupBy
}) => {
    return (
        <tr className={`
            ${editingItemIndex === idx ? "bg-slate-800/50 border-l-4 border-l-blue-500" : "hover:bg-slate-800/30 group transition-colors border-l-4"} 
            ${item.source === 'AI' ? 'border-l-blue-500/50' : 'border-l-slate-600/50'}
        `}>
            {editingItemIndex === idx ? (
                // --- EDIT MODE ---
                <>
                    {/* Code Column */}
                    <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-2">
                            <input
                                type="text"
                                placeholder="SEL"
                                className="input text-xs w-full px-2 py-1 bg-slate-900 border-slate-700 rounded font-mono font-bold"
                                value={editedItemData.selector || ''}
                                onChange={(e) => setEditedItemData({ ...editedItemData, selector: e.target.value })}
                            />
                            <input
                                type="text"
                                className="input text-[10px] w-full px-2 py-1 bg-slate-900 border-slate-700 rounded text-gray-400"
                                value={editedItemData.category}
                                onChange={(e) => setEditedItemData({ ...editedItemData, category: e.target.value })}
                            />
                        </div>
                    </td>

                    {/* Description Column */}
                    <td className="px-4 py-3 align-top">
                        <textarea
                            className="input text-sm w-full px-3 py-2 min-h-[80px] bg-slate-900 border-slate-700 rounded focus:ring-1 focus:ring-blue-500 outline-none resize-y"
                            value={editedItemData.description}
                            onChange={(e) => setEditedItemData({ ...editedItemData, description: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Reviewer Note..."
                            className="input text-xs w-full px-2 py-1 mt-2 bg-slate-900 border-slate-700 rounded text-purple-300 placeholder-purple-500/50"
                            value={editedItemData.adjusterNotes || ''}
                            onChange={(e) => setEditedItemData({ ...editedItemData, adjusterNotes: e.target.value })}
                        />
                    </td>

                    {/* Qty Column */}
                    <td className="px-4 py-3 align-top text-right">
                        <div className="flex flex-col items-end gap-1">
                            <input
                                type="number"
                                className="input text-sm w-20 px-2 py-1 text-right bg-slate-900 border-slate-700 rounded font-bold"
                                value={editedItemData.quantity}
                                onChange={(e) => setEditedItemData({ ...editedItemData, quantity: e.target.value })}
                            />
                            <input
                                type="text"
                                className="input text-xs w-16 px-1 py-1 text-right bg-slate-900 border-slate-700 rounded text-gray-400"
                                value={editedItemData.unit}
                                onChange={(e) => setEditedItemData({ ...editedItemData, unit: e.target.value })}
                            />
                        </div>
                    </td>

                    {/* Price & Total Columns */}
                    <td className="px-4 py-3 align-top text-right">
                        <input
                            type="number"
                            step="0.01"
                            className="input text-sm w-24 px-2 py-1 text-right bg-slate-900 border-slate-700 rounded"
                            value={editedItemData.unitPrice}
                            onChange={(e) => setEditedItemData({ ...editedItemData, unitPrice: e.target.value })}
                        />
                    </td>
                    <td className="px-4 py-3 align-top text-right font-medium text-gray-200">
                        ${(parseFloat(editedItemData.quantity || 0) * parseFloat(editedItemData.unitPrice || 0)).toFixed(2)}
                    </td>

                    {/* Actions */}
                    <td className="px-2 py-3 align-top text-center">
                        <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleSaveItem(idx)} className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30">
                                <Check size={14} />
                            </button>
                            <button onClick={handleCancelEdit} className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30">
                                <X size={14} />
                            </button>
                        </div>
                    </td>
                </>
            ) : (
                // --- VIEW MODE ---
                <>
                    {/* Code Column */}
                    <td className="px-4 py-3 align-top">
                        <div className="font-mono font-bold text-gray-200 text-sm">{item.selector}</div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-0.5">{item.category}</div>
                        {item.activity && (
                            <div className="text-[10px] font-mono text-gray-400 mt-1 bg-slate-800 inline-block px-1 rounded">
                                Act: <span className="text-gray-300">{item.activity}</span>
                            </div>
                        )}
                    </td>

                    {/* Description Column (Content + Evidence) */}
                    <td className="px-4 py-3 align-top">
                        <div className="text-sm text-gray-300 leading-relaxed">
                            <ExpandableText text={item.description} />
                        </div>

                        {/* Metadata Row (Room, AI Reasoning) */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            {item.room && groupBy !== 'room' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-300 border border-slate-600">
                                    {item.room}
                                </span>
                            )}
                            {item.aiReasoning && (
                                <span className="text-[10px] text-blue-300/80 flex items-center gap-1" title={item.aiReasoning}>
                                    <span>✨ AI Insight</span>
                                </span>
                            )}
                        </div>

                        {/* Evidence Thumbnails Row */}
                        {item.linkedPhotoIds?.length > 0 && (
                            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
                                {item.linkedPhotoIds.map(photoId => {
                                    const photo = claim.attachments.find(a => (a.id || a) === photoId || a.id === photoId);
                                    const url = typeof photo === 'string' ? photo : photo?.url;
                                    if (!url) return null;
                                    return (
                                        <div
                                            key={photoId}
                                            className="relative w-12 h-12 shrink-0 rounded border border-slate-700 courser-pointer hover:border-blue-500 transition-colors cursor-pointer"
                                            onClick={() => setSelectedImage(photo)}
                                        >
                                            <img src={url} alt="" className="w-full h-full object-cover rounded-[3px]" />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </td>

                    {/* Qty Column */}
                    <td className="px-4 py-3 align-top text-right">
                        <div className="font-bold text-gray-200">{item.quantity}</div>
                        <div className="text-xs text-gray-500">{item.unit}</div>
                    </td>

                    {/* Price Column */}
                    <td className="px-4 py-3 align-top text-right text-gray-300">
                        ${item.unitPrice.toFixed(2)}
                    </td>

                    {/* Total Column */}
                    <td className="px-4 py-3 align-top text-right font-medium text-gray-100">
                        ${item.total.toFixed(2)}
                    </td>

                    {/* Actions */}
                    <td className="px-2 py-3 align-top text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditItem(idx)} className="p-1.5 hover:bg-slate-700 text-gray-400 hover:text-white rounded">
                                <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDeleteItem(idx)} className="p-1.5 hover:bg-slate-700 text-red-400 hover:text-red-300 rounded">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </td>
                </>
            )}
        </tr>
    );
};

export default LineItemRow;

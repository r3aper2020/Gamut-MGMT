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
        <tr className={editingItemIndex === idx ? "bg-slate-800/50" : "hover:bg-slate-800/30 group transition-colors"}>
            {editingItemIndex === idx ? (
                // EDIT MODE
                <>
                    <td className="px-2 py-3 align-top">
                        <input
                            type="text"
                            className="input text-xs w-full px-2 py-1 min-w-[100px] bg-slate-900 border-slate-700 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                            value={editedItemData.category}
                            onChange={(e) => setEditedItemData({ ...editedItemData, category: e.target.value })}
                        />
                    </td>
                    <td className="px-2 py-3 align-top">
                        <input
                            type="text"
                            className="input text-xs w-full px-2 py-1 mb-2 bg-slate-900 border-slate-700 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                            value={editedItemData.description}
                            onChange={(e) => setEditedItemData({ ...editedItemData, description: e.target.value })}
                        />
                        <textarea
                            className="input text-xs w-full px-2 py-1 min-h-[60px] bg-slate-900 border-slate-700 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                            placeholder="Add Adjuster Notes..."
                            value={editedItemData.adjusterNotes || ''}
                            onChange={(e) => setEditedItemData({ ...editedItemData, adjusterNotes: e.target.value })}
                        />
                        {/* Room Editor */}
                        <select
                            className="input text-xs w-full px-2 py-1 mt-2 bg-slate-900 border-slate-700 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                            value={editedItemData.room || ''}
                            onChange={(e) => setEditedItemData({ ...editedItemData, room: e.target.value })}
                        >
                            <option value="">Select Room...</option>
                            <option value="Kitchen">Kitchen</option>
                            <option value="Living Room">Living Room</option>
                            <option value="Master Bedroom">Master Bedroom</option>
                            <option value="Guest Bedroom">Guest Bedroom</option>
                            <option value="Bathroom">Bathroom</option>
                            <option value="Exterior">Exterior</option>
                            <option value="General">General</option>
                        </select>
                    </td>
                    <td className="px-2 py-3 align-top text-gray-500 text-xs italic whitespace-nowrap">
                        (Fixed)
                    </td>
                    <td className="px-2 py-3 align-top text-right">
                        <div className="flex flex-col gap-1 items-end">
                            <input
                                type="number"
                                className="input text-xs w-20 px-1 py-1 text-right bg-slate-900 border-slate-700 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                value={editedItemData.quantity}
                                onChange={(e) => setEditedItemData({ ...editedItemData, quantity: e.target.value })}
                            />
                            <input
                                type="text"
                                className="input text-xs w-20 px-1 py-1 text-right bg-slate-900 border-slate-700 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                placeholder="Unit"
                                value={editedItemData.unit}
                                onChange={(e) => setEditedItemData({ ...editedItemData, unit: e.target.value })}
                            />
                        </div>
                    </td>
                    <td className="px-2 py-3 align-top text-right">
                        <input
                            type="number"
                            step="0.01"
                            className="input text-xs w-24 px-2 py-1 text-right ml-auto bg-slate-900 border-slate-700 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                            value={editedItemData.unitPrice}
                            onChange={(e) => setEditedItemData({ ...editedItemData, unitPrice: e.target.value })}
                        />
                    </td>
                    <td className="px-4 py-3 align-top text-right font-medium text-gray-200 whitespace-nowrap">
                        ${(parseFloat(editedItemData.quantity || 0) * parseFloat(editedItemData.unitPrice || 0)).toFixed(2)}
                    </td>
                    <td className="px-2 py-3 align-top text-center">
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => handleSaveItem(idx)}
                                className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                                title="Save"
                            >
                                <Check size={14} />
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                                title="Cancel"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </td>
                </>
            ) : (
                // VIEW MODE
                <>
                    <td className="px-4 py-3 text-gray-400 align-top">{item.category}</td>
                    <td className="px-4 py-3 align-top break-words">
                        <ExpandableText text={item.description} />

                        {/* Room Tag - Hide in Room View to reduce clutter, Show in Standard View */}
                        {item.room && groupBy !== 'room' && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600">
                                {item.room}
                            </span>
                        )}

                        {/* AI Reasoning */}
                        {item.aiReasoning && (
                            <div className="text-xs text-blue-300 mt-1.5 flex items-start gap-1.5 bg-blue-500/5 p-1.5 rounded">
                                <div className="mt-0.5">✨</div>
                                <span>{item.aiReasoning}</span>
                            </div>
                        )}

                        {/* Reference Standard */}
                        {item.referenceSource && (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-700/50 border border-slate-600">
                                <BookOpen size={12} className="text-slate-400" />
                                <span className="text-xs text-slate-300 font-medium">{item.referenceSource.code}</span>
                                <span className="text-xs text-slate-500 border-l border-slate-600 pl-1.5">{item.referenceSource.description}</span>
                            </div>
                        )}

                        {/* Clarification Note */}
                        {item.userFullfilled && item.clarificationNote && (
                            <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-400 bg-amber-400/10 p-2 rounded border border-amber-400/20">
                                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-semibold block">User Verified:</span>
                                    {item.clarificationNote}
                                </div>
                            </div>
                        )}

                        {/* Adjuster Notes */}
                        {item.adjusterNotes && (
                            <div className="mt-2 flex items-start gap-1.5 text-xs text-purple-300 bg-purple-500/10 p-2 rounded border border-purple-500/20">
                                <Edit2 size={12} className="shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-semibold block text-purple-400">Reviewer Note:</span>
                                    {item.adjusterNotes}
                                </div>
                            </div>
                        )}
                    </td>
                    <td className="px-4 py-3 align-top">
                        {/* Linked Photos */}
                        {item.linkedPhotoIds?.length > 0 && (
                            <div className="flex -space-x-2 overflow-hidden items-center p-1">
                                {item.linkedPhotoIds.slice(0, 3).map(photoId => {
                                    const photo = claim.attachments.find(a => (a.id || a) === photoId || a.id === photoId);
                                    const url = typeof photo === 'string' ? photo : photo?.url;
                                    if (!url) return null;

                                    return (
                                        <div
                                            key={photoId}
                                            className="relative w-10 h-10 rounded-lg border-2 border-slate-900 cursor-pointer hover:scale-110 transition-transform z-10 hover:z-20 shadow-sm"
                                            onClick={() => setSelectedImage(photo)}
                                            title="View Evidence Match"
                                        >
                                            <img src={url} alt="Evidence" className="w-full h-full object-cover rounded-md" />
                                        </div>
                                    );
                                })}
                                {item.linkedPhotoIds.length > 3 && (
                                    <div
                                        className="relative w-10 h-10 rounded-lg border-2 border-slate-900 bg-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-600 transition-colors z-30"
                                        onClick={() => {
                                            const photo = claim.attachments.find(a => (a.id || a) === item.linkedPhotoIds[3] || a.id === item.linkedPhotoIds[3]);
                                            setSelectedImage(photo);
                                        }}
                                        title="View all photos"
                                    >
                                        <span className="text-xs font-bold text-white">+{item.linkedPhotoIds.length - 3}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </td>
                    <td className="px-2 py-3 text-right text-gray-300 align-top">
                        {item.quantity} {item.unit}
                    </td>
                    <td className="px-2 py-3 text-right text-gray-300 align-top">
                        ${item.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-2 py-3 text-right font-medium text-gray-200 align-top">
                        ${item.total.toFixed(2)}
                    </td>
                    <td className="px-2 py-3 text-center align-top">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEditItem(idx)}
                                className="p-1.5 hover:bg-slate-700 text-gray-400 hover:text-white rounded transition-colors"
                                title="Edit Item"
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                onClick={() => handleDeleteItem(idx)}
                                className="p-1.5 hover:bg-slate-700 text-red-400 hover:text-red-300 rounded transition-colors"
                                title="Delete Item"
                            >
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

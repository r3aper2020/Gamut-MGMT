import React from 'react';
import { FileText, Pencil, Save, Trash2 } from 'lucide-react';
import { type ClaimData } from '@/types/jobs';

interface PhotoDetailSidebarProps {
    image: ClaimData['preScan']['images'][0];
    readOnly?: boolean;
}

export const PhotoDetailSidebar: React.FC<PhotoDetailSidebarProps> = ({ image, readOnly }) => {
    return (
        <aside className="w-80 border-l border-white/10 bg-black/20 flex flex-col animate-in slide-in-from-right-10 overflow-y-auto shrink-0">
            <div className="p-6 border-b border-white/5">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <FileText size={16} className="text-accent-electric" />
                    Photo Details
                </h3>
            </div>
            <div className="p-6 space-y-6">
                {/* Info Block */}
                <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                        <div>
                            <label className="text-[10px] font-bold text-text-muted uppercase block">Category</label>
                            <div className="text-white text-sm font-medium">{image.category || 'Unassigned'}</div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-text-muted uppercase block">Room</label>
                            <div className="text-white text-sm font-medium">{image.room || 'Unassigned'}</div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-text-muted uppercase block">Timestamp</label>
                            <div className="text-white text-sm font-mono">
                                {new Date(image.timestamp).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editor */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase flex items-center gap-2">
                        <Pencil size={12} />
                        Notes / Caption
                    </label>
                    <textarea
                        className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-accent-electric focus:ring-1 outline-none resize-none leading-relaxed disabled:opacity-50"
                        defaultValue={image.caption}
                        placeholder={readOnly ? "No notes available." : "Enter photo notes..."}
                        disabled={readOnly}
                    />
                </div>

                {/* Actions */}
                {!readOnly && (
                    <div className="pt-4 space-y-3">
                        <button className="w-full py-2.5 bg-accent-electric text-black font-bold rounded-lg text-sm hover:bg-white transition-colors flex items-center justify-center gap-2">
                            <Save size={14} /> Update Notes
                        </button>
                        <button className="w-full py-2.5 bg-white/5 text-white font-bold rounded-lg text-sm hover:bg-red-500/20 hover:text-red-500 transition-colors flex items-center justify-center gap-2">
                            <Trash2 size={14} /> Delete Photo
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
};

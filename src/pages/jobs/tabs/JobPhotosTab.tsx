import React, { useState, useMemo } from 'react';
import { type ClaimData } from '@/types/jobs';
import { Camera, Filter, Grid, ChevronLeft, ChevronRight, FileText, Pencil, Save, Trash2 } from 'lucide-react';

interface JobPhotosTabProps {
    data: ClaimData;
    readOnly?: boolean;
}

export const JobPhotosTab: React.FC<JobPhotosTabProps> = ({ data, readOnly }) => {
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [activeRoomFilter, setActiveRoomFilter] = useState<string>('All');

    // Derived State
    const uniqueRooms = useMemo(() => {
        const rooms = new Set(data.preScan.images.map(img => img.room || 'Uncategorized'));
        return ['All', ...Array.from(rooms)];
    }, [data.preScan.images]);

    const filteredImages = useMemo(() => {
        if (activeRoomFilter === 'All') return data.preScan.images;
        return data.preScan.images.filter(img => (img.room || 'Uncategorized') === activeRoomFilter);
    }, [data.preScan.images, activeRoomFilter]);

    // Helper to get global index
    const getGlobalIndex = (filteredIdx: number) => {
        const img = filteredImages[filteredIdx];
        return data.preScan.images.indexOf(img);
    };

    return (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden flex flex-col h-[calc(100vh-300px)] min-h-[600px] animate-in slide-in-from-bottom-4 fade-in duration-500">

            {/* Header / Toolbar */}
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-white/5 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-white font-bold">
                        <Camera size={18} className="text-accent-electric" />
                        <h2>Photo Gallery</h2>
                    </div>
                    <div className="h-4 w-px bg-white/10"></div>
                    <div className="text-xs text-text-muted flex items-center gap-2">
                        <span>{data.preScan.images.length} Total</span>
                        <span>•</span>
                        <span>{activeRoomFilter === 'All' ? 'All Rooms' : activeRoomFilter}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSelectedImageIndex(null)}
                        className={`p-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors ${selectedImageIndex === null ? 'bg-accent-electric text-black' : 'bg-white/5 text-text-muted hover:text-white'}`}
                    >
                        <Grid size={14} /> Grid
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">

                {/* LEFT: Room Filter Sidebar */}
                <aside className="w-56 border-r border-white/10 bg-black/20 overflow-y-auto custom-scrollbar flex flex-col shrink-0">
                    <div className="p-4">
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-2 mb-3">
                            <Filter size={10} />
                            Filter By Room
                        </label>
                        <div className="space-y-1">
                            {uniqueRooms.map(room => {
                                const count = room === 'All'
                                    ? data.preScan.images.length
                                    : data.preScan.images.filter(img => (img.room || 'Uncategorized') === room).length;

                                return (
                                    <button
                                        key={room}
                                        onClick={() => {
                                            setActiveRoomFilter(room);
                                            setSelectedImageIndex(null);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${activeRoomFilter === room
                                            ? 'bg-white/10 text-white font-bold border border-white/5'
                                            : 'text-text-secondary hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <span className="truncate">{room}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeRoomFilter === room ? 'bg-accent-electric text-black' : 'bg-black/40 text-text-muted'}`}>{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                {/* CENTER: Grid or Detail View */}
                <main className="flex-1 bg-black/10 relative flex flex-col min-w-0">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        {filteredImages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
                                <Camera size={48} className="mb-4 text-white/10" />
                                <p>No photos in this category.</p>
                            </div>
                        ) : selectedImageIndex === null ? (
                            /* GRID VIEW */
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
                                {filteredImages.map((img, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedImageIndex(getGlobalIndex(idx))}
                                        className="group relative aspect-video bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/5 hover:border-accent-electric cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:-translate-y-1"
                                    >
                                        <img src={img.url} alt={`Thumb ${idx}`} loading="lazy" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                            <span className="text-[10px] font-bold text-accent-electric uppercase mb-0.5">{img.room}</span>
                                            <p className="text-xs text-white line-clamp-1 font-medium">{img.caption || 'No caption'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* DETAIL VIEW */
                            <div className="h-full flex items-center justify-center relative">
                                <img
                                    src={data.preScan.images[selectedImageIndex].url}
                                    alt="Full View"
                                    className="max-h-full max-w-full object-contain shadow-2xl rounded-lg"
                                />

                                {/* Nav Arrows */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const currentFilteredIdx = filteredImages.indexOf(data.preScan.images[selectedImageIndex]);
                                        const prevIdx = currentFilteredIdx > 0 ? currentFilteredIdx - 1 : filteredImages.length - 1;
                                        setSelectedImageIndex(getGlobalIndex(prevIdx));
                                    }}
                                    className="absolute left-0 p-4 hover:bg-black/20 text-white/50 hover:text-accent-electric transition-colors h-full flex items-center"
                                >
                                    <ChevronLeft size={32} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const currentFilteredIdx = filteredImages.indexOf(data.preScan.images[selectedImageIndex]);
                                        const nextIdx = currentFilteredIdx < filteredImages.length - 1 ? currentFilteredIdx + 1 : 0;
                                        setSelectedImageIndex(getGlobalIndex(nextIdx));
                                    }}
                                    className="absolute right-0 p-4 hover:bg-black/20 text-white/50 hover:text-accent-electric transition-colors h-full flex items-center"
                                >
                                    <ChevronRight size={32} />
                                </button>
                            </div>
                        )}
                    </div>
                </main>

                {/* RIGHT: Sidebar (Only when image selected) */}
                {selectedImageIndex !== null && (
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
                                        <label className="text-[10px] font-bold text-text-muted uppercase block">Room</label>
                                        <div className="text-white text-sm font-medium">{data.preScan.images[selectedImageIndex].room || 'Unassigned'}</div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-text-muted uppercase block">Timestamp</label>
                                        <div className="text-white text-sm font-mono">
                                            {new Date(data.preScan.images[selectedImageIndex].timestamp).toLocaleString()}
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
                                    defaultValue={data.preScan.images[selectedImageIndex].caption}
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
                )}
            </div>
        </div>
    );
};

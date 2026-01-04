import React, { useState, useMemo } from 'react';
import { type ClaimData } from '@/types/jobs';
import { Camera, Filter, Grid } from 'lucide-react';

// Sub-components
import { PhotoGrid } from './components/PhotoGrid';
import { PhotoDetailView } from './components/PhotoDetailView';
import { PhotoDetailSidebar } from './components/PhotoDetailSidebar';

interface JobPhotosTabProps {
    data: ClaimData;
    readOnly?: boolean;
}

export const JobPhotosTab: React.FC<JobPhotosTabProps> = ({ data, readOnly }) => {
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [activeRoomFilter, setActiveRoomFilter] = useState<string>('All');
    const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');

    // Derived State: Unique Rooms (Restored)
    const uniqueRooms = useMemo(() => {
        if (!data.preScan?.images) return ['All'];
        const rooms = new Set(data.preScan.images.map(img => img.room || 'Uncategorized'));
        return ['All', ...Array.from(rooms)];
    }, [data.preScan.images]);

    // Derived State: Unique Categories (For Top Filter)
    const uniqueCategories = useMemo(() => {
        if (!data.preScan?.images) return ['All'];
        const cats = new Set(data.preScan.images.map(img => img.category || 'Uncategorized'));
        const defaultOrder = ['Inspection/Pre-Demo', 'Demo/In-Progress', 'Post Demo/Completion', 'Inspection/Pre-Recon', 'Completion/Post-Recon', 'Uncategorized'];
        return ['All', ...Array.from(cats).sort((a, b) => defaultOrder.indexOf(a) - defaultOrder.indexOf(b))];
    }, [data.preScan.images]);

    const filteredImages = useMemo(() => {
        if (!data.preScan?.images) return [];
        return data.preScan.images.filter(img => {
            const roomMatch = activeRoomFilter === 'All' || (img.room || 'Uncategorized') === activeRoomFilter;
            const catMatch = activeCategoryFilter === 'All' || (img.category || 'Uncategorized') === activeCategoryFilter;
            return roomMatch && catMatch;
        });
    }, [data.preScan.images, activeRoomFilter, activeCategoryFilter]);

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
                        <span>{data.preScan?.images?.length || 0} Total</span>
                        <span>•</span>
                        <span>{activeRoomFilter === 'All' ? 'All Photos' : activeRoomFilter}</span>
                    </div>
                    <div className="text-xs text-text-muted flex items-center gap-2">
                        <span>{filteredImages.length} Shown</span>
                        <span>•</span>
                        <span>{data.preScan?.images?.length || 0} Total</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* STAGE FILTER DROPDOWN */}
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-text-muted uppercase hidden md:block">Stage:</label>
                        <select
                            value={activeCategoryFilter}
                            onChange={(e) => setActiveCategoryFilter(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-accent-electric outline-none"
                        >
                            {uniqueCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="h-4 w-px bg-white/10"></div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedImageIndex(null)}
                            className={`p-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors ${selectedImageIndex === null ? 'bg-accent-electric text-black' : 'bg-white/5 text-text-muted hover:text-white'}`}
                        >
                            <Grid size={14} /> Grid
                        </button>
                    </div>
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
                                // Count based on CURRENT category filter
                                const count = data.preScan?.images?.filter(img => {
                                    const rMatch = room === 'All' || (img.room || 'Uncategorized') === room;
                                    const cMatch = activeCategoryFilter === 'All' || (img.category || 'Uncategorized') === activeCategoryFilter;
                                    return rMatch && cMatch;
                                }).length || 0;

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
                            <PhotoGrid
                                images={filteredImages}
                                onImageSelect={(idx) => setSelectedImageIndex(getGlobalIndex(idx))}
                            />
                        ) : (
                            /* DETAIL VIEW */
                            <PhotoDetailView
                                image={data.preScan.images[selectedImageIndex]}
                                onNext={() => {
                                    const currentFilteredIdx = filteredImages.indexOf(data.preScan.images[selectedImageIndex]);
                                    const nextIdx = currentFilteredIdx < filteredImages.length - 1 ? currentFilteredIdx + 1 : 0;
                                    setSelectedImageIndex(getGlobalIndex(nextIdx));
                                }}
                                onPrev={() => {
                                    const currentFilteredIdx = filteredImages.indexOf(data.preScan.images[selectedImageIndex]);
                                    const prevIdx = currentFilteredIdx > 0 ? currentFilteredIdx - 1 : filteredImages.length - 1;
                                    setSelectedImageIndex(getGlobalIndex(prevIdx));
                                }}
                            />
                        )}
                    </div>
                </main>

                {/* RIGHT: Sidebar (Only when image selected) */}
                {selectedImageIndex !== null && (
                    <PhotoDetailSidebar
                        image={data.preScan.images[selectedImageIndex]}
                        readOnly={readOnly}
                    />
                )}
            </div>
        </div>
    );
};

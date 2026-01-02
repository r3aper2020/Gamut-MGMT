import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { type ClaimData } from '@/types/jobs';
import {
    Camera,
    Ruler,
    BrainCircuit,
    FileText,
    BookOpen,
    X,
    Search,
    Maximize2,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Save,
    Filter,
    Grid
} from 'lucide-react';

interface ClaimAnalysisProps {
    data: ClaimData;
    readOnly?: boolean;
}

export const ClaimAnalysis: React.FC<ClaimAnalysisProps> = ({ data, readOnly = false }) => {
    // State for Photo Manager
    const [showPhotoManager, setShowPhotoManager] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [activeRoomFilter, setActiveRoomFilter] = useState<string>('All');

    // State for Line Items Filter
    const [lineItemFilter, setLineItemFilter] = useState('');

    const filteredLineItems = data.lineItems.filter(item =>
        item.description.toLowerCase().includes(lineItemFilter.toLowerCase()) ||
        item.category.toLowerCase().includes(lineItemFilter.toLowerCase())
    );

    // Derived State for Photo Manager
    const uniqueRooms = useMemo(() => {
        const rooms = new Set(data.preScan.images.map(img => img.room || 'Uncategorized'));
        return ['All', ...Array.from(rooms)];
    }, [data.preScan.images]);

    const filteredImages = useMemo(() => {
        if (activeRoomFilter === 'All') return data.preScan.images;
        return data.preScan.images.filter(img => (img.room || 'Uncategorized') === activeRoomFilter);
    }, [data.preScan.images, activeRoomFilter]);

    // Helper to get global index from filtered index (for navigation)
    const getGlobalIndex = (filteredIdx: number) => {
        const img = filteredImages[filteredIdx];
        return data.preScan.images.indexOf(img);
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">

            {/* AI Analysis Summary */}
            <div className="glass p-6 rounded-2xl border border-accent-electric/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <BrainCircuit size={100} className="text-accent-electric" />
                </div>

                <div className="flex items-center gap-3 mb-4">
                    <BrainCircuit className="text-accent-electric" size={24} />
                    <h2 className="text-lg font-bold text-white uppercase tracking-wide">AI Analysis & Recommendations</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <label className="text-xs font-bold text-text-muted uppercase">Situation Summary</label>
                            <p className="text-white text-sm leading-relaxed mt-1">{data.aiAnalysis.summary}</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase">Severity Score</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${data.aiAnalysis.severityScore > 7 ? 'bg-red-500' : data.aiAnalysis.severityScore > 4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                            style={{ width: `${data.aiAnalysis.severityScore * 10}%` }}
                                        />
                                    </div>
                                    <span className="text-lg font-bold text-white">{data.aiAnalysis.severityScore}/10</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-black/20 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-3 text-accent-primary">
                            <BookOpen size={16} />
                            <span className="text-xs font-bold uppercase">Referenced Standards</span>
                        </div>
                        <ul className="space-y-2">
                            {data.aiAnalysis.referencedStandards.map((std, idx) => (
                                <li key={idx} className="text-xs">
                                    <div className="font-bold text-white">{std.code}</div>
                                    <div className="text-text-muted">{std.description}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Pre-Scan Data (Measurements & Images) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Measurements */}
                <div className="glass p-6 rounded-2xl border border-white/5 h-full">
                    <div className="flex items-center gap-2 mb-4 text-accent-primary">
                        <Ruler size={20} />
                        <h3 className="text-sm font-black uppercase tracking-widest">Site Measurements</h3>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {data.preScan.measurements.map((m, idx) => (
                            <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-colors">
                                <div>
                                    <div className="font-bold text-white">{m.room}</div>
                                    <div className="text-xs text-text-muted">H: {m.height} | P: {m.perimeter}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-accent-electric font-mono font-bold">{m.area}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Images Preview - Gallery Mode */}
                <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-accent-primary">
                            <Camera size={20} />
                            <h3 className="text-sm font-black uppercase tracking-widest">Site Photos ({data.preScan.images.length})</h3>
                        </div>
                        <button
                            onClick={() => setShowPhotoManager(true)}
                            className="text-xs font-bold text-accent-electric hover:underline flex items-center gap-1"
                        >
                            <Maximize2 size={12} />
                            {readOnly ? 'View Photos' : 'Manage Photos'}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 flex-1">
                        {data.preScan.images.slice(0, 4).map((img, idx) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    setShowPhotoManager(true);
                                    setSelectedImageIndex(idx);
                                }}
                                className="group relative aspect-video rounded-lg overflow-hidden bg-black/50 border border-white/10 cursor-pointer hover:border-accent-electric/50 transition-colors"
                            >
                                <img src={img.url} alt={img.caption} loading="lazy" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                {idx === 3 && data.preScan.images.length > 4 && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                        <span className="text-white font-bold text-lg">+{data.preScan.images.length - 4}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Line Items Table */}
            <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col h-[600px]">
                <div className="flex items-center justify-between mb-6 shrink-0">
                    <div className="flex items-center gap-2 text-accent-primary">
                        <FileText size={20} />
                        <h3 className="text-sm font-black uppercase tracking-widest">Estimated Line Items</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={lineItemFilter}
                                onChange={(e) => setLineItemFilter(e.target.value)}
                                className="bg-black/30 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:border-accent-electric outline-none w-64"
                            />
                        </div>
                        <div className="text-xs font-mono text-text-muted bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                            Total: <span className="text-white font-bold">{data.lineItems.length}</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden flex-1 border border-white/5 rounded-xl bg-black/20 relative">
                    <div className="absolute inset-0 overflow-auto custom-scrollbar">
                        <table className="w-full text-sm text-left">
                            <thead className="sticky top-0 bg-[#1a1a1a] z-10 shadow-lg shadow-black/50">
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
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* DEDICATED PHOTO MANAGER (LARGE MODAL - PORTAL) */}
            {showPhotoManager && createPortal(
                <div className="fixed inset-0 z-100 flex items-start justify-center pt-[5vh] p-4 sm:p-8 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200 overflow-hidden">
                    <div className="w-full max-w-[1600px] h-[90vh] bg-[#0a0a0a] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10 animate-in slide-in-from-top-10 duration-300">

                        {/* Header */}
                        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#121212]">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-accent-electric/10 flex items-center justify-center text-accent-electric">
                                    <Camera size={20} />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-white">Photo Manager {readOnly && '(Read Only)'}</h1>
                                    <div className="text-xs text-text-muted flex items-center gap-2">
                                        <span>{data.preScan.images.length} Total</span>
                                        <span>•</span>
                                        <span>{activeRoomFilter === 'All' ? 'All Rooms' : activeRoomFilter}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowPhotoManager(false)}
                                    className="p-2 hover:bg-white/10 rounded-full text-text-muted hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </header>

                        {/* Main Workspace */}
                        <div className="flex-1 flex overflow-hidden">

                            {/* LEFT: Room Filter Sidebar */}
                            <aside className="w-64 border-r border-white/10 bg-[#121212] overflow-y-auto custom-scrollbar flex flex-col">
                                <div className="p-4 border-b border-white/5">
                                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                        <Filter size={10} />
                                        Filter By Room
                                    </label>
                                </div>
                                <div className="p-2 space-y-1">
                                    {uniqueRooms.map(room => {
                                        const count = room === 'All'
                                            ? data.preScan.images.length
                                            : data.preScan.images.filter(img => (img.room || 'Uncategorized') === room).length;

                                        return (
                                            <button
                                                key={room}
                                                onClick={() => {
                                                    setActiveRoomFilter(room);
                                                    setSelectedImageIndex(null); // Deselect on room switch
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${activeRoomFilter === room
                                                    ? 'bg-accent-electric text-black font-bold'
                                                    : 'text-text-secondary hover:bg-white/5 hover:text-white'
                                                    }`}
                                            >
                                                <span>{room}</span>
                                                <span className={`text-xs ${activeRoomFilter === room ? 'text-black/60' : 'text-text-muted'}`}>{count}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </aside>

                            {/* CENTER: Grid or Detail View */}
                            <main className="flex-1 bg-[#0a0a0a] relative flex flex-col">

                                {/* Toolbar */}
                                <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-[#121212]/50">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setSelectedImageIndex(null)}
                                            className={`p-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors ${selectedImageIndex === null ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'
                                                }`}
                                        >
                                            <Grid size={14} /> Grid
                                        </button>
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                    {selectedImageIndex === null ? (
                                        /* GRID VIEW */
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                            {filteredImages.map((img, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setSelectedImageIndex(getGlobalIndex(idx))}
                                                    className="group relative aspect-video bg-[#1a1a1a] rounded-lg overflow-hidden border border-white/5 hover:border-accent-electric cursor-pointer transition-all hover:scale-[1.02]"
                                                >
                                                    <img src={img.url} alt={`Thumb ${idx}`} loading="lazy" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                                        <span className="text-[10px] font-bold text-accent-electric uppercase mb-1">{img.room}</span>
                                                        <p className="text-xs text-white line-clamp-1">{img.caption}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        /* DETAIL VIEW (LARGE CANVAS) */
                                        <div className="h-full flex items-center justify-center relative">
                                            <img
                                                src={data.preScan.images[selectedImageIndex].url}
                                                alt="Full View"
                                                className="max-h-full max-w-full object-contain shadow-2xl shadow-black/50 rounded-lg"
                                            />

                                            {/* Nav Overlay */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const currentFilteredIdx = filteredImages.indexOf(data.preScan.images[selectedImageIndex]);
                                                    const prevIdx = currentFilteredIdx > 0 ? currentFilteredIdx - 1 : filteredImages.length - 1;
                                                    setSelectedImageIndex(getGlobalIndex(prevIdx));
                                                }}
                                                className="absolute left-4 p-3 rounded-full bg-black/50 text-white hover:bg-accent-electric hover:text-black transition-all"
                                            >
                                                <ChevronLeft size={24} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const currentFilteredIdx = filteredImages.indexOf(data.preScan.images[selectedImageIndex]);
                                                    const nextIdx = currentFilteredIdx < filteredImages.length - 1 ? currentFilteredIdx + 1 : 0;
                                                    setSelectedImageIndex(getGlobalIndex(nextIdx));
                                                }}
                                                className="absolute right-4 p-3 rounded-full bg-black/50 text-white hover:bg-accent-electric hover:text-black transition-all"
                                            >
                                                <ChevronRight size={24} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </main>

                            {/* RIGHT: Inspector Sidebar (Only when image selected) */}
                            {selectedImageIndex !== null && (
                                <aside className="w-80 border-l border-white/10 bg-[#121212] flex flex-col animate-in slide-in-from-right-10 overflow-y-auto">
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
                                                className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-accent-electric focus:ring-1 outline-none resize-none leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                <button className="w-full py-2.5 bg-white/5 text-white font-bold rounded-lg text-sm hover:bg-red-500/20 hover:text-red-500 transition-colors">
                                                    Delete Photo
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </aside>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

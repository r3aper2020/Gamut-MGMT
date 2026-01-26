import React, { useState, useEffect } from 'react';
import { type ClaimData, type RoomScan } from '@/types/jobs';
import { BrainCircuit, Ruler, Activity, Layers, ChevronRight, Box } from 'lucide-react';
import { SimpleUSDZViewer as USDZViewer } from './components/SimpleUSDZViewer';

interface JobSiteModelTabProps {
    data?: ClaimData;
    roomScans?: RoomScan[];
}

export const JobSiteModelTab: React.FC<JobSiteModelTabProps> = ({ data, roomScans = [] }) => {
    console.log("DEBUG: JobSiteModelTab Full Data:", JSON.stringify(data, null, 2));
    // Visualization State
    const [visualTab, setVisualTab] = React.useState<'3D' | 'SKETCH'>('3D');
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

    // Initialize selected room
    useEffect(() => {
        if (roomScans.length > 0 && !selectedRoomId) {
            setSelectedRoomId(roomScans[0].id);
        }
    }, [roomScans, selectedRoomId]);

    // Derived Data based on selection
    const selectedRoom = roomScans.find(r => r.id === selectedRoomId);

    // If no room scans, fallback to legacy legacy data (claimData directly)
    const activeModelUrl = selectedRoom?.usdzUrl || selectedRoom?.texturedModelUrl || data?.preScan?.model3dUrl;
    const activeSketchUrl = selectedRoom?.floorPlanUrl || data?.preScan?.sketchUrl;

    console.log("DEBUG: JobSiteModelTab State:", {
        selectedRoomId,
        selectedRoom,
        activeModelUrl,
        hasModelUrl: !!activeModelUrl
    });

    // Filter measurements for the selected room (if room selected) OR show all if no rooms
    const allMeasurements = data?.preScan?.measurements || [];
    const activeMeasurements = selectedRoom
        ? allMeasurements.filter(m => m.room === selectedRoom.roomName)
        : allMeasurements;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-in slide-in-from-bottom-4 fade-in duration-500">

            {/* LEFT SIDEBAR: ROOM LIST (If multiple rooms) */}
            {roomScans.length > 0 && (
                <div className="xl:col-span-3 flex flex-col gap-4 h-[700px]">
                    <div className="glass flex-1 rounded-2xl border border-white/5 flex flex-col min-h-0 overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-white/5">
                            <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                                <Layers size={14} className="text-accent-electric" />
                                Room Scans
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {roomScans.map(scan => (
                                <button
                                    key={scan.id}
                                    onClick={() => setSelectedRoomId(scan.id)}
                                    className={`
                                        w-full p-3 rounded-lg text-left transition-all group flex items-center justify-between
                                        ${selectedRoomId === scan.id
                                            ? 'bg-accent-electric/10 border-accent-electric/20 text-white'
                                            : 'hover:bg-white/5 text-text-muted hover:text-white border-transparent'}
                                        border
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <Box size={16} className={selectedRoomId === scan.id ? 'text-accent-electric' : 'opacity-50'} />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm">{scan.roomName}</span>
                                            <span className="text-[10px] opacity-50">{new Date(scan.createdAt.seconds * 1000).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    {selectedRoomId === scan.id && <ChevronRight size={14} className="text-accent-electric" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* CENTER PANEL: SITE VISUALIZATION (Major Focus) */}
            <div className={`${roomScans.length > 0 ? 'xl:col-span-6' : 'xl:col-span-8'} glass p-1 rounded-2xl border border-white/5 relative group overflow-hidden h-[700px] flex flex-col shadow-2xl transition-all duration-300`}>
                <div className="flex-1 relative bg-[#151515] rounded-t-xl overflow-hidden">

                    {/* 3D MODEL VIEW */}
                    {visualTab === '3D' && (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center animate-in fade-in zoom-in duration-500 bg-black">
                            {activeModelUrl ? (
                                <div className="w-full h-full relative group">
                                    <USDZViewer url={activeModelUrl} />
                                    {/* Overlay Hint */}
                                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 pointer-events-none">
                                        <div className="flex items-center gap-2 text-xs font-bold text-white">
                                            <BrainCircuit size={14} className="text-accent-electric" />
                                            {selectedRoom ? `${selectedRoom.roomName} Model` : 'Site Model'}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-text-muted">
                                    <Activity size={48} className="mb-2 opacity-20" />
                                    <span>No 3D Model Data Available</span>
                                    {selectedRoom && <span className="text-xs text-text-muted/50 mt-1">Select another room or mode</span>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SKETCH VIEW */}
                    {visualTab === 'SKETCH' && (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center animate-in fade-in zoom-in duration-500 bg-white/5">
                            {activeSketchUrl ? (
                                <img
                                    src={activeSketchUrl}
                                    alt="Property Sketch"
                                    className="w-full h-full object-contain"
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <div className="flex flex-col items-center text-text-muted">
                                    <Activity size={48} className="mb-2 opacity-20" />
                                    <span>No Floor Plan Available</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Toolbar */}
                <div className="h-16 bg-[#0a0a0a] border-t border-white/5 flex items-center px-6 gap-6 justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent-electric/10 rounded-lg text-accent-electric">
                            <BrainCircuit size={20} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white uppercase tracking-wide">Visualization</div>
                            <div className="text-[10px] text-text-muted font-mono">
                                {selectedRoom ? selectedRoom.roomName : 'Overview'}
                            </div>
                        </div>
                    </div>

                    <div className="flex bg-white/5 rounded-lg p-1.5 gap-2 border border-white/5">
                        {[
                            { id: '3D', label: '3D Scan', icon: BrainCircuit },
                            { id: 'SKETCH', label: 'Floor Plan', icon: Ruler }
                        ].map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setVisualTab(mode.id as '3D' | 'SKETCH')}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all uppercase tracking-wider
                                    ${visualTab === mode.id
                                        ? 'bg-accent-electric text-black shadow-[0_0_15px_rgba(0,242,255,0.3)]'
                                        : 'text-text-muted hover:bg-white/5 hover:text-white'}
                                `}
                            >
                                <mode.icon size={14} />
                                <span className="hidden sm:inline">{mode.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: MEASUREMENTS */}
            <div className={`xl:col-span-3 flex flex-col gap-6 h-[700px]`}>
                {/* 3. Measurements (List View) */}
                <div className="glass flex-1 rounded-2xl border border-white/5 flex flex-col min-h-0">
                    <div className="p-5 pb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <Ruler size={16} />
                            <h3 className="text-xs font-black uppercase tracking-widest">Measurements</h3>
                        </div>
                        <div className="text-[10px] font-mono text-accent-primary">{activeMeasurements.length} Zones</div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {activeMeasurements.length > 0 ? (
                            activeMeasurements.map((m, idx) => (
                                <div key={idx} className="bg-white/5 p-3 rounded-lg border border-white/5 flex justify-between items-center hover:bg-white/10 transition-colors group">
                                    <div>
                                        <div className="font-bold text-white text-sm">{m.room}</div>
                                        <div className="text-[10px] text-text-muted mt-0.5">
                                            H: {m.height} <span className="mx-1 text-white/10">|</span> P: {m.perimeter}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-accent-electric font-mono font-bold text-sm tracking-tight">{m.area}</div>
                                        <div className="text-[9px] text-text-muted uppercase">Area</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-text-muted gap-2 opacity-50">
                                <Ruler size={24} />
                                <span className="text-xs italic">No measurements</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

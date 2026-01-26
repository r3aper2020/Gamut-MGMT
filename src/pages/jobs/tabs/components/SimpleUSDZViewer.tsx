import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stage, OrbitControls, Html, Environment } from '@react-three/drei';
import { Activity, Layers } from 'lucide-react';
// @ts-ignore
import { USDZLoader } from './PatchedUSDLoader';
import * as THREE from 'three';

interface USDZViewerProps {
    url: string;
}

function Model({ url, showStructureOnly }: { url: string; showStructureOnly: boolean; }) {
    const [model, setModel] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Initial Load Effect
    useEffect(() => {
        if (!url) return;

        setModel(null);
        setError(null);

        const loadModel = async () => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed: ${response.status}`);

                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);

                const loader = new USDZLoader();
                loader.load(
                    objectUrl,
                    (usd: any) => {
                        usd.traverse((child: any) => {
                            if (child.isMesh) {
                                // Enable Shadows for all meshes
                                child.castShadow = true;
                                child.receiveShadow = true;

                                // Fallback for default materials
                                if (!child.material) {
                                    child.material = new THREE.MeshStandardMaterial({ color: 'lightgray' });
                                }
                            }
                        });
                        setModel(usd);
                        URL.revokeObjectURL(objectUrl);
                    },
                    undefined,
                    (err: any) => {
                        console.error("Loader Parse Error:", err);
                        setError("Failed to parse model file.");
                    }
                );
            } catch (err: any) {
                console.error("Fetch Error:", err);
                setError(err.message || "Failed to fetch model.");
            }
        };

        loadModel();

    }, [url]);

    // Visiblity Effect
    useEffect(() => {
        if (!model) return;

        model.traverse((child: any) => {
            if (child.isMesh) {
                if (showStructureOnly) {
                    // Show only structure tags
                    // Default visible=true, but if showStructureOnly is ON...
                    // Check if it's structure
                    if (child.userData.isStructure) {
                        child.visible = true;
                    } else {
                        // Hide Clutter
                        child.visible = false;
                    }
                } else {
                    // Show All
                    child.visible = true;
                }
            }
        });
    }, [model, showStructureOnly]);


    if (error) return (
        <Html center>
            <div className="text-red-500 font-bold bg-black/80 p-4 rounded-xl border border-red-500/50">
                {error}
            </div>
        </Html>
    );

    if (!model) return null;
    return <primitive object={model} />;
}

function Loader() {
    return (
        <Html center>
            <div className="flex flex-col items-center gap-2 text-white bg-black/50 p-4 rounded-xl backdrop-blur-md">
                <Activity className="animate-spin text-accent-electric" size={32} />
                <span className="text-sm font-bold">Loading Model...</span>
            </div>
        </Html>
    );
}

export const SimpleUSDZViewer: React.FC<USDZViewerProps> = ({ url }) => {
    const [showStructureOnly, setShowStructureOnly] = useState(false);

    return (
        <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black relative">
            <Canvas shadows dpr={[1, 2]} camera={{ fov: 50, position: [0, 2, 5] }}>
                <Suspense fallback={<Loader />}>
                    <Environment preset="studio" />
                    <Stage intensity={0.5} adjustCamera={1.2} environment={null}>
                        <Model url={url} showStructureOnly={showStructureOnly} />
                    </Stage>
                    <ambientLight intensity={1.5} />
                    <directionalLight position={[10, 10, 10]} intensity={2} castShadow shadow-mapSize={[2048, 2048]} />
                </Suspense>
                <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} minDistance={2} maxDistance={20} />
            </Canvas>

            {/* Toggle UI */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                    onClick={() => setShowStructureOnly(!showStructureOnly)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md border transition-all ${showStructureOnly
                        ? "bg-accent-electric/20 border-accent-electric text-accent-electric"
                        : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                        }`}
                >
                    <Layers size={18} />
                    <span className="text-sm font-medium">
                        {showStructureOnly ? "Structure Only" : "Show All"}
                    </span>
                </button>
            </div>
        </div>
    );
};

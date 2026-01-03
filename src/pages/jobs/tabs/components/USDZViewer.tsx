import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Html } from '@react-three/drei';
import { USDZLoader } from 'three-usdz-loader';
import * as THREE from 'three';
import { Activity } from 'lucide-react';

interface USDZViewerProps {
    url: string;
}

function Model({ url }: { url: string }) {
    const [model, setModel] = useState<THREE.Group | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!url) return;

        let mounted = true;
        setModel(null);
        setError(null);

        const loadModel = async () => {
            try {
                // Fix for three-usdz-loader: warning "THREE.Material: parameter 'envMap' has value of undefined"
                // The loader expects window.envMap to be set, or it passes undefined to material constructor.
                if (!('envMap' in window)) {
                    Object.assign(window, { envMap: null });
                }

                // Intercept getUsdModule to silence internal WASM errors
                if (!window.hasOwnProperty('__orig_getUsdModule')) {
                    const origGetUsdModule = (window as any).getUsdModule;
                    if (origGetUsdModule) {
                        (window as any).__orig_getUsdModule = origGetUsdModule;
                        (window as any).getUsdModule = function (...args: any[]) {
                            // Emscripten module configuration usually happens here or is passed as arg.
                            // However, getUsdModule is a factory. We can try to modify its behavior or the result.
                            // But usually emscripten factories allow passing a Module object.
                            // The loader calls: getUsdModule(undefined, depDirectory, maxMemory). 
                            // The first arg is typically the Module object to populate.

                            // Let's proxy the call but inject our printErr overrides if possible.
                            // If the first arg is undefined, we can provide one.

                            const [existingModule, ...rest] = args;

                            const moduleConfig = existingModule || {};

                            const suppressErrors = (text: string) => {
                                if (text.includes('UsdVol') ||
                                    text.includes('OpenVDB') ||
                                    text.includes('schemaRegistry.cpp') ||
                                    text.includes('pluginFactory') ||
                                    text.includes('Coding Error')) {
                                    return;
                                }
                                console.warn('[USDZ WASM]', text);
                            };

                            moduleConfig.printErr = suppressErrors;
                            // Also override print just in case
                            moduleConfig.print = (text: string) => {
                                if (!text.includes('UsdVol')) console.log('[USDZ WASM]', text);
                            };

                            return origGetUsdModule.call(window, moduleConfig, ...rest);
                        };
                    }
                }

                // Initialize loader with path to WASM files
                const loader = new USDZLoader('/wasm'); // Points to public/wasm

                // Fetch the file as a blob because three-usdz-loader expects a File/Blob object
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const blob = await response.blob();
                const file = new File([blob], "model.usdz");

                // Load the file
                const group = new THREE.Group();

                // Suppress known WASM console errors for unsupported schemas (Volumetric/OpenVDB)
                const originalConsoleError = console.error;
                const originalConsoleWarn = console.warn;

                const suppressErrors = (args: any[]) => {
                    const msg = args.join(' ');
                    if (msg.includes('UsdVol') ||
                        msg.includes('OpenVDB') ||
                        msg.includes('schemaRegistry.cpp') ||
                        msg.includes('pluginFactory')) {
                        return true;
                    }
                    return false;
                };

                console.error = (...args) => {
                    if (!suppressErrors(args)) originalConsoleError.apply(console, args);
                };
                console.warn = (...args) => {
                    if (!suppressErrors(args)) originalConsoleWarn.apply(console, args);
                };

                try {
                    await loader.loadFile(file, group);
                } finally {
                    // Restore console
                    console.error = originalConsoleError;
                    console.warn = originalConsoleWarn;
                }

                if (mounted) {
                    if (group.children.length > 0) {
                        setModel(group);
                    } else {
                        console.warn("USDZ loaded but group is empty. Likely unsupported schema (e.g. Volumetric/OpenVDB).");
                        setError("Model loaded but contains no displayable geometry. Volumetric data (Clouds/Smoke/OpenVDB) is not currently supported.");
                    }
                }
            } catch (err: any) {
                console.error("USDZ Loading Error:", err);
                if (mounted) setError(err.message || "Failed to load USDZ");
            }
        };

        loadModel();

        return () => {
            mounted = false;
        };
    }, [url]);

    if (error) return (
        <Html center>
            <div className="text-red-500 font-bold bg-black/80 p-4 rounded-xl border border-red-500/50">
                {error}
                <div className="text-xs text-red-300 font-normal mt-1">Check console</div>
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
                <span className="text-sm font-bold">Loading Native USDZ...</span>
            </div>
        </Html>
    );
}

export const USDZViewer: React.FC<USDZViewerProps> = ({ url }) => {
    return (
        <div className="w-full h-full bg-black relative">
            <Canvas shadows dpr={[1, 2]} camera={{ fov: 50, position: [0, 0, 5] }}>
                <Suspense fallback={<Loader />}>
                    <Stage environment="city" intensity={0.6}>
                        <Model url={url} />
                    </Stage>
                </Suspense>
                <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
            </Canvas>

            {/* Hint Overlay */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 pointer-events-none z-10">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span className="w-2 h-2 rounded-full bg-accent-electric animate-pulse"></span>
                    Binary USDZ Loader
                </div>
            </div>
        </div>
    );
};

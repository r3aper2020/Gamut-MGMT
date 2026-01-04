import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
// We import the L object but will use require for icons to avoid issues
import L from 'leaflet';

// Icons fix
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface JobMapProps {
    address: string;
    city: string;
    state: string;
    zip: string;
    className?: string;
}

export const JobMap: React.FC<JobMapProps> = ({ address, city, state, zip, className }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [loading, setLoading] = useState(false);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Init & Update Logic
    useEffect(() => {
        const update = async () => {
            if (!address && !city) return;

            setLoading(true);
            try {
                const fullQuery = `${address}, ${city}, ${state} ${zip}`;
                const cityQuery = `${city}, ${state}`;

                let lat = 40.7128; // Default NY
                let lon = -74.0060;

                try {
                    // 1. Try Geocoding Full Address
                    let res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}`, {
                        headers: { 'User-Agent': 'GamutManagementDemo/1.0' }
                    });
                    let data = await res.json();

                    if (data && data.length > 0) {
                        lat = parseFloat(data[0].lat);
                        lon = parseFloat(data[0].lon);
                    } else {
                        // 2. Fallback: Geocode City Center
                        res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityQuery)}`, {
                            headers: { 'User-Agent': 'GamutManagementDemo/1.0' }
                        });
                        data = await res.json();

                        if (data && data.length > 0) {
                            lat = parseFloat(data[0].lat);
                            lon = parseFloat(data[0].lon);
                        }
                    }
                } catch (e) {
                    console.warn("Geocode error", e);
                }

                // Initialize or Update Map
                if (!mapRef.current) {
                    if (mapContainerRef.current) {
                        const map = L.map(mapContainerRef.current, {
                            zoomControl: false,
                            attributionControl: false
                        }).setView([lat, lon], 16);

                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                            className: 'map-tiles',
                            crossOrigin: true
                        }).addTo(map);

                        mapRef.current = map;

                        setTimeout(() => {
                            map.invalidateSize();
                        }, 100);
                    }
                } else {
                    mapRef.current.setView([lat, lon], 16);
                }

                if (markerRef.current) {
                    markerRef.current.setLatLng([lat, lon]);
                } else if (mapRef.current) {
                    markerRef.current = L.marker([lat, lon]).addTo(mapRef.current);
                }

                if (markerRef.current) {
                    const popupContent = `
                        <div style="font-family: sans-serif; font-size: 12px; font-weight: bold; color: #000;">
                            ${address}<br/>${city}, ${state} ${zip}
                        </div>
                    `;
                    markerRef.current.bindPopup(popupContent);
                }

            } catch (error) {
                console.error("Map Update Failure", error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(update, 500); // 500ms delay to ensure map is ready
        return () => clearTimeout(timer);
    }, [address, city, state, zip]);

    return (
        <div className={`relative w-full h-full ${className}`} style={{ minHeight: '320px' }}>
            <div
                ref={mapContainerRef}
                className="w-full h-full"
                style={{ minHeight: '320px', background: '#222' }}
            />

            {/* Dark Mode Filter */}
            <style>
                {`
                    .map-tiles {
                        filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%) grayscale(100%);
                    }
                `}
            </style>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 pointer-events-none bg-linear-to-t from-black/80 via-transparent to-transparent z-10"></div>

            {loading && (
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur text-white text-[10px] px-2 py-1 rounded-full z-50">
                    Locating...
                </div>
            )}
        </div>
    );
};

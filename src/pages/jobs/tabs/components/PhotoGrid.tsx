import React from 'react';
import { type ClaimData } from '@/types/jobs';

interface PhotoGridProps {
    images: ClaimData['preScan']['images'];
    onImageSelect: (filteredIndex: number) => void;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({ images, onImageSelect }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
            {images.map((img, idx) => (
                <div
                    key={idx}
                    onClick={() => onImageSelect(idx)}
                    className="group relative aspect-video bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/5 hover:border-accent-electric cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:-translate-y-1"
                >
                    <img src={img.url} alt={`Thumb ${idx}`} loading="lazy" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <span className="text-[10px] font-bold text-accent-electric uppercase mb-0.5">{img.category || 'Uncategorized'}</span>
                        <p className="text-xs text-white line-clamp-1 font-medium">{img.caption || 'No caption'}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

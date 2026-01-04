import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type ClaimData } from '@/types/jobs';

interface PhotoDetailViewProps {
    image: ClaimData['preScan']['images'][0];
    onNext: () => void;
    onPrev: () => void;
}

export const PhotoDetailView: React.FC<PhotoDetailViewProps> = ({ image, onNext, onPrev }) => {
    return (
        <div className="h-full flex items-center justify-center relative">
            <img
                src={image.url}
                alt="Full View"
                className="max-h-full max-w-full object-contain shadow-2xl rounded-lg"
            />

            {/* Nav Arrows */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onPrev();
                }}
                className="absolute left-0 p-4 hover:bg-black/20 text-white/50 hover:text-accent-electric transition-colors h-full flex items-center"
            >
                <ChevronLeft size={32} />
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onNext();
                }}
                className="absolute right-0 p-4 hover:bg-black/20 text-white/50 hover:text-accent-electric transition-colors h-full flex items-center"
            >
                <ChevronRight size={32} />
            </button>
        </div>
    );
};

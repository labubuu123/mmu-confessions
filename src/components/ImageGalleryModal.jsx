import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageGalleryModal({ images, initialIndex = 0, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    const goToPrevious = (e) => {
        e.stopPropagation();
        setCurrentIndex(prevIndex => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
    };

    const goToNext = (e) => {
        e.stopPropagation();
        setCurrentIndex(prevIndex => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
    };

    useEffect(() => {
        const handleKeydown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') goToPrevious(e);
            if (e.key === 'ArrowRight') goToNext(e);
        };
        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    }, [images.length]);

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <button
                className="absolute top-4 right-4 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
                onClick={onClose}
                title="Close (Esc)"
            >
                <X className="w-6 h-6" />
            </button>

            <div className="relative flex items-center justify-center w-full h-full p-16">
                <img
                    src={images[currentIndex]}
                    alt={`Gallery image ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            {images.length > 1 && (
                <button
                    className="absolute left-4 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
                    onClick={goToPrevious}
                    title="Previous (←)"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
            )}

            {images.length > 1 && (
                <button
                    className="absolute right-4 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
                    onClick={goToNext}
                    title="Next (→)"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            )}

            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/50 text-white text-sm rounded-full">
                    {currentIndex + 1} / {images.length}
                </div>
            )}
        </div>,
        document.body
    );
}
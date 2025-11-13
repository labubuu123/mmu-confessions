import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'

export default function ImageGalleryModal({ images, initialIndex = 0, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex)
    const [scale, setScale] = useState(1)
    const [rotation, setRotation] = useState(0)

    useEffect(() => {
        document.body.style.overflow = 'hidden'
        
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowLeft') handlePrevious()
            if (e.key === 'ArrowRight') handleNext()
        }
        
        document.addEventListener('keydown', handleKeyDown)
        
        return () => {
            document.body.style.overflow = ''
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [currentIndex])

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
        resetTransforms()
    }

    const handleNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
        resetTransforms()
    }

    const resetTransforms = () => {
        setScale(1)
        setRotation(0)
    }

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3))
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5))
    const handleRotate = () => setRotation(prev => (prev + 90) % 360)

    const handleDownload = async () => {
        try {
            const response = await fetch(images[currentIndex])
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `confession-image-${Date.now()}.jpg`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Failed to download image:', err)
            alert('Failed to download image')
        }
    }

    return ReactDOM.createPortal(
        <div 
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
            onClick={onClose}
        >
            {/* Header Controls */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleZoomOut()
                            }}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition"
                            title="Zoom Out (Ctrl + -)"
                        >
                            <ZoomOut className="w-5 h-5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleZoomIn()
                            }}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition"
                            title="Zoom In (Ctrl + +)"
                        >
                            <ZoomIn className="w-5 h-5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleRotate()
                            }}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition"
                            title="Rotate"
                        >
                            <RotateCw className="w-5 h-5" />
                        </button>
                        <div className="px-3 py-2 bg-white/10 text-white rounded-lg backdrop-blur-sm text-sm font-medium">
                            {Math.round(scale * 100)}%
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-white text-sm font-medium">
                            {currentIndex + 1} / {images.length}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleDownload()
                            }}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition"
                            title="Download"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onClose()
                            }}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition"
                            title="Close (Esc)"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                <img
                    src={images[currentIndex]}
                    alt={`Image ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain transition-all duration-300 select-none"
                    style={{
                        transform: `scale(${scale}) rotate(${rotation}deg)`,
                        cursor: scale > 1 ? 'grab' : 'default'
                    }}
                    onClick={(e) => e.stopPropagation()}
                    draggable={false}
                />
            </div>

            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handlePrevious()
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition z-10"
                        title="Previous (←)"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleNext()
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition z-10"
                        title="Next (→)"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}

            {images.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                    <div className="flex gap-2 justify-center overflow-x-auto max-w-7xl mx-auto pb-2">
                        {images.map((img, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setCurrentIndex(index)
                                    resetTransforms()
                                }}
                                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                                    index === currentIndex
                                        ? 'border-white scale-110'
                                        : 'border-transparent opacity-50 hover:opacity-100'
                                }`}
                            >
                                <img
                                    src={img}
                                    alt={`Thumbnail ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>,
        document.body
    )
}
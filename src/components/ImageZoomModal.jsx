import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react'

export default function ImageZoomModal({ imageUrl, onClose }) {
    const [scale, setScale] = React.useState(1)

    useEffect(() => {
        document.body.style.overflow = 'hidden'
        
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose()
        }
        
        document.addEventListener('keydown', handleEscape)
        
        return () => {
            document.body.style.overflow = ''
            document.removeEventListener('keydown', handleEscape)
        }
    }, [onClose])

    const handleZoomIn = () => {
        setScale(prev => Math.min(prev + 0.25, 3))
    }

    const handleZoomOut = () => {
        setScale(prev => Math.max(prev - 0.25, 0.5))
    }

    const handleDownload = async () => {
        try {
            const response = await fetch(imageUrl)
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
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        handleZoomOut()
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition"
                    title="Zoom Out"
                >
                    <ZoomOut className="w-5 h-5" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        handleZoomIn()
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition"
                    title="Zoom In"
                >
                    <ZoomIn className="w-5 h-5" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        handleDownload()
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition"
                    title="Download"
                >
                    <Download className="w-5 h-5" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onClose()
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition"
                    title="Close (Esc)"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white/10 text-white rounded-full backdrop-blur-sm text-sm">
                {Math.round(scale * 100)}%
            </div>

            <img
                src={imageUrl}
                alt="Zoomed"
                className="max-w-full max-h-full object-contain transition-transform duration-300"
                style={{ transform: `scale(${scale})` }}
                onClick={(e) => e.stopPropagation()}
            />
        </div>,
        document.body
    )
}
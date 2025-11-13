import React, { useState, useEffect } from 'react'
import { Plus, X, Send, Image, Film, Mic } from 'lucide-react'

export default function FloatingActionButton({ onQuickPost }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isVisible, setIsVisible] = useState(true)
    const [lastScrollY, setLastScrollY] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY

            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false)
            } else {
                setIsVisible(true)
            }
            
            setLastScrollY(currentScrollY)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [lastScrollY])

    const quickActions = [
        { icon: Send, label: 'Text', color: 'from-blue-500 to-indigo-600', action: 'text' },
        { icon: Image, label: 'Photo', color: 'from-green-500 to-emerald-600', action: 'image' },
        { icon: Film, label: 'Video', color: 'from-red-500 to-pink-600', action: 'video' },
        { icon: Mic, label: 'Voice', color: 'from-purple-500 to-violet-600', action: 'audio' },
    ]

    return (
        <div className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
        }`}>
            {isExpanded && (
                <div className="mb-4 flex flex-col gap-3 items-end animate-fade-in">
                    {quickActions.map((action, index) => (
                        <button
                            key={action.action}
                            onClick={() => {
                                onQuickPost(action.action)
                                setIsExpanded(false)
                            }}
                            className={`group flex items-center gap-3 bg-gradient-to-r ${action.color} text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110`}
                            style={{
                                animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
                            }}
                        >
                            <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {action.label}
                            </span>
                            <action.icon className="w-5 h-5" />
                        </button>
                    ))}
                </div>
            )}

            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-110 flex items-center justify-center group relative ${
                    isExpanded ? 'rotate-45' : 'rotate-0'
                }`}
            >
                {isExpanded ? (
                    <X className="w-7 h-7" />
                ) : (
                    <>
                        <Plus className="w-7 h-7" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    </>
                )}
                
                <span className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
            </button>

            <style jsx>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </div>
    )
}
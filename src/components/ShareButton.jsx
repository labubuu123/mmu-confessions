import React, { useState } from 'react'
import { Share2, X, Copy, Check, Facebook, Twitter, MessageCircle, Mail } from 'lucide-react'

export default function ShareButton({ post }) {
    const [showModal, setShowModal] = useState(false)
    const [copied, setCopied] = useState(false)

    const shareUrl = `${window.location.origin}${window.location.pathname}#/post/${post.id}`
    const shareText = `Check out this confession on MMU Confessions: ${post.text.slice(0, 100)}${post.text.length > 100 ? '...' : ''}`

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const handleShare = (platform) => {
        let url = ''

        switch (platform) {
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
                break
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
                break
            case 'whatsapp':
                url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
                break
            case 'telegram':
                url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
                break
            case 'email':
                url = `mailto:?subject=${encodeURIComponent('MMU Confession')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`
                break
        }

        if (url) {
            window.open(url, '_blank', 'width=600,height=400')
        }
    }

    const handleNativeShare = async (e) => {
        e.stopPropagation()

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

        if (isMobile && navigator.share) {
            try {
                await navigator.share({
                    title: 'MMU Confession',
                    text: shareText,
                    url: shareUrl
                })
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err)
                    setShowModal(true)
                }
            }
        } else {
            setShowModal(true)
        }
    }

    return (
        <>
            <button
                onClick={handleNativeShare}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                title="Share"
            >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Share</span>
            </button>

            {showModal && (
                <>
                    <div
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowModal(false)
                        }}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <div
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    Share Confession
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-4 p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white relative overflow-hidden">
                                <div className="absolute inset-0 opacity-10">
                                    {[...Array(20)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute w-1 h-1 bg-white rounded-full"
                                            style={{
                                                left: `${Math.random() * 100}%`,
                                                top: `${Math.random() * 100}%`
                                            }}
                                        />
                                    ))}
                                </div>
                                <div className="relative">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                            💬
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">MMU Confessions</p>
                                            <p className="text-xs opacity-80">Share Anonymously</p>
                                        </div>
                                    </div>
                                    <p className="text-sm line-clamp-3 mb-3 bg-white/10 p-3 rounded-lg backdrop-blur">
                                        {post.text}
                                    </p>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="opacity-70">Post #{post.id}</span>
                                        <span className="bg-white/20 px-2 py-1 rounded-full">🔒 Anonymous</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <SharePlatformButton
                                    icon={<Facebook className="w-5 h-5" />}
                                    label="Facebook"
                                    color="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => handleShare('facebook')}
                                />
                                <SharePlatformButton
                                    icon={<Twitter className="w-5 h-5" />}
                                    label="Twitter"
                                    color="bg-sky-500 hover:bg-sky-600"
                                    onClick={() => handleShare('twitter')}
                                />
                                <SharePlatformButton
                                    icon={<MessageCircle className="w-5 h-5" />}
                                    label="WhatsApp"
                                    color="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleShare('whatsapp')}
                                />
                                <SharePlatformButton
                                    icon={
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                                        </svg>
                                    }
                                    label="Telegram"
                                    color="bg-blue-500 hover:bg-blue-600"
                                    onClick={() => handleShare('telegram')}
                                />
                                <SharePlatformButton
                                    icon={<Mail className="w-5 h-5" />}
                                    label="Email"
                                    color="bg-gray-600 hover:bg-gray-700"
                                    onClick={() => handleShare('email')}
                                />
                                <SharePlatformButton
                                    icon={copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    label={copied ? "Copied!" : "Copy Link"}
                                    color={copied ? "bg-green-600" : "bg-indigo-600 hover:bg-indigo-700"}
                                    onClick={handleCopyLink}
                                />
                            </div>

                            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
                                Share this confession while keeping everyone anonymous 🔒
                            </p>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

function SharePlatformButton({ icon, label, color, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl text-white transition-all ${color} shadow-md hover:shadow-lg active:scale-95`}
        >
            {icon}
            <span className="text-[10px] font-medium">{label}</span>
        </button>
    )
}
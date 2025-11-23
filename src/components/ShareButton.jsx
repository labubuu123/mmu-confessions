import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
    Share2,
    X,
    Copy,
    Check,
    Facebook,
    MessageCircle,
    Mail,
    Download
} from 'lucide-react'
import { toPng } from 'html-to-image'
import { QRCodeCanvas } from 'qrcode.react'

/**
 * Truncates text at a word boundary ("word-aware")
 * @param {string} text
 * @param {number} limit
 * @returns {string}
 */

function getTruncatedText(text, limit) {
    if (text.length <= limit) {
        return text
    }

    const lastSpace = text.lastIndexOf(' ', limit)

    if (lastSpace === -1) {
        return text.slice(0, limit) + '...'
    } else {
        return text.slice(0, lastSpace) + '...'
    }
}


export default function ShareButton({ post }) {
    const [showModal, setShowModal] = useState(false)
    const [copied, setCopied] = useState(false)
    const [downloaded, setDownloaded] = useState(false)
    const cardRef = useRef(null)

    const shareUrl = `${window.location.origin}/post/${post.id}`
    const shareText = `Check out this confession on MMU Confessions: ${post.text.slice(0, 100)}${post.text.length > 100 ? '...' : ''}`

    const CARD_TEXT_LIMIT = 100
    const cardText = getTruncatedText(post.text, CARD_TEXT_LIMIT)

    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [showModal])

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
            case 'whatsapp':
                url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
                break
            case 'email':
                url = `mailto:?subject=${encodeURIComponent('MMU Confession')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`
                break
        }

        if (url) {
            window.open(url, '_blank', 'width=600,height=400')
        }
    }

    const handleOpenShareModal = (e) => {
        e.stopPropagation()
        setDownloaded(false)
        setCopied(false)
        setShowModal(true)
    }

    const handleCloseModal = (e) => {
        if (e) {
            e.stopPropagation()
        }
        setShowModal(false)
    }

    const handleDownloadImage = async () => {
        if (!cardRef.current || downloaded) {
            return
        }

        try {
            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                pixelRatio: 2
            })

            const link = document.createElement('a')
            link.download = `MMU-Confession-${post.id}.png`
            link.href = dataUrl
            link.click()

            setDownloaded(true)
            setTimeout(() => setDownloaded(false), 3000)

        } catch (err) {
            console.error('Failed to download image:', err)
        }
    }

    const modalContent = showModal ? (
        <>
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                style={{ zIndex: 10000 }}
                onClick={handleCloseModal}
            />
            <div
                className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
                style={{ zIndex: 10001 }}
            >
                <div
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full pointer-events-auto max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            Share Confession
                        </h3>
                        <button
                            onClick={handleCloseModal}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div
                        ref={cardRef}
                        className="mb-4 p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white relative overflow-hidden"
                    >
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

                            <div className="text-sm mb-3 bg-white/10 p-3 rounded-lg backdrop-blur overflow-hidden">
                                <p>
                                    {cardText}
                                </p>
                            </div>

                            <div className="flex items-end justify-between text-xs">
                                <div>
                                    <span className="opacity-80 block">Post #{post.id}</span>
                                    <span className="bg-white text-indigo-700 px-2 py-1 rounded-full mt-1 inline-block font-medium">
                                        🔒 Anonymous
                                    </span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="bg-white p-1 rounded-md">
                                        <QRCodeCanvas
                                            value={shareUrl}
                                            size={60}
                                            bgColor={"#ffffff"}
                                            fgColor={"#000000"}
                                            level={"L"}
                                            includeMargin={false}
                                        />
                                    </div>
                                    <span className="text-gray-800 opacity-80 mt-1 text-[10px]">
                                        Scan to share
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <SharePlatformButton
                            icon={<Facebook className="w-5 h-5" />}
                            label="Facebook"
                            color="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleShare('facebook')}
                        />
                        <SharePlatformButton
                            icon={<MessageCircle className="w-5 h-5" />}
                            label="WhatsApp"
                            color="bg-green-600 hover:bg-green-700"
                            onClick={() => handleShare('whatsapp')}
                        />
                        <SharePlatformButton
                            icon={<Mail className="w-5 h-5" />}
                            label="Email"
                            color="bg-gray-600 hover:bg-gray-700"
                            onClick={() => handleShare('email')}
                        />
                        <SharePlatformButton
                            icon={copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            label={copied ? 'Copied!' : 'Copy Link'}
                            color={copied ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}
                            onClick={handleCopyLink}
                        />
                    </div>

                    <button
                        onClick={handleDownloadImage}
                        disabled={downloaded}
                        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium transition-all shadow-md hover:shadow-lg active:scale-95 mb-4
                        ${downloaded
                                ? 'bg-green-600'
                                : 'bg-gray-600 hover:bg-gray-700'
                            }`}
                    >
                        {downloaded ? (
                            <Check className="w-5 h-5" />
                        ) : (
                            <Download className="w-5 h-5" />
                        )}
                        <span>
                            {downloaded ? 'Downloaded!' : 'Download as Image'}
                        </span>
                    </button>

                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                        Share this confession while keeping everyone anonymous 🔒
                    </p>
                </div>
            </div>
        </>
    ) : null

    return (
        <>
            <button
                onClick={handleOpenShareModal}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                title="Share"
            >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">Share</span>
            </button>

            {showModal && createPortal(modalContent, document.body)}
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
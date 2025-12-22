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
    Download,
    Smartphone,
    Layout,
    Quote
} from 'lucide-react'
import { toPng } from 'html-to-image'
import { QRCodeCanvas } from 'qrcode.react'
import { supabase } from '../lib/supabaseClient'

/**
 * Truncates text at a word boundary ("word-aware")
 * @param {string} text
 * @param {number} limit
 * @returns {string}
 */
function getTruncatedText(text, limit) {
    if (!text) return "";
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
    const [format, setFormat] = useState('card')
    const [comments, setComments] = useState([])

    const cardRef = useRef(null)

    const shareUrl = `${window.location.origin}/post/${post.id}`
    const shareText = `Check out this confession on MMU Confessions: ${post.text.slice(0, 100)}${post.text.length > 100 ? '...' : ''}`

    const CARD_TEXT_LIMIT = 100
    const STORY_TEXT_LIMIT = 300

    const displayText = getTruncatedText(
        post.text,
        format === 'story' ? STORY_TEXT_LIMIT : CARD_TEXT_LIMIT
    )

    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden'
            if (comments.length === 0) {
                fetchComments()
            }
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [showModal])

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('comments')
            .select('text')
            .eq('post_id', post.id)
            .order('created_at', { ascending: false })
            .limit(2)

        if (!error && data) {
            setComments(data)
        }
    }

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
        setFormat('card')
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
                pixelRatio: 2,
                backgroundColor: format === 'story' ? '#4f46e5' : null
            })

            const link = document.createElement('a')
            link.download = `MMU-Confession-${post.id}-${format}.png`
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
                className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                style={{ zIndex: 10000 }}
                onClick={handleCloseModal}
            />
            <div
                className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
                style={{ zIndex: 10001 }}
            >
                <div
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 max-w-md w-full pointer-events-auto max-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            Share Confession
                        </h3>
                        <button
                            onClick={handleCloseModal}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl mb-4 shrink-0">
                        <button
                            onClick={() => setFormat('card')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${format === 'card'
                                    ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-300'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Layout className="w-4 h-4" /> Card
                        </button>
                        <button
                            onClick={() => setFormat('story')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${format === 'story'
                                    ? 'bg-white dark:bg-gray-600 shadow-sm text-pink-600 dark:text-pink-300'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Smartphone className="w-4 h-4" /> Story
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0 mb-4 flex justify-center bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
                        <div
                            ref={cardRef}
                            className={`
                                relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 text-white shadow-2xl transition-all duration-300 flex flex-col
                                ${format === 'story'
                                    ? 'w-[280px] h-[498px] sm:w-[300px] sm:h-[533px] p-6 justify-between'
                                    : 'w-full h-auto p-5 rounded-xl'
                                }
                            `}
                        >
                            <div className="absolute inset-0 opacity-10 pointer-events-none">
                                {[...Array(15)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute bg-white rounded-full"
                                        style={{
                                            width: Math.random() * 6 + 2 + 'px',
                                            height: Math.random() * 6 + 2 + 'px',
                                            left: `${Math.random() * 100}%`,
                                            top: `${Math.random() * 100}%`,
                                            opacity: Math.random() * 0.5 + 0.3
                                        }}
                                    />
                                ))}
                                <div className="absolute -top-20 -right-20 w-60 h-60 bg-pink-500 rounded-full blur-3xl opacity-30"></div>
                                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-500 rounded-full blur-3xl opacity-30"></div>
                            </div>

                            <div className="relative z-10 flex items-center gap-3 shrink-0">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-inner border border-white/10">
                                    <span className="text-lg">🤫</span>
                                </div>
                                <div>
                                    <p className="font-bold text-base leading-tight">MMU Confessions</p>
                                    <p className="text-[10px] opacity-80 uppercase tracking-widest font-medium">Anonymous</p>
                                </div>
                            </div>

                            <div className={`relative z-10 flex-1 flex flex-col justify-center gap-3 ${format === 'story' ? 'py-4' : 'py-3'}`}>
                                <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg relative">
                                    <Quote className="absolute -top-3 -left-2 w-6 h-6 text-white/40 fill-white/10" />
                                    <p className={`font-medium leading-relaxed drop-shadow-sm ${format === 'story' ? 'text-lg text-center' : 'text-sm'}`}>
                                        {displayText}
                                    </p>
                                    <div className="flex justify-end mt-2">
                                        <span className="text-[10px] opacity-60">#{post.id} • {new Date(post.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {comments.length > 0 && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-2">
                                        <div className="flex items-center gap-2 mb-2 opacity-80">
                                            <div className="h-[1px] flex-1 bg-white/30"></div>
                                            <span className="text-[10px] font-medium uppercase tracking-widest">Top Replies</span>
                                            <div className="h-[1px] flex-1 bg-white/30"></div>
                                        </div>

                                        <div className="space-y-2">
                                            {comments.map((comment, idx) => (
                                                <div
                                                    key={idx}
                                                    className="bg-black/20 backdrop-blur-sm p-3 rounded-xl rounded-tl-none border border-white/5 text-xs sm:text-sm leading-snug shadow-sm flex gap-2"
                                                >
                                                    <div className="w-1 h-full bg-white/50 rounded-full shrink-0"></div>
                                                    <p className="opacity-95">{getTruncatedText(comment.text, 60)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="relative z-10 flex items-end justify-between shrink-0 mt-auto">
                                <div>
                                    <p className="text-[10px] font-medium opacity-70 mb-1">Scan to read full story</p>
                                    <div className="flex items-center gap-1.5 opacity-90">
                                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                        <span className="text-xs font-bold tracking-wide">mmuconfessions.fun</span>
                                    </div>
                                </div>
                                <div className="bg-white p-1.5 rounded-lg shadow-lg">
                                    <QRCodeCanvas
                                        value={shareUrl}
                                        size={format === 'story' ? 70 : 55}
                                        bgColor={"#ffffff"}
                                        fgColor={"#000000"}
                                        level={"L"}
                                        includeMargin={false}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-3 shrink-0">
                        <SharePlatformButton
                            icon={<Facebook className="w-5 h-5" />}
                            label="Facebook"
                            color="bg-[#1877F2] hover:bg-[#166fe5]"
                            onClick={() => handleShare('facebook')}
                        />
                        <SharePlatformButton
                            icon={<MessageCircle className="w-5 h-5" />}
                            label="WhatsApp"
                            color="bg-[#25D366] hover:bg-[#20bd5a]"
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
                            label={copied ? 'Copied' : 'Copy Link'}
                            color={copied ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-800'}
                            onClick={handleCopyLink}
                        />
                    </div>

                    <button
                        onClick={handleDownloadImage}
                        disabled={downloaded}
                        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold transition-all shadow-md hover:shadow-lg active:scale-95 shrink-0
                        ${downloaded
                                ? 'bg-green-600'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                    >
                        {downloaded ? (
                            <Check className="w-5 h-5" />
                        ) : (
                            <Download className="w-5 h-5" />
                        )}
                        <span>
                            {downloaded ? 'Saved to Device!' : `Download for ${format === 'story' ? 'Stories' : 'Socials'}`}
                        </span>
                    </button>
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
                <span className="font-medium hidden sm:inline">Share</span>
                <span className="font-medium sm:hidden">Share</span>
            </button>

            {showModal && createPortal(modalContent, document.body)}
        </>
    )
}

function SharePlatformButton({ icon, label, color, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl text-white transition-all ${color} shadow-sm hover:shadow-md active:scale-95`}
            title={label}
        >
            {icon}
            <span className="text-[10px] font-bold">{label}</span>
        </button>
    )
}
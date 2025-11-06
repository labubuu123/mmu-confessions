import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import CommentSection from './CommentSection'
import ReactionsBar from './ReactionsBar'
import AdBanner from './AdBanner'
import { supabase } from '../lib/supabaseClient'
import { X, ChevronLeft, ChevronRight, Share2, Copy, Check } from 'lucide-react'

export default function PostModal({ post, postId, onClose, onNavigate }) {
    const [internalPost, setInternalPost] = useState(post)
    const [loading, setLoading] = useState(!post)
    const [error, setError] = useState(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        function onKey(e) {
            if (e.key === 'Escape') onClose && onClose()
            if (e.key === 'ArrowLeft' && onNavigate) onNavigate('prev')
            if (e.key === 'ArrowRight' && onNavigate) onNavigate('next')
        }
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [onClose, onNavigate])

    useEffect(() => {
        if (post) {
            setInternalPost(post)
            setLoading(false)
        } else if (postId) {
            setLoading(true)
            async function fetchPost() {
                const { data, error } = await supabase
                    .from('confessions')
                    .select('*')
                    .eq('id', postId)
                    .single()

                if (error) {
                    console.error('Error fetching post by ID:', error)
                    setError('Post not found.')
                } else {
                    setInternalPost(data)
                }
                setLoading(false)
            }
            fetchPost()
        }
    }, [post, postId])

    async function handleShare() {
        if (!internalPost) return;

        const shareUrl = `${window.location.origin}/post/${internalPost.id}`;
        const shareText = `Check out this confession on MMU Confessions`;

        // Try Web Share API first (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'MMU Confession',
                    text: shareText,
                    url: shareUrl
                });
                return;
            } catch (e) {
                if (e.name !== 'AbortError') {
                    console.warn('Web Share API failed:', e);
                }
            }
        }

        // Fallback: Copy to clipboard
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            // Last resort: show prompt
            const input = document.createElement('input');
            input.value = shareUrl;
            document.body.appendChild(input);
            input.select();
            try {
                document.execCommand('copy');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                alert('Copy this link: ' + shareUrl);
            }
            document.body.removeChild(input);
        }
    }

    if (loading) {
        return ReactDOM.createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-700 dark:text-gray-300">Loading...</p>
                    </div>
                </div>
            </div>,
            document.body
        )
    }

    if (error) {
        return ReactDOM.createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl max-w-md">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        Close
                    </button>
                </div>
            </div>,
            document.body
        )
    }

    if (!internalPost) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={onClose} />

            {/* Navigation Arrows */}
            {onNavigate && (
                <>
                    <button
                        onClick={() => onNavigate('prev')}
                        className="absolute left-4 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition hidden md:block"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => onNavigate('next')}
                        className="absolute right-4 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition hidden md:block"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}

            {/* Modal Content */}
            <div className="relative max-w-3xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                A
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-gray-100">Anonymous</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(internalPost.created_at).toLocaleString()}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed text-lg">
                            {internalPost.text}
                        </p>

                        {internalPost.media_url && (
                            <div className="mt-4">
                                {internalPost.media_type?.startsWith('image') ? (
                                    <img
                                        src={internalPost.media_url}
                                        alt="media"
                                        className="w-full max-h-[60vh] object-contain rounded-xl"
                                    />
                                ) : (
                                    <video
                                        src={internalPost.media_url}
                                        controls
                                        className="w-full rounded-xl"
                                    />
                                )}
                            </div>
                        )}

                        {/* Tags */}
                        {internalPost.tags && internalPost.tags.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {internalPost.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-medium"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Reactions */}
                        <div className="mt-6">
                            <ReactionsBar postId={internalPost.id} />
                        </div>

                        {/* Share Button */}
                        <div className="mt-4">
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition w-full justify-center"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4 text-green-500" />
                                        <span className="text-green-500">Link copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="w-4 h-4" />
                                        <span>Share this confession</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Ad */}
                        <div className="mt-6">
                            <AdBanner slot="1234567890" />
                        </div>

                        {/* Comments */}
                        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                            <CommentSection postId={internalPost.id} />
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
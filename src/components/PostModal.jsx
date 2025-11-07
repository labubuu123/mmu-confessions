import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import CommentSection from './CommentSection'
import ReactionsBar from './ReactionsBar'
import AdBanner from './AdBanner'
import { supabase } from '../lib/supabaseClient'
import { X, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react'

export default function PostModal({ post, postId, onClose, onNavigate }) {
    const [internalPost, setInternalPost] = useState(post)
    const [loading, setLoading] = useState(!post)
    const [error, setError] = useState(null)

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

    if (!internalPost) return null

    const hasMultipleImages = internalPost.media_urls && internalPost.media_urls.length > 1
    const displayImages = hasMultipleImages ? internalPost.media_urls : (internalPost.media_url ? [internalPost.media_url] : [])

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

                        {/* Media - Multiple Images */}
                        {internalPost.media_type === 'images' && displayImages.length > 0 && (
                            <div className={`mt-4 ${
                                displayImages.length === 1 ? '' :
                                displayImages.length === 2 ? 'grid grid-cols-2 gap-2' :
                                'grid grid-cols-2 md:grid-cols-3 gap-2'
                            }`}>
                                {displayImages.map((url, idx) => (
                                    <img
                                        key={idx}
                                        src={url}
                                        alt={`media ${idx + 1}`}
                                        className={`w-full object-contain rounded-xl ${
                                            displayImages.length === 1 ? 'max-h-[60vh]' : 'max-h-64'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Media - Video */}
                        {internalPost.media_type === 'video' && internalPost.media_url && (
                            <div className="mt-4">
                                <video
                                    src={internalPost.media_url}
                                    controls
                                    className="w-full rounded-xl"
                                />
                            </div>
                        )}

                        {/* Media - Audio */}
                        {internalPost.media_type === 'audio' && internalPost.media_url && (
                            <div className="mt-4">
                                <div className="p-6 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                            <Volume2 className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                Voice Message
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Tap to play
                                            </p>
                                        </div>
                                    </div>
                                    <audio controls className="w-full">
                                        <source src={internalPost.media_url} />
                                        Your browser does not support audio playback.
                                    </audio>
                                </div>
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
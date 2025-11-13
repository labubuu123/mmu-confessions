import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import CommentSection from './CommentSection'
import ReactionsBar from './ReactionsBar'
import AnonAvatar from './AnonAvatar'
import PollDisplay from './PollDisplay'
import EventDisplay from './EventDisplay'
import ImageZoomModal from './ImageZoomModal'
import { supabase } from '../lib/supabaseClient'
import { X, ChevronLeft, ChevronRight, Volume2, Flag, ExternalLink, Eye, Link as LinkIcon, Check, Download } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export default function PostModal({ post, postId, onClose, onNavigate }) {
    const [internalPost, setInternalPost] = useState(post)
    const [loading, setLoading] = useState(!post)
    const [error, setError] = useState(null)
    const [reportLoading, setReportLoading] = useState(false)
    const [poll, setPoll] = useState(null)
    const [event, setEvent] = useState(null)
    const [linkCopied, setLinkCopied] = useState(false)
    const [zoomedImage, setZoomedImage] = useState(null)

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
            incrementViewCount(post.id)
            fetchPollAndEvent(post.id)
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
                    incrementViewCount(data.id)
                    fetchPollAndEvent(data.id)
                }
                setLoading(false)
            }
            fetchPost()
        }

        if (postId || post?.id) {
            const id = postId || post.id
            const channel = supabase
                .channel(`post-${id}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'confessions',
                    filter: `id=eq.${id}`
                }, payload => {
                    setInternalPost(payload.new)
                })
                .subscribe()
            
            return () => supabase.removeChannel(channel)
        }
    }, [post, postId])

    async function incrementViewCount(id) {
        try {
            await supabase.rpc('increment_view_count', { post_id_in: id })
        } catch (err) {
            console.error('Failed to increment view count:', err)
        }
    }

    async function fetchPollAndEvent(id) {
        const { data: eventData } = await supabase
            .from('events')
            .select('*')
            .eq('confession_id', id)
            .single()
        
        if (eventData) {
            setEvent(eventData)
        } else {
            const { data: pollData } = await supabase
                .from('polls')
                .select('*')
                .eq('confession_id', id)
                .single()
            
            if (pollData) {
                setPoll(pollData)
            }
        }
    }

    async function handleReport() {
        if (!internalPost) return

        if (internalPost.reported) {
            alert('You have already reported this post.')
            return
        }
        
        const confirmed = window.confirm('Report this post as inappropriate? This will flag it for moderator review.')
        if (!confirmed) return

        setReportLoading(true)

        try {
            const { error } = await supabase.rpc('increment_report_count', {
                post_id_in: internalPost.id
            })

            if (error) throw error

            alert('Post reported successfully. Thank you for helping keep our community safe.')
            setInternalPost(prev => ({ ...prev, reported: true, report_count: (prev.report_count || 0) + 1 }))
        } catch (err) {
            console.error('Report error:', err)
            alert('Failed to report post: ' + err.message)
        } finally {
            setReportLoading(false)
        }
    }

    async function handleCopyLink() {
        const url = `${window.location.origin}${window.location.pathname}#/post/${internalPost.id}`
        
        try {
            await navigator.clipboard.writeText(url)
            setLinkCopied(true)
            setTimeout(() => setLinkCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy link:', err)
            alert('Failed to copy link')
        }
    }

    function handleImageClick(url) {
        setZoomedImage(url)
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

    if (!internalPost) return null

    const hasMultipleImages = internalPost.media_urls && internalPost.media_urls.length > 1
    const displayImages = hasMultipleImages ? internalPost.media_urls : (internalPost.media_url ? [internalPost.media_url] : [])

    return ReactDOM.createPortal(
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="absolute inset-0" onClick={onClose} />

                {onNavigate && (
                    <>
                        <button
                            onClick={() => onNavigate('prev')}
                            className="absolute left-4 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition hidden md:block"
                            title="Previous post (←)"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => onNavigate('next')}
                            className="absolute right-4 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition hidden md:block"
                            title="Next post (→)"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </>
                )}

                <div className="relative max-w-3xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <AnonAvatar authorId={internalPost.author_id} />
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                                        {internalPost.author_name || 'Anonymous'}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <span>{dayjs(internalPost.created_at).fromNow()}</span>
                                        {internalPost.view_count > 0 && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-3 h-3" />
                                                    {internalPost.view_count} views
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopyLink}
                                    className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition ${
                                        linkCopied ? 'text-green-500' : ''
                                    }`}
                                    title="Copy Link"
                                >
                                    {linkCopied ? <Check className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={handleReport}
                                    disabled={reportLoading || internalPost.reported}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition disabled:opacity-50"
                                    title={internalPost.reported ? "Already reported" : "Report"}
                                >
                                    <Flag className={`w-5 h-5 ${internalPost.reported ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`} />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                                    title="Close (Esc)"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed text-lg">
                                {internalPost.text}
                            </p>

                            {internalPost.media_type === 'images' && displayImages.length > 0 && (
                                <div className={`mt-4 ${
                                    displayImages.length === 1 ? '' :
                                    displayImages.length === 2 ? 'grid grid-cols-2 gap-2' :
                                    'grid grid-cols-2 md:grid-cols-3 gap-2'
                                }`}>
                                    {displayImages.map((url, idx) => (
                                        <div
                                            key={idx}
                                            className="relative group cursor-pointer"
                                            onClick={() => handleImageClick(url)}
                                        >
                                            <img
                                                src={url}
                                                alt={`media ${idx + 1}`}
                                                className={`w-full object-contain rounded-xl ${
                                                    displayImages.length === 1 ? 'max-h-[60vh]' : 'max-h-64'
                                                }`}
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-xl">
                                                <ExternalLink className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {internalPost.media_type === 'video' && internalPost.media_url && (
                                <div className="mt-4">
                                    <video
                                        src={internalPost.media_url}
                                        controls
                                        className="w-full rounded-xl"
                                    />
                                </div>
                            )}

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

                            {event && (
                                <div className="mt-4">
                                    <EventDisplay
                                        eventName={event.event_name}
                                        description={event.description}
                                        startTime={event.start_time}
                                        endTime={event.end_time}
                                        location={event.location}
                                    />
                                </div>
                            )}

                            {poll && !event && (
                                <div className="mt-4">
                                    <PollDisplay poll={poll} confessionId={internalPost.id} />
                                </div>
                            )}

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

                            <div className="mt-6">
                                <ReactionsBar postId={internalPost.id} />
                            </div>

                            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                                <CommentSection postId={internalPost.id} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {zoomedImage && (
                <ImageZoomModal
                    imageUrl={zoomedImage}
                    onClose={() => setZoomedImage(null)}
                />
            )}
        </>,
        document.body
    )
}
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Heart, MessageCircle, Volume2, TrendingUp, Clock, AlertTriangle, BarChart3, Calendar, Link as LinkIcon, Check } from 'lucide-react'
import AnonAvatar from './AnonAvatar'
import PollDisplay from './PollDisplay'
import EventDisplay from './EventDisplay'
import ImageGalleryModal from './ImageGalleryModal'
import ReactionTooltip from './ReactionToolTip'
import ShareButton from './ShareButton'
import { MoodBadge } from './MoodSelector'
import { supabase } from '../lib/supabaseClient'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { renderTextWithHashtags } from '../utils/hashtags'
import SeriesIndicator from './SeriesIndicator';
import { BADGE_DEFINITIONS, calculateUserBadges } from '../utils/badges';

dayjs.extend(relativeTime)

export default function PostCard({ post: initialPost, onOpen }) {
    const [post, setPost] = useState(initialPost)
    const [reactions, setReactions] = useState({})
    const [isReported, setIsReported] = useState(initialPost.reported || false)
    const [poll, setPoll] = useState(null)
    const [event, setEvent] = useState(null)
    const [linkCopied, setLinkCopied] = useState(false)
    const [zoomedImage, setZoomedImage] = useState(null)

    const getTotalReactions = useCallback((reactionsObj) => {
        if (!reactionsObj) return 0
        return Object.values(reactionsObj).reduce((sum, count) => sum + count, 0)
    }, [])

    const excerpt = useMemo(() => {
        return post.text?.length > 280 ? post.text.slice(0, 280) + '...' : post.text
    }, [post.text])

    const renderedText = useMemo(() => {
        return renderTextWithHashtags(excerpt)
    }, [excerpt])

    const displayImages = useMemo(() => {
        if (Array.isArray(post.media_urls) && post.media_urls.length > 0) {
            return post.media_urls
        } else if (post.media_url) {
            return [post.media_url]
        }
        return []
    }, [post.media_urls, post.media_url])

    const currentTotalReactions = useMemo(() => getTotalReactions(reactions), [reactions, getTotalReactions])

    const getEngagementScore = useCallback(() => {
        const age = (Date.now() - new Date(post.created_at)) / (1000 * 60 * 60)
        const score = (currentTotalReactions * 2 + (post.comments_count || 0) * 3) / (age + 2)
        return score
    }, [post.created_at, post.comments_count, currentTotalReactions])

    const isHotPost = useMemo(() => getEngagementScore() > 5, [getEngagementScore])
    const isTrendingPost = useMemo(() =>
        currentTotalReactions > 20 || (post.comments_count || 0) > 10,
        [currentTotalReactions, post.comments_count]
    )

    useEffect(() => {
        const channel = supabase
            .channel(`post-${post.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'confessions',
                filter: `id=eq.${post.id}`
            }, payload => {
                setPost(prevPost => ({ ...prevPost, ...payload.new }))
            })
            .subscribe()

        fetchReactions()
        fetchPollAndEvent()

        const reactionsChannel = supabase
            .channel(`reactions-${post.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'reactions',
                filter: `post_id=eq.${post.id}`
            }, () => {
                fetchReactions()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
            supabase.removeChannel(reactionsChannel)
        }
    }, [post.id])

    async function fetchReactions() {
        const { data } = await supabase
            .from('reactions')
            .select('emoji, count')
            .eq('post_id', post.id)

        if (data) {
            const reactionsMap = {}
            data.forEach(r => {
                reactionsMap[r.emoji] = r.count
            })
            setReactions(reactionsMap)
        }
    }

    async function fetchPollAndEvent() {
        const { data: eventData } = await supabase
            .from('events')
            .select('*')
            .eq('confession_id', post.id)
            .single()

        if (eventData) {
            setEvent(eventData)
        } else {
            const { data: pollData } = await supabase
                .from('polls')
                .select('*')
                .eq('confession_id', post.id)
                .single()

            if (pollData) {
                setPoll(pollData)
            }
        }
    }

    async function handleReport(e) {
        e.stopPropagation()
        if (isReported) {
            alert('You have already reported this post.')
            return
        }

        const confirmed = window.confirm('Are you sure you want to report this post?')
        if (!confirmed) return

        try {
            const { error } = await supabase.rpc('increment_report_count', {
                post_id_in: post.id
            })
            if (error) throw error
            setIsReported(true)
            alert('Post reported successfully.')
        } catch (err) {
            console.error('Report error:', err)
            alert('Failed to report post: ' + err.message)
        }
    }

    function handleImageClick(e, url) {
        e.stopPropagation()
        setZoomedImage(url)
    }

    const getPostAge = useCallback(() => {
        const hours = dayjs().diff(dayjs(post.created_at), 'hour')
        if (hours < 1) return { label: 'NEW', color: 'green' }
        return null
    }, [post.created_at])

    const postAge = useMemo(() => getPostAge(), [getPostAge])

    return (
        <>
            <div
                onClick={() => onOpen && onOpen(post)}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 cursor-pointer mb-4 overflow-hidden group relative"
            >
                <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 flex flex-col items-end gap-1.5 sm:gap-2 max-w-[calc(100%-4rem)]">
                    {postAge && (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full font-medium flex items-center gap-1 whitespace-nowrap">
                            <Clock className="w-3 h-3" />
                            {postAge.label}
                        </span>
                    )}

                    {post.pinned && (
                        <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1 whitespace-nowrap">
                            📌 PINNED
                        </div>
                    )}

                    {isHotPost && (
                        <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1 animate-pulse whitespace-nowrap">
                            🔥 HOT
                        </div>
                    )}

                    {isTrendingPost && !isHotPost && (
                        <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1 whitespace-nowrap">
                            <TrendingUp className="w-3 h-3" />
                            TRENDING
                        </div>
                    )}

                    {poll && (
                        <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1 whitespace-nowrap">
                            <BarChart3 className="w-3 h-3" />
                            POLL
                        </div>
                    )}

                    {event && (
                        <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1 whitespace-nowrap">
                            <Calendar className="w-3 h-3" />
                            EVENT
                        </div>
                    )}
                </div>

                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="p-3 sm:p-4 flex items-start gap-2 sm:gap-3 relative">
                    <AnonAvatar authorId={post.author_id} size="md" />
                    <div className="flex-1 min-w-0 pr-20 sm:pr-24">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <div className={`font-semibold text-sm sm:text-base truncate ${post.author_name
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-900 dark:text-gray-100'
                                    }`}>
                                    {post.author_name || 'Anonymous'}
                                </div>
                                {post.mood && <MoodBadge mood={JSON.parse(post.mood)} />}
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {dayjs(post.created_at).fromNow()}
                        </div>
                    </div>
                </div>

                <div className="px-3 sm:px-4 pb-3">
                    <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed break-words">
                        {renderedText}
                    </p>
                </div>

                {post.media_type === 'images' && displayImages.length > 0 && (
                    <div className={`w-full ${displayImages.length === 1 ? '' :
                        displayImages.length === 2 ? 'grid grid-cols-2' :
                            displayImages.length === 3 ? 'grid grid-cols-3' :
                                'grid grid-cols-2'
                        } gap-0.5`}>
                        {displayImages.slice(0, 4).map((url, idx) => (
                            <div
                                key={idx}
                                className="relative cursor-pointer group/img"
                                onClick={(e) => handleImageClick(e, url)}
                            >
                                <img
                                    loading="lazy"
                                    src={url}
                                    alt={`media ${idx + 1}`}
                                    className={`w-full object-cover transition-transform group-hover/img:scale-105 ${displayImages.length === 1 ? 'max-h-96' : 'h-40 sm:h-48'
                                        }`}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition" />
                                {idx === 3 && displayImages.length > 4 && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <span className="text-white text-xl sm:text-2xl font-bold">
                                            +{displayImages.length - 4}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {post.media_type === 'video' && post.media_url && (
                    <div className="w-full">
                        <video
                            src={post.media_url}
                            className="w-full max-h-64 sm:max-h-96"
                            controls
                            preload="metadata"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}

                {post.media_type === 'audio' && post.media_url && (
                    <div className="px-3 sm:px-4 pb-3">
                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                                    Voice Message
                                </p>
                                <audio
                                    controls
                                    className="w-full h-8"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <source src={post.media_url} />
                                </audio>
                            </div>
                        </div>
                    </div>
                )}

                {post.series_id && (
                    <div className="px-3 sm:px-4">
                        <SeriesIndicator post={post} />
                    </div>
                )}

                {event && (
                    <div className="px-3 sm:px-4 pb-3" onClick={(e) => e.stopPropagation()}>
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
                    <div className="px-3 sm:px-4 pb-3" onClick={(e) => e.stopPropagation()}>
                        <PollDisplay poll={poll} confessionId={post.id} />
                    </div>
                )}

                <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    {(currentTotalReactions > 0) && (
                        <div className="mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-gray-200 dark:border-gray-700">
                            <ReactionTooltip reactions={reactions} />
                        </div>
                    )}

                    <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-1 sm:gap-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onOpen && onOpen(post)
                                }}
                                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            >
                                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="font-medium">React</span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onOpen && onOpen(post)
                                }}
                                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                            >
                                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="font-medium">{post.comments_count || 0}</span>
                            </button>
                            <ShareButton post={post} />
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleReport}
                                disabled={isReported}
                                className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all ${isReported
                                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                                    }`}
                                title={isReported ? 'Reported' : 'Report Post'}
                            >
                                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {zoomedImage && (
                <ImageGalleryModal
                    images={displayImages}
                    initialIndex={displayImages.indexOf(zoomedImage)}
                    onClose={() => setZoomedImage(null)}
                />
            )}
        </>
    )
}
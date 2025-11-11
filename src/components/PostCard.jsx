import React, { useState, useEffect } from 'react'
import { Heart, MessageCircle, Volume2, Share2, Bookmark } from 'lucide-react'
import AnonAvatar from './AnonAvatar'
import { supabase } from '../lib/supabaseClient'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export default function PostCard({ post: initialPost, onOpen }) {
    const [post, setPost] = useState(initialPost)
    const [reactions, setReactions] = useState({})
    const [totalReactions, setTotalReactions] = useState(0)
    const [isBookmarked, setIsBookmarked] = useState(false)

    const excerpt = post.text?.length > 280 ? post.text.slice(0, 280) + '...' : post.text

    let displayImages = []
    if (Array.isArray(post.media_urls) && post.media_urls.length > 0) {
        displayImages = post.media_urls
    } else if (post.media_url) {
        displayImages = [post.media_url]
    }

    // Subscribe to real-time updates for this specific post
    useEffect(() => {
        const channel = supabase
            .channel(`post-${post.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'confessions',
                filter: `id=eq.${post.id}`
            }, payload => {
                setPost(payload.new)
            })
            .subscribe()

        // Fetch reactions
        fetchReactions()

        // Subscribe to reaction changes
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

        // Check if bookmarked
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]')
        setIsBookmarked(bookmarks.includes(post.id))

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
            let total = 0
            data.forEach(r => {
                reactionsMap[r.emoji] = r.count
                total += r.count
            })
            setReactions(reactionsMap)
            setTotalReactions(total)
        }
    }

    const handleBookmark = (e) => {
        e.stopPropagation()
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]')
        
        if (isBookmarked) {
            const updated = bookmarks.filter(id => id !== post.id)
            localStorage.setItem('bookmarks', JSON.stringify(updated))
            setIsBookmarked(false)
        } else {
            bookmarks.push(post.id)
            localStorage.setItem('bookmarks', JSON.stringify(bookmarks))
            setIsBookmarked(true)
        }
    }

    const handleShare = async (e) => {
        e.stopPropagation()
        const shareData = {
            title: 'MMU Confession',
            text: excerpt,
            url: `${window.location.origin}/#/post/${post.id}`
        }
        
        if (navigator.share) {
            try {
                await navigator.share(shareData)
            } catch (err) {
                console.log('Share cancelled')
            }
        } else {
            navigator.clipboard.writeText(shareData.url)
            alert('Link copied to clipboard!')
        }
    }

    return (
        <div
            onClick={() => onOpen && onOpen(post)}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 cursor-pointer mb-4 overflow-hidden group relative"
        >
            {/* Hover gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            {/* Header */}
            <div className="p-4 flex items-start gap-3 relative">
                <AnonAvatar authorId={post.author_id} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">Anonymous</div>
                        <div className="flex items-center gap-2">
                            {post.tags && post.tags.length > 0 && (
                                <div className="flex gap-1 flex-wrap">
                                    {post.tags.slice(0, 2).map(t => (
                                        <span key={t} className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full font-medium">
                                            #{t}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {dayjs(post.created_at).fromNow()}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-3">
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                    {excerpt}
                </p>
            </div>

            {/* Media */}
            {post.media_type === 'images' && displayImages.length > 0 && (
                <div className={`w-full ${
                    displayImages.length === 1 ? '' :
                    displayImages.length === 2 ? 'grid grid-cols-2' :
                    displayImages.length === 3 ? 'grid grid-cols-3' :
                    'grid grid-cols-2'
                } gap-0.5`}>
                    {displayImages.slice(0, 4).map((url, idx) => (
                        <div key={idx} className="relative">
                            <img
                                loading="lazy"
                                src={url}
                                alt={`media ${idx + 1}`}
                                className={`w-full object-cover ${
                                    displayImages.length === 1 ? 'max-h-96' : 'h-48'
                                }`}
                            />
                            {idx === 3 && displayImages.length > 4 && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-white text-2xl font-bold">
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
                        className="w-full max-h-96"
                        controls
                        preload="metadata"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {post.media_type === 'audio' && post.media_url && (
                <div className="px-4 pb-3">
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Volume2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Voice Message
                            </p>
                            <audio
                                controls
                                className="w-full mt-2"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <source src={post.media_url} />
                            </audio>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats and Actions */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                {/* Reaction Preview */}
                {totalReactions > 0 && (
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex -space-x-1">
                            {Object.keys(reactions).slice(0, 5).map((emoji, i) => (
                                <span 
                                    key={emoji} 
                                    className="text-base bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 w-7 h-7 flex items-center justify-center" 
                                    style={{ zIndex: 5 - i }}
                                >
                                    {emoji}
                                </span>
                            ))}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            {totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}
                        </span>
                    </div>
                )}

                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onOpen && onOpen(post)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        >
                            <Heart className="w-5 h-5" />
                            <span className="font-medium">React</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onOpen && onOpen(post)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span className="font-medium">{post.comments_count || 0}</span>
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleBookmark}
                            className={`p-2 rounded-lg transition-all ${
                                isBookmarked
                                    ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                        >
                            <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                        </button>
                        <button
                            onClick={handleShare}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                            title="Share"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
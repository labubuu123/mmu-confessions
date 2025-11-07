import React from 'react'
import { Heart, MessageCircle, Volume2 } from 'lucide-react'

export default function PostCard({ post, onOpen }) {
    const excerpt = post.text?.length > 280 ? post.text.slice(0, 280) + '...' : post.text
    const hasMultipleImages = post.media_urls && post.media_urls.length > 1
    const displayImages = hasMultipleImages ? post.media_urls : (post.media_url ? [post.media_url] : [])

    return (
        <div
            onClick={() => onOpen && onOpen(post)}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 cursor-pointer mb-4 overflow-hidden"
        >
            {/* Header */}
            <div className="p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    A
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">Anonymous</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(post.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>
                {post.tags && post.tags.length > 0 && (
                    <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        {post.tags.slice(0, 2).map(t => `#${t}`).join(' ')}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="px-4 pb-3">
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                    {excerpt}
                </p>
            </div>

            {/* Media - Images */}
            {post.media_type === 'images' && displayImages.length > 0 && (
                <div className={`w-full ${
                    displayImages.length === 1 ? '' :
                    displayImages.length === 2 ? 'grid grid-cols-2' :
                    displayImages.length === 3 ? 'grid grid-cols-3' :
                    'grid grid-cols-2'
                }`}>
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

            {/* Media - Video */}
            {post.media_type === 'video' && post.media_url && (
                <div className="w-full">
                    <video
                        src={post.media_url}
                        className="w-full max-h-96"
                        controls
                        preload="metadata"
                    />
                </div>
            )}

            {/* Media - Audio */}
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
                            <audio controls className="w-full mt-2">
                                <source src={post.media_url} />
                            </audio>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-red-500 transition">
                            <Heart className="w-5 h-5" />
                            <span className="font-medium">{post.likes_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition">
                            <MessageCircle className="w-5 h-5" />
                            <span className="font-medium">Comment</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
import React from 'react'
import { Heart, MessageCircle, Share2 } from 'lucide-react'

export default function PostCard({ post, onOpen }) {
    const excerpt = post.text?.length > 280 ? post.text.slice(0, 280) + '...' : post.text
    
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

            {/* Media */}
            {post.media_url && (
                <div className="w-full">
                    {post.media_type?.startsWith('image') ? (
                        <img 
                            loading="lazy"
                            src={post.media_url}
                            alt="media"
                            className="w-full max-h-96 object-cover"
                        />
                    ) : (
                        <video 
                            src={post.media_url}
                            className="w-full max-h-96"
                            controls 
                            preload="metadata"
                        />
                    )}
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
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-green-500 transition">
                        <Share2 className="w-5 h-5" />
                        <span className="font-medium">Share</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
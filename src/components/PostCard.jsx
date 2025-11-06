import React from 'react'

export default function PostCard({ post, onOpen }) {
    const excerpt = post.text?.length > 280 ? post.text.slice(0, 280) + '...' : post.text
    return (
    <div onClick={() => onOpen && onOpen(post)} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-md rounded-2xl p-4 mb-4 border border-gray-200 dark:border-gray-700 transition-colors duration-300 cursor-pointer">
        <div className="flex justify-between items-start">
        <div className="text-sm small-muted">{new Date(post.created_at).toLocaleString()}</div>
        <div className="text-xs small-muted">{post.tags?.map(t => `#${t}`).join(' ')}</div>
        </div>

        <p className="mt-2 whitespace-pre-wrap">{excerpt}</p>

        {post.media_url && (
        <div className="mt-3">
            {post.media_type?.startsWith('image') ? (
            <img loading="lazy" src={post.media_url} alt="media" className="w-full max-h-64 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
            ) : (
            <video src={post.media_url} className="w-full rounded-lg" controls preload="metadata" />
            )}
        </div>
        )}

        <div className="mt-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div>❤️ {post.likes_count || 0}</div>
        <div className="flex items-center gap-3">
            <div className="text-xs">Comments</div>
            <div className="text-xs">Share</div>
        </div>
        </div>
    </div>
    )
}

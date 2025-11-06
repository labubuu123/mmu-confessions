import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import CommentSection from './CommentSection'
import ReactionsBar from './ReactionsBar'
import AdBanner from './AdBanner'

export default function PostModal({ post, onClose, postsList = [], currentIndex = -1, onNavigate }) {
    useEffect(() => {
    function onKey(e) {
        if (e.key === 'Escape') onClose && onClose()
        if (e.key === 'ArrowLeft') onNavigate && onNavigate(currentIndex - 1)
        if (e.key === 'ArrowRight') onNavigate && onNavigate(currentIndex + 1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
    }, [onClose, onNavigate, currentIndex])

    if (!post) return null

    return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative max-w-3xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-4">
            <div className="flex justify-between items-start">
            <div>
                <div className="text-xs small-muted">{new Date(post.created_at).toLocaleString()}</div>
                <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">Confession</h2>
            </div>
            <button onClick={onClose} className="text-gray-600 dark:text-gray-300">✕</button>
            </div>

            <div className="mt-4 text-gray-800 dark:text-gray-100 whitespace-pre-wrap">{post.text}</div>

            {post.media_url && (
            <div className="mt-4">
                {post.media_type?.startsWith('image') ? (
                <img src={post.media_url} alt="media" className="w-full max-h-[60vh] object-contain rounded-lg border border-gray-200 dark:border-gray-700" />
                ) : (
                <video src={post.media_url} controls className="w-full rounded-lg" />
                )}
            </div>
            )}

            <div className="mt-4">
            <ReactionsBar postId={post.id} />
            </div>

            <div className="mt-4 flex items-center justify-between">
            <div className="text-sm small-muted">Tags: {post.tags?.map(t => `#${t}`).join(' ')}</div>
            <button className="px-3 py-1 bg-indigo-600 text-white rounded-md" onClick={async () => {
                const shareUrl = `${window.location.origin}/post/${post.id}`
                if (navigator.share) {
                try { await navigator.share({ title: 'Anonymous Confession', text: post.text.slice(0, 120), url: shareUrl }) } catch (e) {}
                } else {
                await navigator.clipboard.writeText(shareUrl); alert('Post link copied to clipboard!')
                }
            }}>Share</button>
            </div>

            <div className="mt-5">
            <AdBanner slot="1234567890" style={{ maxWidth: '728px' }} />
            </div>

            <div className="mt-5">
            <CommentSection postId={post.id} />
            </div>
        </div>
        </div>
    </div>,
    document.body
    )
}

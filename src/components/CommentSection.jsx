import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import Comment from './Comment'
import CommentForm from './CommentForm'
import { MessageCircle, Loader2 } from 'lucide-react'
import { CommentSkeleton } from './LoadingSkeleton'

const COMMENTS_PER_PAGE = 10

export default function CommentSection({ postId }) {
    const [allComments, setAllComments] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const [renderedComments, setRenderedComments] = useState([])
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)

    useEffect(() => {
        async function fetchComments() {
            setLoading(true)
            setError(null)

            const { data, error } = await supabase
                .from('comments')
                .select('*')
                .eq('post_id', postId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Fetch comments error:', error)
                setError('Could not load comments.')
            } else {
                setAllComments(data || [])
            }
            setLoading(false)
        }

        if (postId) {
            fetchComments()
        }
    }, [postId])

    const commentTree = useMemo(() => {
        const map = {}
        const roots = []

        allComments.forEach(comment => {
            map[comment.id] = { ...comment, children: [] }
        })

        allComments.forEach(comment => {
            if (comment.parent_id) {
                map[comment.parent_id]?.children.push(map[comment.id])
            } else {
                roots.push(map[comment.id])
            }
        })

        return roots.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }, [allComments])

    useEffect(() => {
        const initialComments = commentTree.slice(0, COMMENTS_PER_PAGE)
        setRenderedComments(initialComments)
        setHasMore(commentTree.length > COMMENTS_PER_PAGE)
        setPage(0)
    }, [commentTree])

    const loadMoreComments = useCallback(() => {
        setPage(prevPage => {
            const nextPage = prevPage + 1
            const newRenderedCount = (nextPage + 1) * COMMENTS_PER_PAGE

            setRenderedComments(commentTree.slice(0, newRenderedCount))
            setHasMore(newRenderedCount < commentTree.length)
            return nextPage
        })
    }, [commentTree])

    function handleCommentPosted(newComment) {
        setAllComments(prev => [newComment, ...prev])
    }

    return (
        <div className="mt-6 pb-20 sm:pb-24">
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    Comments
                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs py-0.5 px-2 rounded-full">
                        {allComments.length}
                    </span>
                </h3>
            </div>

            <div className="mb-6">
                <CommentForm postId={postId} onCommentPosted={handleCommentPosted} />
            </div>

            {loading && <CommentSkeleton />}

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
            )}

            {!loading && !error && (
                <div className="space-y-4 sm:space-y-6">
                    {renderedComments.length > 0 ? (
                        renderedComments.map(comment => (
                            <Comment
                                key={comment.id}
                                comment={comment}
                                postId={postId}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-full mb-3">
                                <MessageCircle className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-900 dark:text-gray-100 font-medium">No comments yet</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Be the first to start the conversation!
                            </p>
                        </div>
                    )}

                    {hasMore && (
                        <button
                            onClick={loadMoreComments}
                            className="w-full py-3.5 mt-4 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <span>Load previous comments</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
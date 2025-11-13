import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import Comment from './Comment'
import CommentForm from './CommentForm'
import { MessageCircle } from 'lucide-react'
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

        return roots
    }, [allComments])

    useEffect(() => {
        const initialComments = commentTree.slice(0, COMMENTS_PER_PAGE)
        setRenderedComments(initialComments)
        setHasMore(commentTree.length > COMMENTS_PER_PAGE)
        setPage(0)
    }, [commentTree])

    function loadMoreComments() {
        const nextPage = page + 1
        const newRenderedCount = (nextPage + 1) * COMMENTS_PER_PAGE

        setRenderedComments(commentTree.slice(0, newRenderedCount))
        setPage(nextPage)
        setHasMore(newRenderedCount < commentTree.length)
    }

    function handleCommentPosted(newComment) {
        setAllComments(prev => [newComment, ...prev])

        if (!newComment.parent_id) {
            setRenderedComments(prev => [newComment, ...prev])
        }
    }

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Comments ({allComments.length})
            </h3>

            <CommentForm postId={postId} onCommentPosted={handleCommentPosted} />

            {loading && <CommentSkeleton />}

            {error && (
                <p className="text-red-500 text-center py-4">{error}</p>
            )}

            {!loading && !error && (
                <div className="space-y-5 mt-6">
                    {renderedComments.length > 0 ? (
                        renderedComments.map(comment => (
                            <Comment
                                key={comment.id}
                                comment={comment}
                                postId={postId}
                            />
                        ))
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-6">
                            <MessageCircle className="w-12 h-12 mx-auto text-gray-400" />
                            <p className="mt-2">No comments yet.</p>
                            <p className="text-sm">Be the first to share your thoughts!</p>
                        </div>
                    )}

                    {hasMore && !loading && (
                        <div className="flex justify-center pt-4">
                            <button
                                onClick={loadMoreComments}
                                className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                            >
                                Load more comments
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
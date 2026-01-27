import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import Comment from './Comment'
import CommentForm from './CommentForm'
import { MessageCircle, ListFilter } from 'lucide-react'
import { CommentSkeleton } from './LoadingSkeleton'

const COMMENTS_PER_PAGE = 8

export default function CommentSection({ postId }) {
    const [allComments, setAllComments] = useState([])
    const [loading, setLoading] = useState(false)
    const [renderedCount, setRenderedCount] = useState(COMMENTS_PER_PAGE)

    useEffect(() => {
        async function fetchComments() {
            setLoading(true)
            const { data } = await supabase
                .from('comments')
                .select('*')
                .eq('post_id', postId)
                .order('created_at', { ascending: false })

            setAllComments(data || [])
            setLoading(false)
        }
        if (postId) fetchComments()
    }, [postId])

    const commentTree = useMemo(() => {
        const map = {}
        const roots = []
        allComments.forEach(c => map[c.id] = { ...c, children: [] })
        allComments.forEach(c => {
            if (c.parent_id && map[c.parent_id]) map[c.parent_id].children.push(map[c.id])
            else if (!c.parent_id) roots.push(map[c.id])
        })
        return roots.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }, [allComments])

    const currentComments = commentTree.slice(0, renderedCount)
    const hasMore = commentTree.length > renderedCount

    return (
        <div className="pb-20 sm:pb-24">
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    Comments
                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs py-0.5 px-2 rounded-full">
                        {allComments.length}
                    </span>
                </h3>
            </div>

            <div className="mb-8">
                <CommentForm
                    postId={postId}
                    onCommentPosted={(newC) => setAllComments(prev => [newC, ...prev])}
                />
            </div>

            {loading ? (
                <CommentSkeleton />
            ) : (
                <div className="space-y-2">
                    {currentComments.length > 0 ? (
                        currentComments.map(comment => (
                            <Comment
                                key={comment.id}
                                comment={comment}
                                postId={postId}
                            />
                        ))
                    ) : (
                        <div className="py-12 flex flex-col items-center opacity-50">
                            <MessageCircle className="w-12 h-12 mb-2" />
                            <p className="text-sm">No one has spoken yet.</p>
                        </div>
                    )}

                    {hasMore && (
                        <button
                            onClick={() => setRenderedCount(prev => prev + COMMENTS_PER_PAGE)}
                            className="w-full mt-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 text-sm font-bold active:scale-95 transition-transform"
                        >
                            View {Math.min(COMMENTS_PER_PAGE, commentTree.length - renderedCount)} more conversations
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
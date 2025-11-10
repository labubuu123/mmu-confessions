import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Comment from './Comment'
import CommentForm from './CommentForm'

function buildCommentTree(comments) {
    const commentMap = {}
    const topLevelComments = []

    for (const comment of comments) {
        commentMap[comment.id] = { ...comment, children: [] }
    }

    for (const commentId in commentMap) {
        const comment = commentMap[commentId]
        if (comment.parent_id && commentMap[comment.parent_id]) {
            commentMap[comment.parent_id].children.push(comment)
        } else {
            topLevelComments.push(comment)
        }
    }
    
    const sortChildren = (node) => {
        node.children.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        node.children.forEach(sortChildren);
    };
    topLevelComments.forEach(sortChildren);

    topLevelComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return topLevelComments
}

export default function CommentSection({ postId }) {
    const [comments, setComments] = useState([])
    const [loading, setLoading] = useState(false)
    const [commentCount, setCommentCount] = useState(0)

    useEffect(() => {
        fetchComments()

        const channel = supabase
            .channel(`comments-${postId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'comments',
                filter: `post_id=eq.${postId}`
            }, (payload) => {
                fetchComments()
            })
            .subscribe()
        
        return () => supabase.removeChannel(channel)
    }, [postId])

    async function fetchComments() {
        setLoading(true)
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true })
        
        if (data) {
            setCommentCount(data.length)
            const tree = buildCommentTree(data)
            setComments(tree)
        }
        setLoading(false)
    }
    
    function handleCommentPosted(newComment) {
        setComments(currentComments => [newComment, ...currentComments])
    }

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Comments ({commentCount})
            </h3>
            
            <CommentForm
                postId={postId}
                parentId={null}
                onCommentPosted={handleCommentPosted}
            />

            <div className="mt-6 space-y-5">
                {loading ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        Loading comments...
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No comments yet. Be the first to comment!
                    </div>
                ) : (
                    comments.map(comment => (
                        <Comment 
                            key={comment.id}
                            comment={comment}
                            postId={postId}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
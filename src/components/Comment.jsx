import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Smile, MessageSquare } from 'lucide-react'
import AnonAvatar from './AnonAvatar'
import CommentForm from './CommentForm'

dayjs.extend(relativeTime)

const COMMENT_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🤔', '🙏', '👏', '🤯']

export default function Comment({ comment, postId }) {
    const [isReplying, setIsReplying] = useState(false)
    const [reactionLoading, setReactionLoading] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)

    const [replies, setReplies] = useState(comment.children || [])

    const [internalComment, setInternalComment] = useState(comment)

    useEffect(() => {
        const channel = supabase
            .channel(`comment-${comment.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'comments',
                filter: `id=eq.${comment.id}`
            }, payload => {
                setInternalComment(prev => ({ ...prev, ...payload.new }))
            })
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [comment.id])

    async function handleReaction(emoji) {
        if (reactionLoading) return
        setReactionLoading(true)

        try {
            const reactions = internalComment.reactions || {}
            const newCount = (reactions[emoji] || 0) + 1
            const updatedReactions = { ...reactions, [emoji]: newCount }

            const { error } = await supabase
                .from('comments')
                .update({ reactions: updatedReactions })
                .eq('id', comment.id)

            if (error) throw error
            
            setInternalComment(prev => ({ ...prev, reactions: updatedReactions }))
            setShowEmojiPicker(false)
        } catch (err) {
            console.error('Reaction error:', err)
        } finally {
            setReactionLoading(false)
        }
    }

    function handleReplyPosted(newReply) {
        setReplies(currentReplies => [newReply, ...currentReplies])
        setIsReplying(false)
    }

    return (
        <div className="flex items-start gap-3">
            <AnonAvatar authorId={internalComment.author_id} size="sm" />
            <div className="flex-1 min-w-0">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-1">
                        <div className={`text-sm font-medium ${
                            internalComment.author_name
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-gray-900 dark:text-gray-100'
                        }`}>
                            {internalComment.author_name || 'Anonymous'}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {dayjs(internalComment.created_at).fromNow()}
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                        {internalComment.text}
                    </p>
                    
                    {internalComment.reactions && Object.keys(internalComment.reactions).length > 0 && (
                        <div className="mt-2 flex items-center gap-1 flex-wrap">
                            {Object.entries(internalComment.reactions).filter(([_, count]) => count > 0).map(([emoji, count]) => (
                                <div
                                    key={emoji}
                                    className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs"
                                >
                                    <span>{emoji}</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="mt-2 flex items-center gap-4 pl-1">
                    <div className="relative">
                        <button
                            onClick={() => setShowEmojiPicker(prev => !prev)}
                            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600"
                            title="React"
                        >
                            <Smile className="w-4 h-4" />
                            <span>React</span>
                        </button>
                        
                        {showEmojiPicker && (
                            <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 flex gap-1 z-10">
                                {COMMENT_EMOJIS.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => handleReaction(emoji)}
                                        disabled={reactionLoading}
                                        className="text-xl hover:scale-125 transition disabled:opacity-50"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <button
                        onClick={() => setIsReplying(prev => !prev)}
                        className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600"
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span>Reply</span>
                    </button>
                </div>

                {isReplying && (
                    <div className="mt-3">
                        <CommentForm
                            postId={postId}
                            parentId={comment.id}
                            onCommentPosted={handleReplyPosted}
                        />
                    </div>
                )}
                
                {replies.length > 0 && (
                    <div className="mt-4 space-y-4 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                        {replies.map(reply => (
                            <Comment
                                key={reply.id}
                                comment={reply}
                                postId={postId}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
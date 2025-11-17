import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Smile, MessageSquare, ChevronDown, ChevronUp, MoreVertical } from 'lucide-react'
import AnonAvatar from './AnonAvatar'
import CommentForm from './CommentForm'

dayjs.extend(relativeTime)

const COMMENT_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🤔', '🙏', '👏', '🤯', '😍', '🧐']
const MAX_MOBILE_DEPTH = 3

export default function Comment({ comment, postId, depth = 0 }) {
    const [isReplying, setIsReplying] = useState(false)
    const [reactionLoading, setReactionLoading] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showReplies, setShowReplies] = useState(true)
    const [showActions, setShowActions] = useState(false)

    const [replies, setReplies] = useState(comment.children || [])
    const [internalComment, setInternalComment] = useState(comment)

    const isNested = depth > 0
    const hasReplies = replies.length > 0
    const reachedMaxDepth = depth >= MAX_MOBILE_DEPTH

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

    const totalReactions = internalComment.reactions
        ? Object.values(internalComment.reactions).reduce((sum, count) => sum + count, 0)
        : 0

    return (
        <div className={`${isNested ? 'ml-2 sm:ml-6' : ''}`}>
            <div className="flex items-start gap-2 sm:gap-3 mb-2">
                <AnonAvatar authorId={internalComment.author_id} size={isNested ? 'sm' : 'md'} />

                <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className={`text-sm sm:text-base font-semibold truncate ${internalComment.author_name
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-900 dark:text-gray-100'
                                    }`}>
                                    {internalComment.author_name || 'Anonymous'}
                                </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                {dayjs(internalComment.created_at).fromNow()}
                            </span>
                        </div>

                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                            {internalComment.text}
                        </p>

                        {totalReactions > 0 && (
                            <div className="flex flex-col gap-1 sm:gap-1.5 mt-2.5">
                                {Object.entries(internalComment.reactions)
                                    .filter(([_, count]) => count > 0)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 4)
                                    .map(([emoji, count]) => (
                                        <div
                                            key={emoji}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600 text-xs"
                                        >
                                            <span className="text-sm">{emoji}</span>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                {count}
                                            </span>
                                        </div>
                                    ))}
                                {Object.keys(internalComment.reactions || {}).length > 4 && (
                                    <div className="inline-flex items-center px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400">
                                        +{Object.keys(internalComment.reactions).length - 4}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-0.5 sm:gap-1 mt-1.5 px-1 flex-wrap">
                        <div className="relative">
                            <button
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all touch-manipulation"
                            >
                                <Smile className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden xs:inline">React</span>
                            </button>

                            {showEmojiPicker && (
                                <>
                                    <div
                                        className="fixed inset-0 z-30"
                                        onClick={() => setShowEmojiPicker(false)}
                                    />
                                    <div className="absolute top-0 left-full ml-2 z-40 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-2 w-fit">
                                        <div className="flex flex-nowrap gap-1">
                                            {COMMENT_EMOJIS.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => handleReaction(emoji)}
                                                    disabled={reactionLoading}
                                                    className="text-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg active:scale-90 transition-all disabled:opacity-50 touch-manipulation"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {!reachedMaxDepth && (
                            <button
                                onClick={() => setIsReplying(!isReplying)}
                                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all touch-manipulation"
                            >
                                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden xs:inline">Reply</span>
                            </button>
                        )}

                        {hasReplies && (
                            <button
                                onClick={() => setShowReplies(!showReplies)}
                                className="ml-auto flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 active:scale-95 transition-all touch-manipulation"
                            >
                                {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                <span>{replies.length}</span>
                            </button>
                        )}
                    </div>

                    {isReplying && (
                        <div className="mt-2.5">
                            <CommentForm
                                postId={postId}
                                parentId={comment.id}
                                onCommentPosted={handleReplyPosted}
                            />
                        </div>
                    )}
                </div>
            </div>

            {hasReplies && showReplies && (
                <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-2 sm:pl-4 ml-3 sm:ml-6 mt-1 space-y-2">
                    {replies.map(reply => (
                        <Comment
                            key={reply.id}
                            comment={reply}
                            postId={postId}
                            depth={depth + 1}
                        />
                    ))}

                    {reachedMaxDepth && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 italic px-2 py-1">
                            💡 Reply to the parent comment to continue the thread
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
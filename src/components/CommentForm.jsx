import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Send, X } from 'lucide-react'

function getAnonId() {
    let anonId = localStorage.getItem('anonId')
    if (!anonId) {
        anonId = crypto.randomUUID()
        localStorage.setItem('anonId', anonId)
    }
    return anonId
}

export default function CommentForm({ postId, parentId = null, onCommentPosted }) {
    const [text, setText] = useState('')
    const [loading, setLoading] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        if (!text.trim() || loading) return

        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        const anonId = getAnonId()

        try {
            const { data, error } = await supabase
                .from('comments')
                .insert([{
                    post_id: postId,
                    parent_id: parentId,
                    text: text.trim(),
                    author_id: anonId,
                    author_name: session ? 'Admin' : null,
                    reactions: {}
                }])
                .select()

            if (error) throw error

            const { error: rpcError } = await supabase.rpc('increment_comment_count', {
                post_id_in: postId
            })

            if (rpcError) throw rpcError

            if (onCommentPosted && data) {
                onCommentPosted(data[0])
            }
            setText('')
            setIsFocused(false)
        } catch (err) {
            console.error('Comment error:', err)
            alert('Failed to post comment: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const charCount = text.length
    const isNearLimit = charCount > 450

    return (
        <form onSubmit={handleSubmit} className="relative">
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 100)}
                        placeholder={parentId ? "Write a reply..." : "Write a comment..."}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm sm:text-base resize-none"
                        maxLength={500}
                        rows={isFocused ? 3 : 1}
                        style={{ minHeight: isFocused ? '80px' : '44px' }}
                    />
                    {isFocused && (
                        <div className={`absolute bottom-2 right-2 text-xs ${isNearLimit ? 'text-red-500' : 'text-gray-400'}`}>
                            {charCount}/500
                        </div>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={loading || !text.trim()}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2 flex-shrink-0 min-w-[44px] touch-manipulation"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            <span className="hidden sm:inline">Send</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    )
}
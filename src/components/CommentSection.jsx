import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Send } from 'lucide-react'

dayjs.extend(relativeTime)

export default function CommentSection({ postId }) {
    const [comments, setComments] = useState([])
    const [text, setText] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchComments()
        const channel = supabase
            .channel(`comments-${postId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'comments',
                filter: `post_id=eq.${postId}`
            }, payload => {
                setComments(prev => [...prev, payload.new])
            })
            .subscribe()
        
        return () => supabase.removeChannel(channel)
    }, [postId])

    async function fetchComments() {
        const { data } = await supabase
            .from('comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true })
        setComments(data || [])
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!text.trim() || loading) return

        setLoading(true)

        try {
            // Rate limit check
            const r = await fetch('/.netlify/functions/rate-limit', {
                method: 'POST',
                body: JSON.stringify({ action: 'comment' }),
                headers: { 'Content-Type': 'application/json' }
            })
            
            if (!r.ok) {
                alert('Too many comments — please slow down')
                setLoading(false)
                return
            }

            const { error } = await supabase
                .from('comments')
                .insert([{ post_id: postId, text }])
            
            if (error) throw error

            setText('')
        } catch (err) {
            console.error('Comment error:', err)
            alert('Failed to post comment')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Comments ({comments.length})
            </h3>
            
            {/* Comment Input */}
            <form onSubmit={handleSubmit} className="mb-6">
                <div className="flex gap-2">
                    <input
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    />
                    <button
                        type="submit"
                        disabled={loading || !text.trim()}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </form>

            {/* Comments List */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No comments yet. Be the first to comment!
                    </div>
                ) : (
                    comments.map(c => (
                        <div key={c.id} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    A
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        Anonymous
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                                        {c.text}
                                    </p>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        {dayjs(c.created_at).fromNow()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
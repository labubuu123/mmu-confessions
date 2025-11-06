import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import dayjs from 'dayjs'

export default function CommentSection({ postId }) {
    const [comments, setComments] = useState([])
    const [text, setText] = useState('')

    useEffect(() => {
    fetchComments()
    const channel = supabase.channel('comments').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, payload => {
        if (payload.new.post_id === postId) setComments(prev => [...prev, payload.new])
    }).subscribe()
    return () => supabase.removeChannel(channel)
    }, [postId])

    async function fetchComments() {
    const { data } = await supabase.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: true })
    setComments(data || [])
    }

    async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return

    // rate-limit via Netlify
    const r = await fetch('/.netlify/functions/rate-limit', { method: 'POST', body: JSON.stringify({ action: 'comment' }), headers: { 'Content-Type': 'application/json' } })
    if (!r.ok) { alert('Too many comments — slow down'); return }

    await supabase.from('comments').insert([{ post_id: postId, text }])
    setText('')
    }

    return (
    <div>
        <h3 className="text-md font-medium text-gray-800 dark:text-gray-100">Comments</h3>
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Write a comment..." className="flex-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
        <button className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Post</button>
        </form>

        <div className="mt-4 space-y-3 max-h-56 overflow-y-auto pr-2">
        {comments.map(c => (
            <div key={c.id} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
            <div className="text-sm text-gray-800 dark:text-gray-100">{c.text}</div>
            <div className="text-xs small-muted">{dayjs(c.created_at).format('HH:mm • MMM D')}</div>
            </div>
        ))}
        {comments.length === 0 && <div className="text-sm small-muted">No comments yet.</div>}
        </div>
    </div>
    )
}

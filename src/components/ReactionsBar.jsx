import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const EMOJIS = ['😂','😍','😡','😢','👍','🔥']

export default function ReactionsBar({ postId }) {
    const [reactions, setReactions] = useState({})

    useEffect(() => {
    fetchReactions()
    const channel = supabase.channel('reactions')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reactions' }, payload => { if (payload.new.post_id === postId) fetchReactions() })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reactions' }, payload => { if (payload.new.post_id === postId) fetchReactions() })
        .subscribe()
    return () => supabase.removeChannel(channel)
    }, [postId])

    async function fetchReactions() {
    const { data } = await supabase.from('reactions').select('*').eq('post_id', postId)
    const map = {}
    (data || []).forEach(r => map[r.emoji] = r.count)
    setReactions(map)
    }

    async function handleReact(emoji) {
    // rate-limit via Netlify
    const r = await fetch('/.netlify/functions/rate-limit', { method: 'POST', body: JSON.stringify({ action: 'react' }), headers: { 'Content-Type': 'application/json' } })
    if (!r.ok) { alert('Too many reactions — slow down'); return }

    const { data: existing } = await supabase.from('reactions').select('*').eq('post_id', postId).eq('emoji', emoji)
    if (existing && existing.length > 0) {
        const row = existing[0]
        await supabase.from('reactions').update({ count: row.count + 1 }).eq('id', row.id)
    } else {
        await supabase.from('reactions').insert([{ post_id: postId, emoji, count: 1 }])
    }
    fetchReactions()
    }

    return (
    <div className="flex gap-2 flex-wrap">
        {EMOJIS.map(e => (
        <button key={e} onClick={() => handleReact(e)} className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            <span className="text-xl">{e}</span>
            <span className="ml-2 text-sm small-muted">{reactions[e] || 0}</span>
        </button>
        ))}
    </div>
    )
}

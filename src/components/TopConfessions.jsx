import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import dayjs from 'dayjs'

export default function TopConfessions() {
    const [items, setItems] = useState([])
    useEffect(() => { fetchTop() }, [])
    async function fetchTop() {
    const { data } = await supabase.from('confessions').select('*').eq('approved', true).order('likes_count', { ascending: false }).limit(20)
    setItems(data || [])
    }
    return (
    <div className="max-w-3xl mx-auto py-8">
        <h3 className="text-lg font-medium mb-4">Top confessions</h3>
        <div className="space-y-4">
        {items.map(i => (
            <article key={i.id} className="card p-4 rounded shadow-sm">
            <div className="text-sm small-muted">{dayjs(i.created_at).format('MMM D')}</div>
            <p className="mt-2">{i.text}</p>
            <div className="mt-2 text-sm small-muted">❤️ {i.likes_count || 0} • {i.tags?.map(t => `#${t}`).join(' ')}</div>
            </article>
        ))}
        </div>
    </div>
    )
}

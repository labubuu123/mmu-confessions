import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const EMOJIS = ['👍', '😂', '😍', '😡', '😢', '🔥']

export default function ReactionsBar({ postId }) {
    const [reactions, setReactions] = useState({})
    const [loading, setLoading] = useState(false)
    const [animating, setAnimating] = useState(null)

    useEffect(() => {
        fetchReactions()
        const channel = supabase
            .channel(`reactions-${postId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'reactions',
                filter: `post_id=eq.${postId}`
            }, () => fetchReactions())
            .subscribe()
        
        return () => supabase.removeChannel(channel)
    }, [postId])

    async function fetchReactions() {
        const { data } = await supabase
            .from('reactions')
            .select('*')
            .eq('post_id', postId)
        
        const map = {}
        ;(data || []).forEach(r => map[r.emoji] = r.count)
        setReactions(map)
    }

    async function handleReact(emoji) {
        if (loading) return
        setLoading(true)
        setAnimating(emoji)

        try {
            // Rate limit check
            const r = await fetch('/.netlify/functions/rate-limit', { 
                method: 'POST',
                body: JSON.stringify({ action: 'reaction' }), 
                headers: { 'Content-Type': 'application/json' } 
            })
            
            if (!r.ok) {
                alert('Too many reactions — please slow down')
                return
            }

            // Call RPC function
            const { error } = await supabase.rpc('increment_reaction', {
                post_id_in: postId,
                emoji_in: emoji
            })

            if (error) throw error
            
            // Optimistic update
            setReactions(prev => ({
                ...prev,
                [emoji]: (prev[emoji] || 0) + 1
            }))

            setTimeout(() => setAnimating(null), 300)
        } catch (err) {
            console.error('Failed to react:', err)
            alert('Failed to add reaction')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-wrap gap-2">
            {EMOJIS.map(emoji => (
                <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    disabled={loading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        animating === emoji ? 'scale-110' : ''
                    }`}
                >
                    <span className="text-xl">{emoji}</span>
                    {reactions[emoji] > 0 && (
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {reactions[emoji]}
                        </span>
                    )}
                </button>
            ))}
        </div>
    )
}
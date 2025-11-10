import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🤔', '🙏', '👏', '🤯']

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
            }, () => {
                fetchReactions()
            })
            .subscribe()
        
        return () => supabase.removeChannel(channel)
    }, [postId])

    async function fetchReactions() {
        try {
            const { data, error } = await supabase
                .from('reactions')
                .select('*')
                .eq('post_id', postId)
            
            if (error) {
                console.error('Fetch reactions error:', error)
                return
            }
            
            const map = {}
            ;(data || []).forEach(r => map[r.emoji] = r.count)
            setReactions(map)
        } catch (err) {
            console.error('Error fetching reactions:', err)
        }
    }

    async function handleReact(emoji) {
        if (loading) return
        
        setLoading(true)
        setAnimating(emoji)

        try {
            const { data, error } = await supabase.rpc('increment_reaction', {
                post_id_in: postId,
                emoji_in: emoji
            })

            if (error) {
                console.error('RPC error:', error)
                throw error
            }
            
            setReactions(prev => ({
                ...prev,
                [emoji]: (prev[emoji] || 0) + 1
            }))

            setTimeout(() => setAnimating(null), 300)
            
            setTimeout(() => fetchReactions(), 500)
        } catch (err) {
            console.error('Failed to react:', err)
            alert('Failed to add reaction. Please try again.')
            
            fetchReactions()
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
                        animating === emoji ? 'scale-110 shadow-lg' : ''
                    }`}
                    title={`React with ${emoji}`}
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
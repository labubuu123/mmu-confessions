import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🤔', '🙏', '👏', '🤯', '😍', '🧐']

function getAnonId() {
    let anonId = localStorage.getItem('anonId')
    if (!anonId) {
        anonId = crypto.randomUUID()
        localStorage.setItem('anonId', anonId)
    }
    return anonId
}

export default function ReactionsBar({ postId }) {
    const [reactions, setReactions] = useState({})
    const [userReaction, setUserReaction] = useState(null)
    const [loading, setLoading] = useState(false)
    const [animating, setAnimating] = useState(null)

    useEffect(() => {
        fetchReactions()
        checkUserReaction()

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
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'post_user_reactions',
                filter: `post_id=eq.${postId}`
            }, () => {
                checkUserReaction()
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
                ; (data || []).forEach(r => map[r.emoji] = r.count)
            setReactions(map)
        } catch (err) {
            console.error('Error fetching reactions:', err)
        }
    }

    async function checkUserReaction() {
        const anonId = getAnonId()

        try {
            const { data, error } = await supabase
                .from('post_user_reactions')
                .select('emoji')
                .eq('post_id', postId)
                .eq('user_id', anonId)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('Check user reaction error:', error)
                return
            }

            setUserReaction(data?.emoji || null)
        } catch (err) {
            console.error('Error checking user reaction:', err)
        }
    }

    async function handleReact(emoji) {
        if (loading) return

        setLoading(true)
        setAnimating(emoji)
        const anonId = getAnonId()

        try {
            const { error } = await supabase.rpc('toggle_post_reaction', {
                post_id_in: postId,
                emoji_in: emoji,
                user_id_in: anonId
            })

            if (error) {
                console.error('RPC error:', error)
                throw error
            }

            if (userReaction === emoji) {
                setUserReaction(null)
                setReactions(prev => ({
                    ...prev,
                    [emoji]: Math.max(0, (prev[emoji] || 0) - 1)
                }))
            } else if (userReaction && userReaction !== emoji) {
                setUserReaction(emoji)
                setReactions(prev => ({
                    ...prev,
                    [userReaction]: Math.max(0, (prev[userReaction] || 0) - 1),
                    [emoji]: (prev[emoji] || 0) + 1
                }))
            } else {
                setUserReaction(emoji)
                setReactions(prev => ({
                    ...prev,
                    [emoji]: (prev[emoji] || 0) + 1
                }))
            }

            setTimeout(() => setAnimating(null), 300)

            setTimeout(() => {
                fetchReactions()
                checkUserReaction()
            }, 500)

            window.dispatchEvent(new CustomEvent('challengeProgress', {
                detail: { action: { type: 'reaction' } }
            }))

        } catch (err) {
            console.error('Failed to react:', err)
            alert('Failed to add reaction. Please try again.')
            fetchReactions()
            checkUserReaction()
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-wrap gap-2">
            {EMOJIS.map(emoji => {
                const isSelected = userReaction === emoji
                const count = reactions[emoji] || 0

                return (
                    <button
                        key={emoji}
                        onClick={() => handleReact(emoji)}
                        disabled={loading}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isSelected
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-500 scale-110 shadow-lg'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                            } ${animating === emoji ? 'scale-110 shadow-lg' : ''}`}
                        title={isSelected ? `Remove ${emoji}` : `React with ${emoji}`}
                    >
                        <span className="text-xl">{emoji}</span>
                        {count > 0 && (
                            <span className={`text-sm font-semibold ${isSelected
                                ? 'text-indigo-700 dark:text-indigo-300'
                                : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                {count}
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
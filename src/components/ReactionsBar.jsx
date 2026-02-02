import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { SmilePlus, ChevronDown } from 'lucide-react'

const PRIMARY_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🤔', '🙏', '👏', '🤯', '😍','🔥', '💯']

const EXTRA_EMOJIS = [
    '🚀', '🤡', '💀', '💩', '🥴', '👻',
    '💅', '🤝', '🥂', '🌈', '🧐', '🤫', '😴', '🤮',
    '🤧', '🤒', '🤕', '🥶', '🥵', '🥳', '😎', '😏',
]

const ALL_EMOJIS = [...PRIMARY_EMOJIS, ...EXTRA_EMOJIS]

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
    const [showPicker, setShowPicker] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const pickerRef = useRef(null)

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
            }, () => fetchReactions())
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'post_user_reactions',
                filter: `post_id=eq.${postId}`
            }, () => checkUserReaction())
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [postId])

    useEffect(() => {
        function handleClickOutside(event) {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setShowPicker(false)
                setIsExpanded(false)
            }
        }
        if (showPicker) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showPicker]);

    async function fetchReactions() {
        try {
            const { data, error } = await supabase
                .from('reactions')
                .select('*')
                .eq('post_id', postId)

            if (error) return
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
            const { data } = await supabase
                .from('post_user_reactions')
                .select('emoji')
                .eq('post_id', postId)
                .eq('user_id', anonId)
                .single()
            setUserReaction(data?.emoji || null)
        } catch (err) {
        }
    }

    async function handleReact(emoji) {
        if (loading) return
        setLoading(true)
        setShowPicker(false)
        setIsExpanded(false)

        const anonId = getAnonId()

        const previousUserReaction = userReaction
        const previousReactions = { ...reactions }

        if (userReaction === emoji) {
            setUserReaction(null)
            setReactions(prev => ({ ...prev, [emoji]: Math.max(0, (prev[emoji] || 0) - 1) }))
        } else {
            setUserReaction(emoji)
            setReactions(prev => {
                const next = { ...prev }
                if (previousUserReaction) {
                    next[previousUserReaction] = Math.max(0, (next[previousUserReaction] || 0) - 1)
                }
                next[emoji] = (next[emoji] || 0) + 1
                return next
            })
        }

        try {
            const { error } = await supabase.rpc('toggle_post_reaction', {
                post_id_in: postId,
                emoji_in: emoji,
                user_id_in: anonId
            })

            if (error) throw error

            window.dispatchEvent(new CustomEvent('challengeProgress', {
                detail: { action: { type: 'reaction' } }
            }))

        } catch (err) {
            console.error('Failed to react:', err)
            setUserReaction(previousUserReaction)
            setReactions(previousReactions)
        } finally {
            setLoading(false)
            setTimeout(() => {
                fetchReactions()
                checkUserReaction()
            }, 1000)
        }
    }

    const activeEmojis = ALL_EMOJIS.filter(emoji => (reactions[emoji] > 0) || userReaction === emoji);

    const pickerEmojis = isExpanded ? ALL_EMOJIS : PRIMARY_EMOJIS;

    return (
        <div className="relative flex flex-wrap items-center gap-2">
            <AnimatePresence initial={false}>
                {activeEmojis.map(emoji => (
                    <motion.button
                        key={emoji}
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        onClick={() => handleReact(emoji)}
                        disabled={loading}
                        className={`
                            group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200
                            ${userReaction === emoji
                                ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-700/50 text-indigo-700 dark:text-indigo-300 shadow-sm'
                                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }
                        `}
                    >
                        <span className="text-lg leading-none filter drop-shadow-sm group-hover:scale-110 transition-transform">
                            {emoji}
                        </span>
                        <span>{reactions[emoji]}</span>
                    </motion.button>
                ))}
            </AnimatePresence>

            <div className="relative flex items-center" ref={pickerRef}>
                <motion.button
                    layout
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowPicker(!showPicker)}
                    className={`
                        flex items-center justify-center w-9 h-9 rounded-full border transition-colors
                        ${showPicker
                            ? 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100'
                            : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        }
                    `}
                    title="Add Reaction"
                >
                    <SmilePlus size={18} />
                </motion.button>

                <AnimatePresence>
                    {showPicker && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, x: -10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95, x: -10 }}
                            transition={{ type: "spring", duration: 0.3 }}
                            className={`
                                absolute z-50 p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl 
                                top-full left-0 mt-2 sm:mt-0 sm:top-1/2 sm:left-full sm:ml-2 sm:-translate-y-1/2
                                w-max max-w-[95vw] sm:w-auto sm:max-w-none sm:min-w-[500px]
                            `}
                        >
                            <div className="flex flex-col gap-2">
                                <div className="grid grid-cols-7 sm:grid-cols-[repeat(14,minmax(0,1fr))] gap-1">
                                    {pickerEmojis.map((emoji) => (
                                        <button
                                            key={emoji}
                                            onClick={() => handleReact(emoji)}
                                            className={`
                                                p-2 rounded-xl text-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors flex items-center justify-center
                                                ${userReaction === emoji ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''}
                                            `}
                                        >
                                            <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                                                {emoji}
                                            </motion.div>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="flex items-center justify-center gap-1 w-full py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    {isExpanded ? (
                                        <>Show Less <ChevronDown size={14} className="rotate-180" /></>
                                    ) : (
                                        <>More Emojis <ChevronDown size={14} /></>
                                    )}
                                </button>
                            </div>

                            <div className="hidden sm:block absolute top-1/2 -left-1.5 w-3 h-3 bg-white/95 dark:bg-slate-900/95 border-b border-l border-gray-200 dark:border-slate-700 rotate-45 transform -translate-y-1/2"></div>

                            <div className="block sm:hidden absolute -top-1.5 left-3 w-3 h-3 bg-white/95 dark:bg-slate-900/95 border-t border-l border-gray-200 dark:border-slate-700 rotate-45 transform"></div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
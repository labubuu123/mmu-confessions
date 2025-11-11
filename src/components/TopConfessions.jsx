import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { Heart, TrendingUp, MessageCircle, Calendar, RefreshCw } from 'lucide-react'

export default function TopConfessions() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [timeRange, setTimeRange] = useState('all')
    const [lastUpdate, setLastUpdate] = useState(new Date())
    const navigate = useNavigate()

    useEffect(() => {
        fetchTop()
        
        const channel = supabase
            .channel('top-confessions-realtime')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'confessions'
            }, (payload) => {
                console.log('Real-time update received:', payload)
                handleRealtimeUpdate(payload)
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'reactions'
            }, (payload) => {
                console.log('Reaction update received:', payload)
                fetchTop()
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'comments'
            }, (payload) => {
                console.log('Comment update received:', payload)
                fetchTop()
            })
            .subscribe()

        const interval = setInterval(() => {
            setUpdating(true)
            fetchTop().finally(() => setUpdating(false))
        }, 30000)
        
        return () => {
            supabase.removeChannel(channel)
            clearInterval(interval)
        }
    }, [timeRange])

    const handleRealtimeUpdate = (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload

        if (eventType === 'INSERT' && newRecord.approved) {
            setItems(prev => {
                if (prev.find(p => p.id === newRecord.id)) return prev
                return [newRecord, ...prev].sort((a, b) => 
                    (b.likes_count || 0) - (a.likes_count || 0)
                )
            })
        } else if (eventType === 'UPDATE') {
            setItems(prev => prev.map(item => 
                item.id === newRecord.id ? newRecord : item
            ).sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0)))
        } else if (eventType === 'DELETE') {
            setItems(prev => prev.filter(item => item.id !== oldRecord.id))
        }
        
        setLastUpdate(new Date())
    }

    async function fetchTop() {
        setLoading(true)
        
        let query = supabase
            .from('confessions')
            .select('*')
            .eq('approved', true)
            .order('likes_count', { ascending: false })
            .limit(20)

        if (timeRange === 'week') {
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            query = query.gte('created_at', weekAgo.toISOString())
        } else if (timeRange === 'month') {
            const monthAgo = new Date()
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            query = query.gte('created_at', monthAgo.toISOString())
        }
        
        const { data } = await query
        
        if (data) {
            const postsWithReactions = await Promise.all(
                data.map(async (post) => {
                    const { data: reactions } = await supabase
                        .from('reactions')
                        .select('emoji, count')
                        .eq('post_id', post.id)
                    
                    const reactionsMap = {}
                    reactions?.forEach(r => {
                        reactionsMap[r.emoji] = r.count
                    })
                    
                    return { ...post, reactions: reactionsMap }
                })
            )
            setItems(postsWithReactions)
        } else {
            setItems([])
        }
        
        setLoading(false)
        setLastUpdate(new Date())
    }

    function handleClick(post) {
        navigate(`/post/${post.id}`)
    }

    const getTotalReactions = (reactions) => {
        if (!reactions) return 0
        return Object.values(reactions).reduce((sum, count) => sum + count, 0)
    }

    if (loading && items.length === 0) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="flex justify-center items-center py-20">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl shadow-lg">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                🔥 Top Confessions
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Most liked confessions • Updated {lastUpdate.toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                    
                    <button
                        onClick={() => {
                            setUpdating(true)
                            fetchTop().finally(() => setUpdating(false))
                        }}
                        disabled={updating}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 ${updating ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
                    {[
                        { value: 'all', label: 'All Time', icon: '🌟' },
                        { value: 'month', label: 'This Month', icon: '📅' },
                        { value: 'week', label: 'This Week', icon: '⚡' }
                    ].map(({ value, label, icon }) => (
                        <button
                            key={value}
                            onClick={() => setTimeRange(value)}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition text-sm ${
                                timeRange === value
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            <span className="mr-1">{icon}</span>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {updating && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-blue-600 dark:text-blue-400">Updating stats...</span>
                </div>
            )}

            {items.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">😢</div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        No confessions found for this time range.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {items.map((item, index) => (
                        <article
                            key={item.id}
                            onClick={() => handleClick(item)}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl border border-gray-200 dark:border-gray-700 p-5 cursor-pointer transition-all duration-300 group"
                        >
                            <div className="flex gap-4">
                                <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl relative ${
                                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg' :
                                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700 shadow-md' :
                                    index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white shadow-md' :
                                    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                }`}>
                                    {index < 3 && (
                                        <div className="absolute -top-1 -right-1 text-lg">
                                            {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
                                        </div>
                                    )}
                                    #{index + 1}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-gray-900 dark:text-gray-100 line-clamp-3 leading-relaxed mb-3">
                                        {item.text}
                                    </p>

                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-full">
                                                <div className="flex -space-x-1">
                                                    {item.reactions && Object.keys(item.reactions).slice(0, 3).map((emoji, i) => (
                                                        <span key={emoji} className="text-base" style={{ zIndex: 3 - i }}>
                                                            {emoji}
                                                        </span>
                                                    ))}
                                                </div>
                                                <span className="font-bold text-red-600 dark:text-red-400 ml-1">
                                                    {getTotalReactions(item.reactions)}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                                                <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                                    {item.comments_count || 0}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-xs">
                                                    {new Date(item.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {item.tags && item.tags.length > 0 && (
                                            <div className="flex gap-1 flex-wrap">
                                                {item.tags.slice(0, 2).map(tag => (
                                                    <span
                                                        key={tag}
                                                        className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-medium"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    )
}
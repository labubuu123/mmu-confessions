import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { Heart, TrendingUp, MessageCircle, Calendar } from 'lucide-react'

export default function TopConfessions() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState('all')
    const navigate = useNavigate()

    useEffect(() => {
        fetchTop()
    }, [timeRange])

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
        setItems(data || [])
        setLoading(false)
    }

    function handleClick(post) {
        navigate(`/post/${post.id}`)
    }

    if (loading) {
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
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Top Confessions
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Most liked confessions
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setTimeRange('all')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition text-sm ${
                            timeRange === 'all'
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        All Time
                    </button>
                    <button
                        onClick={() => setTimeRange('month')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition text-sm ${
                            timeRange === 'month'
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        This Month
                    </button>
                    <button
                        onClick={() => setTimeRange('week')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition text-sm ${
                            timeRange === 'week'
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        This Week
                    </button>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-20">
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
                                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
                                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg' :
                                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700 shadow-md' :
                                    index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white shadow-md' :
                                    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                }`}>
                                    {index + 1}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-gray-900 dark:text-gray-100 line-clamp-3 leading-relaxed mb-3">
                                        {item.text}
                                    </p>

                                    {item.media_url && (
                                        <div className="mt-3 mb-3">
                                            {item.media_type === 'images' ? (
                                                <img
                                                    src={item.media_url}
                                                    alt="media"
                                                    className="w-full max-h-48 object-cover rounded-lg"
                                                />
                                            ) : item.media_type === 'video' ? (
                                                <video
                                                    src={item.media_url}
                                                    className="w-full max-h-48 rounded-lg"
                                                    controls
                                                />
                                            ) : item.media_type === 'audio' ? (
                                                <audio controls className="w-full">
                                                    <source src={item.media_url} />
                                                </audio>
                                            ) : null}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1.5 text-red-500">
                                                <Heart className="w-4 h-4 fill-current" />
                                                <span className="font-semibold">{item.likes_count || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-blue-500">
                                                <MessageCircle className="w-4 h-4" />
                                                <span className="font-semibold">{item.comments_count || 0}</span>
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
                                                        className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-xs font-medium"
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
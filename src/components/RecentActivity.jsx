import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { MessageSquare, ExternalLink, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function RecentActivity() {
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetchInitialActivity()

        const channel = supabase
            .channel('public:comments')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'comments' },
                (payload) => handleNewComment(payload.new)
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    async function fetchInitialActivity() {
        try {
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    id,
                    text,
                    author_name,
                    created_at,
                    post_id,
                    confessions (
                        id,
                        text,
                        approved
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(10)

            if (error) throw error

            const validActivities = data.filter(item => item.confessions && item.confessions.approved)
            setActivities(validActivities)
        } catch (error) {
            console.error('Error fetching activity:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleNewComment(newComment) {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                confessions (
                    id,
                    text,
                    approved
                )
            `)
            .eq('id', newComment.id)
            .single()

        if (!error && data && data.confessions?.approved) {
            setActivities(prev => [data, ...prev].slice(0, 10))
        }
    }

    const formatTime = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = (now - date) / 1000

        if (diff < 60) return 'Just now'
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
        return `${Math.floor(diff / 86400)}d ago`
    }

    if (loading && activities.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded"></div>
                    ))}
                </div>
            </div>
        )
    }

    if (activities.length === 0) return null

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sticky top-20">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                <Activity className="w-5 h-5 text-green-500" />
                <h3 className="font-bold text-gray-900 dark:text-gray-100">
                    Live Activity
                </h3>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                {activities.map((activity) => (
                    <div
                        key={activity.id}
                        className="group relative flex flex-col gap-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900"
                        onClick={() => navigate(`/post/${activity.post_id}`)}
                    >
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {activity.author_name || 'Anonymous'}
                                </span>
                            </div>
                            <span>{formatTime(activity.created_at)}</span>
                        </div>

                        <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2 font-medium">
                            "{activity.text}"
                        </p>

                        <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                            <MessageSquare className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">
                                on: {activity.confessions?.text.substring(0, 30)}...
                            </span>
                            <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
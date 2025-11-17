import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Loader2, MessageSquare, User, Heart } from 'lucide-react'

function UserStatsWidget({ userId, fetchKey }) {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            if (!userId) {
                setLoading(false)
                setStats(null)
                return
            }

            setLoading(true)
            try {
                let statsData = null;

                const { data, error } = await supabase
                    .from('user_reputation')
                    .select('*')
                    .eq('author_id', userId)
                    .single()

                if (error) {
                    if (error.code === 'PGRST116') {
                        const { data: newData, error: insertError } = await supabase
                            .from('user_reputation')
                            .insert({ author_id: userId })
                            .select()
                            .single()

                        if (insertError) throw insertError
                        statsData = newData
                    } else {
                        throw error
                    }
                } else {
                    statsData = data
                }

                setStats(statsData)

            } catch (error) {
                console.error("Error fetching user stats:", error)
                setStats(null)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [userId, fetchKey])

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center h-24">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Post your first confession to start tracking your stats!
                </p>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Posts</p>
                    <div className="flex items-center justify-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-indigo-500" />
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.post_count || 0}</p>
                    </div>
                </div>
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Comments</p>
                    <div className="flex items-center justify-center gap-1.5">
                        <User className="w-4 h-4 text-blue-500" />
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.comment_count || 0}</p>
                    </div>
                </div>
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reactions</p>
                    <div className="flex items-center justify-center gap-1.5">
                        <Heart className="w-4 h-4 text-red-500" />
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {(stats.post_reactions_received_count || 0) + (stats.comment_reactions_received_count || 0)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserStatsWidget
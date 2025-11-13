import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { TrendingUp, MessageSquare, Heart, Award } from 'lucide-react'

export default function UserStatsWidget() {
    const [stats, setStats] = useState({
        postsCount: 0,
        commentsCount: 0,
        reactionsReceived: 0,
        streak: 0
    })

    useEffect(() => {
        calculateStats()
    }, [])

    async function calculateStats() {
        const anonId = localStorage.getItem('anonId')
        if (!anonId) return

        const { data: posts } = await supabase
            .from('confessions')
            .select('id, created_at')
            .eq('author_id', anonId)
            .eq('approved', true)

        const { data: comments } = await supabase
            .from('comments')
            .select('id')
            .eq('author_id', anonId)

        let streak = 0
        if (posts && posts.length > 0) {
            const dates = posts.map(p => new Date(p.created_at).toDateString())
            const uniqueDates = [...new Set(dates)].sort()

            let currentStreak = 1
            for (let i = uniqueDates.length - 1; i > 0; i--) {
                const current = new Date(uniqueDates[i])
                const prev = new Date(uniqueDates[i - 1])
                const diffDays = (current - prev) / (1000 * 60 * 60 * 24)

                if (diffDays === 1) {
                    currentStreak++
                } else {
                    break
                }
            }
            streak = currentStreak
        }

        setStats({
            postsCount: posts?.length || 0,
            commentsCount: comments?.length || 0,
            reactionsReceived: 0,
            streak
        })
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-gray-900 dark:text-gray-100">Your Anonymous Stats</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.postsCount}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Posts</div>
                </div>

                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.commentsCount}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Comments</div>
                </div>

                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <Heart className="w-6 h-6 text-red-600 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.reactionsReceived}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Reactions</div>
                </div>

                <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                    <span className="text-2xl mb-1 block">🔥</span>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.streak}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Day Streak</div>
                </div>
            </div>
        </div>
    )
}
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { TrendingUp, MessageSquare, Heart, Calendar, Award, Target, Zap } from 'lucide-react'
import { BADGE_DEFINITIONS, calculateUserBadges } from '../utils/badges'

export default function UserAnalytics() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')

    useEffect(() => {
        fetchUserStats()
    }, [])

    async function fetchUserStats() {
        const anonId = localStorage.getItem('anonId')
        if (!anonId) {
            setLoading(false)
            return
        }

        setLoading(true)

        try {
            const { data: posts } = await supabase
                .from('confessions')
                .select('id, created_at, likes_count, comments_count, approved')
                .eq('author_id', anonId)

            const { data: comments } = await supabase
                .from('comments')
                .select('id, created_at, reactions')
                .eq('author_id', anonId)

            const totalPosts = posts?.length || 0
            const approvedPosts = posts?.filter(p => p.approved).length || 0
            const totalComments = comments?.length || 0

            const totalLikes = posts?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0
            const totalPostComments = posts?.reduce((sum, p) => sum + (p.comments_count || 0), 0) || 0

            const mostPopularPost = posts?.sort((a, b) =>
                (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count)
            )[0]

            const dayActivity = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
            posts?.forEach(p => {
                const day = new Date(p.created_at).getDay()
                dayActivity[day]++
            })

            const mostActiveDay = Object.entries(dayActivity)
                .sort((a, b) => b[1] - a[1])[0]

            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

            const engagementRate = totalPosts > 0
                ? ((totalLikes + totalPostComments) / totalPosts).toFixed(1)
                : 0

            const sortedDates = posts?.map(p => new Date(p.created_at).toDateString()).sort()
            const uniqueDates = [...new Set(sortedDates)]

            let streak = 0
            let currentStreak = 0
            const today = new Date().toDateString()

            for (let i = uniqueDates.length - 1; i >= 0; i--) {
                const date = new Date(uniqueDates[i])
                const nextDate = i < uniqueDates.length - 1 ? new Date(uniqueDates[i + 1]) : new Date()
                const diffDays = Math.floor((nextDate - date) / (1000 * 60 * 60 * 24))

                if (diffDays <= 1) {
                    currentStreak++
                } else {
                    break
                }
            }
            streak = currentStreak

            setStats({
                totalPosts,
                approvedPosts,
                totalComments,
                totalLikes,
                totalPostComments,
                mostPopularPost,
                dayActivity,
                mostActiveDay: { day: dayNames[mostActiveDay[0]], count: mostActiveDay[1] },
                engagementRate,
                streak,
                avgLikesPerPost: totalPosts > 0 ? (totalLikes / totalPosts).toFixed(1) : 0,
                avgCommentsPerPost: totalPosts > 0 ? (totalPostComments / totalPosts).toFixed(1) : 0
            })
        } catch (err) {
            console.error('Error fetching stats:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="text-center py-12">
                <Award className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                    Start posting to see your stats!
                </p>
            </div>
        )
    }

    const earnedBadges = calculateUserBadges(stats);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Your Anonymous Stats
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Track your confession journey
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <MetricCard
                    icon={MessageSquare}
                    label="Total Posts"
                    value={stats.totalPosts}
                    color="blue"
                />
                <MetricCard
                    icon={Heart}
                    label="Total Likes"
                    value={stats.totalLikes}
                    color="red"
                />
                <MetricCard
                    icon={TrendingUp}
                    label="Engagement"
                    value={stats.engagementRate}
                    suffix="/post"
                    color="green"
                />
                <MetricCard
                    icon={Zap}
                    label="Day Streak"
                    value={stats.streak}
                    color="orange"
                />
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Activity Overview
                    </h3>
                    <div className="space-y-3">
                        <StatRow label="Approved Posts" value={`${stats.approvedPosts} / ${stats.totalPosts}`} />
                        <StatRow label="Comments Made" value={stats.totalComments} />
                        <StatRow label="Avg Likes/Post" value={stats.avgLikesPerPost} />
                        <StatRow label="Avg Comments/Post" value={stats.avgCommentsPerPost} />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Posting Patterns
                    </h3>
                    <div className="space-y-3">
                        <StatRow
                            label="Most Active Day"
                            value={`${stats.mostActiveDay.day} (${stats.mostActiveDay.count} posts)`}
                        />
                        <StatRow
                            label="Current Streak"
                            value={`${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}`}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    All Badges ({earnedBadges.length}/{BADGE_DEFINITIONS.length})
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                    {BADGE_DEFINITIONS.map((badge) => {
                        const earned = earnedBadges.some(b => b.id === badge.id);
                        return (
                            <div
                                key={badge.id}
                                className={`text-center p-2 sm:p-3 rounded-lg border-2 transition ${earned
                                    ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-40'
                                    }`}
                                title={badge.description}
                            >
                                <div className="text-xl sm:text-2xl mb-1">{badge.icon}</div>
                                <p className="text-[10px] sm:text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                                    {badge.name}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    )
}

function MetricCard({ icon: Icon, label, value, suffix = '', color }) {
    const colors = {
        blue: 'from-blue-500 to-indigo-600',
        red: 'from-red-500 to-pink-600',
        green: 'from-green-500 to-emerald-600',
        orange: 'from-orange-500 to-red-600'
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {value}{suffix}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
    )
}

function StatRow({ label, value }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</span>
        </div>
    )
}
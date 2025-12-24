import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
    TrendingUp, MessageSquare, Heart, Zap, Award,
    Moon, Sun, Coffee, Flame, Crown, Ghost,
    CalendarDays, BarChart2, Share2, Camera
} from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { calculateBadges } from '../utils/badgeSystem'
import dayjs from 'dayjs'

export default function UserAnalytics() {
    const [stats, setStats] = useState(null)
    const [badges, setBadges] = useState([])
    const [loading, setLoading] = useState(true)
    const [persona, setPersona] = useState(null)

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
                .select('id, created_at, likes_count, comments_count, approved, text, mood, tags')
                .eq('author_id', anonId)
                .order('created_at', { ascending: false })

            const { data: comments } = await supabase
                .from('comments')
                .select('id, created_at, reactions')
                .eq('author_id', anonId)

            let events = []
            if (posts?.length > 0) {
                const postIds = posts.map(p => p.id)
                const { data: eventData } = await supabase
                    .from('events')
                    .select('id, confession_id')
                    .in('confession_id', postIds)
                if (eventData) events = eventData
            }

            const totalPosts = posts?.length || 0
            const totalComments = comments?.length || 0
            const totalLikes = posts?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0
            const totalPostComments = posts?.reduce((sum, p) => sum + (p.comments_count || 0), 0) || 0

            const approvedPosts = posts?.filter(p => p.approved).length || 0
            const karmaScore = (approvedPosts * 10) + totalLikes + (totalPostComments * 2) + (totalComments * 5)

            const today = dayjs()
            const heatmapData = []
            const dateMap = {}

            posts?.forEach(p => {
                const d = dayjs(p.created_at).format('YYYY-MM-DD')
                dateMap[d] = (dateMap[d] || 0) + 1
            })
            comments?.forEach(c => {
                const d = dayjs(c.created_at).format('YYYY-MM-DD')
                dateMap[d] = (dateMap[d] || 0) + 1
            })

            for (let i = 89; i >= 0; i--) {
                const d = today.subtract(i, 'day')
                heatmapData.push({
                    date: d.format('YYYY-MM-DD'),
                    count: dateMap[d.format('YYYY-MM-DD')] || 0,
                    dayOfWeek: d.day()
                })
            }

            const hours = new Array(24).fill(0)
            posts?.forEach(p => hours[new Date(p.created_at).getHours()]++)
            comments?.forEach(c => hours[new Date(c.created_at).getHours()]++)

            const determinedPersona = calculatePersona(posts, comments, hours, totalLikes)

            const activityDates = [
                ...(posts?.map(p => dayjs(p.created_at).format('YYYY-MM-DD')) || []),
                ...(comments?.map(c => dayjs(c.created_at).format('YYYY-MM-DD')) || [])
            ].sort().reverse()

            const uniqueActivityDates = [...new Set(activityDates)]

            let streak = 0
            let currentCheck = today

            if (uniqueActivityDates.includes(currentCheck.format('YYYY-MM-DD'))) {
                streak = 1
            } else if (uniqueActivityDates.includes(currentCheck.subtract(1, 'day').format('YYYY-MM-DD'))) {
                streak = 1
                currentCheck = currentCheck.subtract(1, 'day')
            }

            if (streak > 0) {
                for (let i = 1; i < uniqueActivityDates.length; i++) {
                    const prevDate = currentCheck.subtract(i, 'day').format('YYYY-MM-DD')
                    if (uniqueActivityDates.includes(prevDate)) {
                        streak++
                    } else {
                        break
                    }
                }
            }

            const earnedBadges = calculateBadges(posts || [], events || [])

            setStats({
                totalPosts,
                totalComments,
                totalLikes,
                karmaScore,
                heatmapData,
                hourlyData: hours,
                streak,
                mostPopularPost: posts?.sort((a, b) => b.likes_count - a.likes_count)[0]
            })
            setBadges(earnedBadges)
            setPersona(determinedPersona)

        } catch (err) {
            console.error('Error fetching analytics:', err)
        } finally {
            setLoading(false)
        }
    }

    function calculatePersona(posts, comments, hourlyDistribution, totalLikes) {
        if (!posts?.length && !comments?.length) return {
            title: "The Ghost",
            icon: Ghost,
            color: "text-gray-400",
            bg: "bg-gray-100 dark:bg-gray-800",
            desc: "Lurking in the shadows. You see all, but say nothing."
        }

        const nightActivity = hourlyDistribution.slice(0, 5).reduce((a, b) => a + b, 0) + hourlyDistribution.slice(22, 24).reduce((a, b) => a + b, 0)
        const totalActivity = hourlyDistribution.reduce((a, b) => a + b, 0)
        const isNightOwl = (nightActivity / totalActivity) > 0.4

        const avgLikes = posts.length ? totalLikes / posts.length : 0
        const isInfluencer = avgLikes > 15

        const debatePosts = posts.filter(p => p.tags && p.tags.includes('debate')).length
        const isDebater = debatePosts > 2

        const rantPosts = posts.filter(p => p.tags && (p.tags.includes('rant') || p.tags.includes('angry'))).length
        const isRanter = rantPosts > 3

        if (isInfluencer) return {
            title: "Campus Celebrity",
            icon: Crown,
            color: "text-yellow-500",
            bg: "bg-yellow-50 dark:bg-yellow-900/20",
            desc: "Your posts run this campus. When you speak, people listen."
        }

        if (isDebater) return {
            title: "The Devil's Advocate",
            icon: Flame,
            color: "text-orange-500",
            bg: "bg-orange-50 dark:bg-orange-900/20",
            desc: "You love a good argument. Peace was never an option."
        }

        if (isNightOwl) return {
            title: "The Night Owl",
            icon: Moon,
            color: "text-indigo-500",
            bg: "bg-indigo-50 dark:bg-indigo-900/20",
            desc: "Sleep is for the weak. You're most alive when the campus sleeps."
        }

        if (isRanter) return {
            title: "The Vent Master",
            icon: Zap,
            color: "text-red-500",
            bg: "bg-red-50 dark:bg-red-900/20",
            desc: "You have a lot of feelings, and we're here for it."
        }

        if (comments.length > posts.length * 3) return {
            title: "The Yapologer",
            icon: MessageSquare,
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-900/20",
            desc: "You're everywhere in the comments section."
        }

        return {
            title: "The NPC",
            icon: Coffee,
            color: "text-green-500",
            bg: "bg-green-50 dark:bg-green-900/20",
            desc: "Just a regular student trying to survive the semester."
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium animate-pulse">Calculating your campus vibe...</p>
            </div>
        )
    }

    if (!stats || (!stats.totalPosts && !stats.totalComments)) {
        return (
            <div className="text-center py-20 px-4">
                <div className="bg-gray-100 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Ghost className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Data Yet</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Start posting confessions or commenting to unlock your personalized campus analytics!
                </p>
            </div>
        )
    }

    return (
        <>
            <Helmet>
                <title>My Campus Stats - MMU Confessions</title>
            </Helmet>

            <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-5 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                            My Campus Wrapped <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-full">LIVE</span>
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Your anonymous footprint</p>
                    </div>

                    <div className="mx-auto sm:mx-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-3 max-w-fit">
                        <Award className="w-6 h-6 text-yellow-300" />
                        <div>
                            <p className="text-[10px] font-bold uppercase opacity-80 tracking-wider">Karma Score</p>
                            <p className="text-2xl font-black leading-none">{stats.karmaScore}</p>
                        </div>
                    </div>
                </div>

                {persona && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900 shadow-xl overflow-hidden relative">
                        <div className={`absolute top-0 right-0 p-32 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 ${persona.bg.replace('bg-', 'bg-')}`} />

                        <div className="p-6 sm:p-8 relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                            <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full ${persona.bg} flex items-center justify-center shadow-inner shrink-0`}>
                                <persona.icon className={`w-12 h-12 sm:w-16 sm:h-16 ${persona.color}`} />
                            </div>
                            <div className="flex-1">
                                <div className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Your Persona</div>
                                <h2 className={`text-3xl sm:text-4xl font-black ${persona.color} mb-2`}>{persona.title}</h2>
                                <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg font-medium leading-relaxed max-w-xl">
                                    "{persona.desc}"
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <StatBox
                        icon={MessageSquare}
                        label="Confessions"
                        value={stats.totalPosts}
                        color="text-blue-500"
                    />
                    <StatBox
                        icon={Heart}
                        label="Likes Received"
                        value={stats.totalLikes}
                        color="text-red-500"
                    />
                    <StatBox
                        icon={TrendingUp}
                        label="Comments"
                        value={stats.totalComments}
                        color="text-green-500"
                    />
                    <StatBox
                        icon={Zap}
                        label="Day Streak"
                        value={stats.streak}
                        color="text-orange-500"
                    />
                </div>

                <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2 mb-4 sm:mb-6">
                            <CalendarDays className="w-5 h-5 text-gray-400" />
                            <h3 className="font-bold text-gray-900 dark:text-white">Activity Log (90 Days)</h3>
                        </div>

                        <div className="flex sm:flex-wrap gap-1 content-start justify-start sm:justify-start h-auto sm:h-32 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 no-scrollbar">
                            <div className="flex sm:contents min-w-max gap-1">
                                {stats.heatmapData.map((day, i) => (
                                    <div
                                        key={i}
                                        title={`${day.date}: ${day.count} activities`}
                                        className={`w-3 h-3 sm:w-4 sm:h-4 rounded-sm flex-shrink-0 transition-all duration-300 hover:scale-125 hover:ring-2 ring-indigo-300 ${day.count === 0 ? 'bg-gray-100 dark:bg-gray-700' :
                                            day.count < 2 ? 'bg-indigo-200 dark:bg-indigo-900' :
                                                day.count < 4 ? 'bg-indigo-400 dark:bg-indigo-700' :
                                                    'bg-indigo-600 dark:bg-indigo-500'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-400">
                            <span>Less</span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 rounded-sm" />
                                <div className="w-3 h-3 bg-indigo-200 dark:bg-indigo-900 rounded-sm" />
                                <div className="w-3 h-3 bg-indigo-400 dark:bg-indigo-700 rounded-sm" />
                                <div className="w-3 h-3 bg-indigo-600 dark:bg-indigo-500 rounded-sm" />
                            </div>
                            <span>More</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm flex flex-col">
                        <div className="flex items-center gap-2 mb-4 sm:mb-6">
                            <BarChart2 className="w-5 h-5 text-gray-400" />
                            <h3 className="font-bold text-gray-900 dark:text-white">Active Hours</h3>
                        </div>

                        <div className="overflow-x-auto pb-2 no-scrollbar">
                            <div className="flex items-end justify-between h-32 sm:h-40 gap-1 min-w-[300px]">
                                {stats.hourlyData.map((count, hour) => {
                                    const heightPercent = Math.max((count / Math.max(...stats.hourlyData, 1)) * 100, 5)
                                    return (
                                        <div key={hour} className="flex-1 flex flex-col justify-end group relative min-w-[8px]">
                                            <div
                                                style={{ height: `${heightPercent}%` }}
                                                className={`w-full rounded-t-sm transition-all ${hour >= 22 || hour <= 5
                                                    ? 'bg-indigo-400 dark:bg-indigo-600'
                                                    : 'bg-orange-300 dark:bg-orange-600'
                                                    }`}
                                            />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black text-white text-[10px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 hidden sm:block">
                                                {hour}:00 - {count}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-mono uppercase">
                            <span>12AM</span>
                            <span>6AM</span>
                            <span>12PM</span>
                            <span>6PM</span>
                        </div>
                    </div>
                </div>

                {badges.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-yellow-500" /> Achievements
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {badges.map((badge, idx) => (
                                <div key={idx} className="flex flex-col items-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 text-center transition hover:scale-105">
                                    <div className="text-2xl sm:text-3xl mb-2 filter drop-shadow-md">{badge.icon}</div>
                                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">{badge.label}</span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight line-clamp-2">{badge.description}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {stats.mostPopularPost && (
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 sm:p-6 text-white shadow-xl">
                        <div className="flex items-center gap-2 mb-4 opacity-80">
                            <StarIcon className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-widest">Your Top Confession</span>
                        </div>
                        <p className="text-base sm:text-xl font-medium italic mb-6 line-clamp-3 sm:line-clamp-none">
                            "{stats.mostPopularPost.text}"
                        </p>
                        <div className="flex gap-4 text-sm font-bold opacity-90">
                            <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {stats.mostPopularPost.likes_count} <span className="hidden sm:inline">Likes</span></span>
                            <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> {stats.mostPopularPost.comments_count} <span className="hidden sm:inline">Comments</span></span>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

function StatBox({ icon: Icon, label, value, color }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className={`p-2 sm:p-3 rounded-xl bg-gray-50 dark:bg-gray-700 ${color}`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
                <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-none mb-1">{value}</p>
                <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</p>
            </div>
        </div>
    )
}

function StarIcon({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
        </svg>
    )
}
import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
    TrendingUp, MessageSquare, Heart, Zap, Award,
    Moon, Sun, Coffee, Flame, Crown, Ghost,
    CalendarDays, BarChart2, Share2, Camera, ArrowRight,
    Star, Activity
} from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { calculateBadges } from '../utils/badgeSystem'
import dayjs from 'dayjs'

const POINTS = {
    PER_POST: 10,
    PER_COMMENT: 5,
    PER_LIKE_RECEIVED: 2
};

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

            const { data: inventoryItems } = await supabase
                .from('user_inventory')
                .select('quantity, shop_items(cost)')
                .eq('user_id', anonId);

            const totalPosts = posts?.length || 0
            const totalComments = comments?.length || 0
            const totalLikes = posts?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0
            const approvedPosts = posts?.filter(p => p.approved).length || 0;

            const totalEarned =
                (approvedPosts * POINTS.PER_POST) +
                (totalComments * POINTS.PER_COMMENT) +
                (totalLikes * POINTS.PER_LIKE_RECEIVED);

            const totalSpent = inventoryItems?.reduce((sum, slot) => {
                return sum + (slot.shop_items.cost * slot.quantity);
            }, 0) || 0;

            const karmaBalance = Math.max(0, totalEarned - totalSpent);

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

            for (let i = 59; i >= 0; i--) {
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
                karmaScore: karmaBalance,
                heatmapData,
                hourlyData: hours,
                streak,
                mostPopularPost: posts?.sort((a, b) => b.likes_count - a.likes_count)[0],
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
            desc: "Lurking in the shadows."
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

        if (isInfluencer) return { title: "Campus Celebrity", icon: Crown, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20", desc: "Your posts run this campus." }
        if (isDebater) return { title: "The Devil's Advocate", icon: Flame, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20", desc: "Peace was never an option." }
        if (isNightOwl) return { title: "The Night Owl", icon: Moon, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20", desc: "Alive when the campus sleeps." }
        if (isRanter) return { title: "The Vent Master", icon: Zap, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", desc: "You have a lot of feelings." }
        if (comments.length > posts.length * 3) return { title: "The Yapologer", icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", desc: "Everywhere in the comments." }
        return { title: "The NPC", icon: Coffee, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20", desc: "Just trying to survive." }
    }

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center py-20 min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium animate-pulse">Calculating vibe...</p>
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
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                    Start posting confessions to unlock analytics!
                </p>
                <Link to="/create" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-none">
                    Create First Post
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-4 md:py-8 pb-24 space-y-4 md:space-y-6">
            <Helmet>
                <title>My Stats - MMU Confessions</title>
            </Helmet>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <BarChart2 className="w-7 h-7 md:w-8 md:h-8 text-indigo-600" />
                        Analytics Hub
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Your anonymous footprint
                    </p>
                </div>

                <div className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-1 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all">
                    <div className="flex items-center justify-between gap-4 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                <Award className="w-5 h-5 text-yellow-300" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase opacity-80 tracking-wider">Available Karma</p>
                                <p className="text-xl md:text-2xl font-black leading-none">{stats.karmaScore}</p>
                            </div>
                        </div>
                        <Link to="/karma-shop" className="text-xs font-bold bg-white text-indigo-600 px-3 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-transform">
                            Spend <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {persona && (
                    <div className="col-span-2 md:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden relative p-5 md:p-6 flex flex-col justify-center min-h-[140px]">
                        <div className={`absolute top-0 right-0 p-24 rounded-full blur-3xl opacity-10 -mr-10 -mt-10 ${persona.bg.replace('bg-', 'bg-')}`} />
                        <div className="flex items-center gap-4 md:gap-5 relative z-10">
                            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl ${persona.bg} flex items-center justify-center shrink-0 shadow-inner`}>
                                <persona.icon className={`w-8 h-8 md:w-10 md:h-10 ${persona.color}`} />
                            </div>
                            <div>
                                <div className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Your Vibe</div>
                                <h2 className={`text-xl md:text-2xl font-black ${persona.color} mb-1 leading-tight`}>{persona.title}</h2>
                                <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm font-medium leading-relaxed line-clamp-2">
                                    "{persona.desc}"
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <StatBox icon={MessageSquare} label="Posts" value={stats.totalPosts} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-900/20" />
                <StatBox icon={Heart} label="Likes" value={stats.totalLikes} color="text-red-500" bg="bg-red-50 dark:bg-red-900/20" />
                <StatBox icon={TrendingUp} label="Comments" value={stats.totalComments} color="text-green-500" bg="bg-green-50 dark:bg-green-900/20" />
                <StatBox icon={Zap} label="Day Streak" value={stats.streak} color="text-orange-500" bg="bg-orange-50 dark:bg-orange-900/20" />

                <div className="col-span-2 md:col-span-2 lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 md:p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-gray-400" />
                            <h3 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">Activity Log</h3>
                        </div>
                        <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">60 Days</span>
                    </div>

                    <div className="overflow-x-auto no-scrollbar pb-1">
                        <div className="flex md:flex-wrap gap-1 min-w-max md:min-w-0">
                            {stats.heatmapData.map((day, i) => (
                                <div
                                    key={i}
                                    className={`w-3 h-3 md:w-4 md:h-4 rounded-[3px] md:rounded-sm flex-shrink-0 transition-all ${day.count === 0 ? 'bg-gray-100 dark:bg-gray-700/50' :
                                        day.count < 2 ? 'bg-indigo-300 dark:bg-indigo-800' :
                                            day.count < 4 ? 'bg-indigo-500 dark:bg-indigo-600' :
                                                'bg-indigo-700 dark:bg-indigo-400'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="col-span-2 md:col-span-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 md:p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <h3 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">Active Hours</h3>
                    </div>
                    <div className="flex items-end justify-between h-20 gap-0.5">
                        {stats.hourlyData.filter((_, i) => i % 2 === 0).map((count, i) => (
                            <div key={i} className="flex-1 bg-indigo-50 dark:bg-gray-700/30 rounded-sm relative group">
                                <div
                                    style={{ height: `${Math.max((count / Math.max(...stats.hourlyData, 1)) * 100, 15)}%` }}
                                    className={`absolute bottom-0 w-full rounded-sm ${i > 3 && i < 9 ? 'bg-indigo-300 dark:bg-indigo-600' : 'bg-indigo-500 dark:bg-indigo-400'}`}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-mono uppercase">
                        <span>12am</span>
                        <span>12pm</span>
                    </div>
                </div>

                {stats.mostPopularPost && (
                    <div className="col-span-2 md:col-span-3 lg:col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-5 text-white shadow-md flex flex-col justify-between min-h-[140px]">
                        <div>
                            <div className="flex items-center gap-2 mb-3 text-yellow-400">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Top Confession</span>
                            </div>
                            <p className="text-sm md:text-base font-medium italic opacity-90 line-clamp-2 md:line-clamp-3">
                                "{stats.mostPopularPost.text}"
                            </p>
                        </div>
                        <div className="flex gap-4 text-xs font-bold mt-4 opacity-70 border-t border-white/10 pt-3">
                            <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> {stats.mostPopularPost.likes_count}</span>
                            <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> {stats.mostPopularPost.comments_count}</span>
                        </div>
                    </div>
                )}

                {badges.length > 0 && (
                    <div className="col-span-2 md:col-span-3 lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 md:p-5 shadow-sm">
                        <h3 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Award className="w-4 h-4 text-yellow-500" /> Recent Achievements
                        </h3>
                        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x">
                            {badges.slice(0, 5).map((badge, idx) => (
                                <div key={idx} className="snap-start flex-shrink-0 flex flex-col items-center justify-center p-2 w-20 md:w-24 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                                    <div className="text-2xl md:text-3xl mb-1 filter drop-shadow-sm">{badge.icon}</div>
                                    <span className="text-[9px] md:text-[10px] font-bold text-center leading-tight line-clamp-1 text-gray-600 dark:text-gray-300">{badge.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function StatBox({ icon: Icon, label, value, color, bg }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 md:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg ${bg}`}>
                    <Icon className={`w-4 h-4 md:w-5 md:h-5 ${color}`} />
                </div>
            </div>
            <div>
                <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white leading-none">{value}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-1 truncate">{label}</p>
            </div>
        </div>
    )
}
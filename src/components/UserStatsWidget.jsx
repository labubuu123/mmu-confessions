import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Award, Loader2, MessageSquare, User, Heart } from 'lucide-react'
import { calculateUserBadges, getNextBadge, BADGE_DEFINITIONS } from '../utils/badges'
import { useNotification } from './NotificationSystem'

function UserStatsWidget({ userId, fetchKey, onOpenBadges }) {
    const [stats, setStats] = useState(null)
    const [badges, setBadges] = useState([])
    const [nextBadge, setNextBadge] = useState(null)
    const [loading, setLoading] = useState(true)

    const addNotification = useNotification(state => state.addNotification)
    const isInitialLoad = useRef(true)
    const previousBadgesRef = useRef([]);
    useEffect(() => {
        previousBadgesRef.current = badges;
    }, [badges]);


    useEffect(() => {
        async function fetchStats() {
            if (!userId) {
                setLoading(false)
                setStats(null)
                setBadges([])
                setNextBadge(null)
                isInitialLoad.current = true
                previousBadgesRef.current = []
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
                
                const newBadges = calculateUserBadges(statsData)

                if (isInitialLoad.current) {
                    isInitialLoad.current = false
                } else {
                    const oldBadgeIds = new Set(previousBadgesRef.current.map(b => b.id));
                    const newlyEarned = newBadges.filter(b => !oldBadgeIds.has(b.id));

                    newlyEarned.forEach(badge => {
                        addNotification({
                            id: `badge-${badge.id}`,
                            icon: badge.icon,
                            title: `New Badge Earned!`,
                            message: `You've earned the "${badge.name}" badge.`,
                        });
                    });
                }

                setBadges(newBadges)
                setNextBadge(getNextBadge(statsData))

            } catch (error) {
                console.error("Error fetching user stats:", error)
                setStats(null)
                setBadges([])
                setNextBadge(null)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [userId, fetchKey, addNotification])

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

            <button
                onClick={onOpenBadges}
                className="w-full text-left p-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">My Badges</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">View All</p>
                </div>
                <div className="flex items-center gap-2">
                    {badges.length > 0 ? (
                        badges.slice(0, 5).map(badge => (
                            <span key={badge.id} title={badge.name} className="text-xl">{badge.icon}</span>
                        ))
                    ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500">No badges earned yet.</p>
                    )}
                </div>
            </button>
        </div>
    )
}

export default UserStatsWidget
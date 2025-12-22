import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Loader2, MessageSquare, Heart, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'

function UserStatsWidget({ userId, fetchKey }) {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            if (!userId) {
                setLoading(false); setStats(null); return
            }
            setLoading(true)
            try {
                const { count: postCount } = await supabase.from('confessions').select('*', { count: 'exact', head: true }).eq('author_id', userId)
                const { count: commentCount } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('author_id', userId)
                const { data: likeData } = await supabase.from('confessions').select('likes_count').eq('author_id', userId)
                const totalLikes = likeData?.reduce((acc, curr) => acc + (curr.likes_count || 0), 0) || 0

                setStats({ postCount, commentCount, totalLikes })
            } catch (error) {
                console.error("Error fetching user stats:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [userId, fetchKey])

    if (loading) return <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />

    if (!stats) return null

    return (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-4 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 bg-indigo-500 rounded-full blur-2xl opacity-20 -mr-4 -mt-4"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-bold uppercase tracking-wider opacity-80">My Impact</span>
                </div>

                <div className="flex justify-between items-end">
                    <div className="text-center">
                        <p className="text-xl font-black">{stats.postCount}</p>
                        <p className="text-[10px] text-gray-300">Posts</p>
                    </div>
                    <div className="text-center border-l border-white/10 pl-4">
                        <p className="text-xl font-black">{stats.commentCount}</p>
                        <p className="text-[10px] text-gray-300">Comments</p>
                    </div>
                    <div className="text-center border-l border-white/10 pl-4">
                        <p className="text-xl font-black">{stats.totalLikes}</p>
                        <p className="text-[10px] text-gray-300">Likes</p>
                    </div>
                </div>

                <Link to="/stats" className="block mt-4 text-center text-xs font-bold bg-white/10 hover:bg-white/20 py-2 rounded-lg transition">
                    View Full Analytics
                </Link>
            </div>
        </div>
    )
}

export default UserStatsWidget
import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { TrendingUp, Hash } from 'lucide-react'

export default function TrendingSidebar() {
    const [trending, setTrending] = useState([])

    useEffect(() => {
        fetchTrending()
        const interval = setInterval(fetchTrending, 300000)
        return () => clearInterval(interval)
    }, [])

    async function fetchTrending() {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { data } = await supabase
            .from('confessions')
            .select('tags')
            .eq('approved', true)
            .gte('created_at', sevenDaysAgo.toISOString())

        if (!data) return

        const tagCount = {}
        data.forEach(post => {
            if (post.tags) {
                post.tags.forEach(tag => {
                    tagCount[tag] = (tagCount[tag] || 0) + 1
                })
            }
        })

        const sorted = Object.entries(tagCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag, count]) => ({ tag, count }))

        setTrending(sorted)
    }

    if (trending.length === 0) return null

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sticky top-20">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-gray-900 dark:text-gray-100">
                    Trending Topics
                </h3>
            </div>
            <div className="space-y-3">
                {trending.map(({ tag, count }, idx) => (
                    <div
                        key={tag}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`text-lg font-bold ${idx === 0 ? 'text-orange-500' :
                                    idx === 1 ? 'text-orange-400' :
                                        idx === 2 ? 'text-orange-300' :
                                            'text-gray-400'
                                }`}>
                                {idx + 1}
                            </div>
                            <div>
                                <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                                    <Hash className="w-4 h-4" />
                                    {tag}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {count} {count === 1 ? 'post' : 'posts'}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
import React, { useState } from 'react'
import { TrendingUp } from 'lucide-react'

export default function ReactionTooltip({ reactions }) {
    const [showTooltip, setShowTooltip] = useState(false)
    
    if (!reactions || Object.keys(reactions).length === 0) return null

    const sortedReactions = Object.entries(reactions)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])

    const totalReactions = sortedReactions.reduce((sum, [_, count]) => sum + count, 0)
    const topReactions = sortedReactions.slice(0, 3)

    return (
        <div className="relative inline-block">
            <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 hover:shadow-md transition-all"
            >
                <div className="flex -space-x-1">
                    {topReactions.map(([emoji], i) => (
                        <span
                            key={emoji}
                            className="text-base bg-white dark:bg-gray-800 rounded-full border border-purple-200 dark:border-purple-700 w-6 h-6 flex items-center justify-center"
                            style={{ zIndex: 5 - i }}
                        >
                            {emoji}
                        </span>
                    ))}
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        {totalReactions}
                    </span>
                    <TrendingUp className="w-3 h-3 text-purple-500" />
                </div>
            </button>

            {showTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-20">
                    <div className="bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-xl p-3 min-w-[200px] border border-gray-700">
                        <div className="text-xs font-medium mb-2 text-gray-300">
                            Reaction Breakdown
                        </div>
                        <div className="space-y-1">
                            {sortedReactions.map(([emoji, count]) => {
                                const percentage = ((count / totalReactions) * 100).toFixed(0)
                                return (
                                    <div key={emoji} className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className="text-lg">{emoji}</span>
                                            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-sm font-medium">{count}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div className="w-3 h-3 bg-gray-900 dark:bg-gray-800 border-r border-b border-gray-700 transform rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1.5" />
                </div>
            )}
        </div>
    )
}